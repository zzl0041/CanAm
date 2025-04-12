"use client";

import { useState } from 'react';
import AuthForm from '@/components/AuthForm';
import CourtList from '@/components/CourtList';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState('courts');

  return (
    <main className="container mx-auto p-4 max-w-4xl">
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
    </main>
  );
}
