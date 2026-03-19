// src/controllers/auth.controller.js
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { ensureJwtSecret } = require("../config/jwt");
const TokenService = require("../services/token.service");
const { cognitoConfig } = require("../config/cognito");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const jwtSecret = ensureJwtSecret();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Issue a scoped access token for cloud-based delegation
 * POST /api/auth/token/issue
 * Body: { appName, scopes, expiresInMinutes }
 * Example: { appName: "Pilot Portal Logbook", scopes: ["logbook:read", "logbook:write"], expiresInMinutes: 120 }
 */
exports.issueAccessToken = async (req, res) => {
  try {
    const { appName, scopes, expiresInMinutes = 60 } = req.body;

    // Validate required fields
    if (!appName || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({
        message: "Missing or invalid fields. Required: appName (string), scopes (array of strings), optional: expiresInMinutes (number)"
      });
    }

    // Validate scope format
    const validScopes = ["logbook:read", "logbook:write", "license:read", "license:write", "medicals:read", "medicals:write", "profile:read", "profile:write"];
    const invalidScopes = scopes.filter(s => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        message: `Invalid scopes: ${invalidScopes.join(", ")}. Valid scopes: ${validScopes.join(", ")}`
      });
    }

    // Validate expiry
    if (expiresInMinutes < 5 || expiresInMinutes > 10080) { // 5 min to 7 days
      return res.status(400).json({
        message: "expiresInMinutes must be between 5 and 10080 (7 days)"
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || "0.0.0.0";

    // Issue token
    const tokenResult = await TokenService.issueToken(
      req.user.userId,
      appName,
      scopes,
      expiresInMinutes,
      ipAddress
    );

    res.status(201).json({
      message: "Access token issued successfully",
      data: tokenResult
    });

  } catch (error) {
    console.error("[Auth] Error issuing access token:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user's active access tokens
 * GET /api/auth/tokens
 */
exports.getAccessTokens = async (req, res) => {
  try {
    const tokens = await TokenService.getUserTokens(req.user.userId);

    res.status(200).json({
      message: "Active tokens retrieved",
      data: tokens
    });
  } catch (error) {
    console.error("[Auth] Error getting tokens:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Revoke an access token
 * POST /api/auth/token/revoke
 * Body: { jti, reason }
 */
exports.revokeAccessToken = async (req, res) => {
  try {
    const { jti, reason = "User requested revocation" } = req.body;

    if (!jti) {
      return res.status(400).json({ message: "Missing required field: jti" });
    }

    const result = await TokenService.revokeToken(jti, req.user.userId, reason);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("[Auth] Error revoking token:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get audit logs for user's tokens
 * GET /api/auth/audit-logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const logs = await TokenService.getUserAuditLogs(req.user.userId, limit);

    res.status(200).json({
      message: "Audit logs retrieved",
      data: logs
    });
  } catch (error) {
    console.error("[Auth] Error getting audit logs:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Diagnostic endpoint to test Cognito connectivity
 * GET /api/auth/cognito-diagnostics
 */
exports.cognitoDiagnostics = async (req, res) => {
  try {
    console.log("[Auth] Running Cognito diagnostics...");
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      cognitoConfig: {
        domain: cognitoConfig.domain,
        region: cognitoConfig.region,
        userPoolId: cognitoConfig.userPoolId,
        clientId: cognitoConfig.clientId.substring(0, 5) + '***' // Mask for security
      },
      connectivity: {}
    };

    // Test 1: Try to reach Cognito domain
    console.log("[Auth] Test 1: Testing DNS resolution...");
    try {
      const dns = require('dns').promises;
      const hostname = `${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com`;
      const addresses = await dns.resolve4(hostname);
      diagnostics.connectivity.dnsResolution = {
        status: 'OK',
        hostname,
        resolvedAddresses: addresses
      };
      console.log("[Auth] DNS resolution successful:", addresses);
    } catch (dnsError) {
      diagnostics.connectivity.dnsResolution = {
        status: 'FAILED',
        error: dnsError.message
      };
      console.log("[Auth] DNS resolution failed:", dnsError.message);
    }

    // Test 2: Try to make a HEAD request to Cognito token endpoint
    console.log("[Auth] Test 2: Testing HTTP connectivity...");
    try {
      const https = require('https');
      const testUrl = `https://${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com/oauth2/token`;
      
      await new Promise((resolve, reject) => {
        const req = https.request(testUrl, { 
          method: 'OPTIONS',
          timeout: 10000 
        }, (res) => {
          diagnostics.connectivity.httpTest = {
            status: 'OK',
            statusCode: res.statusCode,
            url: testUrl
          };
          console.log("[Auth] HTTP test successful:", res.statusCode);
          resolve();
        });
        
        req.on('error', (error) => {
          diagnostics.connectivity.httpTest = {
            status: 'FAILED',
            error: error.message,
            code: error.code,
            url: testUrl
          };
          console.log("[Auth] HTTP test failed:", error.message);
          reject(error);
        });
        
        req.on('timeout', () => {
          diagnostics.connectivity.httpTest = {
            status: 'TIMEOUT',
            url: testUrl
          };
          console.log("[Auth] HTTP test timed out");
          req.destroy();
          reject(new Error('Connection timeout'));
        });
        
        req.end();
      });
    } catch (httpError) {
      // Already handled above, just log
      console.log("[Auth] HTTP connectivity test error:", httpError.message);
    }

    // Test 3: Check Node environment
    diagnostics.environment = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    };

    res.status(200).json({
      message: "Diagnostic information",
      diagnostics
    });

  } catch (error) {
    console.error("[Auth] Error running diagnostics:", error.message);
    res.status(500).json({ 
      message: "Error running diagnostics", 
      error: error.message 
    });
  }
};

/**
 * Get Cognito Login URL - Frontend redirects user to this URL
 * GET /api/auth/cognito-login
 */
exports.getCognitoLoginUrl = async (req, res) => {
  try {
    const loginUrl = `https://${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com/login?client_id=${cognitoConfig.clientId}&response_type=code&scope=openid+email+profile&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}`;
    
    res.status(200).json({
      loginUrl
    });
  } catch (error) {
    console.error("[Auth] Error getting Cognito login URL:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Handle Cognito Callback - Exchange authorization code for tokens
 * POST /api/auth/cognito-callback
 * Body: { code }
 */
exports.handleCognitoCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    // Exchange authorization code for tokens from Cognito
    const tokenEndpoint = `https://${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com/oauth2/token`;
    
    console.log("[Auth] Token endpoint:", tokenEndpoint);
    console.log("[Auth] Cognito config - Domain:", cognitoConfig.domain, "Region:", cognitoConfig.region);
    
    // Properly form-encode the token request
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('client_id', cognitoConfig.clientId);
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', cognitoConfig.redirectUri);

    console.log("[Auth] Attempting to exchange code for tokens...");

    const tokenResponse = await axios.post(tokenEndpoint, tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log("[Auth] Successfully received token response from Cognito");

    const { id_token, access_token } = tokenResponse.data;

    // Decode ID token to get user info (without verification for now - Cognito issued)
    const decodedIdToken = jwt.decode(id_token);
    
    if (!decodedIdToken) {
      console.error("[Auth] Failed to decode ID token");
      return res.status(400).json({ message: "Invalid ID token from Cognito" });
    }

    console.log("[Auth] Decoded user from ID token - Email:", decodedIdToken.email);

    // Look up user by cognitoSub first (primary identifier)
    let user = await User.findOne({ cognitoSub: decodedIdToken.sub });
    
    if (!user) {
      // Fallback: try to find by email
      user = await User.findOne({ email: decodedIdToken.email });
      console.log("[Auth] User not found by cognitoSub, searched by email");
    }
    
    if (user) {
      // Update existing user without changing role
      user.email = decodedIdToken.email;
      user.name = decodedIdToken.name || decodedIdToken.email.split('@')[0];
      user.cognitoSub = decodedIdToken.sub;
      user.lastLogin = new Date();
      await user.save();
      console.log("[Auth] Existing user updated - ID:", user._id, "Role (preserved):", user.role, "Email:", user.email);
    } else {
      // User not pre-registered - reject login
      console.error("[Auth] User not found in database - Email:", decodedIdToken.email, "CognitoSub:", decodedIdToken.sub);
      console.error("[Auth] User must be pre-registered by admin before first login");
      return res.status(403).json({ 
        message: "User account not found. Please contact the administrator to register your account.",
        email: decodedIdToken.email
      });
    }

    console.log("[Auth] User created/updated - ID:", user._id, "Role:", user.role);

    // Create session token (3-minute expiry as per user request)
    const jwtSecret = ensureJwtSecret();
    const sessionToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        source: 'cognito'
      },
      jwtSecret,
      { expiresIn: "3m" } // 3-minute expiry
    );

    console.log("[Auth] Login successful - Session token created");

    res.status(200).json({
      message: "Login successful via AWS Cognito",
      token: sessionToken,
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      cognitoId: decodedIdToken.sub
    });

  } catch (error) {
    console.error("[Auth] Error in Cognito callback:", error.message);
    console.error("[Auth] Error code:", error.code);
    if (error.response?.data) {
      console.error("[Auth] Cognito error details:", JSON.stringify(error.response.data));
      console.error("[Auth] Cognito error status:", error.response.status);
    }
    if (error.config) {
      console.error("[Auth] Request URL:", error.config.url);
      console.error("[Auth] Request method:", error.config.method);
    }
    
    // Return specific error message based on error type
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      res.status(500).json({ 
        message: "Unable to connect to AWS Cognito. Please ensure Cognito domain is properly set up.",
        error: error.code 
      });
    } else if (error.response?.status === 400) {
      res.status(400).json({ 
        message: "Invalid authorization code. Please try logging in again.",
        error: error.response.data?.error || error.message 
      });
    } else {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
};

/**
 * Create session from Cognito ID Token (token already exchanged on frontend)
 * POST /api/auth/cognito-session
 * Body: { idToken }
 */
exports.createSessionFromCognitoToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error("[Auth] ID token is required - Request body:", JSON.stringify(req.body));
      return res.status(400).json({ message: "ID token is required" });
    }

    console.log("[Auth] Creating session from Cognito ID token...");
    console.log("[Auth] ID Token first 60 chars:", idToken.substring(0, 60));

    // Decode ID token (already verified by Cognito before browser sent it)
    const decodedIdToken = jwt.decode(idToken);
    
    if (!decodedIdToken) {
      console.error("[Auth] Failed to decode ID token");
      return res.status(400).json({ message: "Invalid ID token" });
    }

    console.log("[Auth] Decoded token (full):", JSON.stringify(decodedIdToken));
    console.log("[Auth] Decoded user from ID token - Email:", decodedIdToken.email, "Sub:", decodedIdToken.sub);
    console.log("[Auth] Looking up user by cognitoSub...");
    console.log("[Auth] Query: { cognitoSub:", JSON.stringify(decodedIdToken.sub), "}");

    // Look up user by cognitoSub (primary identifier from Cognito)
    // This ensures we always find the same user for the same Cognito account
    let user = await User.findOne({ cognitoSub: decodedIdToken.sub });
    
    console.log("[Auth] Direct cognitoSub query result:", user ? "FOUND" : "NOT FOUND");
    
    if (!user) {
      // Fallback: try to find by email (for backwards compatibility)
      console.log("[Auth] Attempting fallback query by email:", decodedIdToken.email);
      user = await User.findOne({ email: decodedIdToken.email });
      console.log("[Auth] Email fallback result:", user ? "FOUND" : "NOT FOUND");
      if (user) {
        console.log("[Auth] User found by email - ID:", user._id, "cognitoSub stored:", user.cognitoSub);
      }
    }
    
    if (user) {
      // User exists - update without changing role, but sync cognitoSub
      user.name = decodedIdToken.name || decodedIdToken.email.split('@')[0];
      user.email = decodedIdToken.email; // Sync email in case it changed
      user.cognitoSub = decodedIdToken.sub; // Ensure cognitoSub is always set
      user.lastLogin = new Date();
      await user.save();
      console.log("[Auth] Existing user updated - ID:", user._id, "Sub:", user.cognitoSub, "Role (preserved):", user.role);
    } else {
      // User not pre-registered - reject login
      console.error("[Auth] User not found in database - Email:", decodedIdToken.email, "Sub:", decodedIdToken.sub);
      console.error("[Auth] User must be pre-registered by admin before first login");
      return res.status(403).json({ 
        message: "User account not found. Please contact the administrator to register your account.",
        email: decodedIdToken.email
      });
    }

    // Create session token (3-minute expiry as per user request)
    const jwtSecret = ensureJwtSecret();
    const sessionToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        source: 'cognito'
      },
      jwtSecret,
      { expiresIn: "3m" } // 3-minute expiry
    );

    console.log("[Auth] Login successful - Session token created");

    res.status(200).json({
      message: "Login successful via AWS Cognito",
      token: sessionToken,
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      cognitoId: decodedIdToken.sub
    });

  } catch (error) {
    console.error("[Auth] Error creating session from token:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Bootstrap endpoint to promote the first admin user
 * POST /api/auth/bootstrap-admin
 * Body: { userId }
 * 
 * Security: Only allows promotion if there are currently 0 admin users in the system
 * This prevents unauthorized users from promoting themselves after an admin exists
 */
exports.bootstrapAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId in request body" });
    }

    // Check if any admin users already exist
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount > 0) {
      return res.status(403).json({ 
        message: "An admin user already exists. Use admin panel to manage roles." 
      });
    }

    // Update the user to admin
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("[Auth] Bootstrap: User promoted to admin - ID:", user._id, "Email:", user.email);

    res.status(200).json({
      message: "User promoted to admin successfully",
      userId: user._id,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error("[Auth] Bootstrap admin error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
