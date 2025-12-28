import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobProcessor } from './jobs.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: parseInt(url.port, 10),
              password: url.password,
              username: url.username,
              tls: url.protocol === 'rediss:' ? {} : undefined,
            },
          };
        }
        return {
          redis: {
            host: configService.get('REDIS_HOST'),
            port: parseInt(configService.get('REDIS_PORT') as string, 10) || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'jobs',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobProcessor],
})
export class JobsModule { }
