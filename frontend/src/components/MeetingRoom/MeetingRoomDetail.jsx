import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MeetingRoomDetail = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { getAccessToken, user, appUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetingRoom = async () => {
      try {
        const token = await getAccessToken();
        const response = await api.get(`/meeting-rooms/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setRoom(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch meeting room details');
        console.error('Error fetching meeting room:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingRoom();
  }, [roomId, getAccessToken]);

  const getUserRole = () => {
    if (!room || !user) return null;
    
    const participant = room.participants.find(
      p => p.appUser.auth0Id === user.sub || p.appUser.auth0id === user._id
    );
    return participant?.role || 'employee';
  };

  const handleEndMeeting = async () => {
    try {
      const token = await getAccessToken();
      await api.patch(`/meeting-rooms/${roomId}/end`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setRoom(prevRoom => ({
        ...prevRoom,
        isActive: false
      }));
    } catch (err) {
      console.error('Error ending meeting:', err);
      setError('Failed to end meeting');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-xl text-gray-700">Meeting room not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{room.name}</h1>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                room.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {room.isActive ? 'Active' : 'Ended'}
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="ml-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-2">{room.description || 'No description provided'}</p>
            
<div className="flex items-center text-sm text-gray-600">
              <div className="mr-6">
                <span className="font-medium">Meeting Code:</span> {room.meetingCode}
              </div>
              <div className="mr-6">
                <span className="font-medium">Created:</span> {new Date(room.createdAt).toLocaleString()}
              </div>
              {room.endTime && (
                <div>
                  <span className="font-medium">Ended:</span> {new Date(room.endTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Meeting controls for boss */}
          {getUserRole() === 'boss' && room.isActive && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Meeting Controls</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleEndMeeting}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  End Meeting
                </button>
                <button
                  onClick={() => {
                    // Copy meeting code to clipboard
                    navigator.clipboard.writeText(room.meetingCode);
                    // You could add a toast notification here
                    alert(`Meeting code copied: ${room.meetingCode}`);
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Copy Invite Code
                </button>
              </div>
            </div>
          )}

          {/* Participants section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Participants ({room.participants.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.participants.map((participant) => (
                <div 
                  key={participant.user._id} 
                  className="flex items-center p-4 border border-gray-200 rounded-lg"
                >
                  {participant.user.picture ? (
                    <img 
                      src={participant.user.picture} 
                      alt={`${participant.user.name}'s avatar`}
                      className="w-10 h-10 rounded-full mr-3" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      <span className="text-gray-600 font-medium">
                        {participant.user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{participant.user.name}</p>
                    <div className="flex items-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        participant.role === 'boss' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {participant.role === 'boss' ? 'Boss' : 'Employee'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        Joined: {new Date(participant.joinedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoomDetail;