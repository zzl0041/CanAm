"use client";

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import CourtList from '@/components/CourtList';
import AdminPanel from '@/components/AdminPanel';
import { fetchCourtsAdmin } from '../utils/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://canam-server.onrender.com';

function WaitlistTab() {
  const [courtId, setCourtId] = useState('');
  const [usernames, setUsernames] = useState(['']);
  const [dropUsername, setDropUsername] = useState('');
  const [dropPhone, setDropPhone] = useState('');
  const [viewCourtId, setViewCourtId] = useState('');
  const [debugUsername, setDebugUsername] = useState('');
  const [result, setResult] = useState(null);
  const [allWaitlists, setAllWaitlists] = useState(null);
  const [courtWaitlist, setCourtWaitlist] = useState(null);
  const [debugResult, setDebugResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courtStatus, setCourtStatus] = useState(Array(20).fill({ loading: true }));
  const [visibleCourts, setVisibleCourts] = useState([]);
  const [waitlistData, setWaitlistData] = useState([]);
  const [courts, setCourts] = useState([]);
  const [joinModal, setJoinModal] = useState({ open: false, court: null });
  const [dropModal, setDropModal] = useState({ open: false, court: null });
  const [joinUsernames, setJoinUsernames] = useState(['', '']);
  const [joinType, setJoinType] = useState('half');
  const [modalResult, setModalResult] = useState(null);

  // State for Drop from Waitlist Modal - now with two pairs
  const [dropUsernames, setDropUsernames] = useState(['', '']);
  const [dropPhones, setDropPhones] = useState(['', '']);

  // Function to fetch courts and waitlist data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all court data including waitlists
      const response = await fetchCourtsAdmin();
      if (response && response.success && Array.isArray(response.courts)) {
        setCourts(response.courts);
      } else {
        setCourts([]);
      }
    } catch (error) {
      console.error('Error fetching courts for WaitlistTab:', error);
      setCourts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial load and set up auto-refresh
  useEffect(() => {
    let interval;
    fetchData(); // Initial fetch
    interval = setInterval(fetchData, 60000); // Set up auto-refresh
    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Join waitlist from modal
  const handleJoinModal = async () => {
    try {
      const formattedUsernames = joinUsernames.filter(u => u.trim()).map(u => u.charAt(0).toUpperCase() + u.slice(1).toLowerCase());
      const requiredPlayers = joinType === 'half' ? 2 : 4;
      if (formattedUsernames.length !== requiredPlayers) {
        setModalResult({ success: false, message: `Please enter ${requiredPlayers} valid usernames.` });
        return;
      }
      // Use the /api/reserve endpoint for joining the waitlist
      const response = await fetch(`${API_BASE_URL}/api/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: joinModal.court._id,
          userIds: formattedUsernames,
          type: joinType, // Use the selected court type (half/full)
          option: joinType === 'half' ? 'merge' : 'queue' // Use 'merge' for half, 'queue' for full
        })
      });
      const data = await response.json();
      setModalResult({ success: data.success, message: data.success ? 'Joined waitlist!' : (data.error || 'Failed to join waitlist.'), raw: data });
      if (data.success) {
        // Close modal on success
        setJoinModal({ open: false, court: null });
        fetchData(); // Refresh data after successful join
      }
    } catch (error) {
      // Set error message on failure, modal remains open
      setModalResult({ success: false, message: error.message || 'Failed to join waitlist.' });
    }
  };

  // Drop from waitlist from modal
  const handleDropModal = async () => {
    try {
      const formattedDrops = dropUsernames.map((username, index) => ({
        animalName: username.trim() ? username.charAt(0).toUpperCase() + username.slice(1).toLowerCase() : '',
        phoneNumber: dropPhones[index].replace(/\D/g, '')
      })).filter(drop => drop.animalName || drop.phoneNumber); // Filter out empty pairs

      if (formattedDrops.length !== 2 || formattedDrops.some(drop => !drop.animalName || drop.phoneNumber.length !== 10)) {
        setModalResult({ success: false, message: 'Please enter two sets of valid username and 10-digit phone number.' });
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
        fetchData(); // Refresh data after successful drop
        setDropModal({ open: false, court: null }); // Close modal on success
      }
    } catch (error) {
      setModalResult({ success: false, message: error.message || 'Failed to drop from waitlist.' });
    }
  };

  // View waitlist for a court
  const handleViewCourt = async (e) => {
    e.preventDefault();
    setCourtWaitlist(null);
    setLoading(true);
    try {
      // Parse input as number
      const courtNum = parseInt(viewCourtId, 10);
      if (isNaN(courtNum) || courtNum < 1) throw new Error('Please enter a valid court number');
      // Find court by number
      const courtObj = courts.find(c => c.number === courtNum || c.name === `Court ${courtNum}`);
      if (!courtObj) throw new Error('Court not found');
      // Fetch waitlist by ObjectId
      const response = await fetch(`${API_BASE_URL}/api/waitlist/${courtObj._id}`);
      const data = await response.json();
      if (data && data.success && Array.isArray(data.waitlist)) {
        setCourtWaitlist({ success: true, waitlist: data.waitlist });
      } else {
        setCourtWaitlist({ success: false, error: data.error || 'No waitlist found' });
      }
    } catch (error) {
      setCourtWaitlist({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Debug: find which waitlists a user is in
  const handleDebugUser = async (e) => {
    e.preventDefault();
    setDebugResult(null);
    setLoading(true);
    try {
      // Format username
      const formattedDebugUsername = debugUsername.charAt(0).toUpperCase() + debugUsername.slice(1).toLowerCase();
      const response = await fetch(`${API_BASE_URL}/api/waitlist/debug/user/${formattedDebugUsername}`);
      const data = await response.json();
      setDebugResult(data);
    } catch (error) {
      setDebugResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Helper for usernames array input
  const handleUsernameChange = (i, value) => {
    setUsernames(prev => {
      const arr = [...prev];
      arr[i] = value;
      return arr;
    });
  };
  const addUsernameField = () => setUsernames(prev => [...prev, '']);
  const removeUsernameField = (i) => setUsernames(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  // Helper: get court info by name
  const getCourtInfo = (name) => waitlistData.find(c => c.court && c.court.name === name);
  // Helper: get court _id by name
  const getCourtIdByName = (name) => {
    const found = courts.find(c => c.name === name);
    return found ? found._id : null;
  };

  return (
    <div className="flex flex-col">
      {/* Left: Court Status Grid (now full width)*/}
      <div className="w-full bg-white p-6 rounded shadow min-h-[400px]">
        <h2 className="text-lg font-semibold mb-4">Court Waitlist Status (Auto-refreshes every 60s)</h2>
        {loading ? (
          <div>Loading waitlists...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 20 }, (_, i) => {
              const courtName = `Court ${i + 1}`;
              // Find the court in the fetched list by name
              const court = courts.find(c => c.name === courtName);
              // If court is not found or not visible, display as Blocked/Hidden
              if (!court || !court.isVisible) {
                return (
                  <div key={courtName} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">{courtName}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-500">Hidden</span>
                    </div>
                    <div className="text-gray-500 text-sm">This court is not visible to users.</div>
                  </div>
                );
              }
              return (
                <div key={courtName} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">{courtName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${court.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{court.isAvailable ? 'Available' : 'Booked'}</span>
                  </div>
                  {/* Display waitlist entries if a waitlist exists, otherwise nothing */}
                  {court.waitlist && court.waitlist.length > 0 ? (
                    <div>
                      <div className="font-medium text-sm mb-1">Waitlist:</div>
                      <ul className="list-disc list-inside text-sm">
                        {court.waitlist.map((entry, idx) => (
                          <li key={idx} className="mb-1 flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-gray-800">#{entry.waitlistIndex}:</span>
                              <span className="ml-1 text-gray-700 break-words">{entry.userIds?.join(', ') || ''}</span>
                            </div>
                            {entry.startTime && (
                              <span className="text-gray-500 text-xs ml-2 shrink-0">
                                Added: {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {entry.isReady && <span className="ml-2 text-green-600 font-semibold">(Ready)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : ( // If no waitlist, display nothing
                    null
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      className="flex-1 bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
                      onClick={() => {
                        setJoinType('half');
                        setJoinUsernames(['', '']);
                        console.log('Attempting to open Join modal for court:', court);
                        setJoinModal({ open: true, court: court });
                        setModalResult(null);
                      }}
                    >
                      Join Waitlist
                    </button>
                    {court.waitlistCount > 0 && ( // Only show Drop button if there's a waitlist
                      <button
                        className="flex-1 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                        onClick={() => {
                          setDropUsernames(['', '']);
                          setDropPhones(['', '']);
                          setDropModal({ open: true, court: court });
                          setModalResult(null);
                        }}
                      >
                        Drop from Waitlist
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Right: Operations (1/4) - Removed */}
      {/*
      <div className="w-full lg:w-1/4 space-y-8 bg-white p-6 rounded shadow">
        {/* View Waitlist for a Court */}
        {/* ... forms for View and Debug ... */}
      {/*</div>*/}
      {/* Join Waitlist Modal */}
      {joinModal.open && joinModal.court && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            {/* Exit cross button */}
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
                onClick={handleJoinModal}
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
                    onChange={e => { if (/^\d{0,10}$/.test(e.target.value)) setDropPhones(prev => prev.map((phone, i) => i === index ? e.target.value : phone)); }}
                    placeholder="Phone Number (10 digits)"
                    maxLength={10}
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
                onClick={handleDropModal}
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
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('court-status');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Court Reserve</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('court-status')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'court-status'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Court Status
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {activeTab === 'court-status' && (
            <div className="p-6">
              <CourtList />
            </div>
          )}
          {activeTab === 'register' && (
            <div className="p-6">
              <AuthForm />
            </div>
          )}
          {activeTab === 'admin' && (
            <div className="p-6">
              <AdminPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
