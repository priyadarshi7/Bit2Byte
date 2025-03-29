import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, user, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
  const [appUser, setAppUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && user) {
        try {
          // Get token
          const token = await getAccessTokenSilently();
          
          // Sync user with our backend
          const response = await api.post('/users/sync', user, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setAppUser(response.data);
        } catch (error) {
          console.error('Error syncing user:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAppUser(null);
        setIsLoading(false);
      }
    };

    syncUser();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  // Wrapped version of getAccessTokenSilently to handle errors
  const getAccessToken = async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      loginWithRedirect();
      throw new Error('Authentication required');
    }
  };

  // Define login function to match what Navbar expects
  const login = () => loginWithRedirect();

  // Define a logout handler that uses Auth0's logout
  const logoutHandler = () => logout({ returnTo: window.location.origin });

  // Create the context value with all required properties
  const contextValue = {
    isAuthenticated,
    user,
    appUser,
    isLoading,
    getAccessToken,
    login,
    logout: logoutHandler
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);