/**
 * Role-Based Access Control Middleware
 */

const normalizeRole = (role) => String(role || '').toLowerCase();

const getUserRoles = (user) => {
  if (!user) {
    return [];
  }

  if (Array.isArray(user.roles)) {
    return user.roles.map(normalizeRole);
  }

  if (user.role) {
    return [normalizeRole(user.role)];
  }

  return [];
};

const roleMiddleware = (allowedRoles = []) => {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    const userRoles = getUserRoles(req.user);
    const hasRole = normalizedAllowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
