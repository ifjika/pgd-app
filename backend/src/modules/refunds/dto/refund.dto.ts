import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({ example: 'transaction-uuid' })
  @IsString()
  transactionId!: string;

  @ApiProperty({ example: 50.00 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Customer requested refund - wrong item' })
  @IsString()
  reason!: string;
}
