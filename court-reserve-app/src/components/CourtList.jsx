"use client";

import { useEffect, useState } from 'react';
import { fetchCourtsVisible, reserveCourt } from '../utils/api';
import QueueStatus from './QueueStatus';
import { validateUsernames } from '../utils/validation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://queuesystem-be.onrender.com';

// Separate ReservationModal component
const ReservationModal = ({ selectedCourt, onClose, onReserve }) => {
  const [courtType, setCourtType] = useState('half');
  const [usernames, setUsernames] = useState(['', '']);
  const [activeUsers, setActiveUsers] = useState(new Set());
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null);

  // Fetch active users when modal opens
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/active-users`, {
          headers: {
            'x-admin-password': 'canamadmin'
          }
        });
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
      setError(null);
      return newUsernames;
    });
  };

  const handleSubmit = async () => {
    try {
      // Filter out empty usernames
      let validUsernames = usernames.filter(username => username.trim() !== '');
      // Format: first letter uppercase, rest lowercase
      validUsernames = validUsernames.map(u => u.charAt(0).toUpperCase() + u.slice(1).toLowerCase());
      const requiredPlayers = courtType === 'half' ? 2 : 4;
      if (validUsernames.length !== requiredPlayers) {
        setError({
          type: 'missing_players',
          message: `Please enter ${requiredPlayers} valid usernames`
        });
        return;
      }
      // No frontend validation, just call backend
      const res = await fetch(`${API_BASE_URL}/api/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourt._id,
          userIds: validUsernames,
          type: courtType,
          option: courtType === 'half' ? 'merge' : 'queue' // Use 'merge' for half, 'queue' for full
        })
      });
      const data = await res.json();
      setPopup({
        success: data.success,
        message: data.success ? 'Court reserved successfully!' : (data.error || 'Reservation failed'),
        raw: data
      });
      if (data.success) {
        onClose();
      }
    } catch (error) {
      setPopup({ success: false, message: error.message || 'Reservation failed' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            Reserve {selectedCourt?.name}
          </h3>

          {/* Court Type Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Court Reservation Type
            </label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setCourtType('half');
                  setUsernames(['', '']);
                }}
                className={`flex-1 py-2 px-2 sm:px-4 rounded text-sm ${
                  courtType === 'half'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                Half Court (2)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCourtType('full');
                  setUsernames(['', '', '', '']);
                }}
                className={`flex-1 py-2 px-2 sm:px-4 rounded text-sm ${
                  courtType === 'full'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                Full Court (4)
              </button>
            </div>
          </div>

          {/* Player Inputs */}
          <div className="space-y-3 mb-4">
            {usernames.map((username, index) => (
              <div key={index}>
                <label className="block text-sm text-gray-600 mb-1">
                  Player {index + 1}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(index, e.target.value)}
                  placeholder="Enter username"
                  className={`w-full p-2 border rounded text-sm focus:ring-blue-500 focus:border-blue-500 ${
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
              <p className="text-sm text-red-600 font-medium">{error.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-2 px-4 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reserve
            </button>
          </div>
        </div>
      </div>
      {/* Popup for backend response */}
      {popup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h4 className={`text-lg font-semibold mb-2 ${popup.success ? 'text-green-600' : 'text-red-600'}`}>{popup.success ? 'Success' : 'Error'}</h4>
            <div className="mb-2">{popup.message}</div>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-40">{JSON.stringify(popup.raw, null, 2)}</pre>
            <button
              onClick={() => setPopup(null)}
              className="mt-4 w-full py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
      let validUsernames = usernames.filter(username => username.trim() !== '');
      // Format: first letter uppercase, rest lowercase
      validUsernames = validUsernames.map(u => u.charAt(0).toUpperCase() + u.slice(1).toLowerCase());
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            Merge into {court?.name}
          </h3>
          
          <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>Current players: {court.currentReservation?.userIds.join(', ')}</p>
          </div>

          <div className="space-y-3 mb-4">
            {usernames.map((username, index) => (
              <div key={index}>
                <label className="block text-sm text-gray-600 mb-1">
                  New Player {index + 1}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(index, e.target.value)}
                  placeholder="Enter username"
                  className="w-full p-2 border rounded text-sm focus:ring-blue-500 focus:border-blue-500"
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

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`flex-1 py-2 px-4 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={loading}
            >
              {loading ? 'Merging...' : 'Merge'}
            </button>
          </div>
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
  const [joinModal, setJoinModal] = useState({ open: false, court: null });
  const [dropModal, setDropModal] = useState({ open: false, court: null });
  const [joinUsernames, setJoinUsernames] = useState(['', '']);
  const [joinType, setJoinType] = useState('half');
  const [modalResult, setModalResult] = useState(null);
  const [dropUsernames, setDropUsernames] = useState(['', '']);
  const [dropPhones, setDropPhones] = useState(['', '']);

  // Add ref to track if any modal is open
  const isModalOpen = showReservationModal || showMergeModal || joinModal.open || dropModal.open;

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
      const response = await fetchCourtsVisible();
      console.log('Courts response:', response);
      
      if (response && response.success && response.courts) {
        console.log('Setting courts:', response.courts);
        setCourts(response.courts);
        setError(null);
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
      const response = await fetch(`${API_BASE_URL}/api/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'canamadmin'
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

  const handleJoinWaitlist = async () => {
    if (!joinModal.court) return;

    try {
      const formattedUsernames = joinUsernames.filter(u => u.trim()).map(u => u.charAt(0).toUpperCase() + u.slice(1).toLowerCase());
      const requiredPlayers = joinType === 'half' ? 2 : 4;
      if (formattedUsernames.length !== requiredPlayers) {
        setModalResult({ success: false, message: `Please enter ${requiredPlayers} valid usernames.` });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: joinModal.court._id,
          userIds: formattedUsernames,
          type: joinType,
          option: joinType === 'half' ? 'merge' : 'queue'
        })
      });
      const data = await response.json();
      setModalResult({ success: data.success, message: data.success ? 'Joined waitlist!' : (data.error || 'Failed to join waitlist.'), raw: data });
      if (data.success) {
        setJoinModal({ open: false, court: null });
        loadCourts(true);
      }
    } catch (error) {
      setModalResult({ success: false, message: error.message || 'Failed to join waitlist.' });
    }
  };

  const handleDropWaitlist = async () => {
    if (!dropModal.court) return;

    try {
      const formattedDrops = dropUsernames.map((username, index) => ({
        animalName: username.trim() ? username.charAt(0).toUpperCase() + username.slice(1).toLowerCase() : '',
        phoneNumber: dropPhones[index].replace(/\D/g, '')
      })).filter(drop => drop.animalName || drop.phoneNumber);

      if (formattedDrops.length !== 2 || formattedDrops.some(drop => !drop.animalName || drop.phoneNumber.length !== 5)) {
        setModalResult({ success: false, message: 'Please enter two sets of valid username and 5-digit phone number.' });
        return;
      }

      const dropData = {
        animalName1: formattedDrops[0].animalName,
        phoneNumber1: formattedDrops[0].phoneNumber,
        animalName2: formattedDrops[1].animalName,
        phoneNumber2: formattedDrops[1].phoneNumber,
      };

      const response = await fetch(`${API_BASE_URL}/api/waitlist/${dropModal.court._id}/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dropData)
      });
      const data = await response.json();
      setModalResult({ success: data.success, message: data.success ? 'Dropped from waitlist!' : (data.error || 'Failed to drop from waitlist.'), raw: data });
      if (data.success) {
        loadCourts(true);
        setDropModal({ open: false, court: null });
      }
    } catch (error) {
      setModalResult({ success: false, message: error.message || 'Failed to drop from waitlist.' });
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
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left side - Queue Status */}
        <div className="w-full lg:w-1/3">
          <QueueStatus courts={courts} />
        </div>

        {/* Right side - Courts Grid */}
        <div className="w-full lg:w-2/3">
          {/* Grid container with responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 p-4 bg-white rounded-lg shadow-sm">
                No courts available
              </div>
            ) : (
              courts
                .sort((a, b) => {
                  const numA = parseInt(a.name.replace('Court ', ''));
                  const numB = parseInt(b.name.replace('Court ', ''));
                  return numA - numB;
                })
                .map((court) => (
                  <div 
                    key={court._id} 
                    className="border p-3 rounded-lg shadow-sm bg-white flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base sm:text-lg font-medium">{court.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        court.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {court.isAvailable ? 'Available' : 'In Use'}
                      </span>
                    </div>
                    
                    {!court.isAvailable && court.currentReservation && (
                      <div className="mt-1 text-sm text-gray-500 flex-grow">
                        <p className="mb-1">Started: {new Date(court.currentReservation?.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <p className="break-words">Players: {court.currentReservation?.userIds?.join(', ') || 'No players info'}</p>
                      </div>
                    )}

                    {/* Display waitlist entries if a waitlist exists */}
                    {court.waitlist && court.waitlist.length > 0 && (
                      <div className="mt-2 text-sm text-gray-700">
                        <p className="font-medium">Waitlist:</p>
                        <ul className="list-disc list-inside">
                          {court.waitlist.map((entry, idx) => (
                            <li key={idx} className="mb-1 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-gray-800">#{entry.waitlistIndex}:</span>
                                <span className="ml-1 text-gray-700 break-words">{entry.userIds?.join(', ') || ''}</span>
                              </div>
                              {entry.startTime && (
                                <span className="text-gray-500 text-xs ml-2 shrink-0">
                                  startTime: {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {entry.isReady && <span className="ml-2 text-green-600 font-semibold">(Ready)</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleReserveClick(court)}
                          disabled={!court.isAvailable}
                          className={`flex-1 min-w-[120px] px-3 py-2 text-sm rounded-md ${
                            court.isAvailable
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Reserve
                        </button>
                        {!court.isAvailable && (
                          <button
                            onClick={() => {
                              setJoinType('half');
                              setJoinUsernames(['', '']);
                              setJoinModal({ open: true, court });
                              setModalResult(null);
                            }}
                            className="flex-1 min-w-[120px] px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Join Waitlist
                          </button>
                        )}
                        {court.waitlistCount > 0 && (
                          <button
                            onClick={() => {
                              setDropUsernames(['', '']);
                              setDropPhones(['', '']);
                              setDropModal({ open: true, court });
                              setModalResult(null);
                            }}
                            className="flex-1 min-w-[120px] px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Drop
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Join Waitlist Modal */}
      {joinModal.open && joinModal.court && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              className="absolute top-3 right-5 text-gray-400 hover:text-gray-700 text-5xl font-bold focus:outline-none"
              onClick={() => setJoinModal({ open: false, court: null })}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">Join Waitlist for {joinModal.court?.name}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Court Reservation Type</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`flex-1 py-2 px-2 rounded text-sm ${joinType === 'half' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => {
                    setJoinType('half');
                    setJoinUsernames(['', '']);
                  }}
                >
                  Half Court (2)
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-2 rounded text-sm ${joinType === 'full' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => {
                    setJoinType('full');
                    setJoinUsernames(['', '', '', '']);
                  }}
                >
                  Full Court (4)
                </button>
              </div>
              {joinUsernames.map((username, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={username}
                  onChange={e => setJoinUsernames(prev => prev.map((u, i) => i === idx ? e.target.value : u))}
                  placeholder={`Player ${idx + 1} username`}
                  className="w-full p-2 border rounded mb-2"
                />
              ))}
            </div>
            {modalResult && (
              <div className={`mb-2 text-sm ${modalResult.success ? 'text-green-600' : 'text-red-600'}`}>{modalResult.message}</div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                onClick={() => setJoinModal({ open: false, court: null })}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                onClick={handleJoinWaitlist}
              >
                Join
              </button>
            </div>
            {modalResult && modalResult.raw && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-2 max-h-32">{JSON.stringify(modalResult.raw, null, 2)}</pre>
            )}
          </div>
        </div>
      )}

      {/* Drop from Waitlist Modal */}
      {dropModal.open && dropModal.court && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Drop from Waitlist for {dropModal.court?.name}</h3>
            <div className="space-y-4 mb-4">
              {[0, 1].map(index => (
                <div key={index} className="border p-3 rounded">
                  <label className="block text-sm font-medium mb-1 text-gray-700">User {index + 1}</label>
                  <input
                    type="text"
                    value={dropUsernames[index]}
                    onChange={e => setDropUsernames(prev => prev.map((name, i) => i === index ? e.target.value : name))}
                    placeholder="Username"
                    className="w-full p-2 border rounded mb-2 text-sm"
                  />
                  <input
                    type="text"
                    value={dropPhones[index]}
                    onChange={e => { if (/^\d{0,5}$/.test(e.target.value)) setDropPhones(prev => prev.map((phone, i) => i === index ? e.target.value : phone)); }}
                    placeholder="Last 5 digits of phone number"
                    maxLength={5}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              ))}
            </div>
            {modalResult && (
              <div className={`mb-2 text-sm ${modalResult.success ? 'text-green-600' : 'text-red-600'}`}>{modalResult.message}</div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                onClick={() => { setDropModal({ open: false, court: null }); setDropPhones(['', '']); }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                onClick={handleDropWaitlist}
              >
                Drop
              </button>
            </div>
            {modalResult && modalResult.raw && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-2 max-h-32">{JSON.stringify(modalResult.raw, null, 2)}</pre>
            )}
          </div>
        </div>
      )}

      {/* Existing modals */}
      {showReservationModal && selectedCourt && (
        <ReservationModal
          selectedCourt={selectedCourt}
          onClose={() => {
            setShowReservationModal(false);
            setSelectedCourt(null);
          }}
          onReserve={handleReservation}
        />
      )}

      {showMergeModal && selectedMergeCourt && (
        <MergeModal
          court={selectedMergeCourt}
          onClose={() => {
            setShowMergeModal(false);
            setSelectedMergeCourt(null);
          }}
          onMerge={handleMerge}
        />
      )}
    </div>
  );
}
