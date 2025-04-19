import axios from 'axios';

// For Vercel deployment, we can use relative URLs since the API is served from the same domain
const baseURL = '';  // Empty string for same-domain API requests

const api = axios.create({ 
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add reasonable timeouts for production
  timeout: 10000, // 10 seconds
  timeoutErrorMessage: 'Request timed out. Please try again.'
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging for production
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        endpoint: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', {
        endpoint: error.config?.url,
        request: error.request
      });
    } else {
      // Request setup error
      console.error('API Request Error:', {
        endpoint: error.config?.url,
        message: error.message
      });
    }
    throw error;
  }
);

export const registerUser = async (phoneNumber) => {
  try {
    const response = await api.post('/register', { 
      phoneNumber: phoneNumber.toString().trim() 
    });
    
    if (!response.data) {
      throw new Error('Invalid response from server');
    }
    
    return response.data;  // Return the entire response data which includes success and data fields
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
    const response = await api.post('/reserve', { courtId, userIds, type, option });
    return response.data;
  } catch (error) {
    console.error('Error reserving court:', error);
    throw error;
  }
};

export const validateUsers = async (usernames) => {
  try {
    const response = await api.post('/validate-users', { usernames });
    return response.data;
  } catch (error) {
    console.error('Error validating users:', error);
    throw error;
  }
};

export const fetchActiveUsers = async () => {
  try {
    const response = await api.get('/active-users');
    return response.data;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};

export const cancelReservation = async (reservationId) => {
  try {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling reservation:', error);
    throw error;
  }
};

export const fetchQueue = async () => {
  try {
    const response = await api.get('/queue');
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to fetch queue data');
    }
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
