import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { Merchant } from './entities/merchant.entity';
import { CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponseDto<Merchant>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [data, total] = await this.merchantRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: { customers: true },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant #${id} not found`);
    }
    return merchant;
  }

  async create(dto: CreateMerchantDto): Promise<Merchant> {
    const existing = await this.merchantRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Merchant with code ${dto.code} already exists`);
    }

    const merchant = this.merchantRepository.create({
      ...dto,
      apiKey: `pk_live_${uuidv4().replace(/-/g, '')}`,
      secretKey: `sk_live_${crypto.randomBytes(32).toString('hex')}`,
    });

    return this.merchantRepository.save(merchant);
  }

  async update(id: string, dto: UpdateMerchantDto): Promise<Merchant> {
    const merchant = await this.findOne(id);
    Object.assign(merchant, dto);
    return this.merchantRepository.save(merchant);
  }

  async getStats(id: string): Promise<{ totalTransactions: number; totalVolume: number }> {
    const result = await this.merchantRepository
      .createQueryBuilder('merchant')
      .leftJoin('merchant.transactions', 'transaction')
      .select('COUNT(transaction.id)', 'totalTransactions')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'totalVolume')
      .where('merchant.id = :id', { id })
      .getRawOne();

    return {
      totalTransactions: parseInt(result?.totalTransactions || '0', 10),
      totalVolume: parseFloat(result?.totalVolume || '0'),
    };
  }
}
