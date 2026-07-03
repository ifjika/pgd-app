import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SimulatorService } from './simulator.service';

@ApiTags('Simulator')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get simulator status' })
  getStatus() {
    return this.simulatorService.getStatus();
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Enable or disable the simulator' })
  toggle(@Body('enabled') enabled: boolean) {
    this.simulatorService.setEnabled(enabled);
    return this.simulatorService.getStatus();
  }
}
