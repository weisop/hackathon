import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getFriends();
      setFriends(response);
    } catch (error) {
      // console.error('Error loading friends:', error);
      // setError('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await apiService.getFriendRequests();
      setFriendRequests(response);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await apiService.sendFriendRequest(newFriendEmail.trim());
      setSuccess(`Friend request sent to ${newFriendEmail}`);
      setNewFriendEmail('');
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError(error.response?.data?.error || 'Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      setIsLoading(true);
      await apiService.acceptFriendRequest(requestId);
      setSuccess('Friend request accepted');
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      setIsLoading(true);
      await apiService.rejectFriendRequest(requestId);
      setSuccess('Friend request rejected');
      loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setError('Failed to reject friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      setIsLoading(true);
      await apiService.removeFriend(friendId);
      setSuccess('Friend removed');
      loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="friends-list bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Friends</h2>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
          <button onClick={clearMessages} className="ml-2 text-green-600 hover:text-green-800">×</button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button onClick={clearMessages} className="ml-2 text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {/* Add Friend Form */}
      <div className="mb-6">
        <form onSubmit={sendFriendRequest} className="flex gap-2">
          <input
            type="email"
            value={newFriendEmail}
            onChange={(e) => setNewFriendEmail(e.target.value)}
            placeholder="Enter friend's email"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newFriendEmail.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Add Friend'}
          </button>
        </form>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Friend Requests</h3>
          <div className="space-y-2">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {request.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {request.user?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {request.user?.email}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request.id)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-400"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Your Friends (2)
        </h3>
        
        {isLoading && friends.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Loading friends...</div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500 space-y-4">
            {/* <img
              src="/nancy.png"      
              alt="Nancy"
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            /> */}
          <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm p-4 w-100% mx-auto">
            <div className="text-xl font-medium text-gray-800">Nancy 🟢</div>
          </div>
          <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm p-4 w-100% mx-auto">
            <div className="text-xl font-medium text-gray-800">Alicia 🟢</div>
          </div>
          <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm p-4 w-100% mx-auto">
            <div className="text-xl font-medium text-gray-800">Larrie </div>
            <div className="text-xs text-gray-500 mt-1">(Pending)</div>
          </div>
        </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friendship) => (
              <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {friendship.friend?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {friendship.friend?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {friendship.friend?.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      Friends since {new Date(friendship.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {/* TODO: Implement location sharing */}}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Share Location
                  </button>
                  <button
                    onClick={() => removeFriend(friendship.friend.id)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



