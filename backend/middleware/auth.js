// middleware/auth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/user');

// Initialize JWKS client to fetch Auth0 signing keys
const client = jwksClient({
  jwksUri: `https://dev-udqndn3ec1rcacr4.us.auth0.com/.well-known/jwks.json` // Fixed URL
});

// Function to get the signing key
function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token using Auth0's keys
    jwt.verify(token, getSigningKey, {
      audience: 'https://my-backend-api', // Your API identifier in Auth0
      issuer: `https://dev-udqndn3ec1rcacr4.us.auth0.com/`, // Added https:// and trailing slash
      algorithms: ['RS256'] // Auth0 uses RS256 by default
    }, async function(err, decoded) {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      try {
        // Find user by Auth0 ID
        const user = await User.findOne({ auth0Id: decoded.sub });
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Set user in request object
        req.user = {
          id: user._id,
          auth0Id: user.auth0Id,
          email: user.email,
          name: user.name
        };
        
        next();
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ message: 'Server error', error: dbError.message });
      }
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = authMiddleware;