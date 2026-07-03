import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum WebhookEvent {
  PAYMENT_PENDING = 'payment.pending',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_EXPIRED = 'payment.expired',
  REFUND_REQUESTED = 'refund.requested',
  REFUND_APPROVED = 'refund.approved',
  REFUND_COMPLETED = 'refund.completed',
  REFUND_REJECTED = 'refund.rejected',
}

export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  merchantId!: string;

  @Column({ nullable: true })
  transactionId!: string;

  @Column({ type: 'enum', enum: WebhookEvent })
  event!: WebhookEvent;

  @Column({ type: 'json' })
  payload!: Record<string, unknown>;

  @Column({ type: 'enum', enum: WebhookDeliveryStatus, default: WebhookDeliveryStatus.PENDING })
  deliveryStatus!: WebhookDeliveryStatus;

  @Column({ nullable: true })
  statusCode!: number;

  @Column({ type: 'text', nullable: true })
  response!: string;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ nullable: true })
  nextRetryAt!: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.webhookLogs)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @ManyToOne(() => Transaction, (transaction) => transaction.webhookLogs)
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;

  @CreateDateColumn()
  createdAt!: Date;
}
