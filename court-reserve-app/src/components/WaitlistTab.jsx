"use client";

import { useState, useEffect } from 'react';
import { fetchCourtsAdmin, joinWaitlist, dropWaitlist } from '../utils/api';

export default function WaitlistTab() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for Join Waitlist Modal
  const [joinModal, setJoinModal] = useState({
    open: false,
    court: null,
    usernames: ['', '', '', ''],
  });
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);

  // State for Drop from Waitlist Modal
  const [dropModal, setDropModal] = useState({
    open: false,
    court: null,
    animalName: '',
    phoneNumber: '',
  });
  const [dropLoading, setDropLoading] = useState(false);
  const [dropError, setDropError] = useState(null);
  const [dropSuccess, setDropSuccess] = useState(null);

  const loadCourts = async () => {
    try {
      setLoading(true);
      // Use fetchCourtsAdmin to get all court info for Waitlist tab
      const data = await fetchCourtsAdmin();
      if (data.success) {
        setCourts(data.courts || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load courts');
        setCourts([]);
      }
    } catch (error) {
      setError('Error loading courts: ' + error.message);
      setCourts([]);
      console.error('Error loading courts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
    // Auto-refresh court data every 60 seconds
    const interval = setInterval(loadCourts, 60000);
    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

  const handleOpenJoinModal = (court) => {
    setJoinModal({
      open: true,
      court: court,
      usernames: ['', '', '', ''], // Reset usernames
    });
    setJoinError(null);
    setJoinSuccess(null);
  };

  const handleCloseJoinModal = () => {
    setJoinModal({ ...joinModal, open: false });
  };

  const handleUsernameChange = (index, value) => {
    const newUsernames = [...joinModal.usernames];
    newUsernames[index] = value;
    setJoinModal({ ...joinModal, usernames: newUsernames });
  };

  const handleJoinWaitlist = async () => {
    if (!joinModal.court) return;

    const validUsernames = joinModal.usernames.filter(name => name.trim() !== '');

    if (validUsernames.length === 0) {
      setJoinError('Please enter at least one username.');
      return;
    }

    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      const result = await joinWaitlist(joinModal.court._id, validUsernames);
      if (result.success) {
        setJoinSuccess('Successfully joined waitlist!');
        loadCourts(); // Refresh court data
        handleCloseJoinModal(); // Close modal on success
      } else {
        setJoinError(result.error || 'Failed to join waitlist.');
      }
    } catch (error) {
      setJoinError('Error joining waitlist: ' + error.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleOpenDropModal = (court) => {
    setDropModal({
      open: true,
      court: court,
      animalName: '',
      phoneNumber: '',
    });
    setDropError(null);
    setDropSuccess(null);
  };

  const handleCloseDropModal = () => {
    setDropModal({ ...dropModal, open: false });
  };

  const handleDropWaitlist = async () => {
    if (!dropModal.court) return;

    if (!dropModal.animalName || !dropModal.phoneNumber) {
      setDropError('Please enter both Animal Name and Phone Number.');
      return;
    }

    setDropLoading(true);
    setDropError(null);
    setDropSuccess(null);

    try {
      const result = await dropWaitlist(dropModal.court._id, dropModal.animalName, dropModal.phoneNumber);
      if (result.success) {
        setDropSuccess('Successfully dropped from waitlist!');
        loadCourts(); // Refresh court data
        handleCloseDropModal(); // Close modal on success
      } else {
        setDropError(result.error || 'Failed to drop from waitlist.');
      }
    } catch (error) {
      setDropError('Error dropping from waitlist: ' + error.message);
    } finally {
      setDropLoading(false);
    }
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Court Waitlists</h2>

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

      {loading ? (
        <div className="text-center">Loading waitlist data...</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Courts Display - now full width */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courts
              .sort((a, b) => {
                // Sort courts by number
                const numA = parseInt(a.name.replace('Court ', ''));
                const numB = parseInt(b.name.replace('Court ', ''));
                return numA - numB;
              })
              .map((court) => (
                <div key={court._id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="text-lg font-medium mb-2">{court.name}</h3>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      court.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {court.isAvailable ? 'Available' : 'In Use'}
                    </span>
                    <span className="text-sm text-gray-600">
                       {court.waitlistCount !== undefined ? `${court.waitlistCount} on waitlist` : 'N/A'}
                    </span>
                  </div>

                  {/* Display waitlist entries if a waitlist exists */}
                  {court.waitlist && court.waitlist.length > 0 && (
                     <div className="text-sm text-gray-700 mb-3">
                       <p>Waitlist:</p>
                       <ul className="list-disc list-inside">
                         {court.waitlist.map((entry, index) => (
                           <li key={index}>
                             {entry.userIds ? entry.userIds.join(', ') : 'N/A'} (Added: {entry.startTime ? new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'})
                            </li>
                         ))}
                       </ul>
                     </div>
                  )}

                  {/* Removed Current Reservation display */}
                  


                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleOpenJoinModal(court)}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!court.isAvailable || court.waitlistCount >= 4} // Disable if not available or waitlist full
                    >
                      Join Waitlist
                    </button>
                     {/* Only show Drop button if there's a waitlist */}
                    {court.waitlistCount > 0 && (
                       <button
                        onClick={() => handleOpenDropModal(court)}
                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!court.isAvailable} // Disable if court is in use (can't drop from active game)
                      >
                        Drop
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Operations section was here and is now removed */}

        </div>
      )}

      {/* Join Waitlist Modal */}
      {joinModal.open && joinModal.court && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="join-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Join Waitlist for {joinModal.court.name}</h3>
              <button onClick={handleCloseJoinModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="mt-4 space-y-4">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  type="text"
                  value={joinModal.usernames[index]}
                  onChange={(e) => handleUsernameChange(index, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={`Username ${index + 1}`}
                />
              ))}
            </div>
            {joinError && <p className="text-sm text-red-600 mt-2">{joinError}</p>}
            {joinSuccess && <p className="text-sm text-green-600 mt-2">{joinSuccess}</p>}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleJoinWaitlist}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={joinLoading}
              >
                {joinLoading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Drop from Waitlist Modal */}
      {dropModal.open && dropModal.court && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="drop-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Drop from Waitlist for {dropModal.court.name}</h3>
               <button onClick={handleCloseDropModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="mt-4 space-y-4">
               <div>
                <label htmlFor="animalName" className="block text-sm font-medium text-gray-700">Animal Name</label>
                <input
                  type="text"
                   id="animalName"
                   value={dropModal.animalName}
                   onChange={(e) => setDropModal({...dropModal, animalName: e.target.value})}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                   placeholder="Enter your animal name"
                 />
               </div>
               <div>
                 <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                 <input
                   type="text"
                    id="phoneNumber"
                    value={dropModal.phoneNumber}
                    onChange={(e) => setDropModal({...dropModal, phoneNumber: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your phone number suffix"
                  />
                </div>
            </div>
            {dropError && <p className="text-sm text-red-600 mt-2">{dropError}</p>}
            {dropSuccess && <p className="text-sm text-green-600 mt-2">{dropSuccess}</p>}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDropWaitlist}
                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={dropLoading}
              >
                {dropLoading ? 'Dropping...' : 'Drop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}