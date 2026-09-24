# Payment Gateway Dummy (PGD) - Frontend Dashboard

## Overview

The PGD frontend is a modern, responsive web application built with Next.js 15 (App Router) and React. It serves as an admin dashboard for the Payment Gateway Dummy backend, allowing administrators to monitor transactions, manage merchants and customers, handle refunds, view webhook logs, and access advanced analytics.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Custom CSS with CSS Variables (No Tailwind)
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

## Design System

The application features a dark-themed, glassmorphism-inspired design system (`globals.css`). 
- **Vibrant Colors:** Curated color palette using primary gradients and status-based colors.
- **Glassmorphism:** Semi-transparent cards with blurred backgrounds (`.glass-card`).
- **Responsive Grid:** Flexible layouts for statistics (`.grid-stats`, `.grid-2col`, `.grid-3col`).
- **Micro-animations:** Hover effects, shimmer loading states (`.skeleton`), and live status indicators (`.pulse-dot`).

## Pages & Structure

### Dashboard (`/dashboard`)
- Real-time overview of transaction volume, success rates, and active merchants.
- **Auto-Refresh:** The dashboard automatically updates every 15 seconds to fetch the latest data from the backend simulator.
- **Charts:** Revenue trend (Area Chart).

### Transactions (`/dashboard/transactions`)
- Complete ledger of all generated payments.
- Filters by status and search functionality.
- Paginated data table.
- **Detail View (`/dashboard/transactions/[id]`):** Shows a timeline of the transaction status, related parties, refund history, and webhook delivery logs.

### Merchants (`/dashboard/merchants`)
- Directory of active merchants.
- Secure API key viewing (show/hide toggle).

### Customers (`/dashboard/customers`)
- Directory of all customers mapped to their respective merchants.

### Refunds (`/dashboard/refunds`)
- Queue of pending refund requests.
- Admins can manually Approve or Reject refunds from this view.

### Webhooks (`/dashboard/webhooks`)
- Complete audit trail of HTTP callbacks sent to merchant endpoints.
- Displays HTTP status codes and delivery status (Delivered vs Failed).

### Analytics (`/dashboard/analytics`)
- Deep dive into historical performance.
- Features Bar Charts (Volume), Area Charts (Success Rate), and Pie Charts (Payment Method Distribution).
- Time period filters (7 Days, 30 Days, 90 Days).

### Settings (`/dashboard/settings`)
- **Simulator Control:** Allows admins to start and stop the backend transaction simulator cron jobs.
- General application information.

## Setup & Running

### Prerequisites
- Node.js (v18+)
- Backend API running on `http://localhost:4000`

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Starting the Client
```bash
# Development
npm run dev

# Production Build
npm run build
npm run start
```
By default, the Next.js app will run on `http://localhost:3000`.
