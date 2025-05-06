import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://canam-server.onrender.com';

const api = axios.create({ 
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'x-admin-password': 'canamadmin'
  }
});

export const registerUser = async (phoneNumber) => {
  try {
    console.log('Sending registration request for:', phoneNumber);
    const response = await api.post('/register', { 
      phoneNumber: phoneNumber.toString().trim() 
    });
    console.log('Registration response:', response.data);
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Invalid response from server');
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const fetchCourts = async () => {
  try {
    console.log('Fetching courts from:', `${API_BASE_URL}/api/courts`);
    const response = await fetch(`${API_BASE_URL}/api/courts`, {
      headers: {
        'x-admin-password': 'canamadmin'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Courts API response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch courts');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

export const reserveCourt = async ({ courtId, userIds, type, option }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': 'canamadmin'
      },
      body: JSON.stringify({
        courtId,
        userIds,
        type,
        option
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reserving court:', error);
    throw error;
  }
};

export const cancelReservation = (reservationId) => api.delete(`/reservations/${reservationId}`);

export const fetchQueue = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/queue`, {
      headers: {
        'x-admin-password': 'canamadmin'
      }
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch queue');
    }
    return { data };
  } catch (error) {
    console.error('Error fetching queue:', error);
    throw error;
  }
};

export const joinQueue = (userIds, type) => api.post('/queue/join', { userIds, type });

export const resetCourt = async (courtId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/reset-court`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': 'canamadmin'
      },
      body: JSON.stringify({
        courtId,
        adminPassword: 'canamadmin'
      })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to reset court');
    }
    return data;
  } catch (error) {
    console.error('Error resetting court:', error);
    throw error;
  }
};
