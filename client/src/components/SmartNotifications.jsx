import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const SmartNotifications = ({ currentLocation, userLevel, isVisible }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    if (isVisible && currentLocation) {
      generateNotification();
    }
  }, [currentLocation, userLevel, isVisible]);

  const generateNotification = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const timeOfDay = getTimeOfDay(now);
      const weather = await getWeatherContext();
      const isBusy = await getLocationBusyStatus(currentLocation);
      
      const context = {
        currentLocation,
        timeOfDay,
        weather,
        userLevel,
        isBusy
      };

      const notification = await aiService.generateSmartNotification(context);
      
      if (notification) {
        const newNotification = {
          id: Date.now(),
          message: notification,
          timestamp: now,
          type: getNotificationType(context)
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 2)]); // Keep only 3 most recent
        setLastCheck(now);
      }
    } catch (error) {
      console.error('Error generating notification:', error);
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
    const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Clear'];
    return weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  };

  const getLocationBusyStatus = async (location) => {
    const hour = new Date().getHours();
    const busyLocations = ['HUB', 'Cafeteria', 'Gym'];
    const isPeakTime = (hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 19);
    
    return busyLocations.includes(location) && isPeakTime;
  };

  const getNotificationType = (context) => {
    if (context.isBusy) return 'busy';
    if (context.weather === 'Rainy') return 'weather';
    if (context.userLevel > 3) return 'achievement';
    return 'general';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'busy': return '🚨';
      case 'weather': return '🌧️';
      case 'achievement': return '🏆';
      default: return '💡';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'busy': return 'from-red-50 to-orange-50 border-red-100';
      case 'weather': return 'from-blue-50 to-cyan-50 border-blue-100';
      case 'achievement': return 'from-yellow-50 to-amber-50 border-yellow-100';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  if (!isVisible || !currentLocation) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm">🔔</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Smart Notifications</h3>
        <button
          onClick={generateNotification}
          disabled={loading}
          className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm font-medium disabled:opacity-50"
        >
          {loading ? '🔄 Generating...' : '🔄 Check'}
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`bg-gradient-to-r ${getNotificationColor(notification.type)} rounded-lg p-4 border`}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{getNotificationIcon(notification.type)}</span>
                  <span className="text-sm text-gray-600">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && !loading && (
        <div className="text-center py-4">
          <p className="text-gray-500">No notifications yet. Keep exploring to get smart suggestions!</p>
        </div>
      )}

      {loading && (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      )}

      {lastCheck && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default SmartNotifications;
