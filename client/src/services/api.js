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
};

export default apiService;
