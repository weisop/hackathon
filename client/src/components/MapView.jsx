import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import './MapView.css';

// Optional: custom icon fix for default markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to update map center when user location changes
const MapUpdater = ({ location }) => {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], map.getZoom());
    }
  }, [location, map]);
  
  return null;
};

export default function MapView({ 
  center = [47.6062, -122.3321], // Default to Seattle
  zoom = 13,
  height = "400px",
  showUserLocation = true,
  onLocationUpdate = null
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [trackingStats, setTrackingStats] = useState({
    totalLocations: 0,
    averageAccuracy: 0,
    bestAccuracy: Infinity,
    trackingDuration: 0
  });
  const [precisionMode, setPrecisionMode] = useState('high');
  const [accuracyFilter, setAccuracyFilter] = useState(50); // meters
  const [showAccuracyCircle, setShowAccuracyCircle] = useState(true);
  const [smoothedLocation, setSmoothedLocation] = useState(null);
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const locationBufferRef = useRef([]);

  // Location smoothing algorithm (moving average)
  const smoothLocation = useCallback((newLocation, buffer) => {
    const updatedBuffer = [...buffer, newLocation].slice(-5); // Keep last 5 locations
    
    if (updatedBuffer.length < 2) {
      return newLocation;
    }
    
    const avgLat = updatedBuffer.reduce((sum, loc) => sum + loc.latitude, 0) / updatedBuffer.length;
    const avgLng = updatedBuffer.reduce((sum, loc) => sum + loc.longitude, 0) / updatedBuffer.length;
    const avgAccuracy = updatedBuffer.reduce((sum, loc) => sum + loc.accuracy, 0) / updatedBuffer.length;
    
    return {
      latitude: avgLat,
      longitude: avgLng,
      accuracy: avgAccuracy,
      timestamp: newLocation.timestamp,
      smoothed: true
    };
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Get precision options based on mode
  const getPrecisionOptions = (mode) => {
    switch (mode) {
      case 'ultra':
        return {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        };
      case 'high':
        return {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        };
      case 'balanced':
        return {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        };
      default:
        return {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        };
    }
  };

  // Get user's current location with precision options
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const options = getPrecisionOptions(precisionMode);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed
        };
        
        // Apply accuracy filter
        if (location.accuracy <= accuracyFilter) {
          setUserLocation(location);
          setError(null);
          onLocationUpdate?.(location);
        } else {
          setError(`Location accuracy (${location.accuracy.toFixed(1)}m) exceeds filter (${accuracyFilter}m)`);
        }
      },
      (error) => {
        setError('Failed to get location: ' + error.message);
      },
      options
    );
  };

  // Update tracking statistics
  const updateTrackingStats = useCallback((newLocation) => {
    setTrackingStats(prev => {
      const totalLocations = prev.totalLocations + 1;
      const newAverageAccuracy = ((prev.averageAccuracy * prev.totalLocations) + newLocation.accuracy) / totalLocations;
      const newBestAccuracy = Math.min(prev.bestAccuracy, newLocation.accuracy);
      const trackingDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      
      return {
        totalLocations,
        averageAccuracy: newAverageAccuracy,
        bestAccuracy: newBestAccuracy,
        trackingDuration
      };
    });
  }, []);

  // Start/stop location tracking
  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    } else {
      getCurrentLocation();
      setIsTracking(true);
      startTimeRef.current = Date.now();
    }
  };

  // Watch position for continuous tracking with precision
  useEffect(() => {
    if (isTracking) {
      const options = getPrecisionOptions(precisionMode);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          };
          
          // Apply accuracy filter
          if (location.accuracy <= accuracyFilter) {
            // Apply smoothing if enabled
            const smoothed = smoothLocation(location, locationBufferRef.current);
            locationBufferRef.current = [...locationBufferRef.current, location].slice(-5);
            
            setUserLocation(smoothed);
            setSmoothedLocation(smoothed);
            
            // Add to history with distance calculation
            setLocationHistory(prev => {
              const newHistory = [...prev];
              if (prev.length > 0) {
                const lastLocation = prev[prev.length - 1];
                const distance = calculateDistance(
                  lastLocation.latitude, lastLocation.longitude,
                  location.latitude, location.longitude
                );
                location.distanceFromLast = distance;
              }
              return [...newHistory.slice(-99), location]; // Keep last 100 locations
            });
            
            updateTrackingStats(location);
            onLocationUpdate?.(smoothed);
          } else {
            setError(`Location accuracy (${location.accuracy.toFixed(1)}m) exceeds filter (${accuracyFilter}m)`);
          }
        },
        (error) => {
          setError('Location tracking error: ' + error.message);
        },
        options
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, precisionMode, accuracyFilter, smoothLocation, updateTrackingStats, onLocationUpdate]);

  return (
    <div className="map-container">
      {/* Precision Controls */}
      <div className="precision-controls mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Precision Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Precision Mode</label>
            <select
              value={precisionMode}
              onChange={(e) => setPrecisionMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ultra">Ultra (30s timeout, no cache)</option>
              <option value="high">High (15s timeout, 10s cache)</option>
              <option value="balanced">Balanced (10s timeout, 30s cache)</option>
            </select>
          </div>

          {/* Accuracy Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Accuracy: {accuracyFilter}m
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={accuracyFilter}
              onChange={(e) => setAccuracyFilter(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Only locations with accuracy ≤ {accuracyFilter}m will be accepted
            </div>
          </div>

          {/* Display Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAccuracyCircle}
                  onChange={(e) => setShowAccuracyCircle(e.target.checked)}
                  className="mr-2"
                />
                Show accuracy circle
              </label>
            </div>
          </div>
        </div>

        {/* Tracking Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={toggleTracking}
            className={`px-4 py-2 rounded text-sm font-medium ${
              isTracking 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Precise Tracking'}
          </button>
          
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
          >
            Get Current Location
          </button>

          <button
            onClick={() => {
              setLocationHistory([]);
              setTrackingStats({
                totalLocations: 0,
                averageAccuracy: 0,
                bestAccuracy: Infinity,
                trackingDuration: 0
              });
            }}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium"
          >
            Clear History
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded">{error}</div>
        )}

        {/* Location Info */}
        {userLocation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold text-gray-800 mb-2">Current Location</h4>
              <div className="text-sm space-y-1">
                <div><strong>Lat:</strong> {userLocation.latitude.toFixed(8)}</div>
                <div><strong>Lng:</strong> {userLocation.longitude.toFixed(8)}</div>
                <div><strong>Accuracy:</strong> {userLocation.accuracy.toFixed(1)}m</div>
                {userLocation.altitude && <div><strong>Altitude:</strong> {userLocation.altitude.toFixed(1)}m</div>}
                {userLocation.speed && <div><strong>Speed:</strong> {userLocation.speed.toFixed(1)} m/s</div>}
                {userLocation.heading && <div><strong>Heading:</strong> {userLocation.heading.toFixed(1)}°</div>}
                {userLocation.smoothed && <div className="text-blue-600"><strong>Smoothed:</strong> Yes</div>}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold text-gray-800 mb-2">Tracking Stats</h4>
              <div className="text-sm space-y-1">
                <div><strong>Locations:</strong> {trackingStats.totalLocations}</div>
                <div><strong>Avg Accuracy:</strong> {trackingStats.averageAccuracy.toFixed(1)}m</div>
                <div><strong>Best Accuracy:</strong> {trackingStats.bestAccuracy === Infinity ? 'N/A' : trackingStats.bestAccuracy.toFixed(1) + 'm'}</div>
                <div><strong>Duration:</strong> {Math.floor(trackingStats.trackingDuration / 1000)}s</div>
                <div><strong>History:</strong> {locationHistory.length} points</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={userLocation ? [userLocation.latitude, userLocation.longitude] : center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User's current location marker */}
          {showUserLocation && userLocation && (
            <>
              <Marker 
                position={[userLocation.latitude, userLocation.longitude]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg ${userLocation.smoothed ? 'ring-2 ring-green-400' : ''}"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup>
                  <div>
                    <strong>Your Location</strong>
                    <br />
                    Lat: {userLocation.latitude.toFixed(8)}
                    <br />
                    Lng: {userLocation.longitude.toFixed(8)}
                    <br />
                    Accuracy: {userLocation.accuracy.toFixed(1)}m
                    {userLocation.altitude && <><br />Altitude: {userLocation.altitude.toFixed(1)}m</>}
                    {userLocation.speed && <><br />Speed: {userLocation.speed.toFixed(1)} m/s</>}
                    {userLocation.heading && <><br />Heading: {userLocation.heading.toFixed(1)}°</>}
                    {userLocation.smoothed && <><br /><span className="text-blue-600">Smoothed</span></>}
                  </div>
                </Popup>
              </Marker>
              
              {/* Accuracy circle */}
              {showAccuracyCircle && (
                <Circle
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: '#3B82F6',
                    fillColor: '#3B82F6',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
              )}
            </>
          )}

          {/* Location history trail */}
          {locationHistory.map((location, index) => (
            <Marker
              key={index}
              position={[location.latitude, location.longitude]}
              icon={L.divIcon({
                className: 'history-marker',
                html: `<div class="w-2 h-2 bg-green-500 rounded-full opacity-${Math.max(20, 100 - index * 2)}" title="Point ${index + 1}"></div>`,
                iconSize: [8, 8],
                iconAnchor: [4, 4]
              })}
            >
              <Popup>
                <div>
                  <strong>History Point {index + 1}</strong>
                  <br />
                  Lat: {location.latitude.toFixed(8)}
                  <br />
                  Lng: {location.longitude.toFixed(8)}
                  <br />
                  Accuracy: {location.accuracy.toFixed(1)}m
                  {location.distanceFromLast && <><br />Distance: {location.distanceFromLast.toFixed(1)}m</>}
                  <br />
                  Time: {new Date(location.timestamp).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
          ))}

          <MapUpdater location={userLocation} />
        </MapContainer>
      </div>
    </div>
  );
}
