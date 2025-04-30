"use client";

import { useEffect, useState } from 'react';
import { fetchCourts, reserveCourt } from '../utils/api';
import QueueStatus from './QueueStatus';
import { validateUsernames } from '../utils/validation';

// Separate ReservationModal component
const ReservationModal = ({ selectedCourt, onClose, onReserve }) => {
  const [courtType, setCourtType] = useState('half');
  const [usernames, setUsernames] = useState(['', '']);
  const [activeUsers, setActiveUsers] = useState(new Set());
  const [error, setError] = useState(null);

  // Fetch active users when modal opens
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch('/api/active-users');
        const data = await response.json();
        if (data.success) {
          // Filter out users whose games have ended (over 30 minutes)
          const currentTime = new Date();
          const activeUsersWithTime = data.activeUsers.filter(user => {
            const userStartTime = new Date(user.startTime);
            const timeDifferenceMinutes = (currentTime - userStartTime) / (1000 * 60);
            return timeDifferenceMinutes < 30;
          });
          
          // Only store the usernames of currently active users
          setActiveUsers(new Set(activeUsersWithTime.map(user => user.username)));
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };
    fetchActiveUsers();
  }, []);

  const handleUsernameChange = (index, value) => {
    setUsernames(prev => {
      const newUsernames = [...prev];
      newUsernames[index] = value;
      // Clear error when user starts typing
      setError(null);
      return newUsernames;
    });
  };

  const validateUsernames = async (usernames) => {
    try {
      const response = await fetch('/api/validate-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernames: usernames.filter(u => u.trim() !== '') })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Username validation error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      // Filter out empty usernames
      const validUsernames = usernames.filter(username => username.trim() !== '');
      const requiredPlayers = courtType === 'half' ? 2 : 4;
      
      if (validUsernames.length !== requiredPlayers) {
        setError({
          type: 'missing_players',
          message: `Please enter ${requiredPlayers} valid usernames`
        });
        return;
      }

      // Check for duplicate usernames
      if (new Set(validUsernames).size !== validUsernames.length) {
        setError({
          type: 'duplicate_players',
          message: 'Each player must be unique'
        });
        return;
      }

      // Validate usernames exist
      const validation = await validateUsernames(validUsernames);
      if (!validation.valid) {
        setError({
          type: 'invalid_users',
          message: validation.message || 'Invalid usernames provided',
          users: validation.invalidUsernames
        });
        return;
      }

      // If all validations pass, proceed with reservation
      onReserve({
        courtId: selectedCourt._id,
        usernames: validUsernames,
        type: courtType,
        option: courtType === 'half' ? 'queue' : null  // Always use 'queue' for half court
      });
    } catch (error) {
      setError({
        type: 'system',
        message: error.message || 'An error occurred while validating usernames'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Reserve {selectedCourt?.name}
        </h3>

        {/* Court Type Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Court Reservation Type
          </label>
          <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setCourtType('half');
                setUsernames(['', '']);
              }}
              className={`flex-1 py-2 px-4 rounded ${
                courtType === 'half'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Half Court (2 Players)
            </button>
            <button
              type="button"
              onClick={() => {
                setCourtType('full');
                setUsernames(['', '', '', '']);
              }}
              className={`flex-1 py-2 px-4 rounded ${
                courtType === 'full'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Full Court (4 Players)
            </button>
          </div>
        </div>

        {/* Player Inputs */}
        <div className="space-y-3 mb-6">
          {usernames.map((username, index) => (
            <div key={index}>
              <label className="block text-sm text-gray-600 mb-1">
                Player {index + 1} Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(index, e.target.value)}
                placeholder="Enter username"
                className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${
                  activeUsers.has(username) ? 'border-red-300' : ''
                }`}
              />
              {activeUsers.has(username) && (
                <p className="text-xs text-red-500 mt-1">
                  This user is currently in an active game
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Unable to Reserve Court</p>
            {error.type === 'active_users' && (
              <>
                <p className="text-sm text-red-500">
                  The following users are currently in active games:
                </p>
                <ul className="mt-1 list-disc list-inside text-sm text-red-500">
                  {error.users.map((user, index) => (
                    <li key={index}>{user}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-red-500">
                  Please wait until their current game ends or enter different usernames.
                </p>
              </>
            )}
            {error.type === 'invalid_users' && (
              <>
                <p className="text-sm text-red-500">
                  The following usernames are not registered:
                </p>
                <ul className="mt-1 list-disc list-inside text-sm text-red-500">
                  {error.users.map((user, index) => (
                    <li key={index}>{user}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-red-500">
                  Please make sure all players are registered users.
                </p>
              </>
            )}
            {error.type === 'missing_players' && (
              <p className="text-sm text-red-500">{error.message}</p>
            )}
            {error.type === 'system' && (
              <p className="text-sm text-red-500">{error.message}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this new component for the merge modal
const MergeModal = ({ court, onClose, onMerge }) => {
  const [usernames, setUsernames] = useState(['', '']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (index, value) => {
    setUsernames(prev => {
      const newUsernames = [...prev];
      newUsernames[index] = value;
      setError(null);
      return newUsernames;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter out empty usernames
      const validUsernames = usernames.filter(username => username.trim() !== '');
      
      if (validUsernames.length !== 2) {
        setError({
          type: 'missing_players',
          message: 'Please enter 2 valid usernames'
        });
        return;
      }

      // Check for duplicate usernames with existing players
      const existingPlayers = court.currentReservation?.userIds || [];
      const allPlayers = [...existingPlayers, ...validUsernames];
      if (new Set(allPlayers).size !== allPlayers.length) {
        setError({
          type: 'duplicate_players',
          message: 'New players must be different from existing players and each other'
        });
        return;
      }

      // Validate usernames exist
      const validation = await validateUsernames(validUsernames);
      if (!validation.valid) {
        setError({
          type: 'invalid_users',
          message: validation.message,
          users: validation.invalidUsernames
        });
        return;
      }

      // If all validations pass, proceed with merge
      await onMerge({
        courtId: court._id,
        usernames: validUsernames
      });
      
      onClose();
    } catch (error) {
      setError({
        type: 'system',
        message: error.message || 'An error occurred while validating usernames'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Merge into {court?.name}
        </h3>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>Current players: {court.currentReservation?.userIds.join(', ')}</p>
        </div>

        <div className="space-y-3 mb-6">
          {usernames.map((username, index) => (
            <div key={index}>
              <label className="block text-sm text-gray-600 mb-1">
                New Player {index + 1} Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(index, e.target.value)}
                placeholder="Enter username"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{error.message}</p>
            {error.users && (
              <ul className="mt-1 list-disc list-inside text-sm text-red-500">
                {error.users.map((user, index) => (
                  <li key={index}>{user}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 ${
              loading 
                ? 'bg-gray-400' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white rounded`}
            disabled={loading}
          >
            {loading ? 'Merging...' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main CourtList component
export default function CourtList() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedMergeCourt, setSelectedMergeCourt] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Add ref to track if any modal is open
  const isModalOpen = showReservationModal || showMergeModal;

  useEffect(() => {
    loadCourts();
    
    // Only set up auto-refresh if no modal is open
    let interval;
    if (!isModalOpen) {
      interval = setInterval(loadCourts, 60000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isModalOpen, lastUpdate]); // Add lastUpdate as dependency

  const loadCourts = async (forceLoad = false) => {
    // Only skip refresh if a modal is open and this is not a forced load
    if (isModalOpen && !forceLoad) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetchCourts();
      
      if (response && response.courts) {
        setCourts(response.courts);
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error loading courts:', error);
      setError(error.message || 'Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = (court) => {
    setSelectedCourt(court);
    setShowReservationModal(true);
  };

  const handleReservation = async (reservationData) => {
    try {
      const { courtId, usernames, type, option } = reservationData;
      
      // Make the API call
      const response = await reserveCourt({
        courtId,
        userIds: usernames,
        type: type.toLowerCase(),
        option
      });

      if (response.success) {
        // Close the modal first
        setShowReservationModal(false);
        
        // Force a refresh of the courts data
        await loadCourts(true);
      } else {
        throw new Error(response.error || 'Failed to reserve court');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Failed to reserve court: ' + (error.error || error.message || 'Unknown error'));
    }
  };

  const handleMergeClick = (court) => {
    setSelectedMergeCourt(court);
    setShowMergeModal(true);
  };

  const handleMerge = async ({ courtId, usernames }) => {
    try {
      const response = await fetch('/api/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId,
          userIds: usernames,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Get the updated court data from the response
        const updatedCourt = data.court;
        
        // Update the courts state with the new data
        setCourts(prevCourts => 
          prevCourts.map(court => 
            court._id === courtId ? updatedCourt : court
          )
        );
        
        setShowMergeModal(false);
      } else {
        throw new Error(data.error || 'Failed to merge into court');
      }
    } catch (error) {
      console.error('Merge error:', error);
      alert('Failed to merge: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading courts...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>Error: {error}</p>
        <button onClick={loadCourts} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Courts Grid */}
        <div className="lg:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 20 }, (_, index) => {
              const courtNumber = index + 1;
              const courtName = `Court ${courtNumber}`;
              const court = courts.find(c => c.name === courtName);

              // Skip rendering if no court data exists or if court is not visible
              if (!court || !court.isVisible) {
                return null;
              }

              return (
                <div 
                  key={court._id} 
                  className="border p-4 rounded-lg shadow-sm bg-white"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{court.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      court.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {court.isAvailable ? 'Available' : 'In Use'}
                    </span>
                  </div>
                  
                  {!court.isAvailable && court.currentReservation && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Started: {new Date(court.currentReservation?.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                      <p>Players: {court.currentReservation?.userIds?.join(', ') || 'No players info'}</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleReserveClick(court)}
                    disabled={!court.isAvailable}
                    className={`mt-3 w-full py-2 px-4 rounded ${
                      court.isAvailable
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {court.isAvailable ? 'Reserve Court' : 'In Use'}
                  </button>

                  {!court.isAvailable && court.currentReservation?.type === 'half' && (
                    <button
                      onClick={() => handleMergeClick(court)}
                      className="mt-2 w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                    >
                      Merge Into Full Court
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - QueueStatus */}
        <div className="lg:w-1/3">
          <QueueStatus />
        </div>
      </div>

      {showReservationModal && (
        <ReservationModal
          selectedCourt={selectedCourt}
          onClose={() => setShowReservationModal(false)}
          onReserve={handleReservation}
        />
      )}

      {showMergeModal && (
        <MergeModal
          court={selectedMergeCourt}
          onClose={() => setShowMergeModal(false)}
          onMerge={handleMerge}
        />
      )}
    </div>
  );
}
