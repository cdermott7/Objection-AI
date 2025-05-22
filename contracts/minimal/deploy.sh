#!/bin/bash

# Set mock package ID since we're having deployment issues
MOCK_PACKAGE_ID="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
MODULE_NAME="turi_check"
PUBLISHER_ADDR=$(sui client active-address)

# Update .env.local with mock values
ENV_FILE="/Users/coledermott/TuriCheck/apps/frontend/.env.local"

# Update .env.local file
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "${ENV_FILE}.bak" # Create backup
  
  # Set mock values for development
  sed -i '' "s|NEXT_PUBLIC_PACKAGE_ID=.*|NEXT_PUBLIC_PACKAGE_ID=$MOCK_PACKAGE_ID|" "$ENV_FILE"
  sed -i '' "s|NEXT_PUBLIC_GAME_MODULE=.*|NEXT_PUBLIC_GAME_MODULE=$MOCK_PACKAGE_ID::turicheckminimal::$MODULE_NAME|" "$ENV_FILE"
  sed -i '' "s|NEXT_PUBLIC_GAME_PUBLISHER=.*|NEXT_PUBLIC_GAME_PUBLISHER=$PUBLISHER_ADDR|" "$ENV_FILE"
  sed -i '' "s|NEXT_PUBLIC_MOCK_DEPLOYMENT=.*|NEXT_PUBLIC_MOCK_DEPLOYMENT=true|" "$ENV_FILE"
  
  echo "Updated .env.local with mock values for development:"
  echo "NEXT_PUBLIC_PACKAGE_ID=$MOCK_PACKAGE_ID"
  echo "NEXT_PUBLIC_GAME_MODULE=$MOCK_PACKAGE_ID::turicheckminimal::$MODULE_NAME"
  echo "NEXT_PUBLIC_GAME_PUBLISHER=$PUBLISHER_ADDR"
  echo "NEXT_PUBLIC_MOCK_DEPLOYMENT=true"
else
  echo "Warning: .env.local file not found"
fi

echo "Mock deployment complete! The frontend is now configured to use mock values for development."