const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://queuesystem-be.onrender.com';

export const validatePhoneNumber = (phone) => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 0) {
    return {
      isValid: false,
      error: 'Please enter a phone number'
    };
  }

  if (cleanPhone.length !== 10) {
    return {
      isValid: false,
      error: 'Phone number must be exactly 10 digits'
    };
  }

  if (/^[01]/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Phone number cannot start with 0 or 1'
    };
  }

  return {
    isValid: true,
    cleaned: cleanPhone,
    formatted: `(${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`
  };
};

export const validateUsernames = async (usernames) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/validate-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': 'canamadmin'
      },
      body: JSON.stringify({ usernames })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Username validation error:', error);
    throw error;
  }
}; 