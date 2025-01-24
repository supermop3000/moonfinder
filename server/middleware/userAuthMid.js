// server/middleware/userAuthMid.js
import jwt from 'jsonwebtoken';

const userAuthMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' }); // Unauthorized
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded token data to the request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);

    // Distinguish between expired token and other errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token has expired' }); // Unauthorized
    }
    res.status(403).json({ message: 'Invalid access token' }); // Forbidden
  }
};

export default userAuthMiddleware;
