import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLog, WebhookEvent, WebhookDeliveryStatus } from './entities/webhook-log.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepository: Repository<WebhookLog>,
  ) {}

  async findAll(query: PaginationDto & { event?: WebhookEvent; merchantId?: string }): Promise<PaginatedResponseDto<WebhookLog>> {
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const limit = Math.max(1, parseInt(String(query.limit || 20), 10));
    const sortBy = String(query.sortBy || 'createdAt');
    const sortOrder = (String(query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    const { event, merchantId } = query;
    const skip = Math.max(0, (page - 1) * limit);

    const where: Record<string, unknown> = {};
    if (event) where.event = event;
    if (merchantId) where.merchantId = merchantId;

    const [data, total] = await this.webhookLogRepository.findAndCount({
      where,
      relations: { merchant: true, transaction: true },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async createLog(data: {
    merchantId: string;
    transactionId: string;
    event: WebhookEvent;
    payload: Record<string, unknown>;
  }): Promise<WebhookLog> {
    // Simulate webhook delivery
    const isDelivered = Math.random() > 0.1; // 90% success rate

    const log = this.webhookLogRepository.create({
      ...data,
      deliveryStatus: isDelivered ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED,
      statusCode: isDelivered ? 200 : 500,
      response: isDelivered ? '{"status":"ok"}' : 'Connection timeout',
      attempts: 1,
    });

    return this.webhookLogRepository.save(log);
  }
}
