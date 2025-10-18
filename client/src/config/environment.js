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
    return 'http://localhost:3001';
  }
  
  // Production URL
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
};

// Enhanced port detection that checks shared configuration
const detectApiPortWithSync = async () => {
  try {
    // First, try to get the port from shared configuration
    const response = await fetch('/api/port-config');
    if (response.ok) {
      const config = await response.json();
      if (config.port) {
        console.log(`📋 Using synchronized port: ${config.port}`);
        return `http://localhost:${config.port}`;
      }
    }
  } catch (error) {
    console.log('📋 No shared config found, using auto-detection...');
  }
  
  // Fallback to regular port detection
  return await portDetector.detectApiPort();
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  detectPort: detectApiPortWithSync,
  forceDetection: () => portDetector.forceDetection(),
  getCurrentPort: () => portDetector.getCurrentPort(),
  isCurrentPortAvailable: () => portDetector.isCurrentPortAvailable(),
  timeout: 5000,
  retryAttempts: 3
};

export default API_CONFIG;
