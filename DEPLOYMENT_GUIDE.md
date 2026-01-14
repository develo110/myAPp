# Deployment Guide

This guide covers deploying both the backend API and the mobile application.

## Table of Contents

- [Backend Deployment](#backend-deployment)
  - [Vercel Deployment](#vercel-deployment-recommended)
  - [Railway Deployment](#railway-deployment)
  - [Render Deployment](#render-deployment)
  - [VPS Deployment](#vps-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
  - [Expo EAS Build](#expo-eas-build-recommended)
  - [Android APK/AAB](#android-apkaab)
  - [iOS IPA](#ios-ipa)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Backend Deployment

### Prerequisites

Before deploying, ensure you have:
- MongoDB Atlas account (or other MongoDB hosting)
- Clerk account with API keys
- Cloudinary account for media storage
- Arcjet account for security features

### Vercel Deployment (Recommended)

Vercel is already configured with `vercel.json` in the backend folder.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy from Backend Directory

```bash
cd backend
vercel
```

#### Step 4: Configure Environment Variables

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from `backend/.env`:

```
PORT=5004
NODE_ENV=production
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
MONGO_URI=your_mongodb_connection_string
ARCJET_ENV=production
ARCJET_KEY=your_arcjet_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Step 5: Deploy to Production

```bash
vercel --prod
```

#### Important Notes for Vercel:
- WebSocket support is limited on Vercel's serverless functions
- For real-time features (Socket.IO), consider using a separate WebSocket server or alternative hosting
- Vercel has a 10-second timeout for serverless functions

---

### Railway Deployment

Railway provides better support for WebSocket connections.

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway

```bash
railway login
```

#### Step 3: Initialize Project

```bash
cd backend
railway init
```

#### Step 4: Add Environment Variables

```bash
railway variables set PORT=5004
railway variables set NODE_ENV=production
railway variables set CLERK_PUBLISHABLE_KEY=your_key
railway variables set CLERK_SECRET_KEY=your_key
railway variables set MONGO_URI=your_mongodb_uri
railway variables set ARCJET_ENV=production
railway variables set ARCJET_KEY=your_key
railway variables set CLOUDINARY_CLOUD_NAME=your_name
railway variables set CLOUDINARY_API_KEY=your_key
railway variables set CLOUDINARY_API_SECRET=your_secret
```

#### Step 5: Deploy

```bash
railway up
```

#### Step 6: Get Deployment URL

```bash
railway domain
```

---

### Render Deployment

#### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` directory

#### Step 2: Configure Service

- **Name**: your-app-backend
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free or Starter

#### Step 3: Add Environment Variables

Add all variables from `backend/.env` in the Environment section.

#### Step 4: Deploy

Click "Create Web Service" to deploy.

---

### VPS Deployment (Ubuntu/Debian)

For full control and WebSocket support.

#### Step 1: Connect to VPS

```bash
ssh user@your-server-ip
```

#### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 3: Install PM2

```bash
sudo npm install -g pm2
```

#### Step 4: Clone Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend
```

#### Step 5: Install Dependencies

```bash
npm install
```

#### Step 6: Create Environment File

```bash
nano .env
```

Add all environment variables.

#### Step 7: Start with PM2

```bash
pm2 start src/server.js --name "backend"
pm2 save
pm2 startup
```

#### Step 8: Configure Nginx (Optional)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/your-app
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 9: Setup SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Mobile App Deployment

### Prerequisites

- Expo account
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

### Expo EAS Build (Recommended)

#### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo

```bash
cd mobile
eas login
```

#### Step 3: Configure EAS

```bash
eas build:configure
```

This creates `eas.json` in your project.

#### Step 4: Update Environment Variables

Update `mobile/.env` with production backend URL:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

#### Step 5: Build for Android

```bash
eas build --platform android
```

Choose build type:
- **APK**: For testing and direct distribution
- **AAB**: For Google Play Store

#### Step 6: Build for iOS

```bash
eas build --platform ios
```

You'll need:
- Apple Developer account
- App Store Connect credentials

#### Step 7: Submit to Stores

For Android:
```bash
eas submit --platform android
```

For iOS:
```bash
eas submit --platform ios
```

---

### Android APK/AAB

#### Local Build (Development)

```bash
cd mobile
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

#### Generate Signing Key

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### Configure Signing

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

---

### iOS IPA

#### Requirements

- macOS with Xcode installed
- Apple Developer account ($99/year)
- Valid provisioning profile

#### Step 1: Configure App

```bash
cd mobile
npx expo prebuild
```

#### Step 2: Open in Xcode

```bash
open ios/YourApp.xcworkspace
```

#### Step 3: Configure Signing

1. Select your project in Xcode
2. Go to "Signing & Capabilities"
3. Select your team
4. Choose automatic signing

#### Step 4: Archive

1. Product → Archive
2. Wait for archive to complete
3. Click "Distribute App"
4. Choose distribution method:
   - App Store Connect
   - Ad Hoc
   - Enterprise
   - Development

---

## Environment Variables

### Backend Environment Variables

```env
# Server Configuration
PORT=5004
NODE_ENV=production

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Security
ARCJET_ENV=production
ARCJET_KEY=ajkey_xxxxx

# Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Mobile Environment Variables

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Backend API
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Post-Deployment Checklist

### Backend

- [ ] Verify all environment variables are set
- [ ] Test API endpoints with Postman/Insomnia
- [ ] Check database connection
- [ ] Verify Clerk authentication works
- [ ] Test file upload to Cloudinary
- [ ] Monitor error logs
- [ ] Set up monitoring (e.g., Sentry, LogRocket)
- [ ] Configure CORS for production domain
- [ ] Test WebSocket connections (if applicable)
- [ ] Set up automated backups for database

### Mobile App

- [ ] Update API URL to production backend
- [ ] Test authentication flow
- [ ] Verify all features work with production API
- [ ] Test on physical devices (iOS and Android)
- [ ] Check app permissions
- [ ] Verify push notifications (if implemented)
- [ ] Test offline functionality
- [ ] Review app store guidelines compliance
- [ ] Prepare app store assets:
  - App icon (1024x1024)
  - Screenshots
  - App description
  - Privacy policy
  - Terms of service
- [ ] Submit for review

### Security

- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Set up DDoS protection
- [ ] Review API security
- [ ] Enable security headers
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Review and update dependencies

---

## Troubleshooting

### Backend Issues

**Issue**: WebSocket connections failing
- **Solution**: Use Railway, Render, or VPS instead of Vercel for WebSocket support

**Issue**: Database connection timeout
- **Solution**: Check MongoDB Atlas IP whitelist, add `0.0.0.0/0` for testing

**Issue**: CORS errors
- **Solution**: Update CORS configuration in `server.js` to include production domain

### Mobile App Issues

**Issue**: API connection fails
- **Solution**: Verify `EXPO_PUBLIC_API_URL` is correct and backend is accessible

**Issue**: Build fails
- **Solution**: Clear cache with `expo prebuild --clean`

**Issue**: App crashes on startup
- **Solution**: Check environment variables are properly set

---

## Monitoring and Maintenance

### Recommended Tools

- **Backend Monitoring**: Sentry, LogRocket, New Relic
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Analytics**: Google Analytics, Mixpanel
- **Error Tracking**: Sentry, Bugsnag
- **Performance**: Lighthouse, WebPageTest

### Regular Maintenance

- Update dependencies monthly
- Review security advisories
- Monitor error logs daily
- Check database performance
- Review API usage and costs
- Backup database regularly
- Test critical user flows weekly

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review [Expo Documentation](https://docs.expo.dev/)
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Railway Documentation](https://docs.railway.app/)

---

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Railway Deployment Guide](https://docs.railway.app/deploy/deployments)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Clerk Authentication Setup](https://clerk.com/docs)
- [Cloudinary Setup](https://cloudinary.com/documentation)
