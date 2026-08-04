import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);

    app.use(helmet());
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Payment Gateway Dummy API')
      .setDescription('A dummy payment gateway API for development and testing')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'Login and user management')
      .addTag('Merchants', 'Merchant management')
      .addTag('Customers', 'Customer directory')
      .addTag('Transactions', 'Payment transactions')
      .addTag('Refunds', 'Refund processing')
      .addTag('Webhooks', 'Webhook delivery logs')
      .addTag('Payment Methods', 'Available payment methods')
      .addTag('Analytics', 'Dashboard statistics and charts')
      .addTag('Simulator', 'Transaction simulator controls')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}

if (!process.env.VERCEL) {
  async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port', 4000);

    app.use(helmet());
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.listen(port);
    logger.log(`🚀 Local NestJS API running on http://localhost:${port}`);
  }
  bootstrap();
}

