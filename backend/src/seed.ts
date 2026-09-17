import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, Role } from './generated/prisma/client';

/**
 * Начальные данные: администратор из ADMIN_LOGIN/ADMIN_PASSWORD и демо-каталог.
 * Идемпотентен — существующие записи не перезаписываются.
 * Dev: `npm run db:seed`, в Docker: `node dist/seed.js`.
 */
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL не задан');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const login = (process.env.ADMIN_LOGIN ?? 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD должен быть не короче 8 символов');
  }

  // Пароль существующего админа не перезаписывается.
  await prisma.user.upsert({
    where: { login },
    update: {},
    create: {
      login,
      name: 'Администратор',
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  const categories = [
    { slug: 'smartphones', name: 'Смартфоны' },
    { slug: 'laptops', name: 'Ноутбуки' },
    { slug: 'audio', name: 'Аудио' },
    { slug: 'headphones', name: 'Наушники', parent: 'audio' },
  ];
  const categoryIds: Record<string, number> = {};
  for (const { parent, ...c } of categories) {
    const { id } = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, parentId: parent ? categoryIds[parent] : undefined },
    });
    categoryIds[c.slug] = id;
  }

  const brandIds: Record<string, number> = {};
  for (const b of [
    { slug: 'apple', name: 'Apple' },
    { slug: 'samsung', name: 'Samsung' },
    { slug: 'sony', name: 'Sony' },
  ]) {
    brandIds[b.slug] = (
      await prisma.brand.upsert({
        where: { slug: b.slug },
        update: {},
        create: b,
      })
    ).id;
  }

  const products = [
    {
      name: 'Apple iPhone 16 128 ГБ',
      slug: 'apple-iphone-16-128gb',
      sku: 'APL-IP16-128',
      shortDescription: 'Смартфон с чипом A18 и камерой 48 Мп',
      description:
        'iPhone 16 с дисплеем Super Retina XDR 6,1", чипом A18 и кнопкой «Камера».',
      price: 79990,
      oldPrice: 89990,
      stock: 15,
      isFeatured: true,
      warrantyMonths: 12,
      weightGrams: 170,
      category: 'smartphones',
      brand: 'apple',
      specs: [
        { group: 'Экран', name: 'Диагональ', value: '6,1"' },
        { group: 'Производительность', name: 'Процессор', value: 'Apple A18' },
        { group: 'Память', name: 'Встроенная память', value: '128 ГБ' },
      ],
    },
    {
      name: 'Samsung Galaxy S25 256 ГБ',
      slug: 'samsung-galaxy-s25-256gb',
      sku: 'SMS-S25-256',
      shortDescription: 'Флагман с Snapdragon 8 Elite',
      description:
        'Galaxy S25 с экраном Dynamic AMOLED 2X 6,2" и 12 ГБ оперативной памяти.',
      price: 84990,
      stock: 8,
      warrantyMonths: 12,
      weightGrams: 162,
      category: 'smartphones',
      brand: 'samsung',
      specs: [
        { group: 'Экран', name: 'Диагональ', value: '6,2"' },
        { group: 'Память', name: 'Оперативная память', value: '12 ГБ' },
        { group: 'Память', name: 'Встроенная память', value: '256 ГБ' },
      ],
    },
    {
      name: 'Apple MacBook Air 13 M3 16/512',
      slug: 'apple-macbook-air-13-m3-16-512',
      sku: 'APL-MBA13-M3-512',
      shortDescription: 'Лёгкий ноутбук на Apple M3',
      description: 'MacBook Air 13" с чипом M3, 16 ГБ памяти и SSD 512 ГБ.',
      price: 139990,
      stock: 4,
      isFeatured: true,
      warrantyMonths: 12,
      weightGrams: 1240,
      category: 'laptops',
      brand: 'apple',
      specs: [
        { group: 'Производительность', name: 'Процессор', value: 'Apple M3' },
        { group: 'Память', name: 'Оперативная память', value: '16 ГБ' },
        { group: 'Память', name: 'SSD', value: '512 ГБ' },
      ],
    },
    {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      sku: 'SNY-WH1000XM5',
      shortDescription: 'Беспроводные наушники с шумоподавлением',
      description:
        'Полноразмерные наушники с активным шумоподавлением и автономностью до 30 часов.',
      price: 32990,
      stock: 0,
      warrantyMonths: 12,
      weightGrams: 250,
      category: 'headphones',
      brand: 'sony',
      specs: [
        { group: 'Основные', name: 'Тип подключения', value: 'Bluetooth 5.2' },
        { group: 'Основные', name: 'Время работы', value: '30 ч' },
      ],
    },
  ];

  for (const { category, brand, specs, ...p } of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        categoryId: categoryIds[category],
        brandId: brandIds[brand],
        specs: { create: specs.map((s, position) => ({ ...s, position })) },
      },
    });
  }

  console.log(`Сид выполнен. Админ: ${login}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
