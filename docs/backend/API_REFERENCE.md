# API Reference

## Authentication
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ "data": { "accessToken": "..." } }`

## Merchants
- `GET /api/merchants`
  - Query: `page`, `limit`
  - Response: Paginated list of merchants.

- `GET /api/merchants/:id`
  - Response: Merchant details including `apiKey` and `secretKey`.

## Transactions
- `GET /api/transactions`
  - Query: `page`, `limit`, `status`, `merchantId`
  - Response: Paginated list of transactions.

- `POST /api/transactions`
  - Body: `{ merchantId, customerId, paymentMethodId, amount, currency, description }`
  - Response: The newly created pending transaction.

## Refunds
- `GET /api/refunds`
  - Query: `page`, `limit`, `status`
  - Response: List of refund requests.

- `PATCH /api/refunds/:id/approve`
  - Response: Completes the refund and updates the original transaction.

- `PATCH /api/refunds/:id/reject`
  - Body: `{ reason }`
  - Response: Marks the refund as rejected.

## Analytics
- `GET /api/analytics/overview`
  - Response: Dashboard stats (Total volume, active merchants, etc.)

- `GET /api/analytics/chart`
  - Query: `period` (7d, 30d, 90d)
  - Response: Data arrays for the revenue and transaction volume charts.

## Webhooks
- `GET /api/webhooks`
  - Response: Logs of all webhook deliveries.

## Simulator
- `GET /api/simulator/status`
  - Response: `{ "enabled": true }`
- `POST /api/simulator/toggle`
  - Body: `{ "enabled": false }`
  - Response: Updates simulator state.
