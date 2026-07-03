# Payment Gateway Dummy (PGD) App

A complete, self-contained payment gateway dummy application with a NestJS backend and Next.js frontend dashboard. It continuously simulates transactions, webhooks, and refunds 24/7.

## Structure
- `/backend`: NestJS API, TypeORM, Swagger, Transaction Simulator Cron.
- `/frontend`: Next.js 15 App Router, React, Recharts, Custom Glassmorphism UI.

## Getting Started

### 1. Database
Make sure you have a TiDB (MySQL) instance running.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env # Edit the DB credentials
npm run start:dev
```
API runs on port 4000. Docs: http://localhost:4000/api/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Dashboard runs on port 3000. Login with:
- **Email:** `admin@pgd.dev`
- **Password:** `password123`

## Running 24/7 in Production
We use PM2 to run both services.
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

## Documentation
- [Backend Documentation](./docs/backend/README.md)
- [Frontend Documentation](./docs/frontend/README.md)
