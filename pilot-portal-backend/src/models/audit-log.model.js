const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  // Event metadata
  eventType: {
    type: String,
    enum: ["TOKEN_ISSUED", "TOKEN_USED", "TOKEN_REVOKED", "ACCESS_GRANTED", "ACCESS_DENIED", "SCOPE_VIOLATION"],
    required: true
  },
  
  // User & App
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appName: String,
  jti: String, // JWT ID for correlation
  
  // Resource
  resourceType: String, // "logbook", "license", "medicals", "profile"
  resourceId: String,
  action: String, // "READ", "WRITE", "UPDATE", "DELETE"
  
  // Details
  scopes: [String],
  requestedScopes: [String],
  result: { type: String, enum: ["SUCCESS", "DENIED", "REVOKED", "EXPIRED"], required: true },
  
  // Error/Reason if denied
  reason: String, // e.g., "INSUFFICIENT_SCOPE", "TOKEN_REVOKED", "TOKEN_EXPIRED"
  
  // Request info
  ipAddress: String,
  userAgent: String,
  requestMethod: String,
  requestPath: String,
  
  // Timestamps
  timestamp: { type: Date, default: Date.now },
});

// Index for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ jti: 1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
