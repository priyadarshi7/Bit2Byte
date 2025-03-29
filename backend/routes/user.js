// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

// Create or update user after Auth0 login
router.post('/sync', userController.createOrUpdateUser);

// Get user by Auth0 ID
router.get('/:auth0Id', userController.getUserByAuth0Id);

// Update user metadata
router.patch('/:auth0Id/metadata', userController.updateUserMetadata);

// Get all users (admin only)
router.get('/', userController.getAllUsers);

module.exports = router;