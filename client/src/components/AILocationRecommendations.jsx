import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AILocationRecommendations = ({ userHistory, currentLocation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userHistory, currentLocation]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const recs = await aiService.generateLocationRecommendations(userHistory, currentLocation);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm">🧠</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI Recommendations</h3>
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
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm">🧠</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">AI Recommendations</h3>
        <button
          onClick={loadRecommendations}
          className="ml-auto text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">
        Based on your exploration patterns, here are some locations you might enjoy:
      </p>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={`rec-${rec.name}-${index}`} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{rec.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{rec.reason}</p>
                <div className="flex items-center text-purple-600 text-sm">
                  <span className="mr-1">💡</span>
                  <span className="font-medium">{rec.tip}</span>
                </div>
              </div>
              <div className="ml-4">
                <span className="text-2xl">📍</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">No recommendations available yet. Keep exploring to get personalized suggestions!</p>
        </div>
      )}
    </div>
  );
};

export default AILocationRecommendations;
