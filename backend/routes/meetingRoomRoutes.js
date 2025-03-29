// routes/meetingRoomRoutes.js
const express = require('express');
const router = express.Router();
const meetingRoomController = require('../controllers/meetingRoomController');
const authMiddleware = require('../middleware/auth'); // You'll need to create this

// Apply auth middleware to all meeting room routes
router.use(authMiddleware);

// Create a new meeting room
router.post('/', meetingRoomController.createMeetingRoom);

// Join a meeting room
router.post('/join', meetingRoomController.joinMeetingRoom);

// Get meeting room details
router.get('/:roomId', meetingRoomController.getMeetingRoom);

// Get all meeting rooms for a user
router.get('/', meetingRoomController.getUserMeetingRooms);

// End a meeting room (only for creator/boss)
router.patch('/:roomId/end', meetingRoomController.endMeetingRoom);

module.exports = router;