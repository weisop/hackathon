// Dynamic port finder for server startup
const net = require('net');

class PortFinder {
  constructor() {
    this.commonPorts = [3001, 3000, 8000, 5000, 4000, 3002, 3003, 3004, 3005];
  }

  // Check if a port is available
  isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  // Find the first available port
  async findAvailablePort() {
    console.log('🔍 Scanning for available port...');
    
    for (const port of this.commonPorts) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        console.log(`✅ Port ${port} is available`);
        return port;
      } else {
        console.log(`❌ Port ${port} is in use`);
      }
    }
    
    // If no common port is available, let the system assign one
    console.log('⚠️ No common ports available, using system-assigned port');
    return 0; // 0 means let the system assign a port
  }

  // Get a list of ports to try
  getPortsToTry() {
    return [...this.commonPorts];
  }
}

module.exports = new PortFinder();

