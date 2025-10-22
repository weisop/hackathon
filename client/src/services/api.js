import axios from 'axios';
import { API_CONFIG } from '../config/environment.js';

// Dynamic API URL detection
let API_BASE_URL = API_CONFIG.baseURL;

// Create axios instance first
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.timeout,
});

// Function to detect the correct API port
const detectApiUrl = async () => {
  try {
    const detectedUrl = await API_CONFIG.detectPort();
    // The detectedUrl already includes /api from environment.js
    API_BASE_URL = detectedUrl;
    // Update axios instance baseURL
    api.defaults.baseURL = API_BASE_URL;
    console.log(`🔗 API detected at: ${API_BASE_URL}`);
    return API_BASE_URL;
  } catch (error) {
    console.warn('⚠️ Could not auto-detect API port, using default:', API_BASE_URL);
    return API_BASE_URL;
  }
};

// Initialize API URL detection
detectApiUrl();

// Add request interceptor to handle dynamic URL updates and authentication
api.interceptors.request.use(async (config) => {
  // Update base URL if needed
  if (config.baseURL !== API_BASE_URL) {
    config.baseURL = API_BASE_URL;
  }
  
  // Add authentication token if available
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

  // Enhanced Location Services
  // Get enhanced location data (geocoding + nearby places)
  getEnhancedLocation: async (latitude, longitude) => {
    try {
      const response = await api.post('/location/enhanced', {
        latitude,
        longitude
      });
      return response.data;
    } catch (error) {
      console.error('Error getting enhanced location:', error);
      throw error;
    }
  },

  // Geocode coordinates to address
  geocodeLocation: async (latitude, longitude) => {
    try {
      const response = await api.post('/location/geocode', {
        latitude,
        longitude
      });
      return response.data;
    } catch (error) {
      console.error('Error geocoding location:', error);
      throw error;
    }
  },

  // Get nearby places
  getNearbyPlaces: async (latitude, longitude, radius = 1000, type = 'establishment') => {
    try {
      const response = await api.post('/location/nearby', {
        latitude,
        longitude,
        radius,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Error getting nearby places:', error);
      throw error;
    }
  },

  // Get place details
  getPlaceDetails: async (placeId) => {
    try {
      const response = await api.get(`/location/place/${placeId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  },

  // Calculate distance between two points
  calculateDistance: async (origin, destination, mode = 'driving') => {
    try {
      const response = await api.post('/location/distance', {
        origin,
        destination,
        mode
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw error;
    }
  },

  // Get directions between two points
  getDirections: async (origin, destination, mode = 'driving') => {
    try {
      const response = await api.post('/location/directions', {
        origin,
        destination,
        mode
      });
      return response.data;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  },

  // Check API configuration
  checkLocationConfig: async () => {
    try {
      const response = await api.get('/location/config');
      return response.data;
    } catch (error) {
      console.error('Error checking location config:', error);
      throw error;
    }
  },

  // ===== FRIENDS SYSTEM API METHODS =====

  // Get user's friends
  getFriends: async () => {
    try {
      const response = await api.get('/friends');
      return response.data;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  },

  // Get pending friend requests
  getFriendRequests: async () => {
    try {
      const response = await api.get('/friends/requests');
      return response.data;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      throw error;
    }
  },

  // Send friend request
  sendFriendRequest: async (friendEmail) => {
    try {
      const response = await api.post('/friends/request', { friendEmail });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId) => {
    try {
      const response = await api.post(`/friends/accept/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  // Reject friend request
  rejectFriendRequest: async (requestId) => {
    try {
      const response = await api.post(`/friends/reject/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      const response = await api.delete(`/friends/${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  // ===== LOCATION TRACKING API METHODS =====

  // Save location data
  trackLocation: async (locationData) => {
    try {
      const response = await api.post('/location/track', locationData);
      return response.data;
    } catch (error) {
      // Don't log as error since the MapView component handles this gracefully
      throw error;
    }
  },

  // Get friend locations
  getFriendLocations: async () => {
    try {
      const response = await api.get('/friends/locations');
      return response.data;
    } catch (error) {
      console.error('Error getting friend locations:', error);
      throw error;
    }
  },

  // Check nearby friends
  checkNearbyFriends: async (latitude, longitude, distance = 1000) => {
    try {
      const response = await api.post('/friends/nearby', {
        latitude,
        longitude,
        distance
      });
      return response.data;
    } catch (error) {
      console.error('Error checking nearby friends:', error);
      throw error;
    }
  },

  // ===== LOCATION SHARING API METHODS =====

  // Update location sharing permissions
  updateLocationSharing: async (friendId, canSeeLocation, canSeeHistory, expiresAt) => {
    try {
      const response = await api.post('/location/sharing', {
        friendId,
        canSeeLocation,
        canSeeHistory,
        expiresAt
      });
      return response.data;
    } catch (error) {
      console.error('Error updating location sharing:', error);
      throw error;
    }
  },

  // Get location sharing settings
  getLocationSharing: async () => {
    try {
      const response = await api.get('/location/sharing');
      return response.data;
    } catch (error) {
      console.error('Error getting location sharing:', error);
      throw error;
    }
  },

  // ===== LOCATION SESSIONS API METHODS =====

  // Start a new location session
  startLocationSession: async (sessionData) => {
    try {
      const response = await api.post('/location-sessions/start', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error starting location session:', error);
      throw error;
    }
  },

  // End a location session
  endLocationSession: async (sessionId) => {
    try {
      const response = await api.post('/location-sessions/end', { sessionId });
      return response.data;
    } catch (error) {
      console.error('Error ending location session:', error);
      throw error;
    }
  },

  // Get active location sessions
  getActiveLocationSessions: async () => {
    try {
      const response = await api.get('/location-sessions/active');
      return response.data;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  },

  // Get location session history
  getLocationSessionHistory: async (limit = 50, offset = 0) => {
    try {
      const response = await api.get(`/location-sessions/history?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error getting session history:', error);
      throw error;
    }
  },

  // Add session checkpoint
  addSessionCheckpoint: async (checkpointData) => {
    try {
      console.log('🔍 Adding checkpoint to:', `${API_BASE_URL}/location-sessions/checkpoint`);
      console.log('🔍 Checkpoint data:', checkpointData);
      const response = await api.post('/location-sessions/checkpoint', checkpointData);
      return response.data;
    } catch (error) {
      console.error('Error adding session checkpoint:', error);
      console.error('Base URL:', API_BASE_URL);
      throw error;
    }
  },

    // Get location achievements
    getLocationAchievements: async () => {
      try {
        const response = await api.get('/location-sessions/achievements');
        return response.data;
      } catch (error) {
        console.error('Error getting achievements:', error);
        throw error;
      }
    },

    // Create location achievement
    createLocationAchievement: async (achievementData) => {
      try {
        const response = await api.post('/location-sessions/achievements', achievementData);
        return response.data;
      } catch (error) {
        console.error('Error creating achievement:', error);
        throw error;
      }
    },

    // ===== LOCATION LEVELS API METHODS =====

    // Get user's level for a specific location
    getUserLocationLevel: async (locationId) => {
      try {
        const response = await api.get(`/location-levels/${locationId}`);
        return response.data;
      } catch (error) {
        console.error('Error getting user level:', error);
        throw error;
      }
    },

    // Get all user's location levels
    getAllUserLevels: async () => {
      try {
        const response = await api.get('/location-levels');
        return response.data;
      } catch (error) {
        console.error('Error getting user levels:', error);
        throw error;
      }
    },

    // Update time spent at a location
    updateLocationTime: async (locationId, timeSpentSeconds, locationName) => {
      try {
        const response = await api.post(`/location-levels/${locationId}/time`, {
          timeSpentSeconds,
          locationName
        });
        return response.data;
      } catch (error) {
        console.error('Error updating location time:', error);
        throw error;
      }
    },

    // Advance user to next level
    advanceToNextLevel: async (locationId, locationName) => {
      try {
        const response = await api.post(`/location-levels/${locationId}/advance`, {
          locationName
        });
        return response.data;
      } catch (error) {
        console.error('Error advancing level:', error);
        throw error;
      }
    },

    // Get level achievements
    getLevelAchievements: async () => {
      try {
        const response = await api.get('/location-levels/achievements');
        return response.data;
      } catch (error) {
        console.error('Error getting level achievements:', error);
        throw error;
      }
    },

    // Reset user level to 1
    resetUserLevel: async (locationId, locationName) => {
      try {
        const response = await api.post(`/location-levels/${locationId}/reset`, {
          locationName
        });
        return response.data;
      } catch (error) {
        console.error('Error resetting user level:', error);
        throw error;
      }
    },

    // Reset all user levels and study times
    resetAllUserLevels: async () => {
      try {
        // First get all user levels
        const allLevels = await apiService.getAllUserLevels();
        
        // Reset each level individually
        const resetPromises = allLevels.map(level => 
          apiService.resetUserLevel(level.location_id, level.location_name)
        );
        
        await Promise.all(resetPromises);
        
        return { 
          message: 'All study times and levels have been reset successfully',
          resetCount: allLevels.length 
        };
      } catch (error) {
        console.error('Error resetting all user levels:', error);
        throw error;
      }
    },
};

export default apiService;