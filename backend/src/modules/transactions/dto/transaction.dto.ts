import { IsString, IsNumber, IsOptional, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionCurrency } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ example: 'merchant-uuid' })
  @IsString()
  merchantId!: string;

  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  customerId!: string;

  @ApiProperty({ example: 'payment-method-uuid' })
  @IsString()
  paymentMethodId!: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ enum: TransactionCurrency, default: TransactionCurrency.USD })
  @IsOptional()
  @IsEnum(TransactionCurrency)
  currency?: TransactionCurrency;

  @ApiPropertyOptional({ example: 'Payment for order #123' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
