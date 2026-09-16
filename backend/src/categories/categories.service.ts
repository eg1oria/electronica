import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { slugify } from '../common/slugify';
import { Category } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export type CategoryNode = Category & {
  productsCount: number;
  children: CategoryNode[];
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Все категории деревом. */
  async findTree(): Promise<CategoryNode[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    const nodes = new Map<number, CategoryNode>();
    for (const { _count, ...c } of categories) {
      nodes.set(c.id, { ...c, productsCount: _count.products, children: [] });
    }
    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }

  findFlat() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: { orderBy: { name: 'asc' } },
      },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    return category;
  }

  /** id категории и всех её потомков — для фильтрации товаров. */
  async descendantIds(rootId: number): Promise<number[]> {
    const all = await this.prisma.category.findMany({
      select: { id: true, parentId: true },
    });
    const result = [rootId];
    for (let i = 0; i < result.length; i++) {
      for (const c of all) if (c.parentId === result[i]) result.push(c.id);
    }
    return result;
  }

  create({ slug, ...dto }: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, slug: slug ?? slugify(dto.name) },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    if (dto.parentId != null) {
      const subtree = await this.descendantIds(id);
      if (subtree.includes(dto.parentId)) {
        throw new BadRequestException(
          'Категория не может быть вложена сама в себя или в свою подкатегорию',
        );
      }
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    if (category._count.products || category._count.children) {
      throw new ConflictException(
        'Нельзя удалить категорию, в которой есть товары или подкатегории',
      );
    }
    await this.prisma.category.delete({ where: { id } });
  }
}
