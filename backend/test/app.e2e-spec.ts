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
        email: process.env.ADMIN_EMAIL ?? 'admin@electronica.local',
        password: process.env.ADMIN_PASSWORD ?? 'admin12345',
      })
      .expect(200);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { sku } });
    await app.close();
  });

  it('закрывает админку без токена', () =>
    request(app.getHttpServer()).get('/api/admin/products').expect(401));

  it('валидирует тело запроса', () =>
    request(app.getHttpServer())
      .post('/api/admin/products')
      .auth(token, { type: 'bearer' })
      .send({ name: 'x', price: -1 })
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
  });
});
