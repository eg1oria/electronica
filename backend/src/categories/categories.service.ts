import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { uniqueSlug } from '../common/slugify';
import { Category } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export type CategoryNode = Category & {
  productsCount: number;
  children: CategoryNode[];
};

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /** Все категории деревом; productsCount — только опубликованные товары. */
  async findTree(): Promise<CategoryNode[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
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

  async findById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    return category;
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
    const childrenOf = new Map<number, number[]>();
    for (const c of all) {
      if (c.parentId === null) continue;
      childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c.id]);
    }
    const result = [rootId];
    for (let i = 0; i < result.length; i++) {
      result.push(...(childrenOf.get(result[i]) ?? []));
    }
    return result;
  }

  async create({ slug, ...dto }: CreateCategoryDto) {
    if (dto.parentId != null) await this.assertExists(dto.parentId);
    return this.prisma.category.create({
      data: {
        ...dto,
        slug: slug ?? (await uniqueSlug(dto.name, (s) => this.slugTaken(s))),
      },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const current = await this.findById(id);
    if (dto.parentId != null) {
      await this.assertExists(dto.parentId);
      if ((await this.descendantIds(id)).includes(dto.parentId)) {
        throw new BadRequestException(
          'Категория не может быть вложена сама в себя или в свою подкатегорию',
        );
      }
    }
    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    if (dto.image !== undefined && dto.image !== current.image) {
      await this.uploads.removeUnused([current.image]);
    }
    return updated;
  }

  async remove(id: number) {
    const category = await this.findById(id);
    if (category._count.products || category._count.children) {
      throw new ConflictException(
        'Нельзя удалить категорию, в которой есть товары или подкатегории',
      );
    }
    await this.prisma.category.delete({ where: { id } });
    await this.uploads.removeUnused([category.image]);
  }

  private async slugTaken(slug: string) {
    return !!(await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    }));
  }

  private async assertExists(id: number) {
    const found = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException('Родительская категория не найдена');
    }
  }
}
