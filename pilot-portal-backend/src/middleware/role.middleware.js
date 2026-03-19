/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Usage: app.get('/admin-route', auth, requireRole(['admin']), handler)
 */

module.exports = (requiredRoles) => {
  return (req, res, next) => {
    // Check if user has role attached (set by auth middleware)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "User role not found" });
    }

    // Check if user's role is in required roles
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};
