"use client";

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import CourtList from '@/components/CourtList';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState('courts');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize courts when app starts
  useEffect(() => {
    const initializeCourts = async () => {
      try {
        // Try to fetch courts first
        const response = await fetch('/api/courts');
        const data = await response.json();
        
        // If no courts exist, seed them
        if (!data.courts || data.courts.length === 0) {
          await fetch('/api/seed/courts');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing courts:', error);
      }
    };

    initializeCourts();
  }, []);

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Initializing courts...</p>
      </div>
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex mb-4 border-b">
        <button
          className={`py-2 px-4 mr-2 ${
            activeTab === 'courts'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('courts')}
        >
          Court Status
        </button>
        <button
          className={`py-2 px-4 mr-2 ${
            activeTab === 'register'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'admin'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('admin')}
        >
          Admin
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'courts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Court Status & Reservations</h2>
            <CourtList />
          </div>
        )}
        {activeTab === 'register' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Registration</h2>
            <AuthForm />
          </div>
        )}
        {activeTab === 'admin' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
            <AdminPanel />
          </div>
        )}
      </div>
    </div>
  );
}
