const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = function(server) {
  const io = socketIO(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by Auth0 ID
      const user = await User.findOne({ auth0Id: decoded.sub });
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user._id,
        auth0Id: user.auth0Id,
        name: user.name,
        email: user.email
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);
    
    // Join a meeting room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.user.id,
        name: socket.user.name,
        timestamp: new Date()
      });
      
      console.log(`${socket.user.name} joined room: ${roomId}`);
    });
    
    // Leave a meeting room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user-left', {
        userId: socket.user.id,
        name: socket.user.name,
        timestamp: new Date()
      });
      
      console.log(`${socket.user.name} left room: ${roomId}`);
    });
    
    // Send a message in a room
    socket.on('send-message', (data) => {
      const { roomId, message } = data;
      
      // Broadcast message to everyone in the room including sender
      io.to(roomId).emit('new-message', {
        userId: socket.user.id,
        name: socket.user.name,
        message,
        timestamp: new Date()
      });
    });
    
    // End meeting (boss only)
    socket.on('end-meeting', (roomId) => {
      // Notify all users in the room
      io.to(roomId).emit('meeting-ended', {
        endedBy: socket.user.name,
        timestamp: new Date()
      });
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
};