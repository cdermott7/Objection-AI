#!/bin/bash

set -e

# This script uses Docker to deploy the Move contract to the Sui testnet
# It ensures compatibility by using the same version of Sui CLI in the container

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Creating temporary directory at $TEMP_DIR"

# Copy the contract files to the temporary directory
cp -r /Users/coledermott/TuriCheck/contracts/move/src $TEMP_DIR/
cp /Users/coledermott/TuriCheck/contracts/move/Move.toml $TEMP_DIR/

# Write the dockerfile
cat > $TEMP_DIR/Dockerfile << EOF
FROM mysten/sui:latest

WORKDIR /app
COPY . .

# Print Sui version
RUN sui --version

# Create a keypair
RUN sui client new-address ed25519

# Request gas tokens using the Sui faucet
RUN sui client faucet

# Build and publish the contract
RUN sui move build
RUN sui client publish --gas-budget 100000000
EOF

# Navigate to the temporary directory
cd $TEMP_DIR

# Build the Docker image
echo "Building Docker image..."
docker build -t turicheck-deployer .

# Run the container
echo "Running deployment in Docker container..."
docker run --rm turicheck-deployer

# Clean up
echo "Cleaning up temporary directory..."
rm -rf $TEMP_DIR

echo "Deployment script completed. Please check the output above for your package ID."