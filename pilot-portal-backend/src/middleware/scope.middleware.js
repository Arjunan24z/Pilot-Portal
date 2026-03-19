const TokenService = require("../services/token.service");

/**
 * Middleware to enforce scope requirements
 * Usage: router.get("/logbook", auth, requireScope(["logbook:read"]), handler)
 * 
 * @param {string[]} requiredScopes - Array of required scopes
 * @returns {Function} Middleware function
 */
function requireScope(requiredScopes = []) {
  return async (req, res, next) => {
    try {
      // If no scopes required, proceed
      if (!requiredScopes || requiredScopes.length === 0) {
        return next();
      }

      // If no scopes in token (regular session token), allow (backward compatibility)
      if (!req.user.scopes || req.user.scopes.length === 0) {
        return next();
      }

      // Check if user has all required scopes
      const hasRequiredScopes = requiredScopes.every((scope) =>
        req.user.scopes.includes(scope)
      );

      if (!hasRequiredScopes) {
        // Log violation
        if (req.user.jti) {
          await TokenService.logAudit({
            eventType: "SCOPE_VIOLATION",
            jti: req.user.jti,
            userId: req.user.userId,
            appName: req.user.appName,
            requestedScopes: requiredScopes,
            scopes: req.user.scopes,
            result: "DENIED",
            reason: "INSUFFICIENT_SCOPE",
            ipAddress: req.ip || req.connection.remoteAddress,
            requestMethod: req.method,
            requestPath: req.originalUrl,
          });
        }

        return res.status(403).json({
          message: "Insufficient permissions",
          required: requiredScopes,
          current: req.user.scopes,
        });
      }

      // Log successful scope check
      if (req.user.jti) {
        await TokenService.logAudit({
          eventType: "ACCESS_GRANTED",
          jti: req.user.jti,
          userId: req.user.userId,
          appName: req.user.appName,
          scopes: req.user.scopes,
          result: "SUCCESS",
          ipAddress: req.ip || req.connection.remoteAddress,
          requestMethod: req.method,
          requestPath: req.originalUrl,
        });
      }

      next();
    } catch (error) {
      console.error("[ScopeMiddleware] Error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
}

module.exports = requireScope;
