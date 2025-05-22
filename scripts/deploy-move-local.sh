#!/bin/bash

# Check if sui is installed
if ! command -v sui &> /dev/null; then
    echo "sui CLI is not installed. Please install it first."
    exit 1
fi

# Navigate to Move directory
cd "$(dirname "$0")/../contracts/move" || exit

# Build the package
echo "Building Move package..."
sui move build --skip-fetch-latest-git-deps

# Publish the package to testnet (change network as needed)
echo "Publishing TuriCheck module to testnet..."
# First, make sure we're using the testnet
sui client switch --env testnet

# Use a simpler publish command to see errors better
sui client publish --gas-budget 100000000 --skip-fetch-latest-git-deps

# If successful, run again with JSON for proper parsing
if [ $? -eq 0 ]; then
  echo "Retrieving package ID..."
  RESULT=$(sui client publish --gas-budget 100000000 --skip-fetch-latest-git-deps --json 2>&1)
  echo "$RESULT"
else
  echo "Publication failed, see errors above."
  exit 1
fi

# Extract package ID
PACKAGE_ID=$(echo "$RESULT" | grep -o '"packageId":"0x[a-f0-9]\+' | grep -o '0x[a-f0-9]\+')

if [ -n "$PACKAGE_ID" ]; then
    echo "TuriCheck module published with package ID: $PACKAGE_ID"
    
    # Extract created objects (registry should be one of them)
    # Find the shared object created - this should be our registry
    REGISTRY_ID=$(echo "$RESULT" | grep -o '"objectType":"'$PACKAGE_ID'::TuriCheck::BadgeRegistry"' -A 2 | grep -o '"objectId":"0x[a-f0-9]\+"' | grep -o '0x[a-f0-9]\+' | head -1)
    
    if [ -n "$REGISTRY_ID" ]; then
        echo "TuriCheck registry created with ID: $REGISTRY_ID"
        
        # Update the existing .env.local file with the new package ID and registry ID
        if [ -f "../../apps/frontend/.env.local" ]; then
            # Replace the lines if they exist or append them
            if grep -q "NEXT_PUBLIC_PACKAGE_ID" "../../apps/frontend/.env.local"; then
                sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID|" "../../apps/frontend/.env.local"
            else
                echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" >> "../../apps/frontend/.env.local"
            fi
            
            if grep -q "NEXT_PUBLIC_REGISTRY_ID" "../../apps/frontend/.env.local"; then
                sed -i '' "s|NEXT_PUBLIC_REGISTRY_ID=.*|NEXT_PUBLIC_REGISTRY_ID=$REGISTRY_ID|" "../../apps/frontend/.env.local"
            else
                echo "NEXT_PUBLIC_REGISTRY_ID=$REGISTRY_ID" >> "../../apps/frontend/.env.local"
            fi
            
            echo "Updated .env.local with new package ID and registry ID"
        else
            echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > "../../apps/frontend/.env.local"
            echo "NEXT_PUBLIC_REGISTRY_ID=$REGISTRY_ID" >> "../../apps/frontend/.env.local"
            echo "Created .env.local with package ID and registry ID"
        fi
    else
        echo "Failed to extract registry ID. The registry might not have been created properly."
        echo "You may need to manually create the registry using the TuriCheck module."
        echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > "../../apps/frontend/.env.local"
        echo "Created .env.local with package ID only"
    fi
else
    echo "Failed to extract package ID. Please check logs above."
    exit 1
fi

echo ""
echo "Deployment completed!"
echo "Package ID: $PACKAGE_ID"
if [ -n "$REGISTRY_ID" ]; then
    echo "Registry ID: $REGISTRY_ID"
fi
echo ""
echo "To run the frontend:"
echo "cd ../../apps/frontend && yarn dev"