#!/bin/bash

# Set environment variables
NETWORK="devnet"  # Use devnet since we have tokens here
PACKAGE_DIR="/Users/coledermott/TuriCheck/contracts/move"
GAS_BUDGET=200000000  # Higher gas budget for safety

# Make sure we're using the right network
sui client switch --env $NETWORK

# Check active address
ADDRESS=$(sui client active-address)
echo "Active address: $ADDRESS"

# Check for SUI tokens
BALANCE=$(sui client gas | grep -o 'totalBalance: [0-9]\+' | cut -d ' ' -f 2)
echo "Balance: $BALANCE SUI"

if [ "$BALANCE" -lt "10000000" ]; then
  echo "Warning: Low balance detected. You may need more SUI for deployment."
  echo "Visit https://discord.com/channels/916379725201563759/955861652739166228 to request testnet tokens"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build the package
echo "Building package..."
cd $PACKAGE_DIR
sui move build

# Try to publish
echo "Publishing package to $NETWORK..."
OUTPUT=$(sui client publish --gas-budget $GAS_BUDGET 2>&1 | tee /dev/tty)

# Extract the package ID using the correct pattern based on Sui CLI version
if echo "$OUTPUT" | grep -q "Transaction executed to effect"; then
  # For newer Sui CLI versions
  PACKAGE_ID=$(echo "$OUTPUT" | grep -o "packageId: 0x[a-f0-9]\+" | head -1 | cut -d ' ' -f 2)
  if [ -z "$PACKAGE_ID" ]; then
    # Alternative pattern
    PACKAGE_ID=$(echo "$OUTPUT" | grep -o "Created Objects:.*0x[a-f0-9]\+" | grep -o "0x[a-f0-9]\+" | head -1)
  fi
elif echo "$OUTPUT" | grep -q "Transaction confirmed"; then
  # For older Sui CLI versions
  PACKAGE_ID=$(echo "$OUTPUT" | grep -o "packageId: 0x[a-f0-9]\+" | head -1 | cut -d ' ' -f 2)
  if [ -z "$PACKAGE_ID" ]; then
    # Alternative pattern
    PACKAGE_ID=$(echo "$OUTPUT" | grep -o "Created Objects:.*0x[a-f0-9]\+" | grep -o "0x[a-f0-9]\+" | head -1)
  fi
fi

if [ -n "$PACKAGE_ID" ]; then
  echo "Successfully deployed package with ID: $PACKAGE_ID"
  
  # Save package details to env files
  echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > $PACKAGE_DIR/package_id.env
  echo "NEXT_PUBLIC_GAME_MODULE=$PACKAGE_ID::TuriCheckSimple" >> $PACKAGE_DIR/package_id.env
  echo "NEXT_PUBLIC_GAME_PUBLISHER=$ADDRESS" >> $PACKAGE_DIR/package_id.env
  echo "NEXT_PUBLIC_SUI_NETWORK=$NETWORK" >> $PACKAGE_DIR/package_id.env
  echo "Package details saved to $PACKAGE_DIR/package_id.env"
  
  # Update frontend .env.local file if it exists
  if [ -f "/Users/coledermott/TuriCheck/apps/frontend/.env.local" ]; then
    # Create backup
    cp "/Users/coledermott/TuriCheck/apps/frontend/.env.local" "/Users/coledermott/TuriCheck/apps/frontend/.env.local.bak"
    
    # Update or add environment variables
    if grep -q "NEXT_PUBLIC_PACKAGE_ID" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"; then
      sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID|" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    else
      echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" >> "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_GAME_MODULE" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"; then
      sed -i '' "s|NEXT_PUBLIC_GAME_MODULE=.*|NEXT_PUBLIC_GAME_MODULE=$PACKAGE_ID::TuriCheckSimple|" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    else
      echo "NEXT_PUBLIC_GAME_MODULE=$PACKAGE_ID::TuriCheckSimple" >> "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_GAME_PUBLISHER" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"; then
      sed -i '' "s|NEXT_PUBLIC_GAME_PUBLISHER=.*|NEXT_PUBLIC_GAME_PUBLISHER=$ADDRESS|" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    else
      echo "NEXT_PUBLIC_GAME_PUBLISHER=$ADDRESS" >> "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_SUI_NETWORK" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"; then
      sed -i '' "s|NEXT_PUBLIC_SUI_NETWORK=.*|NEXT_PUBLIC_SUI_NETWORK=$NETWORK|" "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    else
      echo "NEXT_PUBLIC_SUI_NETWORK=$NETWORK" >> "/Users/coledermott/TuriCheck/apps/frontend/.env.local"
    fi
    
    echo "Updated .env.local with new package details"
  else
    echo "Warning: .env.local file not found in frontend directory"
    echo "Create a new .env.local file with the following contents:"
    echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID"
    echo "NEXT_PUBLIC_GAME_MODULE=$PACKAGE_ID::TuriCheckSimple"
    echo "NEXT_PUBLIC_GAME_PUBLISHER=$ADDRESS"
    echo "NEXT_PUBLIC_SUI_NETWORK=$NETWORK"
  fi
  
  echo "Deployment complete!"
else
  echo "Failed to deploy package. Please check the output above."
  exit 1
fi