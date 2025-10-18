import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import L from 'leaflet';

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

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setUserLocation(location);
        setError(null);
        onLocationUpdate?.(location);
      },
      (error) => {
        setError('Failed to get location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Start/stop location tracking
  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
    } else {
      getCurrentLocation();
      setIsTracking(true);
    }
  };

  // Watch position for continuous tracking
  useEffect(() => {
    let watchId;
    
    if (isTracking) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setUserLocation(location);
          setLocationHistory(prev => [...prev.slice(-49), location]); // Keep last 50 locations
          onLocationUpdate?.(location);
        },
        (error) => {
          setError('Location tracking error: ' + error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, onLocationUpdate]);

  return (
    <div className="map-container">
      <div className="map-controls mb-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={toggleTracking}
          className={`px-4 py-2 rounded text-sm font-medium ${
            isTracking 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Location Tracking'}
        </button>
        
        <button
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
        >
          Get Current Location
        </button>
        
        {error && (
          <div className="text-red-500 text-sm mt-2 col-span-2">{error}</div>
        )}
        
        {userLocation && (
          <div className="text-sm text-gray-600 mt-2">
            <div>Current: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</div>
            <div>Accuracy: {userLocation.accuracy}m</div>
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
            <Marker 
              position={[userLocation.latitude, userLocation.longitude]}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            >
              <Popup>
                <div>
                  <strong>Your Location</strong>
                  <br />
                  Lat: {userLocation.latitude.toFixed(6)}
                  <br />
                  Lng: {userLocation.longitude.toFixed(6)}
                  <br />
                  Accuracy: {userLocation.accuracy}m
                </div>
              </Popup>
            </Marker>
          )}

          {/* Location history trail */}
          {locationHistory.map((location, index) => (
            <Marker
              key={index}
              position={[location.latitude, location.longitude]}
              icon={L.divIcon({
                className: 'history-marker',
                html: `<div class="w-2 h-2 bg-green-500 rounded-full opacity-${Math.max(20, 100 - index * 2)}"></div>`,
                iconSize: [8, 8],
                iconAnchor: [4, 4]
              })}
            />
          ))}

          <MapUpdater location={userLocation} />
        </MapContainer>
      </div>
    </div>
  );
}
