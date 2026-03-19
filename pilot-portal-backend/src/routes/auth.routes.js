// src/routes/auth.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
	registerUser,
	loginUser,
	getCurrentUser,
	getCognitoLoginUrl,
	handleCognitoCallback,
	createSessionFromCognitoToken,
	cognitoDiagnostics,
	issueAccessToken,
	getAccessTokens,
	revokeAccessToken,
	getAuditLogs,
	bootstrapAdmin
} = require("../controllers/auth.controller");

const router = express.Router();

// User authentication (Email/Password - keep for backward compatibility)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, getCurrentUser);

// AWS Cognito authentication
router.get("/cognito-login", getCognitoLoginUrl); // Get Cognito login URL
router.post("/cognito-callback", handleCognitoCallback); // Exchange code for tokens (backend-to-Cognito)
router.post("/cognito-session", createSessionFromCognitoToken); // Create session from ID token (frontend-exchanged)
router.get("/cognito-diagnostics", cognitoDiagnostics); // Diagnostic endpoint (no auth required)

// Bootstrap admin (only works if no admin exists)
router.post("/bootstrap-admin", bootstrapAdmin); // Promote first admin user

// Token management (scoped, delegated access)
router.post("/token/issue", auth, issueAccessToken); // Issue a new access token
router.get("/tokens", auth, getAccessTokens); // Get user's active tokens
router.post("/token/revoke", auth, revokeAccessToken); // Revoke a token
router.get("/audit-logs", auth, getAuditLogs); // Get token usage audit logs

module.exports = router;
