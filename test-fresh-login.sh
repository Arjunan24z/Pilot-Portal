#!/bin/bash
# Complete cleanup and fresh start

echo "=== Cleaning up old browser cache ==="
echo "1. Close all browser windows completely"
echo "2. Delete client socket cache"

# Clear Docker logs
docker logs pilot-portal-backend --tail 0 > /dev/null 2>&1

# Verify database state
echo ""
echo "=== DATABASE STATE ==="
docker exec pilot-portal-mongodb mongosh pilot_portal --eval "
  console.log('Total users:', db.users.countDocuments());
  db.users.find({}, {email:1, role:1}).pretty();
"

echo ""
echo "=== BACKEND STATUS ==="
docker ps --filter name=pilot-portal-backend --format "{{.Names}} - {{.Status}}"

echo ""
echo "=== INSTRUCTIONS ==="
echo "1. Press Ctrl+Shift+Delete in browser to open Clear Browsing Data"
echo "2. Select 'All time' for time range"
echo "3. Check: Cookies, Cached images/files, Hosted app data, Local storage"
echo "4. Click 'Clear data'"
echo "5. Close browser completely"
echo "6. Restart browser"
echo "7. Go to http://localhost:4200/login"
echo "8. Click 'Sign in with AWS Cognito'"
echo "9. Check backend logs: docker logs pilot-portal-backend --tail 50"
