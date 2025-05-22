#!/bin/bash

# Check if sui is installed
if ! command -v sui &> /dev/null; then
    echo "sui CLI is not installed. Please install it first."
    exit 1
fi

echo "Using active address for deployment:"
sui client active-address

echo "Checking gas balance:"
sui client gas

# Navigate to the project root
cd "$(dirname "$0")/.."

# Create a temporary build directory with proper permissions
echo "Creating temporary build directory..."
mkdir -p /tmp/turicheck_build
cp -r contracts/move/* /tmp/turicheck_build/

# Navigate to the temporary build directory
cd /tmp/turicheck_build

# Build the package
echo "Building Move package..."
sui move build --skip-fetch-latest-git-deps

# If build was successful, publish the package
if [ $? -eq 0 ]; then
    echo "Publishing TuriCheck module to testnet..."
    PUBLISH_RESULT=$(sui client publish --skip-fetch-latest-git-deps --gas-budget 100000000)
    echo "$PUBLISH_RESULT"
    
    # Extract package ID
    PACKAGE_ID=$(echo "$PUBLISH_RESULT" | grep -o '0x[a-f0-9]\{64\}' | head -1)
    
    if [ -n "$PACKAGE_ID" ]; then
        echo "TuriCheck module published with package ID: $PACKAGE_ID"
        
        # Update .env.local with the package ID
        ENV_FILE="$(dirname "$0")/../apps/frontend/.env.local"
        if [ -f "$ENV_FILE" ]; then
            if grep -q "NEXT_PUBLIC_PACKAGE_ID" "$ENV_FILE"; then
                sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID|" "$ENV_FILE"
            else
                echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" >> "$ENV_FILE"
            fi
            echo "Updated .env.local with new package ID"
        else
            echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > "$ENV_FILE"
            echo "Created .env.local with package ID"
        fi
    else
        echo "Failed to extract package ID. Please check the output above."
        exit 1
    fi
else
    echo "Build failed. Please check the output above."
    exit 1
fi

# Clean up
echo "Cleaning up temporary build directory..."
rm -rf /tmp/turicheck_build

echo "Deployment complete!"