// routes/spaceRoutes.js
const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');

// Create a new space
router.post('/', spaceController.createSpace);

// Join a space with access code
router.post('/join', spaceController.joinSpace);

// Get space by ID
router.get('/:id', spaceController.getSpaceById);

// Get user spaces
router.get('/user/:auth0Id', spaceController.getUserSpaces);

module.exports = router;