import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionStatus, TransactionCurrency, SettlementType } from '../transactions/entities/transaction.entity';
import { calculateSettlementDate } from '../transactions/transactions.service';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Refund, RefundStatus } from '../refunds/entities/refund.entity';
import { WebhookLog, WebhookEvent, WebhookDeliveryStatus } from '../webhooks/entities/webhook-log.entity';
import { Disbursement, DisbursementStatus } from '../disbursements/entities/disbursement.entity';

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);
  private isEnabled: boolean;

  constructor(
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Merchant) private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(PaymentMethod) private readonly paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(Refund) private readonly refundRepo: Repository<Refund>,
    @InjectRepository(WebhookLog) private readonly webhookLogRepo: Repository<WebhookLog>,
    @InjectRepository(Disbursement) private readonly disbursementRepo: Repository<Disbursement>,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<boolean>('app.simulatorEnabled', true);
  }

  // Create new transactions every 15 seconds
  @Cron('*/15 * * * * *')
  async createTransactions() {
    if (!this.isEnabled) return;

    try {
      const merchants = await this.merchantRepo.find({ where: { status: 'active' as any } });
      const customers = await this.customerRepo.find();
      const paymentMethods = await this.paymentMethodRepo.find({ where: { isActive: true } });

      if (merchants.length === 0 || customers.length === 0 || paymentMethods.length === 0) return;

      const count = Math.floor(Math.random() * 3) + 1; // 1-3 transactions

      for (let i = 0; i < count; i++) {
        const merchant = merchants[Math.floor(Math.random() * merchants.length)]!;
        const customer = customers[Math.floor(Math.random() * customers.length)]!;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]!;
        const currencies = [TransactionCurrency.USD, TransactionCurrency.IDR, TransactionCurrency.EUR, TransactionCurrency.SGD];
        const currency = currencies[Math.floor(Math.random() * currencies.length)]!;

        let amount: number;
        if (currency === TransactionCurrency.IDR) {
          amount = Math.floor(Math.random() * 5000000 + 10000);
        } else {
          amount = parseFloat((Math.random() * 500 + 5).toFixed(2));
        }

        const fee = parseFloat((amount * Number(merchant.feePercentage) / 100).toFixed(2));
        const netAmount = parseFloat((amount - fee).toFixed(2));

        const descriptions = [
          'API checkout payment',
          'Recurring subscription',
          'Mobile app purchase',
          'Web checkout',
          'POS terminal payment',
          'Invoice payment',
          'Marketplace purchase',
        ];

        const transaction = this.transactionRepo.create({
          orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          issuerOrderId: `ISS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          refId: `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          merchantRefId: `MREF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          merchantId: merchant.id,
          customerId: customer.id,
          paymentMethodId: paymentMethod.id,
          amount,
          fee,
          netAmount,
          currency,
          status: TransactionStatus.PENDING,
          settlementType: Math.random() < 0.3 ? SettlementType.T0 : SettlementType.T1,
          idempotencyKey: uuidv4(),
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          metadata: { source: 'simulator', generatedAt: new Date().toISOString() },
        });

        await this.transactionRepo.save(transaction);
      }

      this.logger.debug(`🔄 Simulator: Created ${count} new transaction(s)`);
    } catch (error) {
      this.logger.error('Simulator error creating transactions:', error);
    }
  }

  // Process pending transactions every 30 seconds
  @Cron('*/30 * * * * *')
  async processTransactions() {
    if (!this.isEnabled) return;

    try {
      const pending = await this.transactionRepo.find({
        where: { status: In([TransactionStatus.PENDING, TransactionStatus.PROCESSING]) },
        take: 10,
        relations: { merchant: true },
      });

      for (const tx of pending) {
        if (tx.status === TransactionStatus.PENDING) {
          tx.status = TransactionStatus.PROCESSING;
          await this.transactionRepo.save(tx);
          continue;
        }

        // Processing → Success (85%) or Failed (15%)
        const isSuccess = Math.random() < 0.85;
        tx.status = isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED;
        tx.processedAt = new Date();
        if (isSuccess) {
          tx.settlementDate = calculateSettlementDate(tx.createdAt, tx.settlementType);
        }

        if (!isSuccess) {
          const reasons = [
            'Insufficient funds',
            'Card declined by issuer',
            'Network timeout',
            'Suspected fraud',
            'Invalid CVV',
          ];
          tx.failureReason = reasons[Math.floor(Math.random() * reasons.length)];
        }

        await this.transactionRepo.save(tx);

        // Create webhook log
        const webhookLog = this.webhookLogRepo.create({
          merchantId: tx.merchantId,
          transactionId: tx.id,
          event: isSuccess ? WebhookEvent.PAYMENT_SUCCESS : WebhookEvent.PAYMENT_FAILED,
          payload: {
            event: isSuccess ? 'payment.success' : 'payment.failed',
            transaction_id: tx.id,
            order_id: tx.orderId,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            processed_at: tx.processedAt,
          },
          deliveryStatus: Math.random() > 0.08 ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED,
          statusCode: 200,
          response: '{"received":true}',
          attempts: 1,
        });
        await this.webhookLogRepo.save(webhookLog);
      }

      if (pending.length > 0) {
        this.logger.debug(`⚡ Simulator: Processed ${pending.length} transaction(s)`);
      }
    } catch (error) {
      this.logger.error('Simulator error processing transactions:', error);
    }
  }

  // Create refund requests every 60 seconds
  @Cron('*/60 * * * * *')
  async createRefunds() {
    if (!this.isEnabled) return;

    try {
      // ~20% chance to create a refund on each cycle
      if (Math.random() > 0.20) return;

      const successfulTx = await this.transactionRepo.find({
        where: { status: TransactionStatus.SUCCESS },
        order: { createdAt: 'DESC' },
        take: 20,
      });

      if (successfulTx.length === 0) return;

      const tx = successfulTx[Math.floor(Math.random() * successfulTx.length)]!;

      // Check if refund already exists
      const existingRefund = await this.refundRepo.findOne({
        where: { transactionId: tx.id },
      });
      if (existingRefund) return;

      const reasons = [
        'Customer requested cancellation',
        'Item not as described',
        'Duplicate payment',
        'Service not delivered',
        'Wrong amount charged',
      ];

      const isPartial = Math.random() > 0.6;
      const refundAmount = isPartial
        ? parseFloat((Number(tx.amount) * (Math.random() * 0.5 + 0.1)).toFixed(2))
        : Number(tx.amount);

      const refund = this.refundRepo.create({
        transactionId: tx.id,
        amount: refundAmount,
        reason: reasons[Math.floor(Math.random() * reasons.length)]!,
        status: RefundStatus.PENDING,
      });

      await this.refundRepo.save(refund);
      this.logger.debug(`💰 Simulator: Created refund request for ${refundAmount}`);
    } catch (error) {
      this.logger.error('Simulator error creating refunds:', error);
    }
  }

  // Auto-process some refunds every 2 minutes
  @Cron('*/120 * * * * *')
  async processRefunds() {
    if (!this.isEnabled) return;

    try {
      const pendingRefunds = await this.refundRepo.find({
        where: { status: RefundStatus.PENDING },
        relations: { transaction: true },
        take: 5,
      });

      for (const refund of pendingRefunds) {
        // 80% approved, 20% rejected
        if (Math.random() < 0.80) {
          refund.status = RefundStatus.COMPLETED;
          refund.approvedBy = 'system-auto';
          refund.processedAt = new Date();

          // Update transaction status
          if (Number(refund.amount) >= Number(refund.transaction.amount)) {
            refund.transaction.status = TransactionStatus.REFUNDED;
          } else {
            refund.transaction.status = TransactionStatus.PARTIALLY_REFUNDED;
          }
          await this.transactionRepo.save(refund.transaction);

          // Webhook
          const log = this.webhookLogRepo.create({
            merchantId: refund.transaction.merchantId,
            transactionId: refund.transaction.id,
            event: WebhookEvent.REFUND_COMPLETED,
            payload: {
              event: 'refund.completed',
              refund_id: refund.id,
              transaction_id: refund.transaction.id,
              amount: refund.amount,
            },
            deliveryStatus: WebhookDeliveryStatus.DELIVERED,
            statusCode: 200,
            response: '{"received":true}',
            attempts: 1,
          });
          await this.webhookLogRepo.save(log);
        } else {
          refund.status = RefundStatus.REJECTED;
          refund.rejectionReason = 'Refund period expired';
          refund.processedAt = new Date();
        }

        await this.refundRepo.save(refund);
      }

      if (pendingRefunds.length > 0) {
        this.logger.debug(`🔁 Simulator: Processed ${pendingRefunds.length} refund(s)`);
      }
    } catch (error) {
      this.logger.error('Simulator error processing refunds:', error);
    }
  }

  // Process pending disbursements every 20 seconds
  @Cron('*/20 * * * * *')
  async processDisbursements() {
    if (!this.isEnabled) return;

    try {
      const now = new Date();
      const currentHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jakarta',
          hour: 'numeric',
          hour12: false
        }).format(now),
        10
      );

      // Check EOD Maintenance Window
      if (currentHour >= 1 && currentHour < 4) {
        this.logger.debug('⏳ Simulator: EOD Maintenance window (01:00 AM - 04:00 AM) active. Holding all disbursements.');
        return;
      }

      const pending = await this.disbursementRepo.find({
        where: { status: In([DisbursementStatus.PENDING, DisbursementStatus.PROCESSING]) as any },
        take: 5,
      });

      for (const db of pending) {
        if (db.status === DisbursementStatus.PENDING) {
          db.status = DisbursementStatus.PROCESSING;
          await this.disbursementRepo.save(db);
          continue;
        }

        // Processing → Success (90%) or Failed (10%)
        const isSuccess = Math.random() < 0.90;
        db.status = isSuccess ? DisbursementStatus.SUCCESS : DisbursementStatus.FAILED;
        if (!isSuccess) {
          db.failureReason = 'Partner bank system timeout';
        }
        await this.disbursementRepo.save(db);
      }

      if (pending.length > 0) {
        this.logger.debug(`💸 Simulator: Processed ${pending.length} disbursement(s)`);
      }
    } catch (error) {
      this.logger.error('Simulator error processing disbursements:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.logger.log(`Simulator ${enabled ? 'enabled' : 'disabled'}`);
  }

  getStatus(): { enabled: boolean } {
    return { enabled: this.isEnabled };
  }
}
