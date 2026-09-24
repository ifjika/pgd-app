# Frontend Deployment

## Production Build

To build the Next.js frontend for production:

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
echo "NEXT_PUBLIC_API_URL=http://your-backend-api-url" > .env.production

# 3. Build the app
npm run build

# 4. Start the production server
npm start
```

## PM2 Deployment
You can run the built Next.js app using PM2 via the root `ecosystem.config.js`:
```bash
pm2 start ecosystem.config.js --only pgd-frontend
```

## Docker Deployment
```bash
docker build -t pgd-frontend -f ../Dockerfile.frontend .
docker run -p 3000:3000 pgd-frontend
```

## Vercel Deployment
Next.js applications can be easily deployed to Vercel. Connect your repository and configure the `NEXT_PUBLIC_API_URL` environment variable in the Vercel dashboard.
