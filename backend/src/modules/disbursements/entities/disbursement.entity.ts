import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

export enum DisbursementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum DisbursementChannelType {
  E_WALLET = 'e_wallet',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('disbursements')
@Index(['merchantId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Disbursement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  orderId!: string;

  @Column({ nullable: true })
  issuerOrderId!: string;

  @Column({ nullable: true })
  refId!: string;

  @Column({ nullable: true })
  merchantRefId!: string;

  @Column()
  merchantId!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fee!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netAmount!: number;

  @Column({ default: 'IDR' })
  currency!: string;

  @Column({ type: 'enum', enum: DisbursementStatus, default: DisbursementStatus.PENDING })
  status!: DisbursementStatus;

  @Column({ type: 'enum', enum: DisbursementChannelType })
  channelType!: DisbursementChannelType;

  @Column()
  channel!: string; // e.g. DANA, OVO, MANDIRI, BRI, BNI, BCA

  @Column()
  recipientAccount!: string;

  @Column()
  recipientName!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  failureReason!: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
