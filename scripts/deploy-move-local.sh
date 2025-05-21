#!/bin/bash

# Check if sui is installed
if ! command -v sui &> /dev/null; then
    echo "sui CLI is not installed. Please install it first."
    exit 1
fi

# Check if localnet is running and start it if not
if ! sui client ping | grep -q "PONG"; then
    echo "Starting Sui localnet..."
    sui local-network start
    
    # Wait for network to start
    sleep 5
fi

# Navigate to Move directory
cd "$(dirname "$0")/../contracts/move" || exit

# Build the package
echo "Building Move package..."
sui move build

# Publish the package
echo "Publishing TuriCheck module..."
RESULT=$(sui client publish --gas-budget 100000000 2>&1)
echo "$RESULT"

# Extract package ID
PACKAGE_ID=$(echo "$RESULT" | grep -oP 'Created objects:.*\K0x[a-f0-9]+')

if [ -n "$PACKAGE_ID" ]; then
    echo "TuriCheck module published with package ID: $PACKAGE_ID"
    echo "export NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > "../../apps/frontend/.env.local.package"
    
    # Append to .env.local if it exists
    if [ -f "../../apps/frontend/.env.local" ]; then
        cat "../../apps/frontend/.env.local.package" >> "../../apps/frontend/.env.local"
        rm "../../apps/frontend/.env.local.package"
    fi
else
    echo "Failed to extract package ID. Please check logs above."
    exit 1
fi