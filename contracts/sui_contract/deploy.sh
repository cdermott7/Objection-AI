#!/bin/bash

# Exit on error
set -e

echo "=== TuriCheck Contract Deployment ==="
echo "Building and deploying the TuriCheck contract..."

# Switch to testnet
sui client switch --env testnet
echo "Current environment: $(sui client active-env)"
echo "Active address: $(sui client active-address)"

# Build the contract
echo "Building the contract..."
sui move build

# Publish the contract
echo "Publishing the contract..."
RESULT=$(sui client publish --gas-budget 100000000)
echo "$RESULT"

# Extract package ID
PACKAGE_ID=$(echo "$RESULT" | grep -o "packageId: 0x[a-zA-Z0-9]*" | cut -d' ' -f2)
if [ -z "$PACKAGE_ID" ]; then
  echo "Failed to extract package ID"
  exit 1
fi

echo "Contract deployed successfully!"
echo "Package ID: $PACKAGE_ID"

# Write to .env.local
ENV_FILE="../../apps/frontend/.env.local"
if [ -f "$ENV_FILE" ]; then
  # Backup the original file
  cp "$ENV_FILE" "${ENV_FILE}.bak"
  
  # Update the environment variables
  sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID|" "$ENV_FILE"
  sed -i '' "s|NEXT_PUBLIC_GAME_MODULE=.*|NEXT_PUBLIC_GAME_MODULE=$PACKAGE_ID::TuriCheck|" "$ENV_FILE"
  sed -i '' "s|NEXT_PUBLIC_GAME_PUBLISHER=.*|NEXT_PUBLIC_GAME_PUBLISHER=$(sui client active-address)|" "$ENV_FILE"
  sed -i '' "s|NEXT_PUBLIC_MOCK_DEPLOYMENT=.*|NEXT_PUBLIC_MOCK_DEPLOYMENT=false|" "$ENV_FILE"
  
  echo "Updated .env.local with the new contract details"
else
  echo "Warning: .env.local not found, couldn't update environment variables"
  echo "Add these to your .env.local file:"
  echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID"
  echo "NEXT_PUBLIC_GAME_MODULE=$PACKAGE_ID::TuriCheck"
  echo "NEXT_PUBLIC_GAME_PUBLISHER=$(sui client active-address)"
  echo "NEXT_PUBLIC_MOCK_DEPLOYMENT=false"
fi

echo "Deployment complete!"