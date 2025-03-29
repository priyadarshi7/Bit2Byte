const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');
module.exports = function(server) {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  // Track active rooms and users
  const rooms = {};
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);
    
    // Join room
    socket.on('join-room', ({ roomId, userId, userName, userPicture }) => {
      console.log(`User ${userName} (${userId}) joined room ${roomId}`);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = {
          users: {},
          messages: []
        };
      }
      
      // Add user to room
      rooms[roomId].users[socket.id] = {
        socketId: socket.id,
        userId,
        userName,
        userPicture
      };
      
      // Join the room
      socket.join(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user-connected', {
        socketId: socket.id,
        userId,
        userName,
        userPicture
      });
      
      // Send current users in the room to the joining user
      socket.emit('room-users', Object.values(rooms[roomId].users));
      
      // Send existing messages to the joining user
      socket.emit('chat-history', rooms[roomId].messages);
    });
    
    // Handle WebRTC signaling
    socket.on('signal', ({ to, from, signal }) => {
      io.to(to).emit('signal', { from, signal });
    });
    
    // Handle chat messages
    socket.on('send-message', ({ roomId, message }) => {
      // Store the message
      if (rooms[roomId]) {
        rooms[roomId].messages.push(message);
        // Limit message history to prevent memory issues
        if (rooms[roomId].messages.length > 100) {
          rooms[roomId].messages.shift();
        }
        
        // Broadcast to everyone in the room
        io.in(roomId).emit('new-message', message);
      }
    });
    
    // Handle screen sharing status
    socket.on('screen-share-status', ({ roomId, isSharing }) => {
      socket.to(roomId).emit('user-screen-share', {
        socketId: socket.id,
        isSharing
      });
    });

    // Handle mic mute/unmute status
    socket.on('mic-status', ({ roomId, isMuted }) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        // Update user's mic status
        rooms[roomId].users[socket.id].isMuted = isMuted;
        
        // Broadcast to everyone else in the room
        socket.to(roomId).emit('user-mic-status', {
          socketId: socket.id,
          isMuted
        });
      }
    });

    // Handle video on/off status
    socket.on('video-status', ({ roomId, isVideoOff }) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        // Update user's video status
        rooms[roomId].users[socket.id].isVideoOff = isVideoOff;
        
        // Broadcast to everyone else in the room
        socket.to(roomId).emit('user-video-status', {
          socketId: socket.id,
          isVideoOff
        });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        socket.to(roomId).emit('user-typing', {
          socketId: socket.id,
          userId: rooms[roomId].users[socket.id].userId,
          userName: rooms[roomId].users[socket.id].userName,
          isTyping
        });
      }
    });
    
    // Handle heartbeat to detect disconnects
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-ack');
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Find the room this user was in
      for (const roomId in rooms) {
        if (rooms[roomId].users[socket.id]) {
          // Remove the user from the room
          const userData = rooms[roomId].users[socket.id];
          delete rooms[roomId].users[socket.id];
          
          // Notify others in the room
          socket.to(roomId).emit('user-disconnected', socket.id);
          
          // If room is empty, clean it up
          if (Object.keys(rooms[roomId].users).length === 0) {
            delete rooms[roomId];
          }
          
          break;
        }
      }
    });
    
    // Handle leaving room explicitly
    socket.on('leave-room', ({ roomId }) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        // Remove the user from the room
        delete rooms[roomId].users[socket.id];
        
        // Notify others in the room
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // Leave the room
        socket.leave(roomId);
        
        // If room is empty, clean it up
        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
        }
      }
    });

    // Handle room data
    socket.on('update-room-data', ({ roomId, data }) => {
      if (rooms[roomId]) {
        // Update room data with the provided changes
        rooms[roomId] = {
          ...rooms[roomId],
          ...data
        };
        
        // Broadcast updated room data to everyone in the room
        io.in(roomId).emit('room-data-updated', {
          roomId,
          data: rooms[roomId]
        });
      }
    });

    // Handle room settings update
    socket.on('update-room-settings', ({ roomId, settings }) => {
      if (rooms[roomId]) {
        // Initialize settings object if it doesn't exist
        if (!rooms[roomId].settings) {
          rooms[roomId].settings = {};
        }
        
        // Update settings
        rooms[roomId].settings = {
          ...rooms[roomId].settings,
          ...settings
        };
        
        // Broadcast updated settings to everyone in the room
        io.in(roomId).emit('room-settings-updated', {
          roomId,
          settings: rooms[roomId].settings
        });
      }
    });
  });
  return io;
}; 