import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AIInsightsDashboard = ({ userData, locationData }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadInsights();
    calculateStats();
  }, [userData, locationData]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const aiInsights = await aiService.generateLocationInsights(userData, locationData);
      setInsights(aiInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalTime = userData.totalTime || 0;
    const totalVisits = userData.totalVisits || 0;
    const averageTime = totalVisits > 0 ? Math.round(totalTime / totalVisits) : 0;
    const favoriteLocation = userData.favoriteLocation || 'Not determined';
    const currentLevel = userData.currentLevel || 1;

    setStats({
      totalTime: Math.round(totalTime / 60), // Convert to minutes
      totalVisits,
      averageTime: Math.round(averageTime / 60),
      favoriteLocation,
      currentLevel
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
        <button
          onClick={loadInsights}
          className="ml-auto text-green-600 hover:text-green-800 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalTime}m</div>
          <div className="text-xs text-gray-600">Total Time</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalVisits}</div>
          <div className="text-xs text-gray-600">Total Visits</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.averageTime}m</div>
          <div className="text-xs text-gray-600">Avg Time</div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">L{stats.currentLevel}</div>
          <div className="text-xs text-gray-600">Current Level</div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 mb-3">Personalized Insights</h4>
        {insights.map((insight, index) => (
          <div key={`insight-${insight.insight?.slice(0, 20)}-${index}`} className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-green-600 mr-2">💡</span>
                  <span className="font-medium text-gray-800">{insight.insight}</span>
                </div>
                <div className="flex items-center text-green-700 text-sm">
                  <span className="mr-2">🎯</span>
                  <span>{insight.recommendation}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">Keep exploring to get personalized insights!</p>
        </div>
      )}
    </div>
  );
};

export default AIInsightsDashboard;
