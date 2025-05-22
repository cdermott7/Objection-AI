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

# Create a fresh temporary directory
TEMP_DIR=$(mktemp -d)
echo "Creating temporary build directory at $TEMP_DIR"

# Copy only the essential contract files to avoid dependency issues
mkdir -p "$TEMP_DIR/src"
cp "/Users/coledermott/TuriCheck/contracts/move/src/TuriCheck.move" "$TEMP_DIR/src/"

# Create a minimal Move.toml
cat > "$TEMP_DIR/Move.toml" << EOL
[package]
name = "TuriCheck"
version = "0.0.1"

[addresses]
turicheck = "0x0"
EOL

# Navigate to the temporary directory
cd "$TEMP_DIR"

# Build the package
echo "Building Move package..."
sui move build

# If build was successful, publish the package
if [ $? -eq 0 ]; then
    echo "Publishing TuriCheck module to testnet..."
    PUBLISH_RESULT=$(sui client publish --gas-budget 100000000)
    echo "$PUBLISH_RESULT"
    
    # Extract package ID
    PACKAGE_ID=$(echo "$PUBLISH_RESULT" | grep -o '0x[a-f0-9]\{64\}' | head -1)
    
    if [ -n "$PACKAGE_ID" ]; then
        echo "TuriCheck module published with package ID: $PACKAGE_ID"
        
        # Update .env.local with the package ID
        ENV_FILE="/Users/coledermott/TuriCheck/apps/frontend/.env.local"
        if [ -f "$ENV_FILE" ]; then
            if grep -q "NEXT_PUBLIC_PACKAGE_ID" "$ENV_FILE"; then
                sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID|" "$ENV_FILE"
            else
                echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" >> "$ENV_FILE"
            fi
            echo "Updated .env.local with new package ID"
            echo "New package ID: $PACKAGE_ID"
        else
            echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > "$ENV_FILE"
            echo "Created .env.local with package ID"
            echo "New package ID: $PACKAGE_ID"
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
rm -rf "$TEMP_DIR"

echo "Deployment complete!"