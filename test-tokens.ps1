# Pilot Portal - Cloud Token Testing Script
# Tests all token functionality via API

$API_URL = "http://localhost:5000"
$EMAIL = "test@example.com"
$PASSWORD = "password123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOT PORTAL - TOKEN TESTING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Login
Write-Host "STEP 1: Logging in..." -ForegroundColor Yellow
$loginResponse = curl -s -X POST "$API_URL/auth/login" `
  -H "Content-Type: application/json" `
  -d "{`"email`":`"$EMAIL`",`"password`":`"$PASSWORD`"}"

$loginData = $loginResponse | ConvertFrom-Json
$token = $loginData.token
$userId = $loginData.user.id

if ($token) {
  Write-Host "✓ Login successful!" -ForegroundColor Green
  Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
  Write-Host "  User ID: $userId" -ForegroundColor Gray
}
else {
  Write-Host "✗ Login failed!" -ForegroundColor Red
  Write-Host $loginResponse
  exit 1
}

Write-Host ""

# STEP 2: Generate a Cloud Token
Write-Host "STEP 2: Generating Cloud Token..." -ForegroundColor Yellow
$tokenResponse = curl -s -X POST "$API_URL/auth/token/issue" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{`"name`":`"My Test Token`",`"scopes`":[`"logbook:read`",`"logbook:write`"],`"expiresIn`":86400}"

$tokenData = $tokenResponse | ConvertFrom-Json

if ($tokenData.accessToken) {
  Write-Host "✓ Token generated successfully!" -ForegroundColor Green
  Write-Host "  Token: $($tokenData.accessToken.Substring(0,30))..." -ForegroundColor Gray
  Write-Host "  JTI: $($tokenData.jti)" -ForegroundColor Gray
  Write-Host "  Expires: $($tokenData.expiresAt)" -ForegroundColor Gray
  $cloudToken = $tokenData.accessToken
  $jti = $tokenData.jti
}
else {
  Write-Host "✗ Token generation failed!" -ForegroundColor Red
  Write-Host $tokenResponse
  exit 1
}

Write-Host ""

# STEP 3: View Active Tokens
Write-Host "STEP 3: Viewing Active Tokens..." -ForegroundColor Yellow
$tokensResponse = curl -s -X GET "$API_URL/auth/tokens" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"

$tokensData = $tokensResponse | ConvertFrom-Json

if ($tokensData.tokens) {
  Write-Host "✓ Retrieved active tokens:" -ForegroundColor Green
  foreach ($t in $tokensData.tokens) {
    Write-Host "  - Name: $($t.name)" -ForegroundColor Gray
    Write-Host "    Scopes: $($t.scopes -join ', ')" -ForegroundColor Gray
    Write-Host "    Created: $($t.createdAt)" -ForegroundColor Gray
    Write-Host "    Expires: $($t.expiresAt)" -ForegroundColor Gray
    Write-Host ""
  }
}
else {
  Write-Host "⚠ No tokens found or response error" -ForegroundColor Yellow
  Write-Host $tokensResponse
}

Write-Host ""

# STEP 4: Check Audit Logs
Write-Host "STEP 4: Checking Audit Logs..." -ForegroundColor Yellow
$auditResponse = curl -s -X GET "$API_URL/auth/audit-logs" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"

$auditData = $auditResponse | ConvertFrom-Json

if ($auditData.logs) {
  Write-Host "✓ Audit logs retrieved:" -ForegroundColor Green
  $auditData.logs | Select-Object -First 5 | ForEach-Object {
    Write-Host "  - Event: $($_.eventType) | Result: $($_.result) | IP: $($_.ipAddress)" -ForegroundColor Gray
    Write-Host "    Time: $($_.timestamp)" -ForegroundColor Gray
  }
}
else {
  Write-Host "⚠ No audit logs found" -ForegroundColor Yellow
  Write-Host $auditResponse
}

Write-Host ""

# STEP 5: Revoke the Token
Write-Host "STEP 5: Revoking Token..." -ForegroundColor Yellow
$revokeResponse = curl -s -X POST "$API_URL/auth/token/revoke" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{`"jti`":`"$jti`"}"

$revokeData = $revokeResponse | ConvertFrom-Json

if ($revokeData.message) {
  Write-Host "✓ Token revoked successfully!" -ForegroundColor Green
  Write-Host "  Message: $($revokeData.message)" -ForegroundColor Gray
}
else {
  Write-Host "✗ Token revocation failed!" -ForegroundColor Red
  Write-Host $revokeResponse
}

Write-Host ""

# STEP 6: Verify Token is Revoked
Write-Host "STEP 6: Verifying Token Revocation..." -ForegroundColor Yellow
$verifyResponse = curl -s -X GET "$API_URL/auth/tokens" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"

$verifyData = $verifyResponse | ConvertFrom-Json

if ($verifyData.tokens) {
  $revokedTokens = $verifyData.tokens | Where-Object { $_.isRevoked -eq $true }
  if ($revokedTokens) {
    Write-Host "✓ Token successfully marked as revoked!" -ForegroundColor Green
    Write-Host "  Status: REVOKED" -ForegroundColor Gray
  }
  else {
    Write-Host "⚠ Token not showing as revoked" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
