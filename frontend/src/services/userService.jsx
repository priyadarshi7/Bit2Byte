// src/services/userService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Sync user with backend after Auth0 login
export const syncUserWithBackend = async (auth0User) => {
  try {
    const response = await axios.post(`${API_URL}/users/sync`, auth0User);
    return response.data;
  } catch (error) {
    console.error('Error syncing user with backend:', error);
    throw error;
  }
};

// Get user by Auth0 ID
export const getUserByAuth0Id = async (auth0Id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${auth0Id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user metadata
export const updateUserMetadata = async (auth0Id, metadata) => {
  try {
    const response = await axios.patch(`${API_URL}/users/${auth0Id}/metadata`, { metadata });
    return response.data;
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
};