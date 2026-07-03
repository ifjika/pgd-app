import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('chart')
  @ApiOperation({ summary: 'Get time-series chart data' })
  @ApiQuery({ name: 'period', enum: ['7d', '30d', '90d'], required: false })
  getChartData(@Query('period') period?: string) {
    return this.analyticsService.getChartData(period || '7d');
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get payment method distribution' })
  getPaymentMethodDistribution() {
    return this.analyticsService.getPaymentMethodDistribution();
  }

  @Get('top-merchants')
  @ApiOperation({ summary: 'Get top merchants by volume' })
  @ApiQuery({ name: 'limit', required: false })
  getTopMerchants(@Query('limit') limit?: number) {
    return this.analyticsService.getTopMerchants(limit || 5);
  }
}
