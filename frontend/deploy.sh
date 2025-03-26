#!/bin/bash

# Install AWS CLI if not already installed
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Build the React application
echo "Building React application..."
npm run build

# Create S3 bucket if it doesn't exist
BUCKET_NAME="sales-app-frontend-$(date +%Y%m%d)"
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 > /dev/null; then
    echo "Creating S3 bucket..."
    aws s3 mb "s3://$BUCKET_NAME" --region us-east-1
    aws s3 website --bucket $BUCKET_NAME --index-document index.html --error-document index.html
fi

# Upload build files to S3
echo "Uploading files to S3..."
aws s3 sync build/ "s3://$BUCKET_NAME" --delete

# Create CloudFront distribution if it doesn't exist
echo "Creating CloudFront distribution..."
aws cloudfront create-distribution \
    --origin-domain-name "$BUCKET_NAME.s3.amazonaws.com" \
    --default-root-object index.html \
    --enabled \
    --default-cache-behavior "{\"TargetOriginId\":\"S3Origin\",\"ViewerProtocolPolicy\":\"redirect-to-https\",\"AllowedMethods\":{\"Quantity\":2,\"Items\":[\"HEAD\",\"GET\"]},\"ForwardedValues\":{\"QueryString\":false,\"Cookies\":{\"Forward\":\"none\"}},\"MinTTL\":0,\"DefaultTTL\":86400,\"MaxTTL\":31536000,\"Compress\":true}"

echo "Deployment complete!" 