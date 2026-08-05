import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { Transaction, TransactionStatus, SettlementType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/transaction.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

export function calculateSettlementDate(createdAt: Date, type: SettlementType): Date {
  const date = new Date(createdAt);
  if (type === SettlementType.T0) {
    return date;
  }

  function getJakartaDay(d: Date): number {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' });
    const weekdayStr = formatter.format(d);
    const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return daysMap[weekdayStr] ?? d.getDay();
  }
  
  let day = getJakartaDay(date);
  if (day === 6) { // Saturday
    date.setDate(date.getDate() + 2); // Monday
  } else if (day === 0) { // Sunday
    date.setDate(date.getDate() + 1); // Monday
  }
  
  date.setDate(date.getDate() + 1);
  day = getJakartaDay(date);
  if (day === 6) {
    date.setDate(date.getDate() + 2);
  } else if (day === 0) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(
    query: PaginationDto & {
      status?: TransactionStatus;
      merchantId?: string;
      merchantIds?: string | string[];
      minAmount?: number;
      maxAmount?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginatedResponseDto<Transaction>> {
    const { page, limit, sortBy, sortOrder, status, search, merchantId, merchantIds, minAmount, maxAmount, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.merchant', 'merchant')
      .leftJoinAndSelect('transaction.customer', 'customer')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod');

    if (search) {
      qb.andWhere(
        '(transaction.orderId LIKE :search OR transaction.description LIKE :search OR merchant.name LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) {
      const statusList = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statusList.length > 1) {
        qb.andWhere('transaction.status IN (:...statusList)', { statusList });
      } else if (statusList.length === 1) {
        qb.andWhere('transaction.status = :status', { status: statusList[0] });
      }
    }

    if (merchantIds) {
      const ids = Array.isArray(merchantIds) ? merchantIds : merchantIds.split(',').filter(Boolean);
      if (ids.length > 0) {
        qb.andWhere('transaction.merchantId IN (:...merchantIds)', { merchantIds: ids });
      }
    } else if (merchantId) {
      qb.andWhere('transaction.merchantId = :merchantId', { merchantId });
    }
    if (minAmount !== undefined && minAmount !== null && minAmount !== (' ' as any)) {
      qb.andWhere('transaction.amount >= :minAmount', { minAmount });
    }
    if (maxAmount !== undefined && maxAmount !== null && maxAmount !== (' ' as any)) {
      qb.andWhere('transaction.amount <= :maxAmount', { maxAmount });
    }
    if (startDate) {
      qb.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('transaction.createdAt <= :endDate', { endDate: end });
    }


    qb.orderBy(`transaction.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: { merchant: true, customer: true, paymentMethod: true, refunds: true, webhookLogs: true },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
    return transaction;
  }

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const idempotencyKey = randomUUID();

    const feePercentage = 2.9; // Default, could be fetched from merchant
    const fee = parseFloat((dto.amount * feePercentage / 100).toFixed(2));
    const netAmount = parseFloat((dto.amount - fee).toFixed(2));

    const transaction = this.transactionRepository.create({
      ...dto,
      orderId,
      issuerOrderId: dto.issuerOrderId || `ISS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      refId: dto.refId || `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      merchantRefId: dto.merchantRefId || `MREF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      idempotencyKey,
      fee,
      netAmount,
      status: TransactionStatus.PENDING,
    });

    return this.transactionRepository.save(transaction);
  }

  async updateStatus(id: string, status: TransactionStatus, failureReason?: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = status;
    if (failureReason) {
      transaction.failureReason = failureReason;
    }
    if (status === TransactionStatus.SUCCESS || status === TransactionStatus.FAILED) {
      transaction.processedAt = new Date();
      if (status === TransactionStatus.SUCCESS) {
        transaction.settlementDate = calculateSettlementDate(transaction.createdAt, transaction.settlementType);
      }
    }
    return this.transactionRepository.save(transaction);
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return this.transactionRepository.find({
      relations: { merchant: true, customer: true, paymentMethod: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { status: In([TransactionStatus.PENDING, TransactionStatus.PROCESSING]) },
      relations: { merchant: true, customer: true, paymentMethod: true },
    });
  }

  async getSuccessfulTransactions(limit: number = 50): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { status: TransactionStatus.SUCCESS },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
