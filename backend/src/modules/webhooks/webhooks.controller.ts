import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WebhooksService } from './webhooks.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { WebhookEvent } from './entities/webhook-log.entity';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhook delivery logs' })
  @ApiQuery({ name: 'event', enum: WebhookEvent, required: false })
  @ApiQuery({ name: 'merchantId', required: false })
  findAll(@Query() query: PaginationDto & { event?: WebhookEvent; merchantId?: string }) {
    return this.webhooksService.findAll(query);
  }
}
