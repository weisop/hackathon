const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { requireAuth, optionalAuth, getUserById, createUserProfile, updateUserProfile, supabase } = require('./services/supabaseAuth');
const locationService = require('./services/locationService');
const portFinder = require('./utils/portFinder');
const sharedPortConfig = require('../shared-config/portConfig');

const app = express();

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

// Port configuration endpoint for client synchronization
app.get('/api/port-config', (req, res) => {
  const config = sharedPortConfig.getPortConfig();
  if (config) {
    res.json({
      port: config.port,
      timestamp: config.timestamp,
      status: 'synchronized'
    });
  } else {
    res.status(404).json({
      status: 'not_found',
      message: 'No port configuration available'
    });
  }
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

// Check if API is configured
app.get('/api/location/config', (req, res) => {
  res.json({
    configured: locationService.isConfigured(),
    message: locationService.isConfigured() 
      ? 'API is configured' 
      : 'API key not configured. Please set GOOGLE_MAPS_API_KEY environment variable.'
  });
});

// ===== FRIENDS SYSTEM API ENDPOINTS =====

// Get user's friends
app.get('/api/friends', requireAuth, async (req, res) => {
  try {
    const { data: friends, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend:friend_id (
          id, full_name, email, avatar_url
        )
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'accepted');
    
    if (error) throw error;
    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending friend requests
app.get('/api/friends/requests', requireAuth, async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('friends')
      .select(`
        *,
        user:user_id (
          id, full_name, email, avatar_url
        )
      `)
      .eq('friend_id', req.user.id)
      .eq('status', 'pending');
    
    if (error) throw error;
    res.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
app.post('/api/friends/request', requireAuth, async (req, res) => {
  try {
    const { friendEmail } = req.body;
    
    if (!friendEmail) {
      return res.status(400).json({ error: 'Friend email is required' });
    }
    
    // Find friend by email
    const { data: friend, error: friendError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', friendEmail)
      .single();
    
    if (friendError || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (friend.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }
    
    // Check if friendship already exists
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${req.user.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${req.user.id})`)
      .single();
    
    if (existingFriendship) {
      return res.status(400).json({ error: 'Friendship already exists or pending' });
    }
    
    // Create friend request
    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: req.user.id,
        friend_id: friend.id,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      message: 'Friend request sent',
      friendship: data
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
app.post('/api/friends/accept/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('friend_id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    res.json({ message: 'Friend request accepted', friendship: data });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request
app.post('/api/friends/reject/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'blocked' })
      .eq('id', requestId)
      .eq('friend_id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    res.json({ message: 'Friend request rejected', friendship: data });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
app.delete('/api/friends/:friendId', requireAuth, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${req.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${req.user.id})`);
    
    if (error) throw error;
    
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== LOCATION TRACKING API ENDPOINTS =====

// Save location data
app.post('/api/location/track', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, enhancedData } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const { data, error } = await supabase
      .from('location_tracks')
      .insert({
        user_id: req.user.id,
        latitude,
        longitude,
        accuracy,
        enhanced_data: enhancedData
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ message: 'Location saved', location: data });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get friend locations
app.get('/api/friends/locations', requireAuth, async (req, res) => {
  try {
    const { data: locations, error } = await supabase
      .rpc('get_friends_with_locations', { user_uuid: req.user.id });
    
    if (error) throw error;
    res.json(locations);
  } catch (error) {
    console.error('Error fetching friend locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check nearby friends
app.post('/api/friends/nearby', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude, distance = 1000 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const { data: nearbyFriends, error } = await supabase
      .rpc('check_nearby_friends', { 
        user_uuid: req.user.id,
        user_lat: latitude,
        user_lng: longitude,
        distance_meters: distance
      });
    
    if (error) throw error;
    res.json(nearbyFriends);
  } catch (error) {
    console.error('Error checking nearby friends:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== LOCATION SHARING API ENDPOINTS =====

// Update location sharing permissions
app.post('/api/location/sharing', requireAuth, async (req, res) => {
  try {
    const { friendId, canSeeLocation, canSeeHistory, expiresAt } = req.body;
    
    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }
    
    const { data, error } = await supabase
      .from('location_sharing')
      .upsert({
        user_id: req.user.id,
        friend_id: friendId,
        can_see_location: canSeeLocation || false,
        can_see_history: canSeeHistory || false,
        expires_at: expiresAt || null
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ message: 'Location sharing updated', sharing: data });
  } catch (error) {
    console.error('Error updating location sharing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location sharing settings
app.get('/api/location/sharing', requireAuth, async (req, res) => {
  try {
    const { data: sharing, error } = await supabase
      .from('location_sharing')
      .select(`
        *,
        friend:friend_id (
          id, full_name, email
        )
      `)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json(sharing);
  } catch (error) {
    console.error('Error fetching location sharing:', error);
    res.status(500).json({ error: error.message });
  }
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

// Start server with synchronized port detection
const startServer = async () => {
  try {
    // Check if there's already a port configuration
    let PORT = sharedPortConfig.getServerPort();
    
    if (!PORT || !sharedPortConfig.isConfigRecent()) {
      // Find an available port dynamically
      PORT = await portFinder.findAvailablePort();
      // Save the port configuration for client to use
      sharedPortConfig.setPortConfig(PORT);
    } else {
      console.log(`📋 Using configured port: ${PORT}`);
    }
    
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port;
      console.log(`🚀 Server running on http://localhost:${actualPort}`);
      console.log(`📊 Health check: http://localhost:${actualPort}/api/health`);
      console.log(`📝 Items API: http://localhost:${actualPort}/api/items`);
      console.log(`🔗 API Base URL: http://localhost:${actualPort}/api`);
      
      // Update the port config with the actual port
      sharedPortConfig.setPortConfig(actualPort);
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is in use, trying next available port...`);
        // Clean up old config and try again
        sharedPortConfig.cleanup();
        portFinder.findAvailablePort().then(newPort => {
          if (newPort !== PORT) {
            console.log(`🔄 Retrying on port ${newPort}...`);
            startServer();
          }
        });
      } else {
        console.error('❌ Server error:', err);
      }
    });
    
    // Clean up on exit
    process.on('exit', () => {
      sharedPortConfig.cleanup();
    });
    
    process.on('SIGINT', () => {
      sharedPortConfig.cleanup();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
