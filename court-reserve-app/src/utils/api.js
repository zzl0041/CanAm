import axios from 'axios';

// Get the base URL from environment or default to local
const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({ 
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

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
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const fetchCourts = async () => {
  try {
    const response = await api.get('/courts');
    return response.data;
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

export const reserveCourt = async ({ courtId, userIds, type, option }) => {
  try {
    console.log('Sending reservation request:', { courtId, userIds, type, option });
    const response = await api.post('/reserve', { courtId, userIds, type, option });
    console.log('Reservation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Reservation error:', error);
    throw error;
  }
};

export const cancelReservation = async (reservationId) => {
  try {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  } catch (error) {
    console.error('Cancel reservation error:', error);
    throw error;
  }
};

export const fetchQueue = async () => {
  try {
    const response = await api.get('/queue');
    return response.data;
  } catch (error) {
    console.error('Error fetching queue:', error);
    throw error;
  }
};

export const joinQueue = async (userIds, type) => {
  try {
    const response = await api.post('/queue/join', { userIds, type });
    return response.data;
  } catch (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
};
