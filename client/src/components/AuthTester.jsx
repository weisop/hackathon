import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export default function AuthTester() {
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { timestamp, message, type }]);
  };

  const testAuthentication = async () => {
    setIsLoading(true);
    setTestResults([]);
    addResult('🔍 Testing authentication status...', 'info');

    // Test 1: Check if user is logged in
    if (!isAuthenticated || !user) {
      addResult('❌ User is not authenticated', 'error');
      addResult('Please log in to test the database features', 'info');
      setIsLoading(false);
      return;
    }

    addResult(`✅ User is authenticated: ${user.name || user.email}`, 'success');

    // Test 2: Check token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      addResult('❌ No authentication token found in localStorage', 'error');
    } else {
      addResult('✅ Authentication token found in localStorage', 'success');
    }

    // Test 3: Test a simple authenticated endpoint
    try {
      addResult('🧪 Testing authenticated API call...', 'info');
      const activeSessions = await apiService.getActiveLocationSessions();
      addResult(`✅ API call successful - Found ${activeSessions.length} active sessions`, 'success');
    } catch (error) {
      if (error.response?.status === 401) {
        addResult('❌ API call failed: 401 Unauthorized', 'error');
        addResult('Authentication token may be invalid or expired', 'error');
        addResult('Try logging out and logging back in', 'info');
      } else {
        addResult(`❌ API call failed: ${error.message}`, 'error');
      }
    }

    // Test 4: Test session creation
    try {
      addResult('🧪 Testing session creation...', 'info');
      const testSessionData = {
        locationId: 'auth-test',
        locationName: 'Authentication Test',
        latitude: 47.6062,
        longitude: -122.3321,
        targetHours: 0.1 // 6 minutes for quick test
      };

      const result = await apiService.startLocationSession(testSessionData);
      addResult('✅ Session creation successful', 'success');
      addResult(`Session ID: ${result.session.id}`, 'info');

      // Clean up immediately
      setTimeout(async () => {
        try {
          await apiService.endLocationSession(result.session.id);
          addResult('✅ Test session cleaned up', 'success');
        } catch (error) {
          addResult(`⚠️ Failed to clean up test session: ${error.message}`, 'error');
        }
      }, 1000);

    } catch (error) {
      if (error.response?.status === 401) {
        addResult('❌ Session creation failed: 401 Unauthorized', 'error');
      } else {
        addResult(`❌ Session creation failed: ${error.message}`, 'error');
      }
    }

    setIsLoading(false);
    addResult('🎉 Authentication test completed!', 'success');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="auth-tester bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🔐 Authentication Tester</h3>
      
      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700">Authentication Status</h4>
          <p className={`text-2xl font-bold ${
            isAuthenticated ? 'text-green-600' : 'text-red-600'
          }`}>
            {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}
          </p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700">User</h4>
          <p className="text-lg font-bold text-blue-600">
            {user ? (user.name || user.email) : 'None'}
          </p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700">Token</h4>
          <p className={`text-lg font-bold ${
            localStorage.getItem('token') ? 'text-green-600' : 'text-red-600'
          }`}>
            {localStorage.getItem('token') ? 'Present' : 'Missing'}
          </p>
        </div>
      </div>

      {/* Test Button */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={testAuthentication}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : '🧪 Test Authentication'}
        </button>
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
        <h4 className="text-white font-bold mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <div className="text-gray-500">No test results yet. Click "Test Authentication" to start.</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className={`mb-1 ${
              result.type === 'error' ? 'text-red-400' : 
              result.type === 'success' ? 'text-green-400' : 
              'text-blue-400'
            }`}>
              <span className="text-gray-500">[{result.timestamp}]</span> {result.message}
            </div>
          ))
        )}
      </div>

      {/* Quick Fix Instructions */}
      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">🔧 Quick Fix:</h4>
          <ol className="text-yellow-700 text-sm space-y-1">
            <li>1. Make sure you are logged in to the app</li>
            <li>2. Check that the authentication is working</li>
            <li>3. Try logging out and logging back in</li>
            <li>4. Run the authentication test again</li>
          </ol>
        </div>
      )}
    </div>
  );
}
