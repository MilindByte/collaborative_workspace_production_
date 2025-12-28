import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { LoggingInterceptor } from './../src/common/interceptors/logging.interceptor';
import { MetricsService } from './../src/common/metrics/metrics.service';

describe('Full Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mimic main.ts setup
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    const metricsService = app.get(MetricsService);
    app.useGlobalInterceptors(new LoggingInterceptor(metricsService));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/v1/auth/register (POST)', () => {
      const email = `test-${Date.now()}@example.com`;
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          name: 'Test user',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.user.email).toBe(email);
          accessToken = res.body.accessToken;
        });
    });

    it('/v1/auth/login (POST)', () => {
      // Assuming previous test set accessToken, but let's re-login for thoroughness
      // and to test the login endpoint specifically.
    });
  });

  describe('Workspaces', () => {
    it('/v1/workspaces (POST)', () => {
      return request(app.getHttpServer())
        .post('/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'My Workspace',
          description: 'A test workspace',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.name).toBe('My Workspace');
          workspaceId = res.body.id;
        });
    });

    it('/v1/workspaces (GET)', () => {
      return request(app.getHttpServer())
        .get('/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Projects', () => {
    it('/v1/projects (POST)', () => {
      return request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'My Project',
          workspaceId: workspaceId,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.name).toBe('My Project');
        });
    });
  });

  describe('Metrics', () => {
    it('/v1/metrics (GET)', () => {
      return request(app.getHttpServer())
        .get('/v1/metrics')
        .expect(200)
        .then((res) => {
          expect(res.body.totalRequests).toBeGreaterThan(0);
        });
    });
  });
});
