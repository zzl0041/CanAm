"use client";

import { useEffect, useState } from 'react';
import { fetchQueue } from '../utils/api';

export default function QueueStatus({ courts }) {
  // Filter courts to find those that will be available soon (timeToAvailable > 0)
  const courtsAvailableSoon = courts.filter(court => court.timeToAvailable > 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Courts Available Soon</h2>
      </div>

      {courtsAvailableSoon.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {courtsAvailableSoon
            .sort((a, b) => parseInt(a.name.replace('Court ', '')) - parseInt(b.name.replace('Court ', '')))
            .map((court, index) => (
              <div
                key={court._id}
                className={`p-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {court.name}
                </div>
                <div className="text-sm text-gray-700">
                  Available in <span className="font-bold text-blue-600">{court.timeToAvailable}</span> minutes.
                </div>
                {/* Removed waitlist display as we are showing availability time */}
              </div>
            ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No courts expected to be available soon.
        </div>
      )}
    </div>
  );
} 