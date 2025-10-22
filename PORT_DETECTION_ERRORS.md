# Port Detection Errors - Explanation & Fix

## What You Were Seeing

```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5000/api/health
:3003/api/health
:4000/api/health
:3002/api/health
:8000/api/health
:3000/api/health
```

## What This Is

These are **harmless errors** from the port detection system trying to find which port your backend server is running on.

The app checks multiple common ports to automatically detect the server, but the failed connections create console noise.

## What I Fixed

### Before:
- Checked **7 ports** in parallel: [3001, 3000, 8000, 5000, 4000, 3002, 3003]
- All ports checked at once = lots of failed connection errors
- Re-checked every 5 seconds

### After:
- Checks only **3 ports** sequentially: [3001, 3000, 8000]
- Checks one at a time (stops at first success)
- Re-checks every 30 seconds (reduced frequency)

**File Changed**: `hackathon/client/src/utils/portDetector.js`

## Result

You should now see:
```
🔍 Scanning for API server on common ports...
✅ API server found on port 3001
```

Instead of multiple connection refused errors!

## How Port Detection Works

1. **First Check**: Tries port 3001 (most common)
2. **If Failed**: Tries port 3000
3. **If Failed**: Tries port 8000
4. **If All Fail**: Uses 3001 as default
5. **Caches Result**: Won't check again for 30 seconds

## If You Still See Errors

### Option 1: Disable Port Detection (Recommended if server is always on 3001)

In `hackathon/client/src/config/environment.js`, hardcode the port:

```javascript
const getApiBaseUrl = () => {
  return 'http://localhost:3001/api'; // Fixed port
};
```

### Option 2: Set Environment Variable

Create `hackathon/client/.env`:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

### Option 3: Suppress Console Errors

These errors don't affect functionality - you can safely ignore them.

## When Port Detection Is Useful

Port detection is helpful when:
- Server might run on different ports
- Multiple developers with different setups
- Dynamic port assignment in deployment

For local development with a fixed port (3001), you can disable it.

## Related Files

- `hackathon/client/src/utils/portDetector.js` - Port detection logic
- `hackathon/client/src/config/environment.js` - API configuration
- `hackathon/server/server.js` - Backend server (runs on port 3001)

