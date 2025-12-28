import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsService } from './common/metrics/metrics.service';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

const logger = new Logger('Serverless');
let cachedApp: express.Application;

/**
 * Serverless handler entry point for Vercel.
 * This initializes the NestJS application and exports the Express app.
 * Uses a singleton pattern to cache the app instance across warm starts.
 */
async function bootstrap() {
  if (!cachedApp) {
    logger.log('Initializing NestJS application for Vercel serverless environment');

    const expressApp = express();

    // Serve swagger-ui-dist static files
    expressApp.use(
      '/v1/api/docs',
      express.static(require('path').join(__dirname, '../node_modules/swagger-ui-dist'))
    );

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn', 'log'],
      }
    );

    // Set global prefix
    app.setGlobalPrefix('v1');

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
      .addTag('Authentication', 'User registration, login, and token management')
      .addTag('Workspaces', 'Workspace management and member operations')
      .addTag('Projects', 'Project CRUD and collaboration')
      .addTag('Jobs', 'Asynchronous background job processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Setup Swagger UI with local swagger-ui-dist
    SwaggerModule.setup('v1/api/docs', app, document, {
      customSiteTitle: 'Collaborative Workspace API',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    await app.init();

    cachedApp = expressApp;
    logger.log('NestJS application initialized successfully with Swagger UI');
  }

  return cachedApp;
}

// Export the Express app for Vercel
export default async (req: Request, res: Response) => {
  const app = await bootstrap();
  return app(req, res);
};
