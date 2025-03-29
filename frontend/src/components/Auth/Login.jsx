import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Meeting Rooms</h1>
        <p className="text-gray-600 mb-8 text-center">
          Sign in to create or join meeting rooms for your team
        </p>
        
        <button
          onClick={() => login()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 flex justify-center items-center"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default Login;