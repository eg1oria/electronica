import { Injectable, NotFoundException } from '@nestjs/common';
import { uniqueSlug } from '../common/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findById(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Бренд не найден');
    return brand;
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundException('Бренд не найден');
    return brand;
  }

  async create({ slug, ...dto }: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        ...dto,
        slug: slug ?? (await uniqueSlug(dto.name, (s) => this.slugTaken(s))),
      },
    });
  }

  async update(id: number, dto: UpdateBrandDto) {
    const current = await this.findById(id);
    const updated = await this.prisma.brand.update({ where: { id }, data: dto });
    if (dto.logo !== undefined && dto.logo !== current.logo) {
      await this.uploads.removeUnused([current.logo]);
    }
    return updated;
  }

  /** У товаров бренд обнуляется (onDelete: SetNull). */
  async remove(id: number) {
    const brand = await this.findById(id);
    await this.prisma.brand.delete({ where: { id } });
    await this.uploads.removeUnused([brand.logo]);
  }

  private async slugTaken(slug: string) {
    return !!(await this.prisma.brand.findUnique({
      where: { slug },
      select: { id: true },
    }));
  }
}
