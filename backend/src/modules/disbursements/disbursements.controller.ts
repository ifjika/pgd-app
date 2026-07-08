import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/disbursement.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DisbursementStatus } from './entities/disbursement.entity';

@ApiTags('Disbursements')
@Controller('api/disbursements')
@UseGuards(AuthGuard('jwt'))
export class DisbursementsController {
  constructor(private readonly disbursementsService: DisbursementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all disbursements' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: DisbursementStatus,
    @Query('merchantId') merchantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.disbursementsService.findAll({
      ...paginationDto,
      status,
      merchantId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get disbursement by ID' })
  findOne(@Param('id') id: string) {
    return this.disbursementsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new disbursement' })
  create(@Body() createDisbursementDto: CreateDisbursementDto) {
    return this.disbursementsService.create(createDisbursementDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update disbursement status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: DisbursementStatus,
    @Body('failureReason') failureReason?: string,
  ) {
    return this.disbursementsService.updateStatus(id, status, failureReason);
  }
}
