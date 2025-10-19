// Shared port configuration for client and server synchronization
const fs = require('fs');
const path = require('path');

class SharedPortConfig {
  constructor() {
    this.configFile = path.join(__dirname, 'port-config.json');
    this.commonPorts = [3001, 3000, 8000, 5000, 4000, 3002, 3003, 3004, 3005];
  }

  // Get the current port configuration
  getPortConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        return config;
      }
    } catch (error) {
      console.warn('⚠️ Could not read port config:', error.message);
    }
    return null;
  }

  // Set the port configuration
  setPortConfig(port) {
    try {
      const config = {
        port: port,
        timestamp: Date.now(),
        clientPort: null // Will be set by client
      };
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      console.log(`📝 Port config saved: ${port}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save port config:', error.message);
      return false;
    }
  }

  // Get the server port (for client to use)
  getServerPort() {
    const config = this.getPortConfig();
    if (config && config.port) {
      return config.port;
    }
    return null;
  }

  // Set the client port (for server to know)
  setClientPort(port) {
    try {
      const config = this.getPortConfig() || {};
      config.clientPort = port;
      config.clientTimestamp = Date.now();
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      console.log(`📝 Client port saved: ${port}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save client port:', error.message);
      return false;
    }
  }

  // Get the client port (for server to know)
  getClientPort() {
    const config = this.getPortConfig();
    if (config && config.clientPort) {
      return config.clientPort;
    }
    return null;
  }

  // Check if config is recent (within 30 seconds)
  isConfigRecent() {
    const config = this.getPortConfig();
    if (!config || !config.timestamp) return false;
    
    const age = Date.now() - config.timestamp;
    return age < 30000; // 30 seconds
  }

  // Clean up old config
  cleanup() {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
        console.log('🧹 Port config cleaned up');
      }
    } catch (error) {
      console.warn('⚠️ Could not cleanup port config:', error.message);
    }
  }

  // Get available ports
  getAvailablePorts() {
    return [...this.commonPorts];
  }
}

module.exports = new SharedPortConfig();

