import portDetector from '../utils/portDetector.js';

// Environment configuration with synchronized port handling
const getApiBaseUrl = () => {
  // Check if we're in development
  if (import.meta.env.DEV) {
    // Try to get the API URL from environment variables
    const envApiUrl = import.meta.env.VITE_API_BASE_URL;
    if (envApiUrl) {
      return envApiUrl;
    }
    
    // Return default for initial setup
    return 'http://localhost:3001/api';
  }
  
  // Production URL
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
};

// Enhanced port detection that checks shared configuration
const detectApiPortWithSync = async () => {
  // Try common ports in order to find the server
  const portsToTry = [3000, 3001, 8000, 5000, 4000, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
  
  console.log('🔍 Scanning for server on available ports...');
  
  for (const port of portsToTry) {
    try {
      console.log(`🔍 Checking port ${port}...`);
      const response = await fetch(`http://localhost:${port}/api/port-config`, {
        method: 'GET',
        timeout: 2000 // 2 second timeout per port
      });
      
      if (response.ok) {
        const config = await response.json();
        if (config.port) {
          console.log(`📋 Found server on port ${config.port}`);
          return `http://localhost:${config.port}/api`;
        }
      }
    } catch (error) {
      // Continue to next port silently
      continue;
    }
  }
  
  // Try to find any server by testing health endpoint
  console.log('📋 No port config found, testing health endpoints...');
  for (const port of portsToTry) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        timeout: 2000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          console.log(`📋 Found working server on port ${port}`);
          return `http://localhost:${port}/api`;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  console.log('📋 No server found, using fallback detection...');
  // Fallback to regular port detection
  const detectedUrl = await portDetector.detectApiPort();
  // Add /api suffix if not already present
  return detectedUrl.endsWith('/api') ? detectedUrl : `${detectedUrl}/api`;
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  detectPort: detectApiPortWithSync,
  forceDetection: () => portDetector.forceDetection(),
  getCurrentPort: () => portDetector.getCurrentPort(),
  isCurrentPortAvailable: () => portDetector.isCurrentPortAvailable(),
  timeout: 15000, // Increased from 5000ms to 15000ms
  retryAttempts: 3
};

export default API_CONFIG;
