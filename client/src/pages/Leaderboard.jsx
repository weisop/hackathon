import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([
    { id: 1, name: 'Alice', score: 1520 },
    { id: 2, name: 'Bob', score: 1290 },
    { id: 3, name: user?.name || 'You', score: 980 },
  ]);

  // Optional: replace with real API call
  useEffect(() => {
    // Example fetch:
    // setLoading(true);
    // fetch('/api/leaderboard').then(r => r.json()).then(data => { setLeaderboard(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/bg.jpg')"
      }}
    >
      <header className="bg-[#f2ede1] shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-[#37006b] shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-[#f2ede1]mb-6">Top Players</h2>

              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : (
                <ol className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                          <div className="text-xs text-gray-500">Player ID: {entry.id}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{entry.score} pts</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;