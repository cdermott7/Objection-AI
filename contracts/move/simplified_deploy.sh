#!/bin/bash

# Ensure we're in the correct directory
cd /Users/coledermott/TuriCheck/contracts/move

# Check the active network and address
echo "Checking active network and address..."
sui client envs
active_address=$(sui client active-address)
echo "Active address: $active_address"

# Simplify the Move.toml file for compatibility
echo "Configuring Move.toml for compatibility..."
cat > Move.toml << EOF
[package]
name = "TuriCheck"
version = "0.0.1"

[addresses]
turicheck = "0x0"
EOF

# Build the package first
echo "Building Move package..."
sui move build

# Check gas objects
echo "Checking gas objects..."
sui client gas

# Try to get funds from faucet for both testnet and devnet
echo "Requesting funds from testnet faucet..."
sui client switch --env testnet
sui client faucet

echo "Requesting funds from devnet faucet..."
sui client switch --env devnet
sui client faucet

# Try publishing to devnet first (usually more stable)
echo "Attempting to publish to devnet..."
sui client publish --gas-budget 200000000 || true

# If devnet fails, try testnet
echo "Attempting to publish to testnet..."
sui client switch --env testnet
sui client publish --gas-budget 200000000 || true

# If the publish succeeded, we'll see output containing "packageId"
# We can extract this manually from the terminal output

echo "Deployment script completed. Please copy the packageId from the successful transaction above."
echo "Then update the NEXT_PUBLIC_PACKAGE_ID in /Users/coledermott/TuriCheck/apps/frontend/.env.local"