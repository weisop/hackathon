# Dynamic Port Configuration Guide

## 🎯 **Problem Solved**
Your app now automatically detects which port your API server is running on, even if port 3001 is taken!

## 🔧 **How It Works**

### **Automatic Port Detection**
The app now scans these ports in order:
- `3001` (default)
- `3000` 
- `8000`
- `5000`
- `4000`
- `3002`
- `3003`

### **Smart Retry Logic**
- If the API server moves to a different port, the app automatically detects it
- Failed requests trigger a port re-scan
- No manual configuration needed!

## 📁 **Files Added/Modified**

### **New Files:**
- `src/config/environment.js` - Environment configuration
- `src/utils/portDetector.js` - Port detection utility

### **Modified Files:**
- `src/services/api.js` - Now uses dynamic port detection

## 🚀 **Usage**

### **For Development:**
1. Start your API server on any available port
2. Start your client: `npm run dev`
3. The app will automatically find your API server!

### **For Your Friends:**
1. Pull the latest changes: `git pull origin main`
2. Install dependencies: `npm install`
3. Start the app: `npm run dev`
4. The app will automatically detect the correct API port!

## 🔍 **How to Check What Port is Being Used**

Open your browser's developer console and look for:
- `🔍 Scanning for API server...`
- `✅ API server found on port XXXX`
- `🔗 API detected at: http://localhost:XXXX`

## ⚙️ **Manual Override (Optional)**

If you want to force a specific port, you can create a `.env` file:

```bash
# Create .env file in the client directory
echo "VITE_API_BASE_URL=http://localhost:3001" > .env
```

## 🐛 **Troubleshooting**

### **If API is not detected:**
1. Make sure your API server is running
2. Check that it has a `/api/health` endpoint
3. Look in the browser console for error messages

### **If you want to force re-detection:**
```javascript
// In browser console:
window.location.reload();
```

## ✨ **Benefits**

- ✅ **No more port conflicts**
- ✅ **Automatic detection**
- ✅ **Smart retry logic**
- ✅ **Works for all team members**
- ✅ **No manual configuration needed**

Your app will now work regardless of which port your API server runs on! 🎉

