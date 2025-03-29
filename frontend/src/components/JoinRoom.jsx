// components/JoinRoom.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const JoinRoom = () => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth0();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Access code is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/spaces/join', {
        accessCode: accessCode.toUpperCase(),
        auth0Id: user.sub
      });
      
      // Navigate to the joined room
      navigate(`/room/${response.data.id}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Join a Room</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accessCode">
            Room Access Code
          </label>
          <input
            id="accessCode"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Enter 6-digit access code"
            maxLength={6}
            minLength={6}
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinRoom;