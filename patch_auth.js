const fs = require('fs');
const path = require('path');

const authControllerPath = '/app/src/controllers/auth.controller.js';

// Read the file
let content = fs.readFileSync(authControllerPath, 'utf-8');

// Find and replace the problematic section
const oldCode = `    } else {
      // New user - create with default 'pilot' role
      user = await User.create({
        email: decodedIdToken.email,
        name: decodedIdToken.name || decodedIdToken.email.split('@')[0],
        cognitoSub: decodedIdToken.sub,
        role: 'pilot', // Default role for new Cognito users
        lastLogin: new Date()
      });
      console.log("[Auth] New user created - ID:", user._id, "Sub:", decodedIdToken.sub, "Role:", user.role);
    }`;

const newCode = `    } else {
      // User not pre-registered - reject login
      console.error("[Auth] User not found in database - Email:", decodedIdToken.email, "Sub:", decodedIdToken.sub);
      console.error("[Auth] User must be pre-registered by admin before first login");
      return res.status(403).json({ 
        message: "User account not found. Please contact the administrator to register your account.",
        email: decodedIdToken.email
      });
    }`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(authControllerPath, content, 'utf-8');
  console.log('✅ Successfully patched auth.controller.js');
  console.log('   - Removed auto-creation of users with default pilot role');
  console.log('   - Now requires pre-registration in database');
} else {
  console.log('❌ Could not find the code to replace');
  console.log('   Make sure the auth.controller.js file has the expected structure');
}
