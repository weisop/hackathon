// Port detection utility for dynamic API URL handling
class PortDetector {
  constructor() {
    // Check most common port first (3001), then fallbacks
    this.commonPorts = [3001, 3000, 8000];
    this.detectedPort = null;
    this.lastCheck = 0;
    this.checkInterval = 30000; // Check every 30 seconds (reduced frequency)
  }

  // Check if a specific port is available
  async checkPort(port) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Detect the first available API port
  async detectApiPort() {
    // If we recently checked and found a port, use it
    const now = Date.now();
    if (this.detectedPort && (now - this.lastCheck) < this.checkInterval) {
      return `http://localhost:${this.detectedPort}`;
    }

    console.log('🔍 Scanning for API server on common ports...');
    
    // Check ports sequentially to reduce console noise
    for (const port of this.commonPorts) {
      const isAvailable = await this.checkPort(port);
      if (isAvailable) {
        this.detectedPort = port;
        this.lastCheck = now;
        console.log(`✅ API server found on port ${port}`);
        return `http://localhost:${port}`;
      }
    }

    console.warn('⚠️ No API server found, using default port 3001');
    return 'http://localhost:3001'; // Fallback
  }

  // Get the current detected port
  getCurrentPort() {
    return this.detectedPort;
  }

  // Force re-detection
  async forceDetection() {
    this.detectedPort = null;
    this.lastCheck = 0;
    return await this.detectApiPort();
  }

  // Check if the current port is still available
  async isCurrentPortAvailable() {
    if (!this.detectedPort) return false;
    return await this.checkPort(this.detectedPort);
  }
}

// Create a singleton instance
const portDetector = new PortDetector();

export default portDetector;

