import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import './MapView.css';
import { apiService } from '../services/api';

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
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (location) {
      map.setView([location.latitude, location.longitude], map.getZoom());

      // Reuse a single marker instead of creating a new one each update
      if (!markerRef.current) {
        markerRef.current = L.marker([location.latitude, location.longitude]).addTo(map);
      } else {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
      }

      markerRef.current.bindPopup("📍 You are here").openPopup();
    }

    return () => {
      // Clean up marker when component unmounts
      if (markerRef.current) {
        try {
          map.removeLayer(markerRef.current);
        } catch (e) {
          // ignore if already removed
        }
        markerRef.current = null;
      }
    };
  }, [location, map]);

  return null;
};

// Component to fit map bounds to markers and user location
const FitBounds = ({ markers = [], userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points = [];
    if (Array.isArray(markers)) {
      markers.forEach(m => {
        if (m && typeof m.latitude === 'number' && typeof m.longitude === 'number') {
          points.push([m.latitude, m.longitude]);
        }
      });
    }

    if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
      points.push([userLocation.latitude, userLocation.longitude]);
    }

    if (points.length === 0) return;

    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } catch (e) {
      // ignore
    }
  }, [map, markers, userLocation]);

  return null;
};

// Return a divIcon based on type (coffee / library / default)
const getMarkerIcon = (type, size = 28) => {
  const emoji = type === 'library' ? '📚' : (type === 'coffee' ? '☕' : '📍');
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:#ffffff;border:2px solid rgba(0,0,0,0.08);box-shadow:0 1px 3px rgba(0,0,0,0.2);font-size:${Math.floor(size*0.6)}px">${emoji}</div>`;
  return L.divIcon({ html, className: 'custom-emoji-icon', iconSize: [size, size], iconAnchor: [size/2, size/2] });
};

export default function MapView({ 
  center = [47.6567, -122.3066], // Default to Seattle
  zoom = 13,
  height = "400px",
  showUserLocation = true,
  onLocationUpdate = null
  , markers = []
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
  const [smoothedLocation, setSmoothedLocation] = useState(null);
  const [enhancedLocationData, setEnhancedLocationData] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  const [googleMapsConfigured, setGoogleMapsConfigured] = useState(false);
  const [friendLocations, setFriendLocations] = useState([]);
  const [showFriendLocations, setShowFriendLocations] = useState(true);
  
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
        
        setUserLocation(location);
        setError(null);
        onLocationUpdate?.(location);
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

  // Get enhanced location data from Google Maps
  const getEnhancedLocationData = useCallback(async (latitude, longitude) => {
    if (!googleMapsConfigured) return;
    
    setIsLoadingEnhanced(true);
    try {
      const enhancedData = await apiService.getEnhancedLocation(latitude, longitude);
      if (enhancedData.success) {
        setEnhancedLocationData(enhancedData);
        setNearbyPlaces(enhancedData.nearbyPlaces || []);
        console.log('🌟 Enhanced location data loaded:', enhancedData);
      }
    } catch (error) {
      console.error('❌ Failed to get enhanced location data:', error);
    } finally {
      setIsLoadingEnhanced(false);
    }
  }, [googleMapsConfigured]);

  // Check Google Maps API configuration
  const checkGoogleMapsConfig = useCallback(async () => {
    try {
      const config = await apiService.checkLocationConfig();
      setGoogleMapsConfigured(config.configured);
      if (!config.configured) {
        console.warn('⚠️ Google Maps API not configured:', config.message);
      }
    } catch (error) {
      console.error('❌ Failed to check Google Maps config:', error);
    }
  }, []);

  // Load friend locations
  const loadFriendLocations = useCallback(async () => {
    try {
      const locations = await apiService.getFriendLocations();
      setFriendLocations(locations);
      console.log('👥 Friend locations loaded:', locations);
    } catch (error) {
      console.error('❌ Failed to load friend locations:', error);
    }
  }, []);

  // Save location to backend
  const saveLocationToBackend = useCallback(async (location) => {
    try {
      await apiService.trackLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        enhancedData: enhancedLocationData
      });
      console.log('💾 Location saved to backend');
    } catch (error) {
      console.error('❌ Failed to save location:', error);
    }
  }, [enhancedLocationData]);

  // Initialize Google Maps configuration check
  useEffect(() => {
    checkGoogleMapsConfig();
  }, [checkGoogleMapsConfig]);

  // Load friend locations on component mount
  useEffect(() => {
    loadFriendLocations();
  }, [loadFriendLocations]);

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
          
          // Get enhanced location data if Google Maps is configured
          if (googleMapsConfigured) {
            getEnhancedLocationData(location.latitude, location.longitude);
          }

          // Save location to backend
          saveLocationToBackend(smoothed);
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
  }, [isTracking, precisionMode, smoothLocation, updateTrackingStats, onLocationUpdate]);

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

          <button
            onClick={() => setShowFriendLocations(!showFriendLocations)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              showFriendLocations 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-400 hover:bg-gray-500 text-white'
            }`}
          >
            {showFriendLocations ? 'Hide Friends' : 'Show Friends'}
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

        {/* Enhanced Location Data */}
        {enhancedLocationData && (
          <div className="bg-white p-4 rounded border mb-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              🌟 Enhanced Location Data
              {isLoadingEnhanced && <span className="ml-2 text-blue-500">Loading...</span>}
            </h4>
            
            {enhancedLocationData.address && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700">Address:</div>
                <div className="text-sm text-gray-600">{enhancedLocationData.address}</div>
              </div>
            )}

            {enhancedLocationData.addressComponents && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700">Location Details:</div>
                <div className="text-sm text-gray-600">
                  {enhancedLocationData.addressComponents.city && `${enhancedLocationData.addressComponents.city}, `}
                  {enhancedLocationData.addressComponents.state && `${enhancedLocationData.addressComponents.state} `}
                  {enhancedLocationData.addressComponents.country && enhancedLocationData.addressComponents.country}
                </div>
              </div>
            )}

            {nearbyPlaces.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Nearby Places:</div>
                <div className="max-h-32 overflow-y-auto">
                  {nearbyPlaces.slice(0, 5).map((place, index) => (
                    <div key={index} className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium">{place.name}</div>
                      <div className="text-xs text-gray-500">{place.vicinity}</div>
                      {place.rating && <div className="text-xs text-yellow-600">⭐ {place.rating}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Google Maps Configuration Status */}
        <div className="mb-4">
          <div className={`px-3 py-2 rounded text-sm ${
            googleMapsConfigured 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {googleMapsConfigured ? (
              '✅ Google Maps API configured - Enhanced features available'
            ) : (
              '⚠️ Google Maps API not configured - Basic location tracking only'
            )}
          </div>
        </div>
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
                  html: `
                    <div style="width:16px;height:16px;background:#3B82F6;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(59,130,246,0.6);${userLocation.smoothed ? 'box-shadow:0 0 8px rgba(34,197,94,0.7);' : ''}"></div>
                  `,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Tooltip permanent direction="top" className="map-tooltip">
                  {userLocation.name ?? 'You'}
                </Tooltip>
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
              
            </>
          )}

          {/* Friend locations */}
          {showFriendLocations && friendLocations.map((friend, index) => (
            <Marker
              key={`friend-${friend.friend_id}`}
              position={[friend.latest_latitude, friend.latest_longitude]}
              icon={L.divIcon({
                className: 'friend-location-marker',
                html: `<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" title="${friend.friend_name}"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            >
              <Popup>
                <div>
                  <strong>{friend.friend_name}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{friend.friend_email}</span>
                  <br />
                  <span className="text-xs text-gray-500">
                    Last seen: {new Date(friend.location_updated_at).toLocaleString()}
                  </span>
                  {friend.latest_enhanced_data?.address && (
                    <>
                      <br />
                      <span className="text-xs text-blue-600">📍 {friend.latest_enhanced_data.address}</span>
                    </>
                  )}
                  {friend.latest_accuracy && (
                    <>
                      <br />
                      <span className="text-xs text-gray-500">Accuracy: {friend.latest_accuracy.toFixed(1)}m</span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Location history trail */}
          {locationHistory.map((location, index) => (
            <Marker
              key={index}
              position={[location.latitude, location.longitude]}
              icon={L.divIcon({
                className: 'history-marker',
                html: `
                  <div title="Point ${index + 1}" style="width:8px;height:8px;background:#10B981;border-radius:50%;opacity:${(Math.max(20, 100 - index * 2)/100).toFixed(2)};">
                  </div>
                `,
                iconSize: [8, 8],
                iconAnchor: [4, 4]
              })}
            >
              <Tooltip permanent direction="top" className="map-tooltip">{location.name ?? `Point ${index + 1}`}</Tooltip>
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

          {/* External markers passed via props */}
          {Array.isArray(markers) && markers.map((m, idx) => (
            <Marker
              key={m.id ?? idx}
              position={[m.latitude, m.longitude]}
              icon={getMarkerIcon(
                // crude type detection: library if name contains 'Library' or 'Library' keywords
                (/library|library|library/i.test(m.name) || /Library/.test(m.name)) ? 'library' : (/cafe|coffee|starbucks|bagel|boba|snooze|toast|cafe|coffeemaker|coffee/i.test(m.name) ? 'coffee' : 'default')
              )}
            >
              <Tooltip permanent direction="top" className="map-tooltip">{m.name ?? `Marker ${idx + 1}`}</Tooltip>
              <Popup>
                <div>
                  <strong>{m.name ?? `Marker ${idx + 1}`}</strong>
                  <br />
                  Lat: {m.latitude.toFixed(8)}
                  <br />
                  Lng: {m.longitude.toFixed(8)}
                  {m.description && <><br />{m.description}</>}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Auto-fit bounds to show all markers */}
          <FitBounds markers={markers} userLocation={userLocation} />

          <MapUpdater location={userLocation} />
        </MapContainer>
      </div>
    </div>
  );
}
