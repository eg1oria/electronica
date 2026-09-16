import { Injectable, NotFoundException } from '@nestjs/common';
import { slugify } from '../common/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundException('Бренд не найден');
    return brand;
  }

  create({ slug, ...dto }: CreateBrandDto) {
    return this.prisma.brand.create({
      data: { ...dto, slug: slug ?? slugify(dto.name) },
    });
  }

  update(id: number, dto: UpdateBrandDto) {
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  /** У товаров бренд обнуляется (onDelete: SetNull). */
  async remove(id: number) {
    await this.prisma.brand.delete({ where: { id } });
  }
}
