import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../modules/auth/entities/user.entity';
import { Merchant } from '../../modules/merchants/entities/merchant.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { PaymentMethod } from '../../modules/payment-methods/entities/payment-method.entity';
import { Transaction } from '../../modules/transactions/entities/transaction.entity';
import { WebhookLog } from '../../modules/webhooks/entities/webhook-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Merchant, Customer, PaymentMethod, Transaction, WebhookLog]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
