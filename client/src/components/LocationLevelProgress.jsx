import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const LocationLevelProgress = ({ 
  locationId, 
  locationName, 
  elapsedTime, 
  isVisible = true,
  onLevelComplete = null
}) => {
  const [userLevel, setUserLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelCompleted, setLevelCompleted] = useState(false);

  useEffect(() => {
    if (isVisible && locationId) {
      fetchUserLevel();
    }
  }, [locationId, isVisible]);

  const fetchUserLevel = async () => {
    try {
      setLoading(true);
      const level = await apiService.getUserLocationLevel(locationId);
      setUserLevel(level);
    } catch (error) {
      console.error('Error fetching user level:', error);
      // Set default level if API fails
      setUserLevel({
        current_level: 1,
        total_time_spent_seconds: 0,
        is_unlocked: true
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLevelTime = (level) => {
    const baseTime = 0.167; // 10 minutes in hours
    return baseTime * Math.pow(1.5, level - 1);
  };

  const updateLocationTime = async (timeSpentSeconds) => {
    try {
      const result = await apiService.updateLocationTime(
        locationId, 
        timeSpentSeconds, 
        locationName
      );
      
      if (result.isCompleted && !levelCompleted) {
        setLevelCompleted(true);
        if (onLevelComplete) {
          onLevelComplete({
            locationId,
            locationName,
            level: userLevel.current_level,
            timeSpent: result.timeSpent
          });
        }
      }
      
      setUserLevel(result.level);
    } catch (error) {
      console.error('Error updating location time:', error);
    }
  };

  const advanceToNextLevel = async () => {
    try {
      const result = await apiService.advanceToNextLevel(locationId, locationName);
      setUserLevel(result.level);
      setLevelCompleted(false);
    } catch (error) {
      console.error('Error advancing level:', error);
    }
  };

  if (!isVisible || !locationId || loading) {
    return null;
  }

  if (!userLevel) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
        <div className="text-center text-gray-500">Loading level data...</div>
      </div>
    );
  }

  const currentLevel = userLevel.current_level;
  const requiredTime = calculateLevelTime(currentLevel);
  const elapsedHours = elapsedTime / (1000 * 60 * 60);
  const progressPercentage = Math.min((elapsedHours / requiredTime) * 100, 100);

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

  return (
    <div className="location-level-progress bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
      {/* Level Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full ${getLevelColor(currentLevel)} flex items-center justify-center text-white font-bold text-sm`}>
            {currentLevel}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {locationName}
            </h3>
            <p className="text-sm text-gray-600">
              {getLevelTitle(currentLevel)} • Level {currentLevel}
            </p>
          </div>
        </div>
        {levelCompleted && (
          <div className="text-2xl animate-bounce">🎉</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress: {formatTime(elapsedHours)}</span>
          <span>Target: {formatTime(requiredTime)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${getLevelColor(currentLevel)}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{Math.round(progressPercentage)}% complete</span>
          <span>
            {progressPercentage >= 100 
              ? '✅ Level Complete!' 
              : `${formatTime(requiredTime - elapsedHours)} remaining`
            }
          </span>
        </div>
      </div>

      {/* Level Completion */}
      {levelCompleted && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-800 mb-1">
              🎉 Level {currentLevel} Complete!
            </div>
            <p className="text-sm text-yellow-700 mb-2">
              Ready to advance to Level {currentLevel + 1}?
            </p>
            <button
              onClick={advanceToNextLevel}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
            >
              Advance to Level {currentLevel + 1}
            </button>
          </div>
        </div>
      )}

      {/* Next Level Preview */}
      {!levelCompleted && (
        <div className="text-xs text-gray-500 text-center">
          Next level requires {formatTime(calculateLevelTime(currentLevel + 1))}
        </div>
      )}
    </div>
  );
};

export default LocationLevelProgress;
