#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Show the Sui version
echo "Sui CLI version:"
sui --version

# Clean up any previous build artifacts
rm -rf build/

# Build the package without dependencies
echo "Building Move package..."
sui move build

# Check that the testnet environment is configured
echo "Checking testnet environment..."
sui client envs

# Make sure we're using testnet
echo "Switching to testnet environment..."
sui client switch --env testnet

# Publish to testnet
echo "Publishing package to testnet..."
RESULT=$(sui client publish --gas-budget 100000000 2>&1)
echo "$RESULT"

# Extract the package ID - this pattern may need adjustment
PACKAGE_ID=$(echo "$RESULT" | grep -o "packageId: 0x[a-f0-9]\+" | head -1 | cut -d ' ' -f 2)
if [ -n "$PACKAGE_ID" ]; then
  echo "Successfully published TuriCheck with package ID: $PACKAGE_ID"
  
  # Update the frontend .env file
  ENV_FILE="../../apps/frontend/.env.local"
  if grep -q "NEXT_PUBLIC_PACKAGE_ID" "$ENV_FILE"; then
    sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID|" "$ENV_FILE"
  else
    echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" >> "$ENV_FILE"
  fi
  echo "Updated $ENV_FILE with new package ID"
else
  echo "Failed to extract package ID. Please check the output above."
  exit 1
fi