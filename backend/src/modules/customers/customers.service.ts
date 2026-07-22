import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(query: PaginationDto & { merchantId?: string }): Promise<PaginatedResponseDto<Customer>> {
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const limit = Math.max(1, parseInt(String(query.limit || 20), 10));
    const sortBy = String(query.sortBy || 'createdAt');
    const sortOrder = (String(query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    const { search, merchantId } = query;
    const skip = Math.max(0, (page - 1) * limit);

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (merchantId) {
      where.merchantId = merchantId;
    }

    const [data, total] = await this.customerRepository.findAndCount({
      where,
      relations: { merchant: true },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: { merchant: true, transactions: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }
    return customer;
  }
}
