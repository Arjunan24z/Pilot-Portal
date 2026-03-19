const mongoose = require("mongoose");

const accessTokenSchema = new mongoose.Schema({
  // Token metadata
  jti: { type: String, unique: true, required: true }, // JWT ID for revocation tracking
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // App & Permissions
  appName: { type: String, required: true }, // e.g., "Pilot Portal Logbook"
  scopes: { type: [String], required: true }, // e.g., ["logbook:read", "logbook:write", "license:read"]
  
  // Token Content (store copy for audit trail)
  tokenHash: { type: String, required: true }, // Hash of JWT for security (don't store plaintext)
  expiresAt: { type: Date, required: true },
  
  // Revocation & Status
  isRevoked: { type: Boolean, default: false },
  revokedAt: Date,
  revokedReason: String,
  
  // Usage Tracking
  usageCount: { type: Number, default: 0 },
  lastUsedAt: Date,
  
  // IPs (optional security feature)
  issuedFromIp: String,
  allowedIps: [String], // Empty = allow all
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model("AccessToken", accessTokenSchema);
