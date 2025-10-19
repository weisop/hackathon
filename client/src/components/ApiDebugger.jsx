import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ApiDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  const runDebugTests = async () => {
    const results = {
      timestamp: new Date().toISOString(),
      localStorage: {
        token: localStorage.getItem('token'),
        auth_token: localStorage.getItem('auth_token'),
        supabase_auth_token: localStorage.getItem('supabase.auth.token')
      },
      apiTests: {}
    };

    // Test 1: Health check
    try {
      const healthResponse = await fetch('http://localhost:3001/api/health');
      results.apiTests.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: await healthResponse.json()
      };
    } catch (error) {
      results.apiTests.health = { error: error.message };
    }

    // Test 2: Active sessions (requires auth)
    try {
      const sessionsResponse = await apiService.getActiveLocationSessions();
      results.apiTests.activeSessions = {
        success: true,
        data: sessionsResponse
      };
    } catch (error) {
      results.apiTests.activeSessions = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Test 3: Direct API call with token
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/location-sessions/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      results.apiTests.directApiCall = {
        status: response.status,
        ok: response.ok,
        data: await response.text()
      };
    } catch (error) {
      results.apiTests.directApiCall = { error: error.message };
    }

    setDebugInfo(results);
  };

  useEffect(() => {
    if (isVisible) {
      runDebugTests();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      >
        🔧 Debug API
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">API Debugger</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">LocalStorage Tokens:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.localStorage, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">API Tests:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.apiTests, null, 2)}
            </pre>
          </div>

          <button
            onClick={runDebugTests}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🔄 Refresh Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiDebugger;
