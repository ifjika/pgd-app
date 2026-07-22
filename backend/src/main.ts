import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 4000);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation
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

  await app.listen(port);
  logger.log(`🚀 Payment Gateway API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
