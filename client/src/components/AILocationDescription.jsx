import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AILocationDescription = ({ locationName, userLevel, isVisible }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState({
    timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
    weather: 'sunny', // Default weather
    userLevel: userLevel || 1,
    isBusy: Math.random() > 0.5 // Random busy status for demo
  });

  useEffect(() => {
    if (isVisible && locationName) {
      loadDescription();
    }
  }, [locationName, userLevel, isVisible]);

  const loadDescription = async () => {
    try {
      setLoading(true);
      const desc = await aiService.generateLocationDescription(locationName, context);
      setDescription(desc);
    } catch (error) {
      console.error('Error loading description:', error);
      // Fallback description
      setDescription(`${locationName} is a great place to explore and discover new opportunities!`);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm">📍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Location Description</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm">📍</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">About {locationName}</h3>
        <button
          onClick={loadDescription}
          className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
          <div className="ml-4">
            <span className="text-2xl">🏛️</span>
          </div>
        </div>
      </div>

      {/* Context Info */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="bg-gray-100 px-2 py-1 rounded">Level {userLevel}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">{context.timeOfDay}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">{context.weather}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          {context.isBusy ? 'busy' : 'quiet'}
        </span>
      </div>
    </div>
  );
};

export default AILocationDescription;
