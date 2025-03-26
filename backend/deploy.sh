#!/bin/bash

# Install AWS CLI if not already installed
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Install EB CLI if not already installed
if ! command -v eb &> /dev/null; then
    echo "Installing EB CLI..."
    pip install awsebcli
fi

# Initialize EB project if not already initialized
if [ ! -d ".elasticbeanstalk" ]; then
    echo "Initializing EB project..."
    eb init sales-app-backend --platform node.js --region us-east-1
fi

# Create environment if not exists
if ! eb status | grep -q "sales-app-backend-env"; then
    echo "Creating EB environment..."
    eb create sales-app-backend-env --single
fi

# Deploy the application
echo "Deploying to Elastic Beanstalk..."
eb deploy

echo "Deployment complete!" 