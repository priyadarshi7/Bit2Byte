import { io } from 'socket.io-client';

let socket;

export const initSocket = async (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('http://localhost:5000', {
    auth: { token }
  });

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('Socket connected');
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reject(error);
    });
  });
};

export const joinRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('join-room', roomId);
  }
};

export const leaveRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('leave-room', roomId);
  }
};

export const sendMessage = (roomId, message) => {
  if (socket && socket.connected) {
    socket.emit('send-message', { roomId, message });
  }
};

export const endMeeting = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('end-meeting', roomId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export default {
  initSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  endMeeting,
  disconnectSocket
};