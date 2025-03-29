import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/MeetingRoom/Dashboard';
import CreateMeetingRoom from './components/MeetingRoom/CreateMeetingRoom';
import JoinMeetingRoom from './components/MeetingRoom/JoinMeetingRoom';
import MeetingRoomDetail from './components/MeetingRoom/MeetingRoomDetail';
import Login from './components/Auth/Login';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/create-meeting" element={
            <ProtectedRoute>
              <CreateMeetingRoom />
            </ProtectedRoute>
          } />
          
          <Route path="/join-meeting" element={
            <ProtectedRoute>
              <JoinMeetingRoom />
            </ProtectedRoute>
          } />
          
          <Route path="/meeting-room/:roomId" element={
            <ProtectedRoute>
              <MeetingRoomDetail />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
  );
};

export default App;
