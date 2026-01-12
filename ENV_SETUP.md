# Environment Variables Setup

This file documents all environment variables needed for the application.

## Server Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

### Required Variables

```env
# Database Connection
# Option 1: Use Supabase connection string (recommended)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require

# Option 2: Use individual connection parameters
# DB_HOST=db.xxxxx.supabase.co
# DB_PORT=5432
# DB_NAME=postgres
# DB_USER=postgres
# DB_PASSWORD=your-password

# JWT Secret (use a strong random string, minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port (optional, defaults to 3001)
PORT=3001

# Environment
NODE_ENV=development
```

### For Production (Vercel)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
NODE_ENV=production
PORT=3001
```

## Client Environment Variables

Create a `.env` file in the `client/` directory (optional, only if API is on different domain):

```env
# API Base URL (leave empty for same-origin, or set to full API URL)
VITE_API_URL=
```

### For Production (Vercel)

If your API is on a different domain, set:

```
VITE_API_URL=https://your-api-domain.vercel.app/api
```

## Getting Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **URI** format
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual database password

Example format:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## Generating a Secure JWT Secret

### Using OpenSSL (recommended)
```bash
openssl rand -base64 32
```

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Using Online Generator
Visit: https://generate-secret.vercel.app/32

## Security Notes

- **Never commit `.env` files to Git**
- Use different JWT secrets for development and production
- Keep your database password secure
- Rotate secrets periodically in production
- Use Vercel's environment variable encryption for production

## Local Development Setup

1. Copy `.env.example` to `.env` in both `server/` and `client/` directories
2. Fill in the actual values
3. For local development with Supabase, use the connection string from Supabase dashboard
4. Make sure `NODE_ENV=development` for local development

## Troubleshooting

### Database Connection Fails

- Verify `DATABASE_URL` is correct (check for typos)
- Ensure password is URL-encoded if it contains special characters
- Check that `sslmode=require` is included for Supabase
- Verify Supabase project is active and not paused

### JWT Authentication Fails

- Ensure `JWT_SECRET` is set and consistent across deployments
- Verify secret is at least 32 characters long
- Check that the same secret is used for token generation and verification

### API Calls Fail in Production

- Verify `VITE_API_URL` is set correctly if API is on different domain
- Check CORS settings in `server/index.js`
- Verify API routes are accessible (test `/api/health` endpoint)
