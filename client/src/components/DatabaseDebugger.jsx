import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import AuthTester from './AuthTester';

export default function DatabaseDebugger() {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    addLog('🧪 Testing database connection...', 'info');
    
    try {
      // Test basic API connection
      const health = await apiService.healthCheck();
      addLog('✅ API health check passed', 'success');
      setDebugInfo(prev => ({ ...prev, apiHealth: 'OK' }));
    } catch (error) {
      addLog(`❌ API health check failed: ${error.message}`, 'error');
      setDebugInfo(prev => ({ ...prev, apiHealth: 'FAILED' }));
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      addLog('❌ No authentication token found - you need to be logged in', 'error');
      addLog('Please log in to the app first, then run this test again', 'info');
      setDebugInfo(prev => ({ ...prev, authenticated: false }));
      setIsLoading(false);
      return;
    }

    addLog('✅ Authentication token found', 'success');
    setDebugInfo(prev => ({ ...prev, authenticated: true }));

    try {
      // Test location sessions API
      const activeSessions = await apiService.getActiveLocationSessions();
      addLog(`✅ Active sessions API working - Found ${activeSessions.length} sessions`, 'success');
      setDebugInfo(prev => ({ ...prev, activeSessions: activeSessions.length }));
    } catch (error) {
      if (error.response?.status === 401) {
        addLog('❌ Active sessions API failed: 401 Unauthorized - Authentication issue', 'error');
        addLog('Try logging out and logging back in', 'info');
      } else {
        addLog(`❌ Active sessions API failed: ${error.message}`, 'error');
      }
      setDebugInfo(prev => ({ ...prev, activeSessions: 'ERROR' }));
    }

    try {
      // Test session history API
      const history = await apiService.getLocationSessionHistory(5);
      addLog(`✅ Session history API working - Found ${history.length} sessions`, 'success');
      setDebugInfo(prev => ({ ...prev, sessionHistory: history.length }));
    } catch (error) {
      if (error.response?.status === 401) {
        addLog('❌ Session history API failed: 401 Unauthorized - Authentication issue', 'error');
      } else {
        addLog(`❌ Session history API failed: ${error.message}`, 'error');
      }
      setDebugInfo(prev => ({ ...prev, sessionHistory: 'ERROR' }));
    }

    setIsLoading(false);
    addLog('🎉 Database connection tests completed!', 'success');
  };

  const testSessionCreation = async () => {
    setIsLoading(true);
    addLog('🧪 Testing session creation...', 'info');
    
    try {
      const testSessionData = {
        locationId: 'test-debug',
        locationName: 'Debug Test Location',
        latitude: 47.6062,
        longitude: -122.3321,
        targetHours: 1.0
      };

      const result = await apiService.startLocationSession(testSessionData);
      addLog('✅ Session creation successful', 'success');
      addLog(`Session ID: ${result.session.id}`, 'info');
      setDebugInfo(prev => ({ ...prev, lastSessionId: result.session.id }));

      // Clean up test session
      setTimeout(async () => {
        try {
          await apiService.endLocationSession(result.session.id);
          addLog('✅ Test session cleaned up', 'success');
        } catch (error) {
          addLog(`⚠️ Failed to clean up test session: ${error.message}`, 'error');
        }
      }, 2000);

    } catch (error) {
      addLog(`❌ Session creation failed: ${error.message}`, 'error');
      addLog(`Error details: ${JSON.stringify(error.response?.data || error, null, 2)}`, 'error');
    }

    setIsLoading(false);
  };

  const testSessionCheckpoint = async () => {
    if (!debugInfo.lastSessionId) {
      addLog('❌ No session ID available. Create a session first.', 'error');
      return;
    }

    setIsLoading(true);
    addLog('🧪 Testing session checkpoint...', 'info');
    
    try {
      const checkpointData = {
        sessionId: debugInfo.lastSessionId,
        latitude: 47.6062,
        longitude: -122.3321,
        accuracy: 10.0
      };

      const result = await apiService.addSessionCheckpoint(checkpointData);
      addLog('✅ Checkpoint added successfully', 'success');
      addLog(`Duration: ${result.durationSeconds} seconds`, 'info');
    } catch (error) {
      addLog(`❌ Checkpoint failed: ${error.message}`, 'error');
    }

    setIsLoading(false);
  };

  const testAchievements = async () => {
    setIsLoading(true);
    addLog('🧪 Testing achievements API...', 'info');
    
    try {
      const achievements = await apiService.getLocationAchievements();
      addLog(`✅ Achievements API working - Found ${achievements.length} achievements`, 'success');
      setDebugInfo(prev => ({ ...prev, achievements: achievements.length }));
    } catch (error) {
      addLog(`❌ Achievements API failed: ${error.message}`, 'error');
      setDebugInfo(prev => ({ ...prev, achievements: 'ERROR' }));
    }

    setIsLoading(false);
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
    a.download = `database-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="database-debugger bg-gray-100 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🔧 Database Debugger</h2>
      
      {/* Authentication Tester */}
      <div className="mb-6">
        <AuthTester />
      </div>
      
      {/* Debug Info Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">API Health</h3>
          <p className={`text-2xl font-bold ${
            debugInfo.apiHealth === 'OK' ? 'text-green-600' : 'text-red-600'
          }`}>
            {debugInfo.apiHealth || 'Unknown'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Authentication</h3>
          <p className={`text-2xl font-bold ${
            debugInfo.authenticated === true ? 'text-green-600' : 
            debugInfo.authenticated === false ? 'text-red-600' : 'text-gray-600'
          }`}>
            {debugInfo.authenticated === true ? '✅' : 
             debugInfo.authenticated === false ? '❌' : '❓'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Active Sessions</h3>
          <p className="text-2xl font-bold text-blue-600">
            {debugInfo.activeSessions || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Session History</h3>
          <p className="text-2xl font-bold text-purple-600">
            {debugInfo.sessionHistory || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Achievements</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {debugInfo.achievements || 0}
          </p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testDatabaseConnection}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : '🧪 Test Database Connection'}
        </button>
        
        <button
          onClick={testSessionCreation}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          📝 Test Session Creation
        </button>
        
        <button
          onClick={testSessionCheckpoint}
          disabled={isLoading || !debugInfo.lastSessionId}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          📍 Test Checkpoint
        </button>
        
        <button
          onClick={testAchievements}
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          🏆 Test Achievements
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


