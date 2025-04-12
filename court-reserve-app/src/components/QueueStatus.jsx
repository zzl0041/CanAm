"use client";

import { useEffect, useState } from 'react';
import { fetchQueue } from '../utils/api';

export default function QueueStatus() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 60000); // Changed to 60 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const response = await fetchQueue();
      setQueue(response.data.queue || []);
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Current Queue</h2>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Current Queue</h2>
      </div>
      
      {queue.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {queue.map((entry, index) => (
            <div 
              key={`court-${entry.courtNumber}`}
              className={`p-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Court {entry.courtNumber}
                  </span>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>{entry.type} • {entry.userIds.length} players</p>
                    <p className="text-xs mt-1">
                      Players: {entry.userIds.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Available in {formatTimeRemaining(entry.timeRemaining)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Started: {new Date(entry.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No courts in use - All courts available for immediate play
        </div>
      )}
    </div>
  );
} 