import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AILocationDescription = ({ locationName, userLevel, isVisible }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (isVisible && locationName) {
      generateDescription();
    }
  }, [locationName, userLevel, isVisible]);

  const generateDescription = async () => {
    try {
      setLoading(true);
      
      // Get current context
      const now = new Date();
      const timeOfDay = getTimeOfDay(now);
      const weather = await getWeatherContext();
      const isBusy = await getLocationBusyStatus(locationName);
      
      const context = {
        timeOfDay,
        weather,
        userLevel,
        isBusy
      };

      const desc = await aiService.generateLocationDescription(locationName, context);
      setDescription(desc);
      setLastUpdate(now);
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeOfDay = (date) => {
    const hour = date.getHours();
    if (hour < 6) return 'Early Morning';
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  };

  const getWeatherContext = async () => {
    // Simulate weather detection - in a real app, you'd use a weather API
    const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Clear'];
    return weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  };

  const getLocationBusyStatus = async (location) => {
    // Simulate busy status based on time and location
    const hour = new Date().getHours();
    const busyLocations = ['HUB', 'Cafeteria', 'Gym'];
    const isPeakTime = (hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 19);
    
    return busyLocations.includes(location) && isPeakTime;
  };

  if (!isVisible || !locationName) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm">✨</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">AI Location Insight</h3>
        <button
          onClick={generateDescription}
          disabled={loading}
          className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
        >
          {loading ? '🔄 Generating...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-2">{locationName}</h4>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{description}</p>
            )}
          </div>
          <div className="ml-4">
            <span className="text-2xl">🏛️</span>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="mt-3 text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AILocationDescription;
