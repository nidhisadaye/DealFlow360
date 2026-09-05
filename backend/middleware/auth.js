const jwt = require('jsonwebtoken');

const revokedTokens = new Set();

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided.' },
    });
  }

  const token = authHeader.split(' ')[1];

  if (revokedTokens.has(token)) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token has been revoked. Please log in again.' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' },
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
      });
    }
    next();
  };
}

function revokeToken(token) {
  if (token) {
    revokedTokens.add(token);
  }
}

module.exports = { authenticate, authorize, revokeToken };