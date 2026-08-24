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
      merchantIds?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
    },
  ): Promise<PaginatedResponseDto<Disbursement>> {
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const limit = Math.max(1, parseInt(String(query.limit || 20), 10));
    const sortBy = String(query.sortBy || 'createdAt');
    const sortOrder = (String(query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    const { status, merchantId, merchantIds, startDate, endDate, minAmount, maxAmount } = query;
    const skip = Math.max(0, (page - 1) * limit);

    const qb = this.disbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoinAndSelect('disbursement.merchant', 'merchant');

    if (status) {
      const statusList = String(status).split(',').map((s) => s.trim()).filter(Boolean);
      if (statusList.length === 1) {
        qb.andWhere('disbursement.status = :status', { status: statusList[0] });
      } else if (statusList.length > 1) {
        qb.andWhere('disbursement.status IN (:...statusList)', { statusList });
      }
    }
    if (merchantIds) {
      const mList = String(merchantIds).split(',').map((s) => s.trim()).filter(Boolean);
      if (mList.length > 0) {
        qb.andWhere('disbursement.merchantId IN (:...mList)', { mList });
      }
    } else if (merchantId) {
      qb.andWhere('disbursement.merchantId = :merchantId', { merchantId });
    }
    if (query.search) {
      qb.andWhere(
        '(disbursement.orderId LIKE :search OR disbursement.recipientName LIKE :search OR disbursement.recipientAccount LIKE :search OR disbursement.channel LIKE :search OR merchant.name LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (startDate) {
      qb.andWhere('disbursement.createdAt >= :startDate', { startDate: new Date(String(startDate)) });
    }
    if (endDate) {
      const eDate = new Date(String(endDate));
      eDate.setHours(23, 59, 59, 999);
      qb.andWhere('disbursement.createdAt <= :endDate', { endDate: eDate });
    }
    if (minAmount !== undefined && minAmount !== null && !isNaN(Number(minAmount))) {
      qb.andWhere('disbursement.amount >= :minAmount', { minAmount: Number(minAmount) });
    }
    if (maxAmount !== undefined && maxAmount !== null && !isNaN(Number(maxAmount))) {
      qb.andWhere('disbursement.amount <= :maxAmount', { maxAmount: Number(maxAmount) });
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
