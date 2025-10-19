import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignIn, SignUp } from './components/Auth';
import LoadingScreen from './components/LoadingScreen';

function AppContent() {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return showSignUp ? (
      <SignUp onSuccess={() => setShowSignUp(false)} onSwitchToSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignIn onSuccess={() => {}} onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DFC9]">
      {/* Navigation */}
      <nav className="bg-[#E8DFC9] shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                 <img
                    src="/logo.png"
                    alt="ConQuest Logo"
                    className="h-20 w-20 rounded-md shadow-sm"
                  />
                <h1 className="text-xl font-bold text-gray-900">ConQuest</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  to="/leaderboard"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Leaderboard
                </Link>
                <Link
                  to="/profile"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {/* Sign out button moved to profile page only */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App
