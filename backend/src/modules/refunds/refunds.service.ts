import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund, RefundStatus } from './entities/refund.entity';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { CreateRefundDto } from './dto/refund.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(query: PaginationDto & { status?: RefundStatus }): Promise<PaginatedResponseDto<Refund>> {
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const limit = Math.max(1, parseInt(String(query.limit || 20), 10));
    const sortBy = String(query.sortBy || 'createdAt');
    const sortOrder = (String(query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    const skip = Math.max(0, (page - 1) * limit);

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.refundRepository.findAndCount({
      where,
      relations: { transaction: { merchant: true, customer: true } },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async create(dto: CreateRefundDto): Promise<Refund> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: dto.transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestException('Can only refund successful transactions');
    }

    if (dto.amount > Number(transaction.amount)) {
      throw new BadRequestException('Refund amount exceeds transaction amount');
    }

    const refund = this.refundRepository.create({
      transactionId: dto.transactionId,
      amount: dto.amount,
      reason: dto.reason,
      status: RefundStatus.PENDING,
    });

    return this.refundRepository.save(refund);
  }

  async approve(id: string, approvedBy: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: { transaction: true },
    });
    if (!refund) {
      throw new NotFoundException('Refund not found');
    }
    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Refund is not in pending status');
    }

    refund.status = RefundStatus.COMPLETED;
    refund.approvedBy = approvedBy;
    refund.processedAt = new Date();

    // Update transaction status
    const transaction = refund.transaction;
    if (Number(refund.amount) >= Number(transaction.amount)) {
      transaction.status = TransactionStatus.REFUNDED;
    } else {
      transaction.status = TransactionStatus.PARTIALLY_REFUNDED;
    }
    await this.transactionRepository.save(transaction);

    return this.refundRepository.save(refund);
  }

  async reject(id: string, rejectionReason: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({ where: { id } });
    if (!refund) {
      throw new NotFoundException('Refund not found');
    }
    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Refund is not in pending status');
    }

    refund.status = RefundStatus.REJECTED;
    refund.rejectionReason = rejectionReason;
    refund.processedAt = new Date();

    return this.refundRepository.save(refund);
  }
}
