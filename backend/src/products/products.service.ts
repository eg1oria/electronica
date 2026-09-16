import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { Paginated } from '../common/dto/pagination.dto';
import { slugify } from '../common/slugify';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  AdminQueryProductsDto,
  ProductSort,
  QueryProductsDto,
} from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const listInclude = {
  images: { orderBy: { position: 'asc' }, take: 1 },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

const fullInclude = {
  images: { orderBy: { position: 'asc' } },
  specs: { orderBy: { position: 'asc' } },
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
} satisfies Prisma.ProductInclude;

const orderBy: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  price_asc: [{ price: 'asc' }, { id: 'asc' }],
  price_desc: [{ price: 'desc' }, { id: 'desc' }],
  name: [{ name: 'asc' }, { id: 'asc' }],
};

/** Decimal → number, чтобы фронтенд получал цены числами. */
function serialize<
  T extends { price: Prisma.Decimal; oldPrice: Prisma.Decimal | null },
>(product: T) {
  return {
    ...product,
    price: product.price.toNumber(),
    oldPrice: product.oldPrice?.toNumber() ?? null,
  };
}

const withPosition = <T>(items: T[]) =>
  items.map((item, position) => ({ ...item, position }));

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  /** Каталог для покупателей — только опубликованные товары. */
  findPublic(query: QueryProductsDto) {
    return this.list(query, { isActive: true });
  }

  findAdmin(query: AdminQueryProductsDto) {
    return this.list(query, {
      isActive: query.isActive,
      categoryId: query.categoryId,
      brandId: query.brandId,
    });
  }

  async findPublicBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: fullInclude,
    });
    if (!product) throw new NotFoundException('Товар не найден');
    return serialize(product);
  }

  async findById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: fullInclude,
    });
    if (!product) throw new NotFoundException('Товар не найден');
    return serialize(product);
  }

  async create({ images = [], specs = [], ...dto }: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        ...dto,
        slug: dto.slug ?? slugify(dto.name),
        images: { create: withPosition(images) },
        specs: { create: withPosition(specs) },
      },
      include: fullInclude,
    });
    return serialize(product);
  }

  async update(id: number, { images, specs, ...dto }: UpdateProductDto) {
    // Вложенные deleteMany + create выполняются Prisma в одной транзакции.
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(images && {
          images: { deleteMany: {}, create: withPosition(images) },
        }),
        ...(specs && {
          specs: { deleteMany: {}, create: withPosition(specs) },
        }),
      },
      include: fullInclude,
    });
    return serialize(product);
  }

  async updateStock(id: number, stock: number) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { stock },
      include: fullInclude,
    });
    return serialize(product);
  }

  async remove(id: number) {
    await this.prisma.product.delete({ where: { id } });
  }

  private async list(query: QueryProductsDto, base: Prisma.ProductWhereInput) {
    const where: Prisma.ProductWhereInput = { ...base };
    const and: Prisma.ProductWhereInput[] = [];

    if (query.search?.trim()) {
      const search = query.search.trim();
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.categorySlug },
        select: { id: true },
      });
      if (!category) return this.empty(query);
      and.push({
        categoryId: { in: await this.categories.descendantIds(category.id) },
      });
    }

    if (query.brandSlug) and.push({ brand: { slug: query.brandSlug } });
    if (query.minPrice != null) and.push({ price: { gte: query.minPrice } });
    if (query.maxPrice != null) and.push({ price: { lte: query.maxPrice } });
    if (query.inStock != null) {
      and.push(query.inStock ? { stock: { gt: 0 } } : { stock: 0 });
    }
    if (query.isFeatured != null) and.push({ isFeatured: query.isFeatured });
    if (and.length) where.AND = and;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: listInclude,
        orderBy: orderBy[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(serialize),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private empty(query: QueryProductsDto): Paginated<never> {
    return { items: [], total: 0, page: query.page, limit: query.limit };
  }
}
