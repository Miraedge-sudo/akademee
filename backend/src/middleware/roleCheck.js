module.exports = function(allowedRoles = []) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.length) return next();
    if (allowedRoles.includes(user.role)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
};
