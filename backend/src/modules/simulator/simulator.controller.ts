import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SimulatorService } from './simulator.service';

@ApiTags('Simulator')
@Controller('api/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get simulator status' })
  getStatus() {
    return this.simulatorService.getStatus();
  }

  @Post('toggle')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enable or disable the simulator' })
  toggle(@Body('enabled') enabled: boolean) {
    this.simulatorService.setEnabled(enabled);
    return this.simulatorService.getStatus();
  }

  @Get('trigger')
  @Post('trigger')
  @ApiOperation({ summary: 'Trigger one simulator cycle manually or via cron' })
  async trigger(@Query('force') force?: string) {
    return this.simulatorService.triggerSimulationCycle(force === 'true');
  }
}

