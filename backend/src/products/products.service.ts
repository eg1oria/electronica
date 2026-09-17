import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { Paginated } from '../common/dto/pagination.dto';
import { uniqueSlug } from '../common/slugify';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
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
    private readonly uploads: UploadsService,
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

  async create({ images = [], specs = [], slug, ...dto }: CreateProductDto) {
    assertDiscount(dto.price, dto.oldPrice);
    await this.assertRelations(dto.categoryId, dto.brandId);
    const product = await this.prisma.product.create({
      data: {
        ...dto,
        slug: slug ?? (await uniqueSlug(dto.name, (s) => this.slugTaken(s))),
        images: { create: withPosition(images) },
        specs: { create: withPosition(specs) },
      },
      include: fullInclude,
    });
    return serialize(product);
  }

  async update(id: number, { images, specs, ...dto }: UpdateProductDto) {
    const current = await this.findById(id);
    if (dto.price !== undefined || dto.oldPrice !== undefined) {
      assertDiscount(
        dto.price ?? current.price,
        dto.oldPrice === undefined ? current.oldPrice : dto.oldPrice,
      );
    }
    await this.assertRelations(dto.categoryId, dto.brandId);

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
    if (images) {
      await this.uploads.removeUnused(current.images.map((i) => i.url));
    }
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
    const product = await this.findById(id);
    // Баннеры товара удаляются каскадом — их картинки тоже больше не нужны.
    const banners = await this.prisma.banner.findMany({
      where: { productId: id },
      select: { image: true },
    });
    await this.prisma.product.delete({ where: { id } });
    await this.uploads.removeUnused([
      ...product.images.map((i) => i.url),
      ...banners.map((b) => b.image),
    ]);
  }

  private async list(query: QueryProductsDto, base: Prisma.ProductWhereInput) {
    const and: Prisma.ProductWhereInput[] = [base];

    if (query.search) {
      const search = query.search;
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
      if (!category) return empty(query);
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

    const where: Prisma.ProductWhereInput = { AND: and };
    const [items, total] = await Promise.all([
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

  private async slugTaken(slug: string) {
    return !!(await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    }));
  }

  /** Понятная 400 вместо ошибки внешнего ключа. */
  private async assertRelations(categoryId?: number, brandId?: number | null) {
    const [category, brand] = await Promise.all([
      categoryId === undefined
        ? true
        : this.prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true },
          }),
      brandId == null
        ? true
        : this.prisma.brand.findUnique({
            where: { id: brandId },
            select: { id: true },
          }),
    ]);
    if (!category) throw new BadRequestException('Категория не найдена');
    if (!brand) throw new BadRequestException('Бренд не найден');
  }
}

function assertDiscount(price: number, oldPrice?: number | null) {
  if (oldPrice != null && oldPrice <= price) {
    throw new BadRequestException(
      'Старая цена (oldPrice) должна быть больше текущей',
    );
  }
}

function empty(query: QueryProductsDto): Paginated<never> {
  return { items: [], total: 0, page: query.page, limit: query.limit };
}
