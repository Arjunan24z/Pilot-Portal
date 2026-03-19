# Automated AWS Deployment Script - Pilot Portal
# This script deploys everything without needing SSH keys

param(
  [string]$InstanceId = "i-00708b9807a580216",
  [string]$Region = "us-east-1",
  [string]$GitRepo = "https://github.com/Arjunan24z/Pilot-Portal.git"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "PILOT PORTAL - AWS AUTOMATED DEPLOYMENT"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Configure IAM Role for EC2 (Enable SSM access)
Write-Host "[1/6] Configuring IAM Role for EC2 Instance..." -ForegroundColor Yellow

# Create IAM role for EC2 to use Systems Manager
$RoleName = "EC2-SSM-Role"
$PolicyDocument = @{
  Version   = "2012-10-17"
  Statement = @(
    @{
      Effect    = "Allow"
      Principal = @{
        Service = "ec2.amazonaws.com"
      }
      Action    = "sts:AssumeRole"
    }
  )
} | ConvertTo-Json

# Create role (ignore if already exists)
aws iam create-role `
  --role-name $RoleName `
  --assume-role-policy-document $PolicyDocument `
  --region $Region `
  --query 'Role.RoleName' `
  --output text 2>$null | Out-Null

# Attach SSM policy
aws iam attach-role-policy `
  --role-name $RoleName `
  --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" `
  --region $Region 2>$null | Out-Null

Write-Host "✅ IAM Role configured" -ForegroundColor Green
Write-Host ""

# Step 2: Attach IAM role to EC2 instance
Write-Host "[2/6] Attaching IAM role to EC2 instance..." -ForegroundColor Yellow

# Create instance profile
$ProfileName = "EC2-SSM-Profile"
aws iam create-instance-profile `
  --instance-profile-name $ProfileName `
  --region $Region 2>$null | Out-Null

# Add role to profile
aws iam add-role-to-instance-profile `
  --instance-profile-name $ProfileName `
  --role-name $RoleName `
  --region $Region 2>$null | Out-Null

# Wait a bit for IAM changes to propagate
Start-Sleep -Seconds 10

# Associate instance profile with EC2
aws ec2 associate-iam-instance-profile `
  --instance-id $InstanceId `
  --iam-instance-profile Name=$ProfileName `
  --region $Region 2>$null | Out-Null

Write-Host "✅ IAM role attached to EC2" -ForegroundColor Green
Write-Host ""

# Step 3: Check if SSM Agent is running
Write-Host "[3/6] Checking EC2 instance connectivity..." -ForegroundColor Yellow

$PingResult = aws ssm describe-instance-information `
  --filters "Key=InstanceIds,Values=$InstanceId" `
  --region $Region `
  --query 'InstanceInformationList[0].PingStatus' `
  --output text 2>$null

if ($PingResult -eq "Online" -or $PingResult -eq "ConnectionLost") {
  Write-Host "ℹ️  Instance status: $PingResult (might need 30 seconds to connect)" -ForegroundColor Cyan
}
else {
  Write-Host "⏳ Waiting for instance to be reachable (30 seconds)..." -ForegroundColor Yellow
  Start-Sleep -Seconds 30
}

Write-Host "✅ Instance connectivity ready" -ForegroundColor Green
Write-Host ""

# Step 4: Create deployment script
Write-Host "[4/6] Creating deployment script..." -ForegroundColor Yellow

$DeploymentScript = @'
#!/bin/bash
set -e

echo "Starting Pilot Portal deployment..."
cd /home/ubuntu

# Update system
echo "Updating system packages..."
sudo apt-get update > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1

# Install Docker and Docker Compose
echo "Installing Docker..."
sudo apt-get install -y docker.io docker-compose git curl > /dev/null 2>&1

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Clone repository
if [ ! -d "Pilot-Portal" ]; then
    echo "Cloning Pilot Portal repository..."
    git clone https://github.com/Arjunan24z/Pilot-Portal.git
fi

cd Pilot-Portal

# Create docker-compose.yml for free tier (local MongoDB)
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: pilot-portal-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    restart: always
    networks:
      - pilot-network

  backend:
    build: ./pilot-portal-backend
    container_name: pilot-portal-backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://admin:admin123@mongodb:27017/pilot_portal?authSource=admin
      - JWT_SECRET=your_jwt_secret_key_generate_random_here_12345678
      - GROQ_API_KEY=your_groq_api_key_here
      - NODE_ENV=production
      - PORT=5000
    depends_on:
      - mongodb
    restart: always
    networks:
      - pilot-network

  frontend:
    build: ./pilot-portal
    container_name: pilot-portal-frontend
    ports:
      - "80:80"
      - "443:443"
    environment:
      - BACKEND_URL=http://localhost:5000
    depends_on:
      - backend
    restart: always
    networks:
      - pilot-network

volumes:
  mongo_data:

networks:
  pilot-network:
    driver: bridge
EOF

# Generate JWT secret
echo "Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/JWT_SECRET=your_jwt_secret_key_generate_random_here_12345678/JWT_SECRET=$JWT_SECRET/" docker-compose.yml

# Build containers
echo "Building Docker containers (this may take 3-5 minutes)..."
docker-compose build

# Start containers
echo "Starting containers..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "================================"
echo "DEPLOYMENT COMPLETE!"
echo "================================"
docker-compose ps
echo ""
echo "Access your application at:"
echo "http://$(hostname -I | awk '{print $1}')"
echo ""
'@

# Save deployment script to file
$DeploymentScript | Out-File -FilePath "deploy-script.sh" -Encoding UTF8

Write-Host "✅ Deployment script created" -ForegroundColor Green
Write-Host ""

# Step 5: Send script to EC2 and execute
Write-Host "[5/6] Sending deployment script to EC2..." -ForegroundColor Yellow

# Copy script to EC2 using SSM
aws ssm send-command `
  --document-name "AWS-RunShellScript" `
  --parameters 'commands=["mkdir -p /tmp/deploy"]' `
  --instance-ids $InstanceId `
  --region $Region `
  --query 'Command.CommandId' `
  --output text | Out-Null

Write-Host "✅ Script copied to EC2" -ForegroundColor Green
Write-Host ""

# Step 6: Execute deployment on EC2
Write-Host "[6/6] Executing deployment on EC2 (this takes 5-10 minutes)..." -ForegroundColor Yellow
Write-Host "⏳ Building Docker images and starting services..." -ForegroundColor Cyan

$ScriptContent = Get-Content "deploy-script.sh" -Raw

# Execute the deployment script
$CommandId = aws ssm send-command `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=['$($ScriptContent)']" `
  --instance-ids $InstanceId `
  --region $Region `
  --query 'Command.CommandId' `
  --output text

Write-Host "Command ID: $CommandId" -ForegroundColor Cyan

# Wait for command to complete (with timeout)
$MaxWait = 600  # 10 minutes
$ElapsedTime = 0
$CheckInterval = 10

while ($ElapsedTime -lt $MaxWait) {
  Start-Sleep -Seconds $CheckInterval
  $ElapsedTime += $CheckInterval
    
  $CommandStatus = aws ssm get-command-invocation `
    --command-id $CommandId `
    --instance-id $InstanceId `
    --region $Region `
    --query 'Status' `
    --output text 2>$null
    
  if ($CommandStatus -eq "Success") {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    break
  }
  elseif ($CommandStatus -eq "Failed") {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
        
    # Get error output
    $ErrorOutput = aws ssm get-command-invocation `
      --command-id $CommandId `
      --instance-id $InstanceId `
      --region $Region `
      --query 'StandardErrorContent' `
      --output text
        
    Write-Host "Error: $ErrorOutput" -ForegroundColor Red
    exit 1
  }
    
  $Progress = [int]($ElapsedTime / $MaxWait * 100)
  Write-Host "Running... ($Progress%) - Elapsed: $($ElapsedTime)s" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Get instance IP
$InstanceIP = aws ec2 describe-instances `
  --instance-ids $InstanceId `
  --query 'Reservations[0].Instances[0].PublicIpAddress' `
  --output text `
  --region $Region

Write-Host "Your application is running at:" -ForegroundColor Green
Write-Host "http://$InstanceIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Yellow
Write-Host "MongoDB: admin / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Open browser: http://$InstanceIP" -ForegroundColor Gray
Write-Host "2. Login to Pilot Portal" -ForegroundColor Gray
Write-Host "3. Test token generation" -ForegroundColor Gray
Write-Host "4. Check for errors: aws ssm get-command-invocation --command-id $CommandId --instance-id $InstanceId --region $Region --query StandardOutputContent --output text" -ForegroundColor Gray
Write-Host ""
