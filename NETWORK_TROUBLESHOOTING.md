# Network Connectivity Troubleshooting Guide

## Issue Fixed
The mobile app was unable to connect to the backend server due to an IP address mismatch.

**Error:** `Failed to connect to /10.235.167.44:5004`
**Solution:** Updated the IP address in `mobile/.env` to match the current network configuration.

## Root Cause
The mobile app was configured to connect to `10.235.167.44:5004`, but the current machine IP address is `10.130.165.44`. This mismatch caused network connection failures.

## Fix Applied
Updated `mobile/.env`:
```
# Before
EXPO_PUBLIC_API_URL=http://10.235.167.44:5004

# After  
EXPO_PUBLIC_API_URL=http://10.130.165.44:5004
```

## Future Prevention

### Automatic IP Update Script
Use the provided `update-ip.ps1` script to automatically update the IP address:

```powershell
.\update-ip.ps1
```

This script will:
1. Detect your current IP address
2. Update the mobile/.env file
3. Test server connectivity

### Manual IP Update Steps

1. **Find your current IP address:**
   ```powershell
   ipconfig
   ```
   Look for the IPv4 Address under your active network adapter (usually Wi-Fi).

2. **Update mobile/.env:**
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:5004
   ```

3. **Test connectivity:**
   ```powershell
   curl http://YOUR_IP_ADDRESS:5004
   ```
   Should return "Hello from server"

4. **Restart Expo development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

## Common Network Issues

### 1. Server Not Running
**Symptoms:** Connection refused, port not listening
**Solution:** 
```bash
cd backend
npm run dev
```

### 2. Firewall Blocking Connection
**Symptoms:** Connection timeout
**Solution:** 
- Check Windows Firewall settings
- Allow Node.js through firewall
- Temporarily disable firewall for testing

### 3. Wrong Network Interface
**Symptoms:** Server running but not accessible from mobile device
**Solution:**
- Ensure both devices are on the same network
- Use the correct IP address (not 127.0.0.1 or localhost)

### 4. Port Already in Use
**Symptoms:** EADDRINUSE error
**Solution:**
```powershell
# Find process using port 5004
netstat -ano | findstr :5004

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Testing Connectivity

### Backend Health Check
```bash
curl http://YOUR_IP:5004
# Expected: "Hello from server"
```

### API Endpoint Test
```bash
curl http://YOUR_IP:5004/api/users/sync -X POST
# Expected: 401 Unauthorized (this is correct without auth token)
```

### Mobile App Testing
1. Update IP address in mobile/.env
2. Restart Expo development server
3. Reload the mobile app
4. Check for successful API calls in network logs

## Network Configuration

### Development Setup
- **Backend:** Runs on `http://0.0.0.0:5004` (accessible from any IP)
- **Mobile:** Connects to `http://YOUR_IP:5004`
- **Socket.io:** Uses same IP and port for real-time features

### Production Setup
- **Backend:** Deployed to Vercel (https://x-clone-rn.vercel.app)
- **Mobile:** Uses production API URL
- **Environment:** Automatically switches based on NODE_ENV

## Troubleshooting Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Correct IP address in mobile/.env
- [ ] Both devices on same network
- [ ] Firewall allows connections on port 5004
- [ ] Expo development server restarted after .env changes
- [ ] Mobile app reloaded/refreshed
- [ ] No other services using port 5004

## Quick Fix Commands

```powershell
# Update IP and test connectivity
.\update-ip.ps1

# Restart backend server
cd backend
npm run dev

# Restart mobile development server
cd mobile
npm start
```