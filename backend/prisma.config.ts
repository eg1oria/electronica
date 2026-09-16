import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node src/seed.ts',
  },
  datasource: {
    // Не env(): `prisma generate` (postinstall, сборка Docker) должен
    // работать без базы. Команды migrate без DATABASE_URL упадут сами.
    url: process.env.DATABASE_URL,
  },
});
