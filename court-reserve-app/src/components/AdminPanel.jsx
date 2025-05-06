"use client";

import { useState, useEffect } from 'react';
import { fetchCourts, resetCourt } from '../utils/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://canam-server.onrender.com';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [courts, setCourts] = useState([]);
  const [users, setUsers] = useState({ active: [], idle: [] });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadCourts();
      loadUsers();
      // Changed to 60 seconds
      const interval = setInterval(() => {
        loadCourts();
        loadUsers();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadCourts = async () => {
    try {
      const response = await fetchCourts();
      if (response && response.success && response.courts) {
        // Process courts to check for expired games
        const processedCourts = response.courts.map(court => {
          if (court.currentReservation) {
            const startTime = new Date(court.currentReservation.startTime);
            const currentTime = new Date();
            const timeDifferenceMinutes = (currentTime - startTime) / (1000 * 60);
            
            // If 30 minutes have passed, mark the court as available
            if (timeDifferenceMinutes >= 30) {
              return {
                ...court,
                isAvailable: true,
                currentReservation: null
              };
            }
          }
          return court;
        });
        setCourts(processedCourts);
      }
    } catch (error) {
      setError('Failed to load courts');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'x-admin-password': 'canamadmin'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers({
          active: data.activeUsers || [],
          idle: data.idleUsers || []
        });
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'canamadmin') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid password');
    }
    setPassword('');
  };

  const handleResetCourt = async (courtId) => {
    try {
      const response = await resetCourt(courtId);
      
      if (response.success) {
        setSuccessMessage('Court reset successfully');
        loadCourts();
        loadUsers();
      } else {
        setError(response.error || 'Failed to reset court');
      }
    } catch (error) {
      setError('Error resetting court: ' + error.message);
    }

    // Clear messages after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 3000);
  };

  const handleToggleVisibility = async (courtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/toggle-court-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'canamadmin'
        },
        body: JSON.stringify({ courtId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Court visibility updated successfully');
        loadCourts();
      } else {
        setError(data.error || 'Failed to update court visibility');
      }
    } catch (error) {
      setError('Error toggling court visibility: ' + error.message);
    }

    // Clear messages after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 3000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter admin password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* User Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Users */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Users In Game ({users.active.length})
          </h3>
          <div className="space-y-2">
            {users.active.map((user, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-2 bg-blue-50 rounded"
              >
                <div>
                  <p className="font-medium text-blue-800">{user.username}</p>
                  <p className="text-sm text-blue-600">Court {user.courtNumber}</p>
                </div>
                <span className="text-sm text-blue-600">
                  {new Date(user.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
            {users.active.length === 0 && (
              <p className="text-gray-500 text-center">No users currently in game</p>
            )}
          </div>
        </div>

        {/* Idle Users */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Registered Users ({users.idle.length})
          </h3>
          <div className="space-y-2">
            {users.idle.map((user, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-800">{user.animalName}</p>
                  <p className="text-sm text-gray-600">{user.phoneNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600">
                    Registered: {formatTime(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {users.idle.length === 0 && (
              <p className="text-gray-500 text-center">No registered users</p>
            )}
          </div>
        </div>
      </div>

      {/* Courts List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Courts Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div
              key={court._id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium">{court.name}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    court.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {court.isAvailable ? 'Available' : 'In Use'}
                  </span>
                  <button
                    onClick={() => handleToggleVisibility(court._id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      court.isVisible
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {court.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              {!court.isAvailable && court.currentReservation && (
                <div className="text-sm text-gray-500 mb-3">
                  <p>Started: {new Date(court.currentReservation.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p>Players: {court.currentReservation.userIds.join(', ')}</p>
                </div>
              )}

              {!court.isAvailable && (
                <button
                  onClick={() => handleResetCourt(court._id)}
                  className="w-full mt-2 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                  Reset Court
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 