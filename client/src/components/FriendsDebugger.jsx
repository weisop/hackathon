import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function FriendsDebugger() {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const testFriendsAPI = async () => {
    setIsLoading(true);
    addLog('🧪 Starting Friends API Tests...', 'info');
    
    try {
      // Test 1: Get friends
      addLog('📡 Testing GET /api/friends...', 'info');
      const friends = await apiService.getFriends();
      addLog(`✅ Friends loaded: ${friends.length} friends found`, 'success');
      setDebugInfo(prev => ({ ...prev, friendsCount: friends.length, friends }));
    } catch (error) {
      addLog(`❌ Failed to load friends: ${error.message}`, 'error');
    }

    try {
      // Test 2: Get friend requests
      addLog('📡 Testing GET /api/friends/requests...', 'info');
      const requests = await apiService.getFriendRequests();
      addLog(`✅ Friend requests loaded: ${requests.length} pending requests`, 'success');
      setDebugInfo(prev => ({ ...prev, requestsCount: requests.length, requests }));
    } catch (error) {
      addLog(`❌ Failed to load friend requests: ${error.message}`, 'error');
    }

    try {
      // Test 3: Get friend locations
      addLog('📡 Testing GET /api/friends/locations...', 'info');
      const locations = await apiService.getFriendLocations();
      addLog(`✅ Friend locations loaded: ${locations.length} friends with locations`, 'success');
      setDebugInfo(prev => ({ ...prev, locationsCount: locations.length, locations }));
    } catch (error) {
      addLog(`❌ Failed to load friend locations: ${error.message}`, 'error');
    }

    setIsLoading(false);
    addLog('🎉 Friends API tests completed!', 'success');
  };

  const testLocationTracking = async () => {
    if (!navigator.geolocation) {
      addLog('❌ Geolocation not supported by this browser', 'error');
      return;
    }

    addLog('📍 Testing location tracking...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        addLog(`📍 Current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${accuracy}m)`, 'info');
        
        try {
          // Test location tracking API
          const result = await apiService.trackLocation({
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString()
          });
          addLog('✅ Location tracked successfully', 'success');
          setDebugInfo(prev => ({ ...prev, lastLocation: { latitude, longitude, accuracy } }));
        } catch (error) {
          addLog(`❌ Failed to track location: ${error.message}`, 'error');
        }
      },
      (error) => {
        addLog(`❌ Geolocation error: ${error.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const testFriendRequest = async () => {
    const testEmail = prompt('Enter friend email to test friend request:');
    if (!testEmail) return;

    try {
      addLog(`📤 Sending friend request to ${testEmail}...`, 'info');
      const result = await apiService.sendFriendRequest(testEmail);
      addLog(`✅ Friend request sent successfully`, 'success');
      addLog(`📋 Response: ${JSON.stringify(result)}`, 'info');
    } catch (error) {
      addLog(`❌ Failed to send friend request: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setDebugInfo({});
  };

  const exportDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      debugInfo,
      logs,
      userAgent: navigator.userAgent,
      location: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friends-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="friends-debugger bg-gray-100 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🔧 Friends System Debugger</h2>
      
      {/* Debug Info Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Friends</h3>
          <p className="text-2xl font-bold text-blue-600">{debugInfo.friendsCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Pending Requests</h3>
          <p className="text-2xl font-bold text-yellow-600">{debugInfo.requestsCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Friend Locations</h3>
          <p className="text-2xl font-bold text-green-600">{debugInfo.locationsCount || 0}</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testFriendsAPI}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : '🧪 Test Friends API'}
        </button>
        
        <button
          onClick={testLocationTracking}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          📍 Test Location Tracking
        </button>
        
        <button
          onClick={testFriendRequest}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
        >
          📤 Test Friend Request
        </button>
        
        <button
          onClick={clearLogs}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          🗑️ Clear Logs
        </button>
        
        <button
          onClick={exportDebugInfo}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
        >
          📥 Export Debug Info
        </button>
      </div>

      {/* Debug Logs */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-white font-bold mb-2">Debug Logs:</h3>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Run some tests to see debug information.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`mb-1 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              'text-blue-400'
            }`}>
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      {/* Detailed Debug Info */}
      {Object.keys(debugInfo).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Detailed Debug Info:</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
