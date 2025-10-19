import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import MapView from '../components/MapView';
import FriendsList from '../components/FriendsList';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [serverStatus, setServerStatus] = useState('unknown');
  const [showFriends, setShowFriends] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  // Demo markers for testing marker rendering on the map
  // Coordinates provided by user (first converted from DMS to decimal):
  // 47°39′40″N 122°18′50″W => 47.6611111111, -122.3138888889
  // All demo markers with names provided by user
  const allDemoMarkers = [
    { id: 'leon', name: 'Leon Coffee House', latitude: 47.6611111111, longitude: -122.3138888889 },
    { id: 'ugly-mug', name: 'Ugly Mug Cafe', latitude: 47.65, longitude: -122.38 },
    { id: 'allegro', name: 'Cafe Allegro', latitude: 47.607968, longitude: -122.328452 },
    { id: 'toasted', name: 'TOASTED Bagels & Coffee', latitude: 47.664491, longitude: -122.311634 },
    { id: 'solstice', name: 'Cafe Solstice', latitude: 47.6574, longitude: -122.3129 },
    { id: 'seven', name: 'Seven Coffee Roasters Market & Cafe', latitude: 47.6691, longitude: -122.3060 },
    { id: 'sunshine', name: 'Seattle Sunshine and Coffee', latitude: 47.6689, longitude: -122.2921 },
    { id: 'ancient-gate', name: 'Ancient Gate Coffee', latitude: 47.6614, longitude: -122.3130 },
    { id: 'lune', name: 'Lune Cafe', latitude: 47.6653, longitude: -122.3128 },
    { id: 'boon-booma', name: 'Boon Booma Coffee', latitude: 47.6604, longitude: -122.3128 },
    { id: 'suzallo', name: 'Suzallo and Allen Library', latitude: 47.6557, longitude: -122.3084 },
    { id: 'odegaard', name: 'Odegaard Undergrad Library', latitude: 47.6565, longitude: -122.3104 },
    { id: 'health-sciences', name: 'Health Sciences Library', latitude: 47.6491, longitude: -122.3070 },
    { id: 'engineering', name: 'Engineering Library', latitude: 47.6546, longitude: -122.3045 },
    { id: 'foster', name: 'Foster Library', latitude: 47.6570, longitude: -122.3050 },
    { id: 'hub', name: 'HUB', latitude: 47.6553, longitude: -122.3052 },
    { id: 'south-campus', name: 'South Campus Center', latitude: 47.6478, longitude: -122.3058 },
    { id: 'starbucks', name: 'Starbucks', latitude: 47.6582, longitude: -122.3134 },
    { id: 'cafe-ave', name: 'Cafe on the Ave', latitude: 47.6584, longitude: -122.3134 },
    { id: 'snooze', name: 'Snooze', latitude: 47.6588, longitude: -122.3130 },
    { id: 'boba-up', name: 'Boba up', latitude: 47.6581, longitude: -122.3134 },
    { id: 'dont-yell', name: "Don't Yell At Me", latitude: 47.6616, longitude: -122.3134 },
    { id: 'hmart', name: 'HMart Grab & Go', latitude: 47.607968, longitude: -122.328452 },
    { id: 'pacha', name: 'Pacha Collective', latitude: 47.6803, longitude: -122.3162 },
    { id: 'mr-west', name: 'Mr West Cafe Bar', latitude: 47.6632, longitude: -122.2989 },
    { id: 'zoka', name: 'Zoka Coffee & Roaster', latitude: 47.6662, longitude: -122.2974 },
    { id: 'oh-bear', name: 'Oh! Bear Cafe and Teahouse', latitude: 47.6634, longitude: -122.3161 },
    { id: 'cafe-happy', name: 'Cafe Happy', latitude: 47.6558, longitude: -122.3202 }
  ];

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      await apiService.healthCheck();
      setServerStatus('connected');
    } catch (error) {
      setServerStatus('disconnected');
    }
  };

  const handleLocationUpdate = (location) => {
    setUserLocation(location);
    console.log('Location updated:', location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <div className="ml-4 flex items-center">
                <span className="text-sm text-gray-500">Server Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  serverStatus === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {serverStatus}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFriends(!showFriends)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showFriends ? 'Hide Friends' : 'Show Friends'}
              </button>
              <span className="text-sm text-gray-700">Welcome, {user?.name || 'User'}!</span>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Map Section */}
      <div className="bg-white shadow mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Location Tracking</h2>
          </div>
          <MapView
            height="500px"
            onLocationUpdate={handleLocationUpdate}
            markers={allDemoMarkers}
          />
        </div>
      </div>

      {/* Friends List Modal */}
      {showFriends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Friends</h2>
              <button
                onClick={() => setShowFriends(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <FriendsList />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
