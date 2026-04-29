/**
 * General authentication middleware — checks if user is logged in.
 */
function authMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
}

/**
 * Role-based authorization middleware factory.
 * Usage: router.use(roleMiddleware('librarian'))
 */
function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    if (req.session.user.role !== requiredRole) {
      return res.status(403).json({ error: `Forbidden. ${requiredRole} access required.` });
    }
    return next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
