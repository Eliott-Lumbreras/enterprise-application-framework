import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

/**
 * Integration test: runs the real HTTP layer against a test database.
 * Requires a running test PostgreSQL instance configured via env vars
 * (see docker.md skill for a disposable local instance).
 */
describe('{{PascalCase}} (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Replace with a real test-user login against the auth endpoint.
    authToken = 'test-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/{{PLURAL_kebab-case}}').expect(401);
  });

  it('rejects invalid payloads with 400', async () => {
    await request(app.getHttpServer())
      .post('/{{PLURAL_kebab-case}}')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  it('creates and retrieves a {{kebab-case}}', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/{{PLURAL_kebab-case}}')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Integration Test {{PascalCase}}' })
      .expect(201);

    const id = createRes.body.id;

    await request(app.getHttpServer())
      .get(`/{{PLURAL_kebab-case}}/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
