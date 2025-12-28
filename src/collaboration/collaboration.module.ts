import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CollaborationGateway],
})
export class CollaborationModule {}
