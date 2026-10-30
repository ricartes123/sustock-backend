import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = { $queryRaw: jest.fn() };

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'e2e-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responds ok when the database answers', () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /health responds 503 when the database is unreachable', () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));

    return request(app.getHttpServer())
      .get('/health')
      .expect(503);
  });
});
