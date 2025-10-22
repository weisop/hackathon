import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Collections = () => {
  const { user, signOut } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [inProgressLocations, setInProgressLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to calculate required time for a level
  const calculateLevelTime = (level) => {
    const baseTime = 0.167; // 10 minutes in hours
    return baseTime * Math.pow(1.5, level - 1);
  };

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        // Fetch achievements, level achievements, and all location levels (in-progress)
        const [regularAchievements, levelAchievements, userLevels] = await Promise.all([
          apiService.getLocationAchievements().catch(() => []),
          apiService.getLevelAchievements().catch(() => []),
          apiService.getAllUserLevels().catch(() => [])
        ]);
        
        // Ensure all are arrays
        const safeRegularAchievements = Array.isArray(regularAchievements) ? regularAchievements : [];
        const safeLevelAchievements = Array.isArray(levelAchievements) ? levelAchievements : [];
        const safeUserLevels = Array.isArray(userLevels) ? userLevels : [];
        
        console.log('📊 Fetched data:', { 
          regularAchievements: safeRegularAchievements, 
          levelAchievements: safeLevelAchievements,
          userLevels: safeUserLevels 
        });
        
        // Combine and format completed achievements
        const allAchievements = [
          ...safeRegularAchievements.map(achievement => ({
            ...achievement,
            type: 'regular',
            level: 1
          })),
          ...safeLevelAchievements.map(achievement => ({
            ...achievement,
            type: 'level',
            target_hours: achievement.required_time_hours,
            achieved_hours: achievement.achieved_time_hours,
            level: achievement.level
          }))
        ];
        
        // Format in-progress locations (locations with time spent but not completed current level)
        const inProgress = safeUserLevels
          .filter(level => level.total_time_spent_seconds > 0)
          .map(level => {
            const requiredTime = calculateLevelTime(level.current_level);
            const currentTime = level.total_time_spent_seconds / 3600; // Convert to hours
            const progressPercent = Math.min((currentTime / requiredTime) * 100, 100);
            
            return {
              id: level.location_id,
              location_id: level.location_id,
              location_name: level.location_name || 'Unknown Location',
              current_level: level.current_level,
              total_time_spent_seconds: level.total_time_spent_seconds,
              required_time_hours: requiredTime,
              current_time_hours: currentTime,
              progress_percent: progressPercent,
              is_completed: progressPercent >= 100
            };
          });
        
        setAchievements(allAchievements);
        setInProgressLocations(inProgress);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setAchievements([]);
        setInProgressLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  // Auto-refresh achievements when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing achievements...');
        refreshAchievements();
      }
    };

    const handleRefreshCollections = () => {
      console.log('🔄 Refresh collections event received, refreshing achievements...');
      refreshAchievements();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('refreshCollections', handleRefreshCollections);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('refreshCollections', handleRefreshCollections);
    };
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (hours) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}m`;
    } else {
      const wholeHours = Math.floor(hours);
      const minutes = Math.floor((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    }
  };

  const formatTimeDetailed = (hours) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      const seconds = Math.floor((hours * 60 - minutes) * 60);
      if (seconds > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${minutes}m`;
    } else {
      const wholeHours = Math.floor(hours);
      const minutes = Math.floor((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    }
  };

  const getLevelTitle = (level) => {
    const titles = {
      1: 'Novice',
      2: 'Explorer', 
      3: 'Regular',
      4: 'Expert',
      5: 'Master'
    };
    return titles[Math.min(level, 5)] || `Level ${level}`;
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-blue-500', 
      3: 'bg-purple-500',
      4: 'bg-yellow-500',
      5: 'bg-red-500'
    };
    return colors[Math.min(level, 5)] || 'bg-gray-500';
  };

  const calculateLevelProgress = (achievement) => {
    if (achievement.type === 'level') {
      // For level achievements, they are always 100% complete since they represent completed levels
      return 100;
    } else {
      // For regular achievements, calculate based on achieved vs target time
      return Math.min(100, (achievement.achieved_hours / achievement.target_hours) * 100);
    }
  };

  const refreshAchievements = async () => {
    try {
      setLoading(true);
      // Fetch achievements, level achievements, and all location levels (in-progress)
      const [regularAchievements, levelAchievements, userLevels] = await Promise.all([
        apiService.getLocationAchievements().catch(() => []),
        apiService.getLevelAchievements().catch(() => []),
        apiService.getAllUserLevels().catch(() => [])
      ]);
      
      // Ensure all are arrays
      const safeRegularAchievements = Array.isArray(regularAchievements) ? regularAchievements : [];
      const safeLevelAchievements = Array.isArray(levelAchievements) ? levelAchievements : [];
      const safeUserLevels = Array.isArray(userLevels) ? userLevels : [];
      
      console.log('📊 Refreshed data:', { 
        regularAchievements: safeRegularAchievements, 
        levelAchievements: safeLevelAchievements,
        userLevels: safeUserLevels 
      });
      
      // Combine and format completed achievements
      const allAchievements = [
        ...safeRegularAchievements.map(achievement => ({
          ...achievement,
          type: 'regular',
          level: 1
        })),
        ...safeLevelAchievements.map(achievement => ({
          ...achievement,
          type: 'level',
          target_hours: achievement.required_time_hours,
          achieved_hours: achievement.achieved_time_hours,
          level: achievement.level
        }))
      ];
      
      // Format in-progress locations
      const inProgress = safeUserLevels
        .filter(level => level.total_time_spent_seconds > 0)
        .map(level => {
          const requiredTime = calculateLevelTime(level.current_level);
          const currentTime = level.total_time_spent_seconds / 3600; // Convert to hours
          const progressPercent = Math.min((currentTime / requiredTime) * 100, 100);
          
          return {
            id: level.location_id,
            location_id: level.location_id,
            location_name: level.location_name || 'Unknown Location',
            current_level: level.current_level,
            total_time_spent_seconds: level.total_time_spent_seconds,
            required_time_hours: requiredTime,
            current_time_hours: currentTime,
            progress_percent: progressPercent,
            is_completed: progressPercent >= 100
          };
        });
      
      setAchievements(allAchievements);
      setInProgressLocations(inProgress);
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/bg.jpg')"
      }}
    >
      <header className="bg-[#f2ede1] shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
            <div className="flex space-x-3">
              <button
                onClick={refreshAchievements}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
              >

                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* In-Progress Conquests Section */}
          {!loading && inProgressLocations.length > 0 && (
            <div className="bg-[#37006b] shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-[#f2ede1] mb-6">⚔️ Territories Being Conquered</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressLocations.map((location) => (
                    <div
                      key={location.id}
                      className="rounded-lg p-6 border bg-gradient-to-br from-yellow-50 to-orange-100 border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-4xl">
                            {getAchievementIcon(location.location_name)}
                          </div>
                          <div className={`w-10 h-10 rounded-full ${getLevelColor(location.current_level)} flex items-center justify-center text-white font-bold text-lg`}>
                            {location.current_level}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {getLevelTitle(location.current_level)}
                          </span>
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            In Progress
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {location.location_name}
                        <span className="ml-2 text-sm text-orange-600 font-medium">
                          (Level {location.current_level})
                        </span>
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Progress:</span>
                          <span className="font-medium text-orange-600">{formatTime(location.current_time_hours)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target for Level {location.current_level}:</span>
                          <span className="font-medium">{formatTime(location.required_time_hours)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Time Remaining:</span>
                          <span className="font-medium text-blue-600">
                            {formatTime(Math.max(0, location.required_time_hours - location.current_time_hours))}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-orange-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Conquest Progress</span>
                          <span className="text-sm font-medium text-orange-600">
                            {Math.round(location.progress_percent)}%
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-orange-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-600 transition-all duration-500"
                            style={{
                              width: `${location.progress_percent}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-orange-600 font-medium mt-1 text-center">
                          {location.progress_percent >= 100 
                            ? '🎉 Ready to advance!' 
                            : `${Math.round(100 - location.progress_percent)}% until conquest`
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conquered Achievements Section */}
          <div className="bg-[#37006b] shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-[#f2ede1] mb-6">✅ Conquered Achievements</h2>
              
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
                      className={`rounded-lg p-6 border ${
                        achievement.type === 'level'
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                          : 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-4xl">
                            {getAchievementIcon(achievement.location_name)}
                          </div>
                          {achievement.level && (
                            <div className={`w-10 h-10 rounded-full ${getLevelColor(achievement.level)} flex items-center justify-center text-white font-bold text-lg`}>
                              {achievement.level}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {achievement.level && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {getLevelTitle(achievement.level)}
                            </span>
                          )}
                          {achievement.is_milestone && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              Milestone
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {achievement.location_name}
                        {achievement.type === 'level' && (
                          <span className="ml-2 text-sm text-green-600 font-medium">
                            (Level {achievement.level})
                          </span>
                        )}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-medium">{formatTime(achievement.target_hours)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Achieved:</span>
                          <span className="font-medium text-primary-600">{formatTime(achievement.achieved_hours)}</span>
                        </div>
                        {achievement.type === 'level' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Level:</span>
                            <span className="font-medium text-green-600">Level {achievement.level}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{formatDate(achievement.achievement_date)}</span>
                        </div>
                        {achievement.type === 'level' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium text-purple-600">Level Achievement</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-primary-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-primary-600">
                            {Math.round(calculateLevelProgress(achievement))}%
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-primary-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              achievement.type === 'level' 
                                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                : 'bg-primary-600'
                            }`}
                            style={{
                              width: `${calculateLevelProgress(achievement)}%`
                            }}
                          ></div>
                        </div>
                        {achievement.type === 'level' && (
                          <div className="text-xs text-green-600 font-medium mt-1 text-center">
                            ✅ Level {achievement.level} Completed
                          </div>
                        )}
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


