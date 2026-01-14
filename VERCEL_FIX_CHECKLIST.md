# Vercel Deployment Fix - Checklist

## What Was Fixed

The 500 error was caused by the server trying to connect to MongoDB synchronously on startup and calling `process.exit(1)` on failure. In Vercel's serverless environment, this crashed the function before it could handle any requests.

## Changes Made

1. **backend/src/config/db.js**
   - Added connection reuse logic for serverless
   - Added connection timeout configuration
   - Removed `process.exit(1)` from connection error

2. **backend/src/server.js**
   - Added middleware to ensure DB connection per request
   - Modified startup logic to not exit on DB errors in production
   - Separated local dev startup from production behavior

## Deployment Steps

1. **Verify Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Check that these variables are set:
     - `MONGO_URI`
     - `CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
     - `ARCJET_KEY`
     - `NODE_ENV` (should be "production")

2. **Deploy to Vercel**
   ```bash
   cd backend
   vercel --prod
   ```

3. **Test the Deployment**
   - Visit: `https://your-domain.vercel.app/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

4. **Check Vercel Logs**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for any connection errors or issues

## Common Issues

- **Still getting 500?** Check Vercel logs for specific error messages
- **Database timeout?** Verify your MongoDB URI is correct and accessible from Vercel's servers
- **Missing env vars?** Double-check all environment variables are set in Vercel dashboard

## Testing Locally

To test the production behavior locally:
```bash
cd backend
NODE_ENV=production node src/server.js
```
