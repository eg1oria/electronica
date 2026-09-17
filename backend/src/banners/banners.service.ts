import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { MAX_BANNERS } from './banners.constants';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

const include = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      price: true,
      oldPrice: true,
      isActive: true,
      images: { orderBy: { position: 'asc' }, take: 1 },
      category: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.BannerInclude;

type BannerWithProduct = Prisma.BannerGetPayload<{ include: typeof include }>;

function serialize({ product, ...banner }: BannerWithProduct) {
  return {
    ...banner,
    product: {
      ...product,
      price: product.price.toNumber(),
      oldPrice: product.oldPrice?.toNumber() ?? null,
    },
  };
}

const orderBy = [{ position: 'asc' }, { id: 'asc' }] as const;

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /** Для главной: включённые слайды с опубликованными товарами. */
  async findPublic() {
    const banners = await this.prisma.banner.findMany({
      where: { isActive: true, product: { isActive: true } },
      include,
      orderBy: [...orderBy],
      take: MAX_BANNERS,
    });
    return banners.map(serialize);
  }

  async findAll() {
    const banners = await this.prisma.banner.findMany({
      include,
      orderBy: [...orderBy],
    });
    return banners.map(serialize);
  }

  async findById(id: number) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
      include,
    });
    if (!banner) throw new NotFoundException('Баннер не найден');
    return serialize(banner);
  }

  async create({ productId, ...rest }: CreateBannerDto) {
    await this.assertProduct(productId);
    const banner = await this.prisma.$transaction(
      async (tx) => {
        const count = await tx.banner.count();
        if (count >= MAX_BANNERS) {
          throw new ConflictException(
            `Можно добавить не больше ${MAX_BANNERS} баннеров`,
          );
        }
        const last = await tx.banner.aggregate({ _max: { position: true } });
        return tx.banner.create({
          data: {
            productId,
            ...rest,
            position: (last._max.position ?? -1) + 1,
          },
          include,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return serialize(banner);
  }

  async update(id: number, dto: UpdateBannerDto) {
    const current = await this.findById(id);
    if (dto.productId !== undefined) await this.assertProduct(dto.productId);
    const banner = await this.prisma.banner.update({
      where: { id },
      data: dto,
      include,
    });
    if (dto.image !== undefined && dto.image !== current.image) {
      await this.uploads.removeUnused([current.image]);
    }
    return serialize(banner);
  }

  async reorder(ids: number[]) {
    const existing = await this.prisma.banner.findMany({
      select: { id: true },
    });
    const known = new Set(existing.map((b) => b.id));
    if (ids.length !== known.size || !ids.every((id) => known.has(id))) {
      throw new BadRequestException('Передайте все id баннеров без повторов');
    }
    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.banner.update({ where: { id }, data: { position } }),
      ),
    );
    return this.findAll();
  }

  async remove(id: number) {
    const banner = await this.findById(id);
    await this.prisma.banner.delete({ where: { id } });
    await this.uploads.removeUnused([banner.image]);
  }

  private async assertProduct(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!product) throw new BadRequestException('Товар не найден');
  }
}
