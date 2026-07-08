import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SimulatorModule } from './modules/simulator/simulator.module';
import { DisbursementsModule } from './modules/disbursements/disbursements.module';
import { SeedModule } from './database/seeds/seed.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        ssl: configService.get('database.ssl'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('app.nodeEnv') !== 'production',
        logging: configService.get<boolean>('database.logging'),
        timezone: configService.get<string>('database.timezone', 'Z'),
      }),
    }),

    // Scheduler (for simulator cron jobs)
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    MerchantsModule,
    CustomersModule,
    TransactionsModule,
    RefundsModule,
    WebhooksModule,
    PaymentMethodsModule,
    AnalyticsModule,
    SimulatorModule,
    DisbursementsModule,

    // Database seeding
    SeedModule,
  ],
})
export class AppModule {}
