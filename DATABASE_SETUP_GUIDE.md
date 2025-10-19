# 🗄️ Database Setup Guide for Location Sessions

## 🎯 **Quick Setup Checklist**

### **1. Run the Database Schema**
1. **Open your Supabase dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the contents of `database/location_sessions_schema.sql`
4. **Click "Run"** to execute the schema

### **2. Check Environment Variables**
Make sure your `server/.env` file has:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **3. Test the Setup**
1. **Start your servers:**
   ```bash
   # Terminal 1: Backend
   cd hackathon/server
   npm start
   
   # Terminal 2: Frontend
   cd hackathon/client
   npm run dev
   ```

2. **Open the app and click "🗄️ Debug Database"**

3. **Run the database tests** to verify everything is working

## 🔍 **Common Issues & Solutions**

### **Issue 1: "Table doesn't exist"**
**Solution:**
- Make sure you ran the SQL schema in Supabase
- Check that you're using the correct database
- Verify the table names match exactly

### **Issue 2: "Permission denied"**
**Solution:**
- Check your RLS policies in Supabase
- Make sure you're using the service role key for server operations
- Verify your user is authenticated

### **Issue 3: "Connection failed"**
**Solution:**
- Check your environment variables
- Verify your Supabase URL and keys
- Make sure your server is running

### **Issue 4: "Insert failed"**
**Solution:**
- Check data types match the schema
- Verify required fields are provided
- Check for foreign key constraints

## 🧪 **Testing Steps**

### **Step 1: Run Database Debugger**
1. Click "🗄️ Debug Database" in the app
2. Click "🧪 Test Database Connection"
3. Check the logs for any errors

### **Step 2: Test Session Creation**
1. Click "📝 Test Session Creation"
2. Should create a test session and clean it up
3. Check logs for success/error messages

### **Step 3: Test Real Location**
1. Go to a location (like the HUB)
2. Watch the console for session creation logs
3. Check the database for new records

## 📊 **Database Tables Created**

### **location_sessions**
- Stores active and completed sessions
- Tracks time spent at each location
- Links to user and location data

### **location_session_checkpoints**
- Detailed tracking of location updates
- Records accuracy and coordinates
- Links to parent session

### **location_achievements**
- Records when users reach their goals
- Tracks milestones and completions
- Historical achievement data

## 🔧 **Debugging Commands**

### **Check Database Connection:**
```bash
cd hackathon
node debug-database.js
```

### **Check Server Logs:**
Look for these messages in your server terminal:
- ✅ "Location session started"
- ✅ "Checkpoint added"
- ❌ "Failed to start location session"

### **Check Browser Console:**
Look for these messages in browser console:
- ✅ "Location session started: {session data}"
- ✅ "Recovered active session: {session data}"
- ❌ "Failed to start location session: {error}"

## 🎯 **Success Indicators**

### **✅ Everything Working:**
- Database debugger shows green checkmarks
- Sessions are created when you enter locations
- Progress bars show and persist across reloads
- No error messages in console or server logs

### **❌ Something's Wrong:**
- Red error messages in debugger
- No sessions created when entering locations
- Progress bars don't appear
- Console shows authentication errors

## 🚀 **Next Steps After Setup**

1. **Test with real locations** - Go to the HUB or a library
2. **Check persistence** - Reload the page and see if progress continues
3. **Verify achievements** - Stay long enough to reach your target
4. **Check database** - Look at your Supabase dashboard to see the data

## 📞 **Getting Help**

If you're still having issues:

1. **Run the database debugger** and export the debug info
2. **Check your Supabase dashboard** for any error messages
3. **Look at server logs** for specific error details
4. **Verify your environment variables** are correct

The debugger will show you exactly what's failing and help you fix it! 🎉
