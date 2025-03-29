// controllers/spaceController.js
const Space = require('../models/space');
const User = require('../models/user');
const mongoose = require('mongoose');

// Create a new space
const createSpace = async (req, res) => {
  try {
    const { name, width, height, author } = req.body;
    
    // Generate a unique access code (6 characters)
    const generateAccessCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    let accessCode = generateAccessCode();
    let codeExists = await Space.findOne({ accessCode });
    
    // Ensure access code is unique
    while (codeExists) {
      accessCode = generateAccessCode();
      codeExists = await Space.findOne({ accessCode });
    }
    
    // Get user info
    const user = await User.findOne({ auth0Id: author });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newSpace = new Space({
      id: new mongoose.Types.ObjectId().toString(),
      name,
      width: width || 1200,
      height: height || 800,
      thumbnail: '',
      author,
      accessCode,
      members: [{
        userId: user.auth0Id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        points: 0,
        joinedAt: new Date()
      }]
    });
    
    await newSpace.save();
    
    // Add space to user's spaces
    await User.findOneAndUpdate(
      { auth0Id: author },
      { 
        $push: { 
          spaces: { 
            spaceId: newSpace.id, 
            role: 'leader', 
            points: 0 
          } 
        } 
      }
    );
    
    return res.status(201).json(newSpace);
  } catch (error) {
    console.error('Error in createSpace:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join a space using access code
const joinSpace = async (req, res) => {
  try {
    const { accessCode, auth0Id } = req.body;
    
    if (!accessCode || !auth0Id) {
      return res.status(400).json({ message: 'Access code and auth0Id are required' });
    }
    
    const space = await Space.findOne({ accessCode });
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found with provided access code' });
    }
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const isMember = space.members.some(member => member.userId === auth0Id);
    
    if (isMember) {
      return res.status(200).json({ message: 'Already a member of this space', space });
    }
    
    // Add user to space members
    space.members.push({
      userId: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      points: 0,
      joinedAt: new Date()
    });
    
    await space.save();
    
    // Add space to user's spaces
    await User.findOneAndUpdate(
      { auth0Id },
      { 
        $push: { 
          spaces: { 
            spaceId: space.id, 
            role: 'member', 
            points: 0 
          } 
        } 
      }
    );
    
    return res.status(200).json(space);
  } catch (error) {
    console.error('Error in joinSpace:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get space by ID
const getSpaceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const space = await Space.findOne({ id });
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }
    
    return res.status(200).json(space);
  } catch (error) {
    console.error('Error in getSpaceById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all spaces for a user
const getUserSpaces = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const spaceIds = user.spaces.map(space => space.spaceId);
    const spaces = await Space.find({ id: { $in: spaceIds } });
    
    return res.status(200).json(spaces);
  } catch (error) {
    console.error('Error in getUserSpaces:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createSpace,
  joinSpace,
  getSpaceById,
  getUserSpaces
};