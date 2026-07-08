import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disbursement, DisbursementStatus } from './entities/disbursement.entity';
import { CreateDisbursementDto } from './dto/disbursement.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DisbursementsService {
  constructor(
    @InjectRepository(Disbursement)
    private readonly disbursementRepository: Repository<Disbursement>,
  ) {}

  async findAll(
    query: PaginationDto & {
      status?: DisbursementStatus;
      merchantId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginatedResponseDto<Disbursement>> {
    const { page, limit, sortBy, sortOrder, status, merchantId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const qb = this.disbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoinAndSelect('disbursement.merchant', 'merchant');

    if (status) {
      qb.andWhere('disbursement.status = :status', { status });
    }
    if (merchantId) {
      qb.andWhere('disbursement.merchantId = :merchantId', { merchantId });
    }
    if (startDate && endDate) {
      qb.andWhere('disbursement.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    qb.orderBy(`disbursement.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: string): Promise<Disbursement> {
    const disbursement = await this.disbursementRepository.findOne({
      where: { id },
      relations: { merchant: true },
    });
    if (!disbursement) {
      throw new NotFoundException(`Disbursement #${id} not found`);
    }
    return disbursement;
  }

  async create(dto: CreateDisbursementDto): Promise<Disbursement> {
    const orderId = dto.orderId || `DIS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const issuerOrderId = dto.issuerOrderId || `ISS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const refId = dto.refId || `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const merchantRefId = dto.merchantRefId || `MREF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate simulated fee: standard flat fee or percentage for disbursement
    const fee = 1500.00; // Flat 1500 IDR fee
    const netAmount = dto.amount - fee;

    const now = new Date();
    const currentHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        hour12: false
      }).format(now),
      10
    );
    let description = dto.description || '';
    if (currentHour >= 1 && currentHour < 4) {
      description = (description ? description + ' | ' : '') + 'Held due to EOD maintenance window (01:00 AM - 04:00 AM)';
    }

    const disbursement = this.disbursementRepository.create({
      ...dto,
      orderId,
      issuerOrderId,
      refId,
      merchantRefId,
      fee,
      netAmount,
      description,
      status: DisbursementStatus.PENDING,
    });

    return this.disbursementRepository.save(disbursement);
  }

  async updateStatus(id: string, status: DisbursementStatus, failureReason?: string): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    disbursement.status = status;
    if (failureReason) {
      disbursement.failureReason = failureReason;
    }
    return this.disbursementRepository.save(disbursement);
  }
}
