# Pages and Components

## Layout Shell
- `DashboardLayout` (`src/app/dashboard/layout.tsx`): Renders the Sidebar and the main content area.
- Includes a live "Simulator Active" indicator and the navigation links.

## Pages
1. **Login Page** (`src/app/login/page.tsx`)
   - Pre-filled with demo credentials (`admin@pgd.dev` / `password123`).
   - Uses `authApi.login` to fetch JWT token.

2. **Dashboard Overview** (`src/app/dashboard/page.tsx`)
   - Key Stats (Volume, Success Rate).
   - Area Chart showing Revenue Trend using Recharts.
   - List of recent transactions.
   - Auto-refreshes every 15 seconds.

3. **Transactions Ledger** (`src/app/dashboard/transactions/page.tsx`)
   - Complete list of transactions.
   - Status filters.
   - Links to transaction detail page.

4. **Transaction Detail** (`src/app/dashboard/transactions/[id]/page.tsx`)
   - Visual status timeline.
   - Linked refunds and webhook delivery logs.

5. **Merchants** (`src/app/dashboard/merchants/page.tsx`)
   - Lists merchants with an API key show/hide toggle.

6. **Refunds** (`src/app/dashboard/refunds/page.tsx`)
   - Allows administrators to visually approve or reject refunds.

7. **Analytics** (`src/app/dashboard/analytics/page.tsx`)
   - Complex chart visualizations for volume, success rates, and top merchants.

8. **Settings** (`src/app/dashboard/settings/page.tsx`)
   - Simulator controls to pause or start background cron jobs.

## Reusable Utilities
- `src/lib/utils.ts`: Includes `formatCurrency`, `formatDate`, and `getStatusBadgeClass`.
- `src/lib/api.ts`: Axios instance configured with an interceptor to attach the JWT token to every request and handle 401 redirects.
