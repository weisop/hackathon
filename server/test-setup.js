const http = require('http');

const testServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.status === 'OK') {
          console.log('✅ Server is running and healthy');
          console.log('📊 Health check response:', response);
        } else {
          console.log('❌ Server responded but status is not OK');
        }
      } catch (error) {
        console.log('❌ Invalid JSON response from server');
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Could not connect to server');
    console.log('Make sure the server is running on port 3001');
    console.log('Error:', error.message);
  });

  req.setTimeout(5000, () => {
    console.log('❌ Request timeout - server may not be running');
    req.destroy();
  });

  req.end();
};

console.log('🧪 Testing server connection...');
testServer();
