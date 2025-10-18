const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { requireAuth, optionalAuth, getUserById, createUserProfile, updateUserProfile, supabase } = require('./services/supabaseAuth');
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
