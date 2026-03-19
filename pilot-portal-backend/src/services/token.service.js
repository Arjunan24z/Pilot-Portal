const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const AccessToken = require("../models/access-token.model");
const AuditLog = require("../models/audit-log.model");
const { ensureJwtSecret } = require("../config/jwt");

class TokenService {
  /**
   * Issue a new scoped access token
   * @param {string} userId - User ID
   * @param {string} appName - Application name (e.g., "Pilot Portal Logbook")
   * @param {string[]} scopes - Array of scopes (e.g., ["logbook:read", "license:read"])
   * @param {number} expiresInMinutes - Token expiry time (default: 60 minutes)
   * @param {string} issuedFromIp - IP address of token issuer
   * @returns {Promise<{token, jti, expiresAt}>}
   */
  static async issueToken(userId, appName, scopes, expiresInMinutes = 60, issuedFromIp = "0.0.0.0") {
    try {
      const jti = crypto.randomBytes(16).toString("hex"); // Unique token ID
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      const jwtSecret = ensureJwtSecret();

      // Create JWT payload
      const payload = {
        jti,
        userId,
        appName,
        scopes,
        iss: "pilot-portal-cloud", // Issuer
        aud: `pilot-portal-${appName.toLowerCase().replace(/\s+/g, "-")}`, // Audience
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
      };

      // Sign JWT
      const token = jwt.sign(payload, jwtSecret, { algorithm: "HS256" });

      // Hash token for storage (never store plaintext tokens)
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Store token metadata
      const tokenRecord = new AccessToken({
        jti,
        userId,
        appName,
        scopes,
        tokenHash,
        expiresAt,
        issuedFromIp,
      });

      await tokenRecord.save();

      // Audit log: token issued
      await this.logAudit({
        eventType: "TOKEN_ISSUED",
        userId,
        appName,
        jti,
        scopes,
        result: "SUCCESS",
        ipAddress: issuedFromIp,
      });

      return {
        token,
        jti,
        expiresAt,
        appName,
        scopes,
      };
    } catch (error) {
      console.error("[TokenService] Error issuing token:", error.message);
      throw error;
    }
  }

  /**
   * Verify and validate a token, check scopes and revocation status
   * @param {string} token - JWT token
   * @param {string[]} requiredScopes - Required scopes for the operation
   * @param {string} ipAddress - Request IP for logging
   * @returns {Promise<{valid, decoded, error}>}
   */
  static async verifyToken(token, requiredScopes = [], ipAddress = "0.0.0.0") {
    try {
      const jwtSecret = ensureJwtSecret();

      // Verify JWT signature and expiry
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (err) {
        // Log failed verification
        await this.logAudit({
          eventType: "ACCESS_DENIED",
          jti: err.jti || "unknown",
          result: "EXPIRED",
          reason: err.message.includes("expired") ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
          ipAddress,
        });

        return {
          valid: false,
          error: err.message.includes("expired") ? "Token expired" : "Invalid token",
          reason: err.message.includes("expired") ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        };
      }

      // Check if token is revoked
      const tokenRecord = await AccessToken.findOne({ jti: decoded.jti });

      if (!tokenRecord) {
        await this.logAudit({
          eventType: "ACCESS_DENIED",
          jti: decoded.jti,
          userId: decoded.userId,
          appName: decoded.appName,
          result: "DENIED",
          reason: "TOKEN_NOT_FOUND",
          ipAddress,
        });

        return {
          valid: false,
          error: "Token not found in system",
          reason: "TOKEN_NOT_FOUND",
        };
      }

      if (tokenRecord.isRevoked) {
        await this.logAudit({
          eventType: "ACCESS_DENIED",
          jti: decoded.jti,
          userId: decoded.userId,
          appName: decoded.appName,
          result: "REVOKED",
          reason: tokenRecord.revokedReason || "TOKEN_REVOKED",
          ipAddress,
        });

        return {
          valid: false,
          error: `Token revoked: ${tokenRecord.revokedReason || "no reason provided"}`,
          reason: "TOKEN_REVOKED",
        };
      }

      // Check scopes if required
      if (requiredScopes.length > 0) {
        const hasAllScopes = requiredScopes.every((scope) =>
          decoded.scopes.includes(scope)
        );

        if (!hasAllScopes) {
          await this.logAudit({
            eventType: "SCOPE_VIOLATION",
            jti: decoded.jti,
            userId: decoded.userId,
            appName: decoded.appName,
            requestedScopes: requiredScopes,
            scopes: decoded.scopes,
            result: "DENIED",
            reason: "INSUFFICIENT_SCOPE",
            ipAddress,
          });

          return {
            valid: false,
            decoded,
            error: `Missing required scopes: ${requiredScopes.join(", ")}`,
            reason: "INSUFFICIENT_SCOPE",
          };
        }
      }

      // Update usage tracking
      await AccessToken.updateOne(
        { jti: decoded.jti },
        {
          usageCount: tokenRecord.usageCount + 1,
          lastUsedAt: new Date(),
        }
      );

      return {
        valid: true,
        decoded,
      };
    } catch (error) {
      console.error("[TokenService] Error verifying token:", error.message);
      return {
        valid: false,
        error: error.message,
        reason: "VERIFICATION_ERROR",
      };
    }
  }

  /**
   * Revoke a token immediately
   * @param {string} jti - JWT ID
   * @param {string} userId - User ID (for verification)
   * @param {string} reason - Revocation reason
   * @returns {Promise<{success, message}>}
   */
  static async revokeToken(jti, userId, reason = "User requested revocation") {
    try {
      const result = await AccessToken.updateOne(
        { jti, userId }, // Ensure user can only revoke their own tokens
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason,
          updatedAt: new Date(),
        }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          message: "Token not found or you don't have permission to revoke it",
        };
      }

      // Audit log: token revoked
      await this.logAudit({
        eventType: "TOKEN_REVOKED",
        jti,
        userId,
        result: "SUCCESS",
        reason,
      });

      return {
        success: true,
        message: "Token revoked successfully",
      };
    } catch (error) {
      console.error("[TokenService] Error revoking token:", error.message);
      throw error;
    }
  }

  /**
   * Get user's active tokens
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  static async getUserTokens(userId) {
    try {
      const tokens = await AccessToken.find({
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }, // Not expired
      }).select("-tokenHash"); // Don't return token hashes

      return tokens;
    } catch (error) {
      console.error("[TokenService] Error getting user tokens:", error.message);
      throw error;
    }
  }

  /**
   * Log audit event
   * @param {object} auditData - Audit event data
   * @returns {Promise}
   */
  static async logAudit(auditData) {
    try {
      const log = new AuditLog({
        timestamp: new Date(),
        ...auditData,
      });

      await log.save();
    } catch (error) {
      console.error("[TokenService] Error logging audit:", error.message);
      // Don't throw - audit logging should not break application flow
    }
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to return
   * @returns {Promise<Array>}
   */
  static async getUserAuditLogs(userId, limit = 50) {
    try {
      return await AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error("[TokenService] Error getting audit logs:", error.message);
      throw error;
    }
  }
}

module.exports = TokenService;
