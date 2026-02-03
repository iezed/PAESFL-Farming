# SendGrid Setup Guide

This guide explains how to set up SendGrid for email verification in MetaCaprine Intelligence.

## Step 1: Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (allows 100 emails/day)
3. Verify your email address

## Step 2: Create API Key

1. Log in to SendGrid Dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `MetaCaprine Production` (or similar)
5. Select **Full Access** (or at minimum: **Mail Send** permissions)
6. Click **Create & View**
7. **IMPORTANT:** Copy the API key immediately - you won't be able to see it again!

## Step 3: Verify Sender Identity

You need to verify a sender email address or domain:

### Option A: Single Sender Verification (Easier, for testing)

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **Create New Sender**
3. Fill in the form:
   - **From Email Address**: `noreply@yourdomain.com` (or your email)
   - **From Name**: `MetaCaprine Intelligence`
   - **Reply To**: Your actual email (for support)
   - **Company Address**: Your company address
4. Click **Create**
5. Check your email and click the verification link
6. Once verified, you can use this email in `SENDGRID_FROM_EMAIL`

### Option B: Domain Authentication (Recommended for production)

1. Go to **Settings** → **Sender Authentication** → **Domain Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS configuration steps
4. This allows you to send from any email @yourdomain.com

## Step 4: Configure Environment Variables

Add these to your `.env` file in the `server/` directory:

```env
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
APP_URL=http://localhost:3000  # For development
```

For production (Vercel), add these in **Project Settings** → **Environment Variables**:

```env
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://your-domain.vercel.app
```

## Step 5: Test Email Sending

1. Start your server: `cd server && npm run dev`
2. Register a new user account
3. Check the email inbox for the verification email
4. Check SendGrid Dashboard → **Activity** to see if emails are being sent

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `SENDGRID_API_KEY` is correct and has Mail Send permissions
2. **Check Sender**: Ensure `SENDGRID_FROM_EMAIL` is verified in SendGrid
3. **Check Logs**: Look at server console for SendGrid errors
4. **Check SendGrid Activity**: Go to SendGrid Dashboard → **Activity** to see delivery status

### "Sender not verified" Error

- Make sure the email in `SENDGRID_FROM_EMAIL` matches a verified sender in SendGrid
- For single sender: verify the email address
- For domain: complete domain authentication

### API Key Issues

- Ensure the API key has **Mail Send** permissions
- Regenerate the key if needed
- Make sure there are no extra spaces in the environment variable

### Rate Limits

- Free tier: 100 emails/day
- If you hit the limit, upgrade your SendGrid plan or wait 24 hours

## Security Best Practices

1. **Never commit API keys to Git**
2. **Use different keys for development and production**
3. **Rotate API keys periodically**
4. **Use environment variables, never hardcode**
5. **Restrict API key permissions to minimum required**

## Email Templates

The email templates are defined in `server/services/emailService.js`. You can customize:
- Email subject
- HTML content
- Text content
- Branding colors
- Logo/images

## Production Checklist

- [ ] SendGrid account created
- [ ] API key generated with Mail Send permissions
- [ ] Sender email/domain verified
- [ ] Environment variables set in Vercel
- [ ] Test email sent successfully
- [ ] Email verification flow tested end-to-end
- [ ] Error handling tested (expired tokens, invalid tokens)

## Support

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Support](https://support.sendgrid.com/)
- [API Reference](https://docs.sendgrid.com/api-reference)
