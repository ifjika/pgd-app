import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { WebhookLog } from '../webhooks/entities/webhook-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Merchant,
      Customer,
      PaymentMethod,
      Refund,
      WebhookLog,
    ]),
  ],
  controllers: [SimulatorController],
  providers: [SimulatorService],
  exports: [SimulatorService],
})
export class SimulatorModule {}
