import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const [meetingRooms, setMeetingRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { getAccessToken, user } = useAuth();

  useEffect(() => {
    const fetchMeetingRooms = async () => {
      try {
        const token = await getAccessToken();
        const response = await api.get('/meeting-rooms', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMeetingRooms(response.data);
      } catch (err) {
        setError('Failed to fetch meeting rooms');
        console.error('Error fetching meeting rooms:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingRooms();
  }, [getAccessToken]);

  const getRole = (room) => {
    const participant = room.participants.find(
      p => p.user._id === user?.sub || p.user._id === user?._id
    );
    return participant?.role || 'employee';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meeting Rooms</h1>
        <div className="space-x-4">
          <Link
            to="/create-meeting"
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Create Meeting
          </Link>
          <Link
            to="/join-meeting"
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Join Meeting
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetingRooms.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-600">No meeting rooms found.</p>
            <p className="text-gray-500 mt-2">Create a new meeting or join an existing one.</p>
          </div>
        ) : (
          meetingRooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{room.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {room.description || 'No description provided'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    getRole(room) === 'boss' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getRole(room) === 'boss' ? 'Boss' : 'Employee'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span className="mr-3">
                    <span className="font-medium">Code:</span> {room.meetingCode}
                  </span>
                  <span>
                    <span className="font-medium">Status:</span>{' '}
                    {room.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Ended</span>
                    )}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Created by:</span> {room.creator.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Participants:</span> {room.participants.length}
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <Link
                    to={`/meeting-room/${room._id}`}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Enter Room
                  </Link>
                  
                  {getRole(room) === 'boss' && room.isActive && (
                    <button
                      onClick={async () => {
                        try {
                          const token = await getAccessToken();
                          await api.patch(`/meeting-rooms/${room._id}/end`, {}, {
                            headers: {
                              Authorization: `Bearer ${token}`
                            }
                          });
                          
                          // Update local state
                          setMeetingRooms(prevRooms =>
                            prevRooms.map(prevRoom =>
                              prevRoom._id === room._id 
                                ? { ...prevRoom, isActive: false } 
                                : prevRoom
                            )
                          );
                        } catch (err) {
                          console.error('Error ending meeting:', err);
                        }
                      }}
                      className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                    >
                      End Meeting
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;