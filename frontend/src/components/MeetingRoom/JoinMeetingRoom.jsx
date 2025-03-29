// src/components/MeetingRoom/JoinMeetingRoom.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const JoinMeetingRoom = () => {
  const [meetingCode, setMeetingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = await getAccessToken();
      const response = await api.post('/meeting-rooms/join', { meetingCode }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Navigate to the joined meeting room
      navigate(`/meeting-room/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join meeting room');
      console.error('Error joining meeting room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Join Meeting Room</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="meetingCode" className="block text-gray-700 font-medium mb-2">
            Meeting Code
          </label>
          <input
            type="text"
            id="meetingCode"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code (e.g., ABC123)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength="6"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || meetingCode.length < 6}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
        >
          {isLoading ? 'Joining...' : 'Join Meeting'}
        </button>
      </form>
    </div>
  );
};

export default JoinMeetingRoom;
