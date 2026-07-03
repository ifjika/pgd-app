import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Refund } from '../../refunds/entities/refund.entity';
import { WebhookLog } from '../../webhooks/entities/webhook-log.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum TransactionCurrency {
  USD = 'USD',
  IDR = 'IDR',
  EUR = 'EUR',
  SGD = 'SGD',
}

@Entity('transactions')
@Index(['merchantId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  orderId!: string;

  @Column()
  merchantId!: string;

  @Column()
  customerId!: string;

  @Column()
  paymentMethodId!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fee!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netAmount!: number;

  @Column({ type: 'enum', enum: TransactionCurrency, default: TransactionCurrency.USD })
  currency!: TransactionCurrency;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ unique: true })
  idempotencyKey!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown>;

  @Column({ nullable: true })
  failureReason!: string;

  @Column({ nullable: true })
  processedAt!: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.transactions)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @ManyToOne(() => Customer, (customer) => customer.transactions)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @ManyToOne(() => PaymentMethod, (pm) => pm.transactions)
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod!: PaymentMethod;

  @OneToMany(() => Refund, (refund) => refund.transaction)
  refunds!: Refund[];

  @OneToMany(() => WebhookLog, (log) => log.transaction)
  webhookLogs!: WebhookLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
