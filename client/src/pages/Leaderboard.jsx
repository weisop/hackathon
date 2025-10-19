import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // 'all', 'week', 'month'
  const [category, setCategory] = useState('total'); // 'total', 'locations', 'time'

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe, category]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since we don't have a real leaderboard API
      const mockData = generateMockLeaderboardData();
      setLeaderboardData(mockData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLeaderboardData = () => {
    const names = [
      'Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Wilson', 'David Kim',
      'Lisa Zhang', 'Chris Brown', 'Maria Garcia', 'James Lee', 'Anna Taylor',
      'Tom Anderson', 'Sophie White', 'Ryan Davis', 'Zoe Martinez', 'Jake Miller'
    ];

    return names.map((name, index) => ({
      id: index + 1,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      totalPoints: Math.floor(Math.random() * 1000) + 500,
      locationsVisited: Math.floor(Math.random() * 20) + 5,
      totalTime: Math.floor(Math.random() * 200) + 50,
      level: Math.floor(Math.random() * 10) + 1,
      isCurrentUser: name === (user?.name || user?.firstName || 'Current User')
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTimeframeText = () => {
    switch (timeframe) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const getCategoryText = () => {
    switch (category) {
      case 'locations': return 'Most Locations';
      case 'time': return 'Most Time Spent';
      default: return 'Total Points';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e9e1cc] p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e9e1cc] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
              <p className="text-gray-600">See how you rank against other campus explorers!</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Welcome, {user?.firstName || user?.name || 'Explorer'}!</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Timeframe:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="total">Total Points</option>
                <option value="locations">Most Locations</option>
                <option value="time">Most Time Spent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500">
            <h2 className="text-xl font-bold text-white">
              {getTimeframeText()} - {getCategoryText()}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {leaderboardData.map((player, index) => (
              <div
                key={player.id}
                className={`px-6 py-4 flex items-center justify-between ${
                  player.isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <span className="text-lg font-bold">
                      {getRankIcon(index + 1)}
                    </span>
                  </div>
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{player.name}</h3>
                      {player.isCurrentUser && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Level {player.level}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{player.totalPoints}</div>
                    <div className="text-xs text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{player.locationsVisited}</div>
                    <div className="text-xs text-gray-500">Locations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{player.totalTime}h</div>
                    <div className="text-xs text-gray-500">Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top Performer</h3>
                <p className="text-sm text-gray-500">{leaderboardData[0]?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Total Players</h3>
                <p className="text-sm text-gray-500">{leaderboardData.length} explorers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Your Rank</h3>
                <p className="text-sm text-gray-500">
                  #{leaderboardData.findIndex(p => p.isCurrentUser) + 1 || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
