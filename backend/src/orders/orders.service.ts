import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Paginated } from '../common/dto/pagination.dto';
import {
  DeliveryMethod,
  OrderStatus,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  MAX_ORDER_QTY,
  OrderItemDto,
} from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';

const include = {
  items: {
    orderBy: { id: 'asc' },
    include: {
      product: {
        select: {
          slug: true,
          images: { orderBy: { position: 'asc' }, take: 1 },
          category: { select: { slug: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof include }>;

/** Decimal → number, как и у товаров. */
function serialize({ items, total, ...order }: OrderWithItems) {
  return {
    ...order,
    total: total.toNumber(),
    items: items.map(({ price, ...item }) => ({
      ...item,
      price: price.toNumber(),
    })),
  };
}

/** Одинаковые товары в запросе складываем в одну позицию. */
function mergeItems(items: OrderItemDto[]) {
  const qty = new Map<number, number>();
  for (const item of items) {
    qty.set(item.productId, (qty.get(item.productId) ?? 0) + item.qty);
  }
  return [...qty].map(([productId, n]) => ({
    productId,
    qty: Math.min(n, MAX_ORDER_QTY),
  }));
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Оформление заказа с витрины. Цены берутся из базы, а не от клиента;
   * остатки списываются в той же транзакции, что и создание заказа.
   */
  async create({ items, ...dto }: CreateOrderDto) {
    const lines = mergeItems(items);
    const courier = dto.delivery === DeliveryMethod.COURIER;

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
        select: { id: true, name: true, sku: true, price: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      if (lines.some((l) => !byId.has(l.productId))) {
        throw new ConflictException(
          'Некоторые товары больше не продаются — обновите корзину',
        );
      }

      let total = new Prisma.Decimal(0);
      for (const line of lines) {
        const product = byId.get(line.productId)!;
        // Условное списание: не уйдём в минус при одновременных заказах.
        const { count } = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.qty } },
          data: { stock: { decrement: line.qty } },
        });
        if (!count) {
          const { stock } = await tx.product.findUniqueOrThrow({
            where: { id: line.productId },
            select: { stock: true },
          });
          throw new ConflictException(
            stock > 0
              ? `«${product.name}»: в наличии только ${stock} шт.`
              : `«${product.name}» закончился`,
          );
        }
        total = total.add(product.price.mul(line.qty));
      }

      return tx.order.create({
        data: {
          ...dto,
          email: dto.email || null,
          city: courier ? dto.city : null,
          address: courier ? dto.address : null,
          apartment: courier ? dto.apartment || null : null,
          comment: dto.comment || null,
          total,
          items: {
            create: lines.map((line) => {
              const p = byId.get(line.productId)!;
              return {
                productId: p.id,
                name: p.name,
                sku: p.sku,
                price: p.price,
                qty: line.qty,
              };
            }),
          },
        },
        include,
      });
    });

    return serialize(order);
  }

  async findAll(query: QueryOrdersDto): Promise<Paginated<unknown>> {
    const and: Prisma.OrderWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    const byNumber = query.search?.match(/^[№#]\s*(\d{1,9})$/);
    if (byNumber) {
      and.push({ id: Number(byNumber[1]) });
    } else if (query.search) {
      const search = query.search;
      const or: Prisma.OrderWhereInput[] = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
      if (/^\d{1,9}$/.test(search)) or.push({ id: Number(search) });
      and.push({ OR: or });
    }

    const where: Prisma.OrderWhereInput = { AND: and };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      items: items.map(serialize),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /** Количество заказов по статусам — для обзора и фильтров админки. */
  async countByStatus() {
    const groups = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = Object.fromEntries(
      Object.values(OrderStatus).map((s) => [s, 0]),
    ) as Record<OrderStatus, number>;
    for (const g of groups) counts[g.status] = g._count._all;
    return counts;
  }

  async findById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include,
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return serialize(order);
  }

  /** Отмена возвращает товары на склад; отменённый заказ закрыт. */
  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!current) throw new NotFoundException('Заказ не найден');
      if (current.status === status) {
        return tx.order.findUniqueOrThrow({ where: { id }, include });
      }
      if (current.status === OrderStatus.CANCELLED) {
        throw new BadRequestException(
          'Отменённый заказ нельзя вернуть в работу — оформите новый',
        );
      }

      if (status === OrderStatus.CANCELLED) {
        for (const item of current.items) {
          if (item.productId === null) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          });
        }
      }

      // Условие по статусу защищает от двойной отмены параллельными запросами.
      const { count } = await tx.order.updateMany({
        where: { id, status: current.status },
        data: { status },
      });
      if (!count) {
        throw new ConflictException('Заказ уже изменён — обновите страницу');
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include });
    });
    return serialize(order);
  }
}
