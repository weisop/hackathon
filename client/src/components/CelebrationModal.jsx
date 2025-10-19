import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export default function CelebrationModal({ isOpen, onClose, locationName, achievementData }) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setAnimationStep(0);
      
      // Trigger confetti animation
      setTimeout(() => setAnimationStep(1), 100);
      setTimeout(() => setAnimationStep(2), 300);
      setTimeout(() => setAnimationStep(3), 500);
      
      // Save achievement to database
      saveAchievement();
    }
  }, [isOpen]);

  const saveAchievement = async () => {
    if (!achievementData) return;
    
    try {
      setIsSaving(true);
      
      // Create achievement record
      const achievementRecord = {
        location_id: achievementData.locationName.toLowerCase().replace(/\s+/g, '-'),
        location_name: achievementData.locationName,
        target_hours: achievementData.targetHours,
        achieved_hours: achievementData.achievedHours,
        achievement_date: new Date().toISOString(),
        is_milestone: true
      };

      // Save to database via API
      await apiService.createLocationAchievement(achievementRecord);
      
      console.log('✅ Achievement saved to collections!');
    } catch (error) {
      console.error('❌ Failed to save achievement:', error);
      // Still show celebration even if save fails
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setShowConfetti(false);
    setAnimationStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 ${
                i % 5 === 0 ? 'bg-yellow-400' :
                i % 5 === 1 ? 'bg-red-400' :
                i % 5 === 2 ? 'bg-blue-400' :
                i % 5 === 3 ? 'bg-green-400' : 'bg-purple-400'
              } rounded-full animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration Modal */}
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 ${
        animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 p-6 rounded-t-2xl text-center">
          <div className={`text-6xl mb-4 transform transition-all duration-500 ${
            animationStep >= 2 ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
          }`}>
            🎉
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Achievement Unlocked!
          </h2>
          <p className="text-yellow-100">
            You've reached your goal at {locationName}!
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Location Master
            </h3>
            <p className="text-gray-600">
              You've spent enough time at <strong>{locationName}</strong> to earn this achievement!
            </p>
          </div>

          {/* Achievement Stats */}
          {achievementData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Target Time</div>
                  <div className="font-semibold">{achievementData.targetHours}h</div>
                </div>
                <div>
                  <div className="text-gray-600">Time Spent</div>
                  <div className="font-semibold text-green-600">{achievementData.achievedHours}h</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => {
                handleClose();
                navigate('/collections');
              }}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
            >
              View Collections
            </button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 text-2xl animate-bounce">⭐</div>
        <div className="absolute bottom-4 left-4 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</div>
        <div className="absolute top-1/2 left-4 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute top-1/2 right-4 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>🌟</div>
      </div>
    </div>
  );
}
