import { IsString, IsNumber, IsOptional, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionCurrency, SettlementType } from '../entities/transaction.entity';

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

  @ApiPropertyOptional({ example: 'ISS-12345' })
  @IsOptional()
  @IsString()
  issuerOrderId?: string;

  @ApiPropertyOptional({ example: 'REF-12345' })
  @IsOptional()
  @IsString()
  refId?: string;

  @ApiPropertyOptional({ example: 'MREF-12345' })
  @IsOptional()
  @IsString()
  merchantRefId?: string;

  @ApiPropertyOptional({ enum: SettlementType, default: SettlementType.T1 })
  @IsOptional()
  @IsEnum(SettlementType)
  settlementType?: SettlementType;
}
