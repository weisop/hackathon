# Dynamic Server Port Configuration

## 🎯 **Problem Solved**
The server now automatically finds an available port instead of crashing when port 3001 is taken!

## 🔧 **How It Works**

### **Automatic Port Detection**
The server now scans these ports in order:
- `3001` (default)
- `3000`
- `8000`
- `5000`
- `4000`
- `3002`
- `3003`
- `3004`
- `3005`

### **Smart Error Handling**
- If a port is in use, it automatically tries the next one
- No more server crashes due to port conflicts
- Clear console messages showing which port is being used

## 📁 **Files Added/Modified**

### **New Files:**
- `server/utils/portFinder.js` - Port detection utility for server

### **Modified Files:**
- `server/server.js` - Now uses dynamic port detection

## 🚀 **Usage**

### **For Development:**
1. Start the server: `npm run dev` (from hackathon root)
2. The server will automatically find an available port
3. Check the console for the actual port being used

### **Console Output:**
```
🔍 Scanning for available port...
❌ Port 3001 is in use
✅ Port 3000 is available
🚀 Server running on http://localhost:3000
📊 Health check: http://localhost:3000/api/health
🔗 API Base URL: http://localhost:3000/api
```

## ⚙️ **Manual Override (Optional)**

If you want to force a specific port, create a `.env` file in the server directory:

```bash
# Create .env file in the server directory
echo "PORT=3001" > server/.env
```

## 🔍 **How to Check What Port the Server is Using**

Look for these messages in the server console:
- `🔍 Scanning for available port...`
- `✅ Port XXXX is available`
- `🚀 Server running on http://localhost:XXXX`
- `🔗 API Base URL: http://localhost:XXXX/api`

## 🐛 **Troubleshooting**

### **If server still crashes:**
1. Check if all common ports are in use
2. Look for error messages in the console
3. Try manually setting a port in `.env` file

### **If client can't connect:**
1. Check the server console for the actual port
2. Make sure the client's port detection is working
3. Look for API Base URL in server console

## ✨ **Benefits**

- ✅ **No more port conflicts**
- ✅ **Automatic port detection**
- ✅ **Clear error messages**
- ✅ **Works for all team members**
- ✅ **No manual configuration needed**

## 🔄 **How Client and Server Work Together**

1. **Server starts** and finds an available port
2. **Client starts** and scans for the API server
3. **Client automatically detects** which port the server is using
4. **Everything works** without manual configuration!

Your server will now start successfully regardless of which ports are already in use! 🎉
