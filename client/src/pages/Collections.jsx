import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Collections = () => {
  const { user, signOut } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const data = await apiService.getLocationAchievements();
        setAchievements(data);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        // Set some demo data if API fails
        setAchievements([
          {
            id: '1',
            location_name: 'HUB',
            target_hours: 4,
            achieved_hours: 4.5,
            achievement_date: new Date().toISOString(),
            is_milestone: true
          },
          {
            id: '2',
            location_name: 'Library',
            target_hours: 2,
            achieved_hours: 2.2,
            achievement_date: new Date(Date.now() - 86400000).toISOString(),
            is_milestone: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAchievementIcon = (locationName) => {
    const icons = {
      'HUB': '🏢',
      'Library': '📚',
      'Gym': '💪',
      'Cafeteria': '🍽️',
      'Park': '🌳',
      'Cafe': '☕'
    };
    return icons[locationName] || '🏆';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Your Achievements</h2>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-gray-600">Loading achievements...</span>
                </div>
              ) : achievements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Yet</h3>
                  <p className="text-gray-600">
                    Start visiting locations and spending time there to earn your first achievement!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl">
                          {getAchievementIcon(achievement.location_name)}
                        </div>
                        {achievement.is_milestone && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Milestone
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {achievement.location_name}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-medium">{achievement.target_hours}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Achieved:</span>
                          <span className="font-medium text-primary-600">{achievement.achieved_hours}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{formatDate(achievement.achievement_date)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-primary-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-primary-600">
                            {Math.round((achievement.achieved_hours / achievement.target_hours) * 100)}%
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-primary-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (achievement.achieved_hours / achievement.target_hours) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Collections;
