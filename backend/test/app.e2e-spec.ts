import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupApp } from '../src/setup-app';

// Требует запущенной БД с выполненным `npm run db:seed`.
describe('Shop API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  const sku = `E2E-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        login: process.env.ADMIN_LOGIN ?? 'admin',
        password: process.env.ADMIN_PASSWORD ?? 'admin12345',
      })
      .expect(200);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { items: { some: { sku } } } });
    await prisma.product.deleteMany({ where: { sku } });
    await app.close();
  });

  it('health-check отвечает', () =>
    request(app.getHttpServer())
      .get('/api/health')
      .expect(200, { status: 'ok' }));

  it('закрывает админку без токена', () =>
    request(app.getHttpServer()).get('/api/admin/products').expect(401));

  it('валидирует тело запроса', () =>
    request(app.getHttpServer())
      .post('/api/admin/products')
      .auth(token, { type: 'bearer' })
      .send({ name: 'x', price: -1 })
      .expect(400));

  it('не принимает несуществующую категорию', () =>
    request(app.getHttpServer())
      .post('/api/admin/products')
      .auth(token, { type: 'bearer' })
      .send({ name: 'x', sku, description: '', price: 1, categoryId: 2e9 })
      .expect(400));

  it('отклоняет слишком большой id', () =>
    request(app.getHttpServer())
      .get('/api/admin/products/99999999999')
      .auth(token, { type: 'bearer' })
      .expect(400));

  it('создаёт товар и показывает его в каталоге', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/admin/products')
      .auth(token, { type: 'bearer' })
      .send({
        name: `Тестовый товар ${sku}`,
        sku,
        description: 'Описание',
        price: 1234.5,
        stock: 2,
        categoryId: category.id,
        images: [{ url: '/uploads/test.png' }],
        specs: [{ name: 'Цвет', value: 'Чёрный' }],
      })
      .expect(201);

    expect(created.body).toMatchObject({
      price: 1234.5,
      slug: `testovyy-tovar-${sku.toLowerCase()}`,
      images: [{ url: '/uploads/test.png', position: 0 }],
      specs: [{ name: 'Цвет', value: 'Чёрный' }],
    });

    const list = await request(server)
      .get('/api/products')
      .query({ search: sku, minPrice: 1000, maxPrice: 2000 })
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].sku).toBe(sku);

    await request(server).get(`/api/products/${created.body.slug}`).expect(200);

    // Скрытый товар пропадает из каталога, но виден в админке.
    await request(server)
      .patch(`/api/admin/products/${created.body.id}`)
      .auth(token, { type: 'bearer' })
      .send({ isActive: false })
      .expect(200);
    await request(server).get(`/api/products/${created.body.slug}`).expect(404);
    await request(server)
      .get(`/api/admin/products/${created.body.id}`)
      .auth(token, { type: 'bearer' })
      .expect(200);

    // Повторный артикул — 409.
    await request(server)
      .post('/api/admin/products')
      .auth(token, { type: 'bearer' })
      .send({
        name: 'Дубль',
        sku,
        description: '',
        price: 1,
        categoryId: category.id,
      })
      .expect(409);
  });

  it('оформляет заказ по ценам из базы и возвращает остаток при отмене', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const server = app.getHttpServer();
    const orderSku = `${sku}-ORDER`;
    const product = await prisma.product.create({
      data: {
        name: 'Товар для заказа',
        slug: orderSku.toLowerCase(),
        sku: orderSku,
        description: '',
        price: 1000,
        stock: 3,
        categoryId: category.id,
      },
    });
    const order = {
      customerName: 'Тест',
      phone: '+7 700 000 00 00',
      delivery: 'PICKUP',
      payment: 'ON_DELIVERY',
    };

    try {
      await request(server)
        .post('/api/orders')
        .send({ ...order, delivery: 'COURIER', items: [] })
        .expect(400);

      await request(server)
        .post('/api/orders')
        .send({ ...order, items: [{ productId: product.id, qty: 4 }] })
        .expect(409);

      // Цену передать нельзя — она берётся только из базы.
      await request(server)
        .post('/api/orders')
        .send({
          ...order,
          items: [{ productId: product.id, qty: 1, price: 1 }],
        })
        .expect(400);

      // Одинаковые позиции складываются в одну.
      const placed = await request(server)
        .post('/api/orders')
        .send({
          ...order,
          items: [
            { productId: product.id, qty: 1 },
            { productId: product.id, qty: 1 },
          ],
        })
        .expect(201);
      expect(placed.body).toMatchObject({
        status: 'NEW',
        total: 2000,
        items: [{ productId: product.id, qty: 2, price: 1000 }],
      });
      const stock = async () =>
        (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
          .stock;
      expect(await stock()).toBe(1);

      await request(server).get('/api/admin/orders').expect(401);
      await request(server)
        .patch(`/api/admin/orders/${placed.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(await stock()).toBe(3);

      await request(server)
        .patch(`/api/admin/orders/${placed.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ status: 'NEW' })
        .expect(400);
    } finally {
      await prisma.order.deleteMany({
        where: { items: { some: { sku: orderSku } } },
      });
      await prisma.product.delete({ where: { id: product.id } });
    }
  });

  it('заводит сотрудника, и менеджеру закрыты разделы администратора', async () => {
    const server = app.getHttpServer();
    const login = `e2e-manager-${Date.now()}`;
    const password = 'manager12345';

    const created = await request(server)
      .post('/api/admin/users')
      .auth(token, { type: 'bearer' })
      .send({ login, password, name: 'Менеджер', role: 'MANAGER' })
      .expect(201);
    expect(created.body).toMatchObject({ login, role: 'MANAGER' });
    expect(created.body.passwordHash).toBeUndefined();

    try {
      const signed = await request(server)
        .post('/api/auth/login')
        .send({ login, password })
        .expect(200);
      const managerToken = signed.body.accessToken as string;

      // Каталог менеджеру доступен, сотрудники и настройки — нет.
      await request(server)
        .get('/api/admin/products')
        .auth(managerToken, { type: 'bearer' })
        .expect(200);
      await request(server)
        .get('/api/admin/users')
        .auth(managerToken, { type: 'bearer' })
        .expect(403);
      await request(server)
        .get('/api/admin/settings/telegram')
        .auth(managerToken, { type: 'bearer' })
        .expect(403);

      await request(server)
        .patch('/api/auth/password')
        .auth(managerToken, { type: 'bearer' })
        .send({ currentPassword: 'wrong-password', newPassword: 'manager54321' })
        .expect(401);

      // Свой пароль: старый токен отзывается, новый выдаётся в ответе.
      const changed = await request(server)
        .patch('/api/auth/password')
        .auth(managerToken, { type: 'bearer' })
        .send({ currentPassword: password, newPassword: 'manager54321' })
        .expect(200);
      await request(server)
        .get('/api/auth/me')
        .auth(managerToken, { type: 'bearer' })
        .expect(401);
      await request(server)
        .get('/api/auth/me')
        .auth(changed.body.accessToken, { type: 'bearer' })
        .expect(200);

      // Смена роли администратором тоже закрывает сессии сотрудника.
      await request(server)
        .patch(`/api/admin/users/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .send({ role: 'ADMIN' })
        .expect(200);
      await request(server)
        .get('/api/auth/me')
        .auth(changed.body.accessToken, { type: 'bearer' })
        .expect(401);
    } finally {
      await request(server)
        .delete(`/api/admin/users/${created.body.id}`)
        .auth(token, { type: 'bearer' })
        .expect(204);
    }
  });

  it('не даёт удалить собственную учётную запись', async () => {
    const server = app.getHttpServer();
    const me = await request(server)
      .get('/api/auth/me')
      .auth(token, { type: 'bearer' })
      .expect(200);
    await request(server)
      .delete(`/api/admin/users/${me.body.id}`)
      .auth(token, { type: 'bearer' })
      .expect(400);
  });

  it('проверяет настройки Telegram и не отдаёт токен наружу', async () => {
    const server = app.getHttpServer();

    await request(server)
      .put('/api/admin/settings/telegram')
      .auth(token, { type: 'bearer' })
      .send({ botToken: 'это-не-токен' })
      .expect(400);
    // Включить уведомления без бота нельзя.
    await request(server)
      .put('/api/admin/settings/telegram')
      .auth(token, { type: 'bearer' })
      .send({ enabled: true })
      .expect(400);
    await request(server)
      .put('/api/admin/settings/telegram')
      .auth(token, { type: 'bearer' })
      .send({ chatId: 'чат' })
      .expect(400);

    try {
      const saved = await request(server)
        .put('/api/admin/settings/telegram')
        .auth(token, { type: 'bearer' })
        .send({ chatId: '123456789' })
        .expect(200);
      expect(saved.body).toMatchObject({
        chatId: '123456789',
        enabled: false,
        tokenPreview: null,
      });
      expect(saved.body.telegramBotToken).toBeUndefined();

      // Без токена отправлять нечем — понятная ошибка вместо 500.
      await request(server)
        .post('/api/admin/settings/telegram/test')
        .auth(token, { type: 'bearer' })
        .expect(400);
    } finally {
      await request(server)
        .put('/api/admin/settings/telegram')
        .auth(token, { type: 'bearer' })
        .send({ botToken: '', chatId: '', enabled: false })
        .expect(200);
    }
  });
});
