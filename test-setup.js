// Simple test script to verify the setup
const http = require('http');

console.log('🧪 Testing web app setup...\n');

// Test server health
const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Server health check:', response.status);
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Server not running. Please start the server first:');
      console.log('   cd server && npm run dev');
      reject(err);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Test API endpoints
const testAPI = async () => {
  try {
    await testServer();
    console.log('🎉 Setup is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser (client)');
    console.log('2. The server should be running on http://localhost:3001');
    console.log('3. Try adding some items in the web interface!');
  } catch (error) {
    console.log('\n❌ Setup test failed:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Make sure the server is running: cd server && npm run dev');
    console.log('2. Then run this test again: node test-setup.js');
  }
};

testAPI();
