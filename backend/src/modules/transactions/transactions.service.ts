import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/transaction.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

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
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginatedResponseDto<Transaction>> {
    const { page, limit, sortBy, sortOrder, status, merchantId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.merchant', 'merchant')
      .leftJoinAndSelect('transaction.customer', 'customer')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod');

    if (status) {
      qb.andWhere('transaction.status = :status', { status });
    }
    if (merchantId) {
      qb.andWhere('transaction.merchantId = :merchantId', { merchantId });
    }
    if (startDate && endDate) {
      qb.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
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
    const idempotencyKey = uuidv4();

    const feePercentage = 2.9; // Default, could be fetched from merchant
    const fee = parseFloat((dto.amount * feePercentage / 100).toFixed(2));
    const netAmount = parseFloat((dto.amount - fee).toFixed(2));

    const transaction = this.transactionRepository.create({
      ...dto,
      orderId,
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
