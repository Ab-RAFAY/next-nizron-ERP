import { Module } from '@nestjs/common';
import { ClientPortalController } from './client-portal.controller';
import { DrizzleModule } from '../../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ClientPortalController],
  providers: [],
})
export class ClientPortalModule {}
