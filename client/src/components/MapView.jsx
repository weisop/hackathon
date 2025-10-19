import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import './MapView.css';
import { apiService } from '../services/api';
import LocationProgressBar from './LocationProgressBar';
import LocationLevelProgress from './LocationLevelProgress';
import CelebrationModal from './CelebrationModal';
// import 'leaflet.tilelayer.colorfilter';

//   const fantasyMapFilter = [
//   'hue: 275deg',      // purple hue shift
//   'saturate: 1.4',    // boost saturation
//   'contrast: 1.1',    // mild contrast
//   'brightness: 1.05', // slight brightness
//   'sepia: 0.25',      // yellow warmth
// ];
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

// Component to update marker position without affecting map view
const MapUpdater = ({ location }) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (location) {
      // Only update marker position, don't change map view
      if (!markerRef.current) {
        markerRef.current = L.marker([location.latitude, location.longitude]).addTo(map);
      } else {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
      }
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

// Component to fit map bounds to markers and user location (disabled to prevent auto-reframing)
const FitBounds = ({ markers = [], userLocation }) => {
  // Disabled to prevent automatic reframing during location updates
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
  // Friends functionality temporarily disabled
  // const [friendLocations, setFriendLocations] = useState([]);
  // const [showFriendLocations, setShowFriendLocations] = useState(true);
  const [nearbyBuilding, setNearbyBuilding] = useState(null);
  const [showYouAreHereButton, setShowYouAreHereButton] = useState(false);
  const [locationStartTime, setLocationStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievementData, setAchievementData] = useState(null);
  const [shownAchievements, setShownAchievements] = useState(() => {
    // Load shown achievements from localStorage on component mount
    try {
      const saved = localStorage.getItem('shownAchievements');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.warn('Failed to load shown achievements from localStorage:', error);
      return new Set();
    }
  });
  
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

  // Start a location session in the database
  const startLocationSession = useCallback(async (marker) => {
    try {
      const sessionData = {
        locationId: marker.id,
        locationName: marker.name,
        latitude: marker.latitude,
        longitude: marker.longitude,
        targetHours: marker.targetHours || 4 // Default to 4 hours if not specified
      };

      const response = await apiService.startLocationSession(sessionData);
      setActiveSession(response.session);
      setSessionId(response.session.id);
      console.log('✅ Location session started:', response.session);
    } catch (error) {
      console.error('❌ Failed to start location session:', error);
      // Continue with local tracking even if database fails
    }
  }, []);

  // End a location session in the database
  const endLocationSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await apiService.endLocationSession(sessionId);
      console.log('✅ Location session ended');
    } catch (error) {
      console.error('❌ Failed to end location session:', error);
    } finally {
      setActiveSession(null);
      setSessionId(null);
    }
  }, [sessionId]);

  // Add a checkpoint to the current session
  const addSessionCheckpoint = useCallback(async (latitude, longitude, accuracy) => {
    if (!sessionId) return;

    try {
      await apiService.addSessionCheckpoint({
        sessionId,
        latitude,
        longitude,
        accuracy
      });
    } catch (error) {
      console.error('❌ Failed to add session checkpoint:', error);
    }
  }, [sessionId]);

  const handleAchievementComplete = (achievement) => {
    // Create a unique key for this achievement
    const achievementKey = `${achievement.locationName}-${achievement.level || 1}-${Math.floor(Date.now() / 1000)}`;
    
    // Check if this achievement has already been shown
    if (shownAchievements.has(achievementKey)) {
      console.log('🎉 Achievement already shown, skipping:', achievementKey);
      return;
    }
    
    console.log('🎉 Achievement completed!', achievement);
    setAchievementData(achievement);
    setShowCelebration(true);
    
    // Mark this achievement as shown
    setShownAchievements(prev => new Set([...prev, achievementKey]));
  };

  const handleLevelComplete = (levelData) => {
    // Create a unique key for this level achievement
    const achievementKey = `${levelData.locationName}-level-${levelData.level}-${Math.floor(Date.now() / 1000)}`;
    
    // Check if this achievement has already been shown
    if (shownAchievements.has(achievementKey)) {
      console.log('🎉 Level achievement already shown, skipping:', achievementKey);
      return;
    }
    
    console.log('🎉 Level completed!', levelData);
    setAchievementData({
      locationName: levelData.locationName,
      targetHours: 0.167, // Base time
      achievedHours: levelData.timeSpent / 3600,
      progressPercentage: 100,
      level: levelData.level
    });
    setShowCelebration(true);
    
    // Mark this achievement as shown
    setShownAchievements(prev => new Set([...prev, achievementKey]));
  };

  const handleLevelAdvancement = (levelData) => {
    console.log('🚀 Level advanced!', levelData);
    // Reset the celebration state to allow for new level celebrations
    setShowCelebration(false);
    setAchievementData(null);
  };

  // Function to clear shown achievements (for testing purposes)
  const clearShownAchievements = () => {
    setShownAchievements(new Set());
    localStorage.removeItem('shownAchievements');
    console.log('🧹 Cleared shown achievements');
  };

  // Expose clear function to window for testing
  useEffect(() => {
    window.clearShownAchievements = clearShownAchievements;
    return () => {
      delete window.clearShownAchievements;
    };
  }, []);

  // Check if user is near any building markers
  const checkProximityToBuildings = useCallback((userLat, userLng) => {
    if (!Array.isArray(markers) || markers.length === 0) return;

    const PROXIMITY_THRESHOLD = 50; // 50 meters threshold for being "near" a building
    
    for (const marker of markers) {
      if (marker.latitude && marker.longitude) {
        const distance = calculateDistance(userLat, userLng, marker.latitude, marker.longitude);
        
        if (distance <= PROXIMITY_THRESHOLD) {
          // If we're at the same building, don't reset the timer
          if (nearbyBuilding && nearbyBuilding.id === marker.id) {
            setNearbyBuilding(marker);
            setShowYouAreHereButton(true);
            return;
          }
          
          // New building or first time at this building - start timer and session
          setNearbyBuilding(marker);
          setShowYouAreHereButton(true);
          setLocationStartTime(Date.now());
          setElapsedTime(0);
          setShowProgressBar(true);
          
          // Start database session
          startLocationSession(marker);
          return;
        }
      }
    }
    
    // If no nearby building found, hide the button and stop timer
    if (nearbyBuilding) {
      endLocationSession();
    }
    
    setNearbyBuilding(null);
    setShowYouAreHereButton(false);
    setLocationStartTime(null);
    setElapsedTime(0);
    setShowProgressBar(false);
  }, [markers, calculateDistance, nearbyBuilding, startLocationSession, endLocationSession]);

  // Format elapsed time for display
  const formatElapsedTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
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
        
        // Check proximity to buildings
        checkProximityToBuildings(location.latitude, location.longitude);
        
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

  // Get enhanced location data
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

  // Check API configuration
  const checkGoogleMapsConfig = useCallback(async () => {
    try {
      const config = await apiService.checkLocationConfig();
      setGoogleMapsConfigured(config.configured);
    } catch (error) {
      setGoogleMapsConfigured(false);
    }
  }, []);

  // Friends functionality temporarily disabled
  // const loadFriendLocations = useCallback(async () => {
  //   try {
  //     const locations = await apiService.getFriendLocations();
  //     setFriendLocations(locations);
  //     console.log('👥 Friend locations loaded:', locations);
  //   } catch (error) {
  //     console.warn('⚠️ Friend locations not available (authentication required):', error.message);
  //     setFriendLocations([]);
  //   }
  // }, []);

  // Save location to backend
  const saveLocationToBackend = useCallback(async (location) => {
    // Check if user is authenticated before attempting to save
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      console.log('🔐 No authentication token found, skipping location save');
      return;
    }

    try {
      await apiService.trackLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        enhancedData: enhancedLocationData
      });
      console.log('💾 Location saved to backend');
    } catch (error) {
      console.error('Error saving location:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }
      });
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.warn('⚠️ Location tracking requires authentication. Please log in.');
      } else if (error.response?.status === 404) {
        console.warn('⚠️ Location tracking endpoint not found. Server may not be running.');
      } else {
        console.warn('⚠️ Location tracking failed:', error.message);
      }
    }
  }, [enhancedLocationData]);

  // Initialize API configuration check
  useEffect(() => {
    checkGoogleMapsConfig();
  }, [checkGoogleMapsConfig]);

  // Recover active sessions on component mount
  useEffect(() => {
    const recoverActiveSessions = async () => {
      try {
        // Check authentication first
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        console.log('🔐 Auth token available:', !!token);
        
        const activeSessions = await apiService.getActiveLocationSessions();
        if (activeSessions && activeSessions.length > 0) {
          const session = activeSessions[0]; // Get the most recent active session
          setActiveSession(session);
          setSessionId(session.id);
          
          // Find the corresponding marker
          const marker = markers.find(m => m.id === session.location_id);
          if (marker) {
            setNearbyBuilding(marker);
            setShowYouAreHereButton(true);
            setShowProgressBar(true);
            
            // Calculate elapsed time since session start
            const sessionStartTime = new Date(session.session_start_time).getTime();
            const currentTime = Date.now();
            const elapsed = currentTime - sessionStartTime;
            setLocationStartTime(sessionStartTime);
            setElapsedTime(elapsed);
            
            console.log('🔄 Recovered active session:', session);
          }
        } else {
          console.log('📝 No active sessions found');
        }
      } catch (error) {
        console.warn('⚠️ Failed to recover active sessions:', error);
        console.log('🔍 Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    };

    recoverActiveSessions();
  }, [markers]);

  // Friends functionality temporarily disabled
  // useEffect(() => {
  //   loadFriendLocations();
  // }, [loadFriendLocations]);

  // Stopwatch timer effect
  useEffect(() => {
    let interval;
    if (locationStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - locationStartTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [locationStartTime]);

  // Save shown achievements to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('shownAchievements', JSON.stringify([...shownAchievements]));
    } catch (error) {
      console.warn('Failed to save shown achievements to localStorage:', error);
    }
  }, [shownAchievements]);

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
          
          // Check proximity to buildings
          checkProximityToBuildings(smoothed.latitude, smoothed.longitude);
          
          // Add checkpoint to active session if we're at a location
          if (sessionId && nearbyBuilding) {
            addSessionCheckpoint(smoothed.latitude, smoothed.longitude, smoothed.accuracy);
          }
          
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
          
          // Get enhanced location data if API is configured
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
    <div className="map-container relative">
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

          {/* Friends functionality temporarily disabled */}
          {/* <button
            onClick={() => setShowFriendLocations(!showFriendLocations)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              showFriendLocations 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-400 hover:bg-gray-500 text-white'
            }`}
          >
            {showFriendLocations ? 'Hide Friends' : 'Show Friends'}
          </button> */}
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

      </div>

      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={userLocation ? [userLocation.latitude, userLocation.longitude] : center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}{r}.jpg"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> | Map tiles by <a href="https://stamen.com/">Stamen Design</a>, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
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
              
              {/* "You are here" button when near a building */}
              {showYouAreHereButton && nearbyBuilding && (
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={L.divIcon({
                    className: 'you-are-here-button',
                    html: `
                      <div style="
                        background: linear-gradient(135deg, #10B981, #059669);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        text-align: center;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                        border: 2px solid white;
                        white-space: nowrap;
                        cursor: pointer;
                      ">
                        ${nearbyBuilding.name}
                      </div>
                    `,
                    iconSize: [200, 40],
                    iconAnchor: [100, 40]
                  })}
                >
                  <Popup>
                    <div className="p-3">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">📍</span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">You are here!</h3>
                          <p className="text-sm text-gray-600">Currently at</p>
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 text-base mb-1">{nearbyBuilding.name}</h4>
                        <p className="text-sm text-green-700">You're currently at this location</p>
                      </div>
                      
                      {/* Stopwatch Section */}
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-blue-800 text-sm">⏱️ Time at location</h5>
                            <p className="text-xs text-blue-600">How long you've been here</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-blue-800">
                              {formatElapsedTime(elapsedTime)}
                            </div>
                            <div className="text-xs text-blue-600">
                              {elapsedTime > 0 ? 'Running...' : 'Just arrived'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        <p>📍 Location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
                        <p>🎯 Accuracy: {userLocation.accuracy.toFixed(1)}m</p>
                        {userLocation.smoothed && <p>✨ Smoothed location data</p>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          )}

          {/* Friends functionality temporarily disabled */}
          {/* Friend locations */}
          {/* {showFriendLocations && friendLocations.map((friend, index) => (
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
          ))} */}

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
            />
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

      {/* Location Level Progress */}
      {showProgressBar && nearbyBuilding && (
        <div className="absolute bottom-4 left-4 z-10">
          <LocationLevelProgress
            locationId={nearbyBuilding.id}
            locationName={nearbyBuilding.name}
            elapsedTime={elapsedTime}
            isVisible={showProgressBar}
            onLevelComplete={handleLevelComplete}
            onLevelAdvancement={handleLevelAdvancement}
          />
        </div>
      )}

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        locationName={achievementData?.locationName}
        achievementData={achievementData}
      />
    </div>
  );
}