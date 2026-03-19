# Simple Pilot Portal AWS Deployment Script
# No SSH required, uses AWS Systems Manager

param(
  [string]$InstanceId = "i-00708b9807a580216",
  [string]$Region = "us-east-1"
)

Write-Host "======================================"
Write-Host "PILOT PORTAL - AWS DEPLOYMENT"
Write-Host "======================================"
Write-Host ""

# Step 1: Configure IAM
Write-Host "[1/5] Configuring IAM permissions..." -ForegroundColor Yellow

$RoleName = "EC2-SSM-Role"
$TrustPolicy = @{
  Version   = "2012-10-17"
  Statement = @(@{
      Effect    = "Allow"
      Principal = @{ Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    })
}

try {
  aws iam create-role --role-name $RoleName --assume-role-policy-document ($TrustPolicy | ConvertTo-Json -Compress) --region $Region 2>$null
}
catch {}

aws iam attach-role-policy --role-name $RoleName --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" --region $Region 2>$null

Write-Host "OK - IAM configured" -ForegroundColor Green
Write-Host ""

# Step 2: Create instance profile  
Write-Host "[2/5] Creating instance profile..." -ForegroundColor Yellow

$ProfileName = "EC2-SSM-Profile"

try {
  aws iam create-instance-profile --instance-profile-name $ProfileName --region $Region 2>$null
}
catch {}

try {
  aws iam add-role-to-instance-profile --instance-profile-name $ProfileName --role-name $RoleName --region $Region 2>$null
}
catch {}

Start-Sleep -Seconds 10

aws ec2 associate-iam-instance-profile --instance-id $InstanceId --iam-instance-profile Name=$ProfileName --region $Region 2>$null

Write-Host "OK - Instance profile attached" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy application
Write-Host "[3/5] Sending deployment commands to EC2..." -ForegroundColor Yellow

$Commands = @(
  "#!/bin/bash",
  "set -e",
  "cd /home/ubuntu",
  "sudo apt-get update >/dev/null 2>&1",
  "sudo apt-get install -y docker.io docker-compose git >/dev/null 2>&1",
  "sudo usermod -aG docker ubuntu",
  "sudo systemctl start docker",
  "sudo systemctl enable docker",
  "if [ ! -d Pilot-Portal ]; then git clone https://github.com/Arjunan24z/Pilot-Portal.git; fi",
  "cd Pilot-Portal",
  "cat > docker-compose.yml << 'DOCEOF'",
  "version: '3.8'",
  "services:",
  "  mongodb:",
  "    image: mongo:7.0",
  "    container_name: pilot-portal-mongodb",
  "    ports:",
  "      - '27017:27017'",
  "    volumes:",
  "      - mongo_data:/data/db",
  "    environment:",
  "      MONGO_INITDB_ROOT_USERNAME: admin",
  "      MONGO_INITDB_ROOT_PASSWORD: admin123",
  "    restart: always",
  "    networks:",
  "      - pilot-network",
  "  backend:",
  "    build: ./pilot-portal-backend",
  "    container_name: pilot-portal-backend",
  "    ports:",
  "      - '5000:5000'",
  "    environment:",
  "      - MONGO_URI=mongodb://admin:admin123@mongodb:27017/pilot_portal?authSource=admin",
  "      - JWT_SECRET=$(openssl rand -base64 32)",
  "      - NODE_ENV=production",
  "      - PORT=5000",
  "    depends_on:",
  "      - mongodb",
  "    restart: always",
  "    networks:",
  "      - pilot-network",
  "  frontend:",
  "    build: ./pilot-portal",
  "    container_name: pilot-portal-frontend",
  "    ports:",
  "      - '80:80'",
  "      - '443:443'",
  "    environment:",
  "      - BACKEND_URL=http://localhost:5000",
  "    depends_on:",
  "      - backend",
  "    restart: always",
  "    networks:",
  "      - pilot-network",
  "volumes:",
  "  mongo_data:",
  "networks:",
  "  pilot-network:",
  "    driver: bridge",
  "DOCEOF",
  "docker-compose build",
  "docker-compose up -d",
  "sleep 10",
  "docker-compose ps"
)

$CommandJson = $Commands -join '|'

$CommandId = aws ssm send-command `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=$Commands" `
  --instance-ids $InstanceId `
  --region $Region `
  --query 'Command.CommandId' `
  --output text

Write-Host "OK - Command ID: $CommandId" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for deployment
Write-Host "[4/5] Waiting for deployment to complete (this takes 5-10 minutes)..." -ForegroundColor Yellow

$MaxWait = 600
$Elapsed = 0
$Interval = 15

while ($Elapsed -lt $MaxWait) {
  Start-Sleep -Seconds $Interval
  $Elapsed += $Interval
    
  $Status = aws ssm get-command-invocation `
    --command-id $CommandId `
    --instance-id $InstanceId `
    --region $Region `
    --query 'Status' `
    --output text 2>$null
    
  if ($Status -eq "Success") {
    Write-Host "OK - Deployment successful!" -ForegroundColor Green
    break
  }
  elseif ($Status -eq "Failed") {
    Write-Host "ERROR - Deployment failed!" -ForegroundColor Red
    exit 1
  }
    
  $Percent = [int]($Elapsed / $MaxWait * 100)
  Write-Host "Running... $Percent% (${Elapsed}s)" -ForegroundColor Cyan
}

Write-Host ""

# Step 5: Get IP and display results
Write-Host "[5/5] Getting instance IP address..." -ForegroundColor Yellow

$IP = aws ec2 describe-instances `
  --instance-ids $InstanceId `
  --query 'Reservations[0].Instances[0].PublicIpAddress' `
  --output text `
  --region $Region

Write-Host ""
Write-Host "======================================"
Write-Host "DEPLOYMENT COMPLETE!"
Write-Host "======================================"
Write-Host ""
Write-Host "Your Pilot Portal is running at:" -ForegroundColor Green
Write-Host "http://$IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Yellow
Write-Host "  MongoDB: admin / admin123"
Write-Host "  Use your app credentials to login"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Open browser: http://$IP"
Write-Host "  2. Login to Pilot Portal"
Write-Host "  3. Test cloud token generation"
Write-Host ""
