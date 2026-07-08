import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisbursementChannelType } from '../entities/disbursement.entity';

export class CreateDisbursementDto {
  @ApiProperty({ example: 'merchant-uuid' })
  @IsString()
  merchantId!: string;

  @ApiProperty({ example: 100000.00 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ default: 'IDR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: DisbursementChannelType })
  @IsEnum(DisbursementChannelType)
  channelType!: DisbursementChannelType;

  @ApiProperty({ example: 'DANA' })
  @IsString()
  channel!: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  recipientAccount!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  recipientName!: string;

  @ApiPropertyOptional({ example: 'Disbursement for freelance work' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuerOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchantRefId?: string;
}
