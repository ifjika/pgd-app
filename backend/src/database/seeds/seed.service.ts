import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { User, UserRole } from '../../modules/auth/entities/user.entity';
import { Merchant, MerchantStatus } from '../../modules/merchants/entities/merchant.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { PaymentMethod, PaymentMethodType } from '../../modules/payment-methods/entities/payment-method.entity';
import { Transaction, TransactionStatus, TransactionCurrency } from '../../modules/transactions/entities/transaction.entity';
import { WebhookLog, WebhookEvent, WebhookDeliveryStatus } from '../../modules/webhooks/entities/webhook-log.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Merchant) private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(PaymentMethod) private readonly paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(WebhookLog) private readonly webhookLogRepo: Repository<WebhookLog>,
  ) {}

  async onModuleInit() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('🌱 Seeding database with dummy data...');
    await this.seed();
    this.logger.log('✅ Database seeding complete!');
  }

  async seed() {
    // 1. Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = this.userRepo.create({
      email: 'admin@pgd.dev',
      password: hashedPassword,
      name: 'Admin PGD',
      role: UserRole.ADMIN,
    });
    await this.userRepo.save(admin);
    this.logger.log('  → Admin user created (admin@pgd.dev / password123)');

    // 2. Create merchants
    const merchantsData = [
      { name: 'TechStore ID', code: 'TECHSTORE', description: 'Leading electronics retailer in Indonesia', defaultCurrency: 'IDR', feePercentage: 2.5 },
      { name: 'FoodMart SG', code: 'FOODMART', description: 'Singapore\'s favorite food delivery platform', defaultCurrency: 'SGD', feePercentage: 3.0 },
      { name: 'CloudSaaS Pro', code: 'CLOUDSAAS', description: 'Enterprise cloud software provider', defaultCurrency: 'USD', feePercentage: 2.9 },
      { name: 'TravelGo EU', code: 'TRAVELGO', description: 'European travel booking platform', defaultCurrency: 'EUR', feePercentage: 3.5 },
      { name: 'GameVault', code: 'GAMEVAULT', description: 'Digital gaming marketplace', defaultCurrency: 'USD', feePercentage: 2.0 },
    ];

    const merchants: Merchant[] = [];
    for (const data of merchantsData) {
      const merchant = this.merchantRepo.create({
        ...data,
        apiKey: `pk_live_${uuidv4().replace(/-/g, '')}`,
        secretKey: `sk_live_${crypto.randomBytes(32).toString('hex')}`,
        status: MerchantStatus.ACTIVE,
        webhookUrl: `https://${data.code.toLowerCase()}.example.com/webhooks/pgd`,
      });
      merchants.push(await this.merchantRepo.save(merchant));
    }
    this.logger.log(`  → ${merchants.length} merchants created`);

    // 3. Create payment methods
    const paymentMethodsData = [
      { name: 'Visa', type: PaymentMethodType.CREDIT_CARD, provider: 'Visa Inc.', icon: '💳', additionalFee: 0 },
      { name: 'Mastercard', type: PaymentMethodType.CREDIT_CARD, provider: 'Mastercard Inc.', icon: '💳', additionalFee: 0 },
      { name: 'BCA Transfer', type: PaymentMethodType.BANK_TRANSFER, provider: 'Bank Central Asia', icon: '🏦', additionalFee: 0.5 },
      { name: 'GoPay', type: PaymentMethodType.E_WALLET, provider: 'GoTo Financial', icon: '📱', additionalFee: 0 },
      { name: 'QRIS', type: PaymentMethodType.QRIS, provider: 'Bank Indonesia', icon: '📲', additionalFee: 0.3 },
      { name: 'Mandiri Debit', type: PaymentMethodType.DEBIT_CARD, provider: 'Bank Mandiri', icon: '💳', additionalFee: 0.2 },
    ];

    const paymentMethods: PaymentMethod[] = [];
    for (const data of paymentMethodsData) {
      const pm = this.paymentMethodRepo.create(data);
      paymentMethods.push(await this.paymentMethodRepo.save(pm));
    }
    this.logger.log(`  → ${paymentMethods.length} payment methods created`);

    // 4. Create customers
    const customerNames = [
      { name: 'John Doe', email: 'john@example.com', phone: '+1234567890', city: 'New York', country: 'US' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', city: 'San Francisco', country: 'US' },
      { name: 'Budi Santoso', email: 'budi@example.com', phone: '+6281234567', city: 'Jakarta', country: 'ID' },
      { name: 'Siti Rahayu', email: 'siti@example.com', phone: '+6281234568', city: 'Surabaya', country: 'ID' },
      { name: 'Ahmad Fauzi', email: 'ahmad@example.com', phone: '+6281234569', city: 'Bandung', country: 'ID' },
      { name: 'Wei Lin', email: 'weilin@example.com', phone: '+6591234567', city: 'Singapore', country: 'SG' },
      { name: 'Tan Mei', email: 'tanmei@example.com', phone: '+6591234568', city: 'Singapore', country: 'SG' },
      { name: 'Hans Mueller', email: 'hans@example.com', phone: '+4901234567', city: 'Berlin', country: 'DE' },
      { name: 'Maria Garcia', email: 'maria@example.com', phone: '+3401234567', city: 'Madrid', country: 'ES' },
      { name: 'Yuki Tanaka', email: 'yuki@example.com', phone: '+8101234567', city: 'Tokyo', country: 'JP' },
      { name: 'Rina Wati', email: 'rina@example.com', phone: '+6281234570', city: 'Yogyakarta', country: 'ID' },
      { name: 'David Chen', email: 'david@example.com', phone: '+8521234567', city: 'Hong Kong', country: 'HK' },
      { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1234567892', city: 'Chicago', country: 'US' },
      { name: 'Pierre Dupont', email: 'pierre@example.com', phone: '+3301234567', city: 'Paris', country: 'FR' },
      { name: 'Liam O\'Brien', email: 'liam@example.com', phone: '+4401234567', city: 'London', country: 'UK' },
      { name: 'Dewi Lestari', email: 'dewi@example.com', phone: '+6281234571', city: 'Bali', country: 'ID' },
      { name: 'Michael Brown', email: 'michael@example.com', phone: '+1234567893', city: 'Los Angeles', country: 'US' },
      { name: 'Anna Schmidt', email: 'anna@example.com', phone: '+4901234568', city: 'Munich', country: 'DE' },
      { name: 'Ravi Kumar', email: 'ravi@example.com', phone: '+9101234567', city: 'Mumbai', country: 'IN' },
      { name: 'Emma Wilson', email: 'emma@example.com', phone: '+6101234567', city: 'Sydney', country: 'AU' },
    ];

    const customers: Customer[] = [];
    for (let i = 0; i < customerNames.length; i++) {
      const data = customerNames[i]!;
      const merchant = merchants[i % merchants.length]!;
      const customer = this.customerRepo.create({
        ...data,
        merchantId: merchant.id,
      });
      customers.push(await this.customerRepo.save(customer));
    }
    this.logger.log(`  → ${customers.length} customers created`);

    // 5. Create initial transactions with varied timestamps
    const statuses = [
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.FAILED,
      TransactionStatus.PENDING,
      TransactionStatus.PROCESSING,
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.EXPIRED,
    ];

    const currencies = [TransactionCurrency.USD, TransactionCurrency.IDR, TransactionCurrency.EUR, TransactionCurrency.SGD];
    const descriptions = [
      'Monthly subscription payment',
      'One-time purchase',
      'Premium plan upgrade',
      'Digital goods purchase',
      'Service fee payment',
      'Marketplace order',
      'Booking payment',
      'Top-up balance',
      'Annual license renewal',
      'In-app purchase',
    ];

    const failureReasons = [
      'Insufficient funds',
      'Card declined',
      'Network timeout',
      'Invalid card number',
      'Expired card',
    ];

    const transactions: Transaction[] = [];
    for (let i = 0; i < 100; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)]!;
      const customer = customers[Math.floor(Math.random() * customers.length)]!;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]!;
      const status = statuses[Math.floor(Math.random() * statuses.length)]!;
      const currency = currencies[Math.floor(Math.random() * currencies.length)]!;
      
      let amount: number;
      if (currency === TransactionCurrency.IDR) {
        amount = Math.floor(Math.random() * 5000000 + 10000); // 10K - 5M IDR
      } else {
        amount = parseFloat((Math.random() * 500 + 5).toFixed(2)); // 5 - 505 USD/EUR/SGD
      }

      const fee = parseFloat((amount * Number(merchant.feePercentage) / 100).toFixed(2));
      const netAmount = parseFloat((amount - fee).toFixed(2));

      // Spread transactions over the last 30 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      const transaction = this.transactionRepo.create({
        orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        merchantId: merchant.id,
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        amount,
        fee,
        netAmount,
        currency,
        status,
        idempotencyKey: uuidv4(),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        metadata: { source: 'seed', batchId: 'initial' },
        failureReason: status === TransactionStatus.FAILED ? failureReasons[Math.floor(Math.random() * failureReasons.length)] : undefined,
        processedAt: [TransactionStatus.SUCCESS, TransactionStatus.FAILED].includes(status) ? createdAt : undefined,
        createdAt,
      });

      transactions.push(await this.transactionRepo.save(transaction));
    }
    this.logger.log(`  → ${transactions.length} transactions created`);

    // 6. Create some webhook logs for successful transactions
    const successfulTransactions = transactions.filter(t => t.status === TransactionStatus.SUCCESS);
    let webhookCount = 0;
    for (const tx of successfulTransactions.slice(0, 30)) {
      const log = this.webhookLogRepo.create({
        merchantId: tx.merchantId,
        transactionId: tx.id,
        event: WebhookEvent.PAYMENT_SUCCESS,
        payload: {
          event: 'payment.success',
          transaction_id: tx.id,
          order_id: tx.orderId,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
        },
        deliveryStatus: Math.random() > 0.1 ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED,
        statusCode: 200,
        response: '{"status":"ok"}',
        attempts: 1,
      });
      await this.webhookLogRepo.save(log);
      webhookCount++;
    }
    this.logger.log(`  → ${webhookCount} webhook logs created`);
  }
}
