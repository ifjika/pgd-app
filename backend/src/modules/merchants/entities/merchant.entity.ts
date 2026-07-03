import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { WebhookLog } from '../../webhooks/entities/webhook-log.entity';

export enum MerchantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ unique: true })
  apiKey!: string;

  @Column()
  secretKey!: string;

  @Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.ACTIVE })
  status!: MerchantStatus;

  @Column({ nullable: true })
  webhookUrl!: string;

  @Column({ nullable: true })
  logoUrl!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 'USD' })
  defaultCurrency!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 2.90 })
  feePercentage!: number;

  @OneToMany(() => Transaction, (transaction) => transaction.merchant)
  transactions!: Transaction[];

  @OneToMany(() => Customer, (customer) => customer.merchant)
  customers!: Customer[];

  @OneToMany(() => WebhookLog, (log) => log.merchant)
  webhookLogs!: WebhookLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
