import axios from 'axios';
import { API_CONFIG } from '../config/environment.js';

// Dynamic API URL detection
let API_BASE_URL = API_CONFIG.baseURL;

// Function to detect the correct API port
const detectApiUrl = async () => {
  try {
    const detectedUrl = await API_CONFIG.detectPort();
    API_BASE_URL = `${detectedUrl}/api`;
    console.log(`🔗 API detected at: ${API_BASE_URL}`);
    return API_BASE_URL;
  } catch (error) {
    console.warn('⚠️ Could not auto-detect API port, using default:', API_BASE_URL);
    return API_BASE_URL;
  }
};

// Initialize API URL
detectApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.timeout,
});

// Add request interceptor to handle dynamic URL updates
api.interceptors.request.use(async (config) => {
  // Update base URL if needed
  if (config.baseURL !== API_BASE_URL) {
    config.baseURL = API_BASE_URL;
  }
  return config;
});

// Add response interceptor for error handling and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If it's a network error and we haven't retried yet
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to detect a new API URL
        const newApiUrl = await API_CONFIG.detectPort();
        API_BASE_URL = `${newApiUrl}/api`;
        api.defaults.baseURL = API_BASE_URL;
        
        console.log(`🔄 Retrying with new API URL: ${API_BASE_URL}`);
        
        // Retry the original request
        return api(originalRequest);
      } catch (detectionError) {
        console.error('❌ Failed to detect API URL:', detectionError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // Get all items
  getItems: async () => {
    try {
      const response = await api.get('/items');
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Create a new item
  createItem: async (item) => {
    try {
      const response = await api.post('/items', item);
      return response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Update an item
  updateItem: async (id, item) => {
    try {
      const response = await api.put(`/items/${id}`, item);
      return response.data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete an item
  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking server health:', error);
      throw error;
    }
  },
};

export default apiService;
