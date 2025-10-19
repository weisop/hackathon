import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  // Check Google Maps API configuration
  checkLocationConfig: async () => {
    try {
      const response = await api.get('/location/config');
      return response.data;
    } catch (error) {
      console.error('Error checking location config:', error);
      throw error;
    }
  },
};

export default apiService;
