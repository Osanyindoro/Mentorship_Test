#!/bin/bash
# AWS S3 & CloudFront Deployment Script for Jobberman x Mastercard Foundation Mentorship Portal
# Domain: mentorship.jobberman.com

set -e

S3_BUCKET="s3://mentorship.jobberman.com"
DIST_DIR="dist"
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC" # Replace with your AWS CloudFront Distribution ID

echo "🚀 Building production bundle..."
npm run build

echo "📦 Syncing static assets to AWS S3 (${S3_BUCKET})..."
aws s3 sync ${DIST_DIR} ${S3_BUCKET} \
  --delete \
  --cache-control "max-age=31536000,public" \
  --exclude "index.html"

echo "📄 Uploading index.html with no-cache headers..."
aws s3 cp ${DIST_DIR}/index.html ${S3_BUCKET}/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

echo "🔄 Invalidating CloudFront edge cache..."
aws cloudfront create-invalidation \
  --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
  --paths "/*"

echo "✅ Production deployment to mentorship.jobberman.com completed successfully!"
