// services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fetch pending registrations (unverified users)
export const fetchPendingRegistrations = async () => {
  try {
    const response = await fetch(`${API_URL}/pending-registrations`);
    if (!response.ok) {
      throw new Error('Failed to fetch pending registrations');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Fetch verified users
export const fetchVerifiedUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/verified-users`);
    if (!response.ok) {
      throw new Error('Failed to fetch verified users');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Update verification status
export const updateVerificationStatus = async (verificationData) => {
  try {
    const response = await fetch(`${API_URL}/update-verification-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update verification status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
