import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'FEATURE_FLAGS',
      useFactory: (configService: ConfigService) => {
        return {
          enableBetaFeatures:
            configService.get('ENABLE_BETA_FEATURES') === 'true',
          enableNewAuthFlow:
            configService.get('ENABLE_NEW_AUTH_FLOW') === 'true',
        };
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FEATURE_FLAGS'],
})
export class FeatureFlagModule {}
