// src/config/cognito.js
const aws = require('aws-sdk');

// Cognito configuration
const cognito = new aws.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION || 'us-east-1'
});

const cognitoConfig = {
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_LzGkKvhAE',
  clientId: process.env.COGNITO_CLIENT_ID || '7de7b7jvlt2u85icqkm4e67aun',
  domain: process.env.COGNITO_DOMAIN || 'pilot-portal-9367',
  region: process.env.AWS_REGION || 'us-east-1',
  redirectUri: process.env.COGNITO_REDIRECT_URI || 'http://localhost:4200/auth/callback'
};

module.exports = {
  cognito,
  cognitoConfig
};
