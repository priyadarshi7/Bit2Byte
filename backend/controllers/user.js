// controllers/userController.js
const User = require('../models/user')

// Create or update user after Auth0 login
const createOrUpdateUser = async (req, res) => {
  try {
    const auth0User = req.body;
    
    if (!auth0User || !auth0User.sub) {
      return res.status(400).json({ message: 'Invalid user data' });
    }

    // Find user by Auth0 ID or create new one
    let user = await User.findOne({ auth0Id: auth0User.sub });
    
    if (user) {
      // Update existing user
      user.email = auth0User.email;
      user.name = auth0User.name;
      user.picture = auth0User.picture;
      user.lastLogin = new Date();
      
      await user.save();
      return res.status(200).json(user);
    } else {
      // Create new user
      const newUser = new User({
        auth0Id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture
      });
      
      await newUser.save();
      return res.status(201).json(newUser);
    }
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by Auth0 ID
const getUserByAuth0Id = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    
    if (!auth0Id) {
      return res.status(400).json({ message: 'Auth0 ID is required' });
    }
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserByAuth0Id:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user metadata
const updateUserMetadata = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const { metadata } = req.body;
    
    if (!auth0Id) {
      return res.status(400).json({ message: 'Auth0 ID is required' });
    }
    
    if (!metadata) {
      return res.status(400).json({ message: 'Metadata is required' });
    }
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update or add metadata fields
    user.metadata = { ...user.metadata, ...metadata };
    await user.save();
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in updateUserMetadata:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrUpdateUser,
  getUserByAuth0Id,
  updateUserMetadata,
  getAllUsers
};