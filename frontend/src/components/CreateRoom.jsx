// components/CreateRoom.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth0();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
      
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
      
    setLoading(true);
    setError('');
      
    try {
      // Generate a random access code (you could move this to the server side)
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const response = await axios.post('http://localhost:5000/api/spaces', {
        name,
        author: user.sub, // auth0Id
        width: 1200,
        height: 800,
        accessCode // Add the access code
      });
          
      // Navigate to the newly created room
      navigate(`/room/${response.data.id}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create a New Room</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomName">
            Room Name
          </label>
          <input
            id="roomName"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter room name"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoom;