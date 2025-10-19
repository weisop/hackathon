import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Settings = () => {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [imagePreview, setImagePreview] = useState(user?.photoURL || null);
  const fileInputRef = useRef(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const initials = (user?.firstName || user?.name || 'User')
    .split(' ')
    .map((n) => n[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // TODO: send `file` or `reader.result` to backend or an auth/profile update function
    // e.g. await updateProfile({ photo: file })
  };

  const handleResetAllStudyData = async () => {
    if (!window.confirm('Are you sure you want to reset all your study times and levels? This action cannot be undone.')) {
      return;
    }

    try {
      setIsResetting(true);
      setResetMessage('');
      
      const result = await apiService.resetAllUserLevels();
      setResetMessage(`✅ ${result.message} (${result.resetCount} locations reset)`);
      
      // Clear message after 5 seconds
      setTimeout(() => setResetMessage(''), 5000);
    } catch (error) {
      console.error('Error resetting study data:', error);
      setResetMessage('❌ Failed to reset study data. Please try again.');
      setTimeout(() => setResetMessage(''), 5000);
    } finally {
      setIsResetting(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
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
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Profile Section */}
          <div className="bg-[#37006b] shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-[#f2ede1] mb-6">Profile</h2>
              
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold border">
                      {initials}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 w-full text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
                  >
                    Change Photo
                  </button>
                </div>

                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900">{user?.firstName || user?.name || 'User'}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>

                  <p className="mt-4 text-sm text-gray-600">
                    Upload a profile image to personalize your account. This preview is local — add a
                    backend upload or profile update call to persist the image.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 flex space-x-3">
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Save Profile
                </button>
                <button
                  onClick={() => {
                    setImagePreview(user?.photoURL || null);
                  }}
                  className="bg-white border border-gray-300 px-4 py-2 rounded-md text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Study Data Management Section */}
          <div className="bg-[#37006b] shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-[#f2ede1] mb-6">Study Data Management</h2>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Reset All Study Data</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This will reset all your study times and levels for all locations back to zero. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[#f2ede1]">Study Times & Levels</h3>
                    <p className="text-sm text-gray-300">
                      Reset all location study times and levels to start fresh
                    </p>
                  </div>
                  <button
                    onClick={handleResetAllStudyData}
                    disabled={isResetting}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isResetting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isResetting ? '🔄 Resetting...' : '🗑️ Reset All Data'}
                  </button>
                </div>

                {resetMessage && (
                  <div className={`p-3 rounded-md text-sm ${
                    resetMessage.includes('✅') 
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {resetMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-[#37006b] shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-[#f2ede1] mb-6">Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[#f2ede1]">Email Notifications</h3>
                    <p className="text-sm text-gray-300">Receive email updates about your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-[#f2ede1]">
                    Theme
                  </label>
                  <select
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;