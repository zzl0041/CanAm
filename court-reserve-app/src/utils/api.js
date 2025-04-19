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
  (response) => {
    // Validate response format
    if (!response.data) {
      throw new Error('Invalid response format: missing data');
    }
    return response;
  },
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
      
      // Transform error message for user-friendly display
      const errorMessage = error.response.data?.error || 
        error.response.data?.message || 
        `Server error: ${error.response.status}`;
      
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', {
        endpoint: error.config?.url,
        request: error.request
      });
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Request setup error
      console.error('API Request Error:', {
        endpoint: error.config?.url,
        message: error.message
      });
      throw error;
    }
  }
);

// Helper function to validate response
const validateResponse = (response, requiredFields = []) => {
  if (!response.data) {
    throw new Error('Invalid response: missing data');
  }
  
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      throw new Error(`Invalid response: missing ${field}`);
    }
  }
  
  return response.data;
};

export const registerUser = async (phoneNumber) => {
  try {
    const response = await api.post('/register', { 
      phoneNumber: phoneNumber.toString().trim() 
    });
    return validateResponse(response, ['success']);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const fetchCourts = async () => {
  try {
    const response = await api.get('/courts');
    return validateResponse(response, ['success', 'courts']);
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

export const reserveCourt = async ({ courtId, userIds, type, option }) => {
  try {
    const response = await api.post('/reserve', { courtId, userIds, type, option });
    return validateResponse(response, ['success']);
  } catch (error) {
    console.error('Error reserving court:', error);
    throw error;
  }
};

export const validateUsers = async (usernames) => {
  try {
    const response = await api.post('/validate-users', { usernames });
    return validateResponse(response, ['success']);
  } catch (error) {
    console.error('Error validating users:', error);
    throw error;
  }
};

export const fetchActiveUsers = async () => {
  try {
    const response = await api.get('/active-users');
    return validateResponse(response, ['success', 'activeUsers']);
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
    return validateResponse(response, ['success', 'queue']);
  } catch (error) {
    console.error('Error fetching queue:', error);
    throw error;
  }
};

export const joinQueue = async (userIds, type) => {
  try {
    const response = await api.post('/queue/join', { userIds, type });
    return validateResponse(response, ['success']);
  } catch (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
};
