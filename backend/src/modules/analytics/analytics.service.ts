import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Refund } from '../refunds/entities/refund.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
  ) {}

  async getOverview(): Promise<{
    totalTransactions: number;
    totalVolume: number;
    successRate: number;
    activeMerchants: number;
    todayTransactions: number;
    todayVolume: number;
    pendingRefunds: number;
    totalCustomers: number;
  }> {
    const totalTransactions = await this.transactionRepository.count();
    
    const volumeResult = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.status = :status', { status: TransactionStatus.SUCCESS })
      .getRawOne();

    const successCount = await this.transactionRepository.count({
      where: { status: TransactionStatus.SUCCESS },
    });

    const processedCount = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.status IN (:...statuses)', {
        statuses: [TransactionStatus.SUCCESS, TransactionStatus.FAILED],
      })
      .getCount();

    const activeMerchants = await this.merchantRepository.count({
      where: { status: 'active' as any },
    });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayResult = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'volume')
      .where('t.createdAt >= :today', { today })
      .getRawOne();

    const pendingRefunds = await this.refundRepository.count({
      where: { status: 'pending' as any },
    });

    const totalCustomers = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COUNT(DISTINCT t.customerId)', 'count')
      .getRawOne();

    return {
      totalTransactions,
      totalVolume: parseFloat(volumeResult?.total || '0'),
      successRate: processedCount > 0 ? Math.round((successCount / processedCount) * 10000) / 100 : 0,
      activeMerchants,
      todayTransactions: parseInt(todayResult?.count || '0', 10),
      todayVolume: parseFloat(todayResult?.volume || '0'),
      pendingRefunds,
      totalCustomers: parseInt(totalCustomers?.count || '0', 10),
    };
  }

  async getChartData(period: string = '7d'): Promise<{
    labels: string[];
    revenue: number[];
    transactions: number[];
    successRate: number[];
  }> {
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;

    const labels: string[] = [];
    const revenue: number[] = [];
    const transactions: number[] = [];
    const successRate: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      labels.push(date.toISOString().split('T')[0]!);

      const result = await this.transactionRepository
        .createQueryBuilder('t')
        .select('COUNT(*)', 'total')
        .addSelect(`SUM(CASE WHEN t.status = '${TransactionStatus.SUCCESS}' THEN t.amount ELSE 0 END)`, 'revenue')
        .addSelect(`SUM(CASE WHEN t.status = '${TransactionStatus.SUCCESS}' THEN 1 ELSE 0 END)`, 'successCount')
        .where('t.createdAt >= :start AND t.createdAt < :end', {
          start: date,
          end: nextDate,
        })
        .getRawOne();

      const totalCount = parseInt(result?.total || '0', 10);
      const successCountVal = parseInt(result?.successCount || '0', 10);

      transactions.push(totalCount);
      revenue.push(parseFloat(result?.revenue || '0'));
      successRate.push(totalCount > 0 ? Math.round((successCountVal / totalCount) * 100) : 0);
    }

    return { labels, revenue, transactions, successRate };
  }

  async getPaymentMethodDistribution(): Promise<{ name: string; count: number; volume: number }[]> {
    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .leftJoin('t.paymentMethod', 'pm')
      .select('pm.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'volume')
      .groupBy('pm.name')
      .getRawMany();

    return result.map((r: any) => ({
      name: r.name,
      count: parseInt(r.count, 10),
      volume: parseFloat(r.volume),
    }));
  }

  async getTopMerchants(limit: number = 5): Promise<{ id: string; name: string; volume: number; transactions: number }[]> {
    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .leftJoin('t.merchant', 'm')
      .select('m.id', 'id')
      .addSelect('m.name', 'name')
      .addSelect('COUNT(*)', 'transactions')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'volume')
      .where('t.status = :status', { status: TransactionStatus.SUCCESS })
      .groupBy('m.id')
      .addGroupBy('m.name')
      .orderBy('volume', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r: any) => ({
      id: r.id,
      name: r.name,
      volume: parseFloat(r.volume),
      transactions: parseInt(r.transactions, 10),
    }));
  }
}
