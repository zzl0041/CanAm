"use client";

import { useState } from 'react';
import { registerUser } from '../utils/api';
import { validatePhoneNumber } from '../utils/validation';

export default function AuthForm() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const handlePhoneChange = (e) => {
    // Allow any input, validation will happen on submit
    setPhone(e.target.value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      setModalContent({
        title: 'Invalid Phone Number',
        message: validation.error,
        isError: true
      });
      setShowModal(true);
      setLoading(false);
      return;
    }

    // Only use the last five digits for registration
    const lastFive = validation.cleaned.slice(-5);
    try {
      const response = await registerUser(lastFive);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Registration failed');
      }

      setModalContent({
        title: response.data.isExisting ? 'Welcome Back!' : 'Registration Successful!',
        username: response.data.user.animalName,
        phone: lastFive,
        isError: false
      });
      setShowModal(true);
    } catch (error) {
      setModalContent({
        title: 'Registration Failed',
        message: error.response?.data?.error || error.message || 'Failed to register',
        isError: true
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className={`text-xl font-semibold mb-4 ${
          modalContent.isError ? 'text-red-600' : 'text-blue-600'
        }`}>
          {modalContent.title}
        </h3>
        
        {modalContent.isError ? (
          <div className="text-red-500">
            {modalContent.message}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your username:</p>
              <p className="text-2xl font-bold text-blue-600">
                {modalContent.username}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Registered phone: {modalContent.phone}</p>
              <p className="mt-2">Please remember this username for making court reservations.</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowModal(false)}
          className={`mt-6 w-full py-2 px-4 rounded ${
            modalContent.isError 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {modalContent.isError ? 'Try Again' : 'Close'}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleRegister} className="max-w-sm mx-auto">
      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Last 5 digits of Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="Enter last 5 digits of your phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          maxLength={5}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>

      {showModal && <Modal />}
    </form>
  );
}
