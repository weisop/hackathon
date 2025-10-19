import React from 'react';

const LocationProgressBar = ({ 
  locationName, 
  elapsedTime, 
  targetHours, 
  isVisible = true 
}) => {
  if (!isVisible || !locationName || !targetHours) {
    return null;
  }

  // Convert elapsed time from milliseconds to hours
  const elapsedHours = elapsedTime / (1000 * 60 * 60);
  
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min((elapsedHours / targetHours) * 100, 100);
  
  // Determine progress bar color based on completion
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-yellow-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    return 'bg-red-500';
  };

  // Format time display
  const formatTime = (hours) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}m`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.floor((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (progressPercentage >= 100) {
      return '🎉 Goal achieved!';
    } else if (progressPercentage >= 75) {
      return '🔥 Almost there!';
    } else if (progressPercentage >= 50) {
      return '💪 Halfway there!';
    } else {
      return '🚀 Keep going!';
    }
  };

  return (
    <div className="location-progress-bar bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          📍 {locationName}
        </h3>
        <span className="text-sm text-gray-500">
          {getStatusMessage()}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Time spent: {formatTime(elapsedHours)}</span>
          <span>Target: {formatTime(targetHours)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{Math.round(progressPercentage)}% complete</span>
          <span>
            {progressPercentage >= 100 
              ? '✅ Complete!' 
              : `${formatTime(targetHours - elapsedHours)} remaining`
            }
          </span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Progress:</span>
          <span className="font-medium">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${
            progressPercentage >= 100 ? 'text-green-600' :
            progressPercentage >= 75 ? 'text-yellow-600' :
            progressPercentage >= 50 ? 'text-blue-600' : 'text-red-600'
          }`}>
            {progressPercentage >= 100 ? 'Complete' :
             progressPercentage >= 75 ? 'Almost Done' :
             progressPercentage >= 50 ? 'Halfway' : 'Getting Started'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationProgressBar;
