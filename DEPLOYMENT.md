# Deployment Guide: Vercel + Supabase

This guide will help you deploy the MVP Web application to Vercel (frontend + backend) and Supabase (database).

## Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- A Supabase account (sign up at [supabase.com](https://supabase.com))

## Step 1: Set Up Supabase Database

### 1.1 Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `mvp-web-ganaderia` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `server/db/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. Verify tables were created by checking the **Table Editor**

### 1.3 Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. Save this for Step 2

### 1.4 (Optional) Create Initial Admin User

You can create an admin user directly in Supabase SQL Editor:

```sql
-- Insert admin user (password: admin123)
-- Note: You'll need to hash the password using bcrypt
-- For now, you can register through the app after deployment
```

Or use the migration script after setting up the connection.

## Step 2: Deploy to Vercel

### 2.1 Prepare Your Repository

1. Make sure your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Push all changes to your repository

### 2.2 Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: Leave as default (root)
   - **Build Command**: `npm install && cd server && npm install && cd ../client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: Leave empty (handled in build command)

### 2.3 Configure Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NODE_ENV=production
PORT=3001
```

#### Optional (if not using DATABASE_URL):

```
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
```

**Important Notes:**
- Replace `[PASSWORD]` with your actual Supabase database password
- Replace `xxxxx` with your actual Supabase project reference
- Use a strong, random string for `JWT_SECRET` (at least 32 characters)
- You can generate a secure JWT secret using: `openssl rand -base64 32`

### 2.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, Vercel will provide you with a URL like: `https://your-project.vercel.app`

### 2.5 Update Frontend API URL (if needed)

If your frontend needs to call the API from a different domain:

1. Go to Vercel project settings → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://your-project.vercel.app/api
   ```
3. Redeploy the project

## Step 3: Run Database Migrations

After deployment, you need to run the migration script to set up initial data:

### Option 1: Run Migration Locally

1. Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   ```

2. Run the migration:
   ```bash
   cd server
   npm install
   npm run migrate
   ```

### Option 2: Run Migration in Supabase SQL Editor

You can manually create the admin user in Supabase SQL Editor:

```sql
-- First, you'll need to hash the password 'admin123'
-- Use an online bcrypt generator or run this in Node.js:
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('admin123', 10).then(console.log);

-- Then insert (replace HASHED_PASSWORD with the actual hash):
INSERT INTO users (email, password_hash, name)
VALUES ('admin@test.com', 'HASHED_PASSWORD', 'Admin User')
ON CONFLICT (email) DO NOTHING;
```

## Step 4: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the health endpoint: `https://your-project.vercel.app/api/health`
3. Try to register a new user or login with admin credentials
4. Create a test scenario and verify it saves to the database

## Step 5: Set Up Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Wait for SSL certificate provisioning

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure your IP is allowed (Supabase allows all by default, but check if you have restrictions)
- Verify SSL is enabled in the connection string (`?sslmode=require`)

### Build Errors

- Check that all dependencies are listed in `package.json`
- Verify Node.js version (Vercel uses Node 18.x by default)
- Check build logs in Vercel dashboard for specific errors

### API Routes Not Working

- Verify the `vercel.json` configuration
- Check that routes are properly exported from `api/index.js`
- Review Vercel function logs in the dashboard

### CORS Issues

- The server already has CORS enabled for all origins
- If you need to restrict, update `server/index.js` CORS configuration

## Environment Variables Reference

### Server (.env or Vercel Environment Variables)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase connection string | `postgresql://postgres:pass@host:5432/postgres` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Vercel handles this) | `3001` |

### Client (Vercel Environment Variables)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL (optional) | `https://your-app.vercel.app/api` |

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Verify all environment variables are set correctly
4. Ensure database schema is properly migrated
