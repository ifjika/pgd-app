import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet',
  QRIS = 'qris',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  type!: PaymentMethodType;

  @Column()
  provider!: string;

  @Column({ nullable: true })
  icon!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  additionalFee!: number;

  @OneToMany(() => Transaction, (transaction) => transaction.paymentMethod)
  transactions!: Transaction[];

  @CreateDateColumn()
  createdAt!: Date;
}
