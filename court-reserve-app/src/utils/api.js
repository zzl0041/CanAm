import axios from 'axios';

const api = axios.create({ 
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
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
  const response = await api.get('/courts');
  return response.data;
};

export const reserveCourt = async ({ courtId, userIds, type, option }) => {
  const response = await api.post('/reserve', { courtId, userIds, type, option });
  return response.data;  // Return the data directly instead of the axios response
};

export const cancelReservation = (reservationId) => api.delete(`/reservations/${reservationId}`);

export const fetchQueue = () => api.get('/queue');

export const joinQueue = (userIds, type) => api.post('/queue/join', { userIds, type });
