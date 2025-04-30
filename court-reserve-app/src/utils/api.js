import axios from 'axios';

const api = axios.create({ 
  baseURL: '/api',
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
    const response = await fetch('/api/courts', {
      headers: {
        'x-admin-password': 'canamadmin'
      }
    });
    const data = await response.json();
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
  const response = await api.post('/reserve', { courtId, userIds, type, option });
  return response.data;
};

export const cancelReservation = (reservationId) => api.delete(`/reservations/${reservationId}`);

export const fetchQueue = async () => {
  try {
    const response = await fetch('/api/queue', {
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
