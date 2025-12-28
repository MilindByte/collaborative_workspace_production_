import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './collaboration/redis-io.adapter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsService } from './common/metrics/metrics.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    console.log('Environment Debug:');
    console.log('REDIS_URL Present:', !!process.env.REDIS_URL);
    console.log('DATABASE_URL Present:', !!process.env.DATABASE_URL);

    // Redis Adapter for WebSockets (optional)
    if (process.env.REDIS_URL) {
      try {
        const redisIoAdapter = new RedisIoAdapter(app);
        await redisIoAdapter.connectToRedis();
        app.useWebSocketAdapter(redisIoAdapter);
        console.log('✅ Redis WebSocket adapter connected');
      } catch (error) {
        console.warn('⚠️  Redis connection failed, WebSocket features may be limited:', error.message);
      }
    } else {
      console.warn('⚠️  REDIS_URL not configured, WebSocket features will use default adapter');
    }

    // Set global prefix
    app.setGlobalPrefix('v1');

    // Enable API Versioning
    app.enableVersioning();

    // Enable CORS
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Global logging interceptor
    const metricsService = app.get(MetricsService);
    app.useGlobalInterceptors(new LoggingInterceptor(metricsService));

    // Swagger API Documentation
    const config = new DocumentBuilder()
      .setTitle('Collaborative Workspace API')
      .setDescription(
        'Real-time collaborative workspace backend with authentication, project management, WebSockets, and background jobs',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag(
        'Authentication',
        'User registration, login, and token management',
      )
      .addTag('Workspaces', 'Workspace management and member operations')
      .addTag('Projects', 'Project CRUD and collaboration')
      .addTag('Jobs', 'Asynchronous background job processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('v1/api/docs', app, document, {
      customSiteTitle: 'Collaborative Workspace API',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`\n🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/v1/api/docs`);
    console.log(
      `🔌 WebSocket endpoint: ws://localhost:${port}/collaboration\n`,
    );
  } catch (error) {
    console.error('❌ Error during application bootstrap:', error);
    process.exit(1);
  }
}
bootstrap();
