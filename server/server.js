const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { requireAuth, optionalAuth, getUserById, createUserProfile, updateUserProfile, supabase } = require('./services/supabaseAuth');
const locationService = require('./services/locationService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in a real app, you'd use a database)
let items = [
  { id: 1, name: 'Learn React', completed: false },
  { id: 2, name: 'Build a full-stack app', completed: false },
  { id: 3, name: 'Deploy to production', completed: false }
];

let nextId = 4;

// Simple in-memory user storage (in a real app, use a database)
let users = [
  { id: 1, name: 'Demo User', email: 'demo@example.com', password: 'password123', createdAt: new Date().toISOString() }
];

let nextUserId = 2;

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data.user) {
      // Create user profile
      await createUserProfile(data.user);
      
      res.status(201).json({
        user: { 
          id: data.user.id, 
          email: data.user.email, 
          name: data.user.user_metadata?.full_name,
          createdAt: data.user.created_at 
        },
        session: data.session
      });
    } else {
      res.status(400).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    if (data.user) {
      res.json({
        user: { 
          id: data.user.id, 
          email: data.user.email, 
          name: data.user.user_metadata?.full_name,
          createdAt: data.user.created_at 
        },
        session: data.session
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get additional user profile data
    const profile = await getUserById(user.id);
    
    res.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.user_metadata?.full_name,
        createdAt: user.created_at,
        profile: profile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all items (with optional auth)
app.get('/api/items', optionalAuth, (req, res) => {
  res.json(items);
});

// Get a specific item
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(item => item.id === id);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json(item);
});

// Create a new item (requires auth)
app.post('/api/items', requireAuth, (req, res) => {
  const { name, completed = false } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
  }
  
  const newItem = {
    id: nextId++,
    name: name.trim(),
    completed: Boolean(completed)
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
});

// Update an item (requires auth)
app.put('/api/items/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const { name, completed } = req.body;
  
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }
    items[itemIndex].name = name.trim();
  }
  
  if (completed !== undefined) {
    items[itemIndex].completed = Boolean(completed);
  }
  
  res.json(items[itemIndex]);
});

// Delete an item (requires auth)
app.delete('/api/items/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const deletedItem = items.splice(itemIndex, 1)[0];
  res.json({ message: 'Item deleted successfully', item: deletedItem });
});

// Enhanced Location API endpoints
// Get enhanced location data (geocoding + nearby places)
app.post('/api/location/enhanced', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const enhancedData = await locationService.getEnhancedLocationData(latitude, longitude);
    res.json(enhancedData);
  } catch (error) {
    console.error('Enhanced location error:', error);
    res.status(500).json({ error: 'Failed to get enhanced location data' });
  }
});

// Geocode coordinates to address
app.post('/api/location/geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const geocodeResult = await locationService.geocodeLocation(latitude, longitude);
    res.json(geocodeResult);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
});

// Get nearby places
app.post('/api/location/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000, type = 'establishment' } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const nearbyResult = await locationService.getNearbyPlaces(latitude, longitude, radius, type);
    res.json(nearbyResult);
  } catch (error) {
    console.error('Nearby places error:', error);
    res.status(500).json({ error: 'Failed to get nearby places' });
  }
});

// Get place details
app.get('/api/location/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const placeDetails = await locationService.getPlaceDetails(placeId);
    res.json(placeDetails);
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});

// Calculate distance between two points
app.post('/api/location/distance', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const distanceResult = await locationService.getDistanceMatrix(origin, destination, mode);
    res.json(distanceResult);
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

// Get directions between two points
app.post('/api/location/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const directionsResult = await locationService.getDirections(origin, destination, mode);
    res.json(directionsResult);
  } catch (error) {
    console.error('Directions error:', error);
    res.status(500).json({ error: 'Failed to get directions' });
  }
});

// Check if Google Maps API is configured
app.get('/api/location/config', (req, res) => {
  res.json({
    configured: locationService.isConfigured(),
    message: locationService.isConfigured() 
      ? 'Google Maps API is configured' 
      : 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY environment variable.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Items API: http://localhost:${PORT}/api/items`);
});
