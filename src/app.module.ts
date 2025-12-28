import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { JobsModule } from './jobs/jobs.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { HealthModule } from './health/health.module';
import { FeatureFlagModule } from './common/feature-flags/feature-flags.module';
import { MetricsModule } from './common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    JobsModule,
    CollaborationModule,
    HealthModule,
    FeatureFlagModule,
    MetricsModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        console.log('[CacheModule] REDIS_URL present:', !!redisUrl);

        if (redisUrl) {
          return {
            store: await redisStore({
              url: redisUrl,
              ttl: 60 * 1000,
            }),
          };
        }

        return {
          store: await redisStore({
            socket: {
              host: configService.get('REDIS_HOST') || 'localhost',
              port: parseInt(configService.get('REDIS_PORT') as string, 10) || 6379,
            },
            ttl: 60 * 1000,
          }),
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
