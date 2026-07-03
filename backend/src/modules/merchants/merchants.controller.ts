import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Merchants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all merchants (paginated)' })
  findAll(@Query() query: PaginationDto) {
    return this.merchantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant by ID' })
  findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get merchant statistics' })
  getStats(@Param('id') id: string) {
    return this.merchantsService.getStats(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new merchant' })
  create(@Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a merchant' })
  update(@Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.merchantsService.update(id, dto);
  }
}
