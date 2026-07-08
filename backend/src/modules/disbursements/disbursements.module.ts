import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisbursementsService } from './disbursements.service';
import { DisbursementsController } from './disbursements.controller';
import { Disbursement } from './entities/disbursement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Disbursement])],
  controllers: [DisbursementsController],
  providers: [DisbursementsService],
  exports: [DisbursementsService, TypeOrmModule],
})
export class DisbursementsModule {}
