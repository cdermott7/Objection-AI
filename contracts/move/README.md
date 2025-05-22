# TuriCheck Smart Contract

This directory contains the Move smart contract for TuriCheck, which creates NFT badges for users who play the Human or AI game.

## Contract Overview

The TuriCheck contract creates badge NFTs that certify a user's performance in the TuriCheck game:

```move
module turicheck::TuriCheck {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    
    /// A TuriCheck Badge NFT
    struct Badge has key, store {
        id: UID,
        session_id: u64,
        correct: bool,
    }
    
    /// Mint a new badge for a user who participated in a TuriCheck session
    public entry fun mint_badge(
        session_id: u64,
        correct: bool,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let badge = Badge {
            id: object::new(ctx),
            session_id,
            correct,
        };
        
        transfer::public_transfer(badge, recipient);
    }
}
```

This contract allows the creation of NFT badges that record:
- Session ID of the TuriCheck game
- Whether the user correctly identified the AI or human

## Deployment Status

The contract is currently configured to run in mock mode due to version compatibility issues between the installed Sui CLI (v1.48.1) and the current network versions (v1.49.x).

### Mock Mode

The frontend application is configured to use a mock deployment that simulates the blockchain interactions without requiring an actual deployed contract. This is controlled by the `NEXT_PUBLIC_MOCK_DEPLOYMENT=true` setting in the `.env.local` file.

### Deploying the Real Contract

To deploy the actual contract once you have access to a compatible Sui CLI:

1. **Option 1: Update Sui CLI** (Recommended)
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
   ```

2. **Option 2: Use Sui Explorer** (No CLI required)
   - Go to the [Sui Explorer](https://explorer.sui.io/)
   - Connect your wallet
   - Go to "Publish Package"
   - Upload the contract files

3. **Deployment Steps**
   ```bash
   # Navigate to the contract directory
   cd /Users/coledermott/TuriCheck/contracts/move
   
   # Make sure you have test tokens
   sui client faucet
   
   # Build and publish
   sui move build
   sui client publish --gas-budget 100000000
   ```

4. **Update Environment Variables**
   After successful deployment, update the `.env.local` file:
   ```
   NEXT_PUBLIC_PACKAGE_ID=<your-new-package-id>
   NEXT_PUBLIC_MOCK_DEPLOYMENT=false
   ```

## Troubleshooting

If you encounter the "Duplicate module found" error, it's likely due to a version mismatch between the Sui CLI and the network. You can:

1. Try building with `--skip-dependency-verification`
2. Use a Docker container with the matching Sui version
3. Continue using mock mode until you can update the Sui CLI

## Development

For development purposes, the application uses a mock implementation that simulates blockchain interactions. This allows development to continue even when deployment is not possible due to version compatibility issues.