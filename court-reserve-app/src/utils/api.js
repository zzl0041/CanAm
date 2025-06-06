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

export const fetchCourtsVisible = async () => {
  try {
    // Fetch visible courts
    const courtsRes = await fetch(`${API_BASE_URL}/api/courts`);
    if (!courtsRes.ok) {
      throw new Error(`HTTP error! status: ${courtsRes.status}`);
    }
    const courtsData = await courtsRes.json();
    if (!courtsData.success || !Array.isArray(courtsData.courts)) {
      throw new Error(courtsData.error || 'Failed to fetch courts');
    }
    // The /api/courts/all endpoint includes waitlist and availability info directly.
    // We will use waitlistCount from the response for status.
    return { success: true, courts: courtsData.courts };
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

export const fetchCourtsAdmin = async () => {
  try {
    const courtsRes = await fetch(`${API_BASE_URL}/api/courts/all`, {
      headers: {
        'x-admin-password': 'canamadmin'
      }
    });
    if (!courtsRes.ok) {
      throw new Error(`HTTP error! status: ${courtsRes.status}`);
    }
    const courtsData = await courtsRes.json();
    if (!courtsData.success || !Array.isArray(courtsData.courts)) {
      throw new Error(courtsData.error || 'Failed to fetch courts');
    }
    return { success: true, courts: courtsData.courts };
  } catch (error) {
    console.error('Error fetching admin courts:', error);
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
    const response = await fetch(`${API_BASE_URL}/api/admin/reset-court/${courtId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': 'canamadmin'
      },
      body: JSON.stringify({}),
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
