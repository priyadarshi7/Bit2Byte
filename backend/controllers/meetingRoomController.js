// controllers/meetingRoomController.js
const MeetingRoom = require('../models/MeetingRoom');
const User = require('../models/user');

// Create a new meeting room
const createMeetingRoom = async (req, res) => {
  try {
    const { name, description } = req.body;
    const creatorId = req.user.id; // Assuming you have authentication middleware that sets req.user
    
    if (!name) {
      return res.status(400).json({ message: 'Meeting room name is required' });
    }
    
    // Find the user
    const user = await User.findById(creatorId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate unique meeting code
    let meetingCode = MeetingRoom.generateMeetingCode();
    let codeExists = await MeetingRoom.findOne({ meetingCode });
    
    // Ensure code is unique
    while (codeExists) {
      meetingCode = MeetingRoom.generateMeetingCode();
      codeExists = await MeetingRoom.findOne({ meetingCode });
    }
    
    // Create new meeting room
    const newMeetingRoom = new MeetingRoom({
      name,
      description,
      creator: creatorId,
      meetingCode,
      participants: [{
        user: creatorId,
        role: 'boss',
        joinedAt: new Date()
      }]
    });
    
    await newMeetingRoom.save();
    
    // Populate creator information
    await newMeetingRoom.populate('participants.user', 'name email picture');
    
    return res.status(201).json(newMeetingRoom);
  } catch (error) {
    console.error('Error in createMeetingRoom:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join a meeting room
const joinMeetingRoom = async (req, res) => {
  try {
    const { meetingCode } = req.body;
    const userId = req.user.id; // From auth middleware
    
    if (!meetingCode) {
      return res.status(400).json({ message: 'Meeting code is required' });
    }
    
    // Find the meeting room
    const meetingRoom = await MeetingRoom.findOne({ meetingCode, isActive: true });
    
    if (!meetingRoom) {
      return res.status(404).json({ message: 'Active meeting room not found with this code' });
    }
    
    // Check if user is already a participant
    const isParticipant = meetingRoom.participants.some(
      participant => participant.user.toString() === userId
    );
    
    if (isParticipant) {
      return res.status(400).json({ message: 'You are already a participant in this meeting' });
    }
    
    // Add user as participant with employee role
    meetingRoom.participants.push({
      user: userId,
      role: 'employee',
      joinedAt: new Date()
    });
    
    await meetingRoom.save();
    
    // Populate participants information
    await meetingRoom.populate('participants.user', 'name email picture');
    
    return res.status(200).json(meetingRoom);
  } catch (error) {
    console.error('Error in joinMeetingRoom:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get meeting room details
const getMeetingRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.auth0Id; // This is likely the auth0Id
    
    const meetingRoom = await MeetingRoom.findById(roomId)
      .populate('creator', 'name email picture auth0Id') // Add auth0Id to populated fields
      .populate('participants.user', 'name email picture auth0Id'); // Add auth0Id to populated fields
    
    if (!meetingRoom) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }
    
    // Log for debugging
    console.log("User from token:", userId);
    console.log("First participant:", meetingRoom.participants[0].user);
    
    // Check if user is participant by auth0Id
    const isParticipant = meetingRoom.participants.some(
      participant => participant.user.auth0Id === userId
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not authorized to view this meeting room' });
    }
    
    return res.status(200).json(meetingRoom);
  } catch (error) {
    console.error('Error in getMeetingRoom:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all meeting rooms for a user
const getUserMeetingRooms = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    // Find all meeting rooms where user is a participant
    const meetingRooms = await MeetingRoom.find({
      'participants.user': userId
    })
      .populate('creator', 'name email picture auth0Id')
      .populate('participants.user', 'name email picture auth0Id')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(meetingRooms);
  } catch (error) {
    console.error('Error in getUserMeetingRooms:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// End a meeting room (only for creator/boss)
const endMeetingRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    const meetingRoom = await MeetingRoom.findById(roomId);
    
    if (!meetingRoom) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }
    
    // Check if user is the creator
    if (meetingRoom.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only the meeting creator can end this meeting' });
    }
    
    meetingRoom.isActive = false;
    meetingRoom.endTime = new Date();
    
    await meetingRoom.save();
    
    return res.status(200).json({ message: 'Meeting ended successfully', meetingRoom });
  } catch (error) {
    console.error('Error in endMeetingRoom:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createMeetingRoom,
  joinMeetingRoom,
  getMeetingRoom,
  getUserMeetingRooms,
  endMeetingRoom
};