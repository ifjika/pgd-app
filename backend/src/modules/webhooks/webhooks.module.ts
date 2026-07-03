import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookLog } from './entities/webhook-log.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookLog])],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService, TypeOrmModule],
})
export class WebhooksModule {}
