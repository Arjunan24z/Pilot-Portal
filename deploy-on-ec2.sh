#!/bin/bash
# Pilot Portal Deployment Script
set -e

echo "Starting Pilot Portal deployment..."
cd /home/ubuntu

# Update system
echo "Updating system..."
sudo apt-get update >/dev/null 2>&1
sudo apt-get upgrade -y >/dev/null 2>&1

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y docker.io docker-compose git curl openssl >/dev/null 2>&1

# Enable Docker for ubuntu user
sudo usermod -aG docker ubuntu
sudo systemctl start docker
sudo systemctl enable docker

# Clone repo if not exists
if [ ! -d "Pilot-Portal" ]; then
    echo "Cloning Pilot Portal..."
    git clone https://github.com/Arjunan24z/Pilot-Portal.git
fi

cd Pilot-Portal

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create docker-compose.yml
cat > docker-compose.yml << 'ENDFILE'
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
      MONGO_URI: mongodb://admin:admin123@mongodb:27017/pilot_portal?authSource=admin
      JWT_SECRET: REPLACE_JWT_SECRET
      NODE_ENV: production
      PORT: 5000
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
      BACKEND_URL: http://localhost:5000
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
ENDFILE

# Replace JWT secret placeholder
sed -i "s|REPLACE_JWT_SECRET|$JWT_SECRET|g" docker-compose.yml

echo "Building Docker images..."
docker-compose build

echo "Starting containers..."
docker-compose up -d

sleep 10

echo "Deployment complete!"
docker-compose ps
