const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'offline-safe-local-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      username: user.username,
      role: (user.role || 'PARTICIPANT').toUpperCase(),
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware: Enforces authentication on requests.
 * Checks Authorization header (Bearer <token>) or cookie (token=<token>).
 * Returns 401 if not logged in or invalid token.
 */
function authenticate(req, res, next) {
  let token = null;

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback to cookie if present
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.'
    });
  }
}

/**
 * Middleware: Enforces role-based authorization.
 * Returns 401 if user is not authenticated.
 * Returns 403 if user role does not match allowed roles.
 * 
 * @param  {...string} allowedRoles Roles allowed to access the route (case-insensitive)
 */
function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking permissions.'
      });
    }

    const userRole = req.user.role.toUpperCase();

    // Check if user's role is in the allowed list
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Forbidden: User role '${userRole}' lacks permission. Required role(s): [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticate,
  requireRole
};
