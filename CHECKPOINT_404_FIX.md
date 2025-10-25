## Fix for 404 Error: `/api/location-sessions/checkpoint`

### Problem
The client is getting a 404 error when trying to POST to `/api/location-sessions/checkpoint`.

### Most Likely Cause
**The server needs to be restarted** to register the checkpoint endpoint.

---

## Solution Steps

### Step 1: Restart the Server

The server must be restarted to load the updated routes.

**If using the start script:**
```bash
# Stop the server (Ctrl+C if it's running)
# Then restart:
npm run dev
# OR
node server/server.js
```

**If using nodemon:**
```bash
# Nodemon should auto-restart, but if not:
npx nodemon server/server.js
```

### Step 2: Verify the Endpoint Exists

Run the test script:
```bash
node test-checkpoint-endpoint.js
```

**Expected output:**
- ✅ Status 401 or 403 (authentication required) = Endpoint exists!
- ❌ Status 404 = Endpoint not found, server needs restart

### Step 3: Check Server Logs

After restarting, you should see:
```
📍 POST /api/location-sessions/checkpoint - Request received
📍 Request body: { sessionId: '...', latitude: ..., longitude: ... }
📍 User: <user-id>
```

If you DON'T see these logs when making a request, the request isn't reaching the server.

---

## Additional Debugging

### Check if Server is Running
```bash
curl http://localhost:3001/api/health
```

### Check All Available Routes
Add this to your server.js (temporarily):
```javascript
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
})
```

### Verify Base URL in Client
Open browser console and look for:
```
🔗 API detected at: http://localhost:3001/api
```

When adding checkpoint, you should see:
```
🔍 Adding checkpoint to: http://localhost:3001/api/location-sessions/checkpoint
🔍 Checkpoint data: {...}
```

---

## Quick Diagnostic

### If you see 404:
1. ✅ Server needs restart (most common)
2. ✅ Check server.js line 1079 - route should be there
3. ✅ Verify server is running on port 3001

### If you see 401/403:
1. ✅ Endpoint exists! 
2. ❌ Authentication issue (different problem)

### If you see 500:
1. ✅ Endpoint exists!
2. ❌ Database/logic error (check server logs)

---

## What Was Changed

### Client (`client/src/services/api.js`)
- Added debugging logs to show the exact URL being called
- Shows checkpoint data being sent

### Server (`server/server.js`)
- Added extensive logging at line 1080-1082
- Shows when requests are received
- Shows request body and user info
- Shows success/failure status

### Database
- Make sure you've run `setup-all-tables.sql` to create the `location_session_checkpoints` table

---

## Still Getting 404?

### Check these in order:

1. **Server restart** - This fixes 90% of cases
   ```bash
   # Kill server (Ctrl+C)
   # Restart
   npm start
   ```

2. **Check server.js** - Verify line 1079:
   ```javascript
   app.post('/api/location-sessions/checkpoint', requireAuth, async (req, res) => {
   ```

3. **Check port** - Server must be on 3001:
   ```bash
   netstat -ano | findstr :3001  # Windows
   lsof -i :3001                 # Mac/Linux
   ```

4. **Check client base URL** - Should end with `/api`:
   ```
   http://localhost:3001/api
   ```

5. **Clear browser cache** - Sometimes old client code is cached

6. **Database tables** - Run the setup script:
   ```bash
   # In Supabase SQL Editor
   # Run: hackathon/database/setup-all-tables.sql
   ```

---

## Prevention

To avoid this in the future:
1. Use nodemon for auto-restart during development
2. Always check server logs when adding new endpoints
3. Test endpoints with the test script after changes


