# Payment Gateway Dummy (PGD) - Backend Documentation

## Overview

The PGD backend is a robust NestJS application designed to simulate a fully functional payment gateway. It exposes RESTful APIs for merchants, customers, transactions, refunds, and webhook deliveries, providing a complete sandbox for testing payment integrations.

## Tech Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** TiDB (MySQL compatible)
- **ORM:** TypeORM
- **Authentication:** JWT (JSON Web Tokens)
- **Documentation:** Swagger OpenAPI

## Features & Modules

### 1. Authentication Module (`/api/auth`)
- Validates merchant and admin credentials.
- Issues JWT tokens for API access.

### 2. Merchants Module (`/api/merchants`)
- Manages merchant accounts, configurations, default currencies, and API keys.
- **Key Fields:** `apiKey`, `secretKey`, `webhookUrl`, `feePercentage`

### 3. Customers Module (`/api/customers`)
- Manages end-user data attached to merchants.

### 4. Transactions Module (`/api/transactions`)
- Handles payment processing simulations.
- **Statuses:** `pending`, `processing`, `success`, `failed`, `expired`, `refunded`, `partially_refunded`.
- Idempotency control to prevent duplicate payments.

### 5. Refunds Module (`/api/refunds`)
- Process partial and full refund requests.
- **Statuses:** `pending`, `completed`, `rejected`.

### 6. Webhooks Module (`/api/webhooks`)
- Logs webhook delivery attempts to merchant endpoints.
- Tracks HTTP status codes, delivery status, and retry attempts.

### 7. Simulator Service
- A background Cron service that:
  - Generates new dummy transactions every 15 seconds.
  - Processes pending transactions (85% success rate).
  - Creates refund requests automatically.
  - Auto-processes pending refunds.

## Business Process

### Transaction Lifecycle
1. **Creation:** A new transaction is generated via the API or Simulator (`status: pending`).
2. **Processing:** The transaction is picked up for processing (`status: processing`).
3. **Completion:** The transaction either succeeds or fails. 
   - If successful, fees are deducted, net amount is calculated, and a `payment.success` webhook is fired.
   - If failed, a `failureReason` is logged and a `payment.failed` webhook is fired.

### Webhook Delivery
- The backend attempts to send an HTTP POST request to the merchant's configured `webhookUrl`.
- Logs of these deliveries are stored in the `webhook_logs` table for auditing and debugging in the frontend dashboard.

## Setup & Running

### Prerequisites
- Node.js (v18+)
- MySQL or TiDB Cloud Connection

### Installation
```bash
cd backend
npm install
```

### Environment Variables
Create a `.env` file based on the provided `.env.example`:
```env
# Application
NODE_ENV=development
PORT=4000
API_PREFIX=api

# Database (TiDB / MySQL)
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=pgd_dummy
DB_SSL=true

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Simulator
SIMULATOR_ENABLED=true
```

### Starting the Server
```bash
# Development
npm run start:dev

# Production Build
npm run build
npm run start:prod
```

### API Documentation
Once running, the Swagger documentation is accessible at:
- `http://localhost:4000/api/docs`
