// Test script to verify the checkpoint endpoint exists
// Run this with: node test-checkpoint-endpoint.js

const serverUrl = 'http://localhost:3001';

async function testEndpoint() {
  console.log('🧪 Testing checkpoint endpoint...\n');
  
  try {
    // Test if server is running
    const healthResponse = await fetch(`${serverUrl}/api/health`);
    console.log('✅ Server is running');
    console.log('Health check status:', healthResponse.status);
    
    // Test checkpoint endpoint (will fail auth but should not be 404)
    const checkpointResponse = await fetch(`${serverUrl}/api/location-sessions/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'test',
        latitude: 47.6,
        longitude: -122.3,
        accuracy: 10
      })
    });
    
    console.log('\n📍 Checkpoint endpoint test:');
    console.log('Status:', checkpointResponse.status);
    console.log('Status text:', checkpointResponse.statusText);
    
    const data = await checkpointResponse.text();
    console.log('Response:', data);
    
    if (checkpointResponse.status === 404) {
      console.log('\n❌ PROBLEM: Endpoint returns 404 - route not found');
      console.log('This means the server needs to be restarted or the route is not registered.');
    } else if (checkpointResponse.status === 401 || checkpointResponse.status === 403) {
      console.log('\n✅ GOOD: Endpoint exists but requires authentication (expected)');
    } else {
      console.log('\n⚠️ Unexpected status:', checkpointResponse.status);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure the server is running on port 3001');
  }
}

testEndpoint();


