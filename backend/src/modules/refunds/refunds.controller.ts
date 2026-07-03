import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/refund.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RefundStatus } from './entities/refund.entity';

@ApiTags('Refunds')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  @ApiOperation({ summary: 'List all refunds (paginated)' })
  @ApiQuery({ name: 'status', enum: RefundStatus, required: false })
  findAll(@Query() query: PaginationDto & { status?: RefundStatus }) {
    return this.refundsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Request a refund' })
  create(@Body() dto: CreateRefundDto) {
    return this.refundsService.create(dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a refund' })
  approve(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.refundsService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a refund' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.refundsService.reject(id, reason);
  }
}
