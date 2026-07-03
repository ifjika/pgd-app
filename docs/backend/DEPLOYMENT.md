# Backend Deployment

## PM2 (Recommended for VPS)
For a standard Linux VPS, you can run the backend continuously using PM2.

```bash
# 1. Install dependencies
npm install

# 2. Build the NestJS app
npm run build

# 3. Start with PM2 using the root ecosystem file
cd ..
pm2 start ecosystem.config.js --only pgd-backend
pm2 save
```

## Docker Deployment
Alternatively, you can build and run the backend as a Docker container.

```bash
docker build -t pgd-backend -f ../Dockerfile.backend .
docker run -p 4000:4000 --env-file .env pgd-backend
```

## Environment Variables
Ensure the following variables are set in production:
- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (TiDB Credentials)
- `JWT_SECRET`
