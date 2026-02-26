import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DrizzleModule } from '../../db/drizzle.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
