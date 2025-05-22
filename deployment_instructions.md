# TuriCheck Smart Contract Deployment Instructions

Due to compatibility issues between the installed Sui CLI version (1.48.1) and the current Sui network versions (1.49.x), direct deployment is encountering issues. Here are the steps to deploy the contract manually:

## Option 1: Deploy via Sui CLI (Latest Version)

1. Update your Sui CLI to the latest version:
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
   ```

2. Navigate to the contract directory:
   ```bash
   cd /Users/coledermott/TuriCheck/contracts/move
   ```

3. Build the package:
   ```bash
   sui move build
   ```

4. Request test tokens from the faucet:
   ```bash
   sui client faucet
   ```

5. Publish the contract:
   ```bash
   sui client publish --gas-budget 100000000
   ```

6. Copy the package ID from the output and update your frontend `.env.local` file:
   ```
   NEXT_PUBLIC_PACKAGE_ID=<your-package-id>
   ```

## Option 2: Deploy via Sui Explorer

1. Go to the Sui Explorer: https://explorer.sui.io/

2. Connect your wallet (make sure you have SUI tokens on testnet)

3. Go to "Publish Package"

4. Upload your `TuriCheck` package (from `/Users/coledermott/TuriCheck/contracts/move/`)

5. Complete the publish transaction

6. Copy the package ID and update your frontend `.env.local` file:
   ```
   NEXT_PUBLIC_PACKAGE_ID=<your-package-id>
   ```

## TuriCheck Smart Contract

The TuriCheck smart contract creates NFT badges that certify a user's performance in the TuriCheck game:

```move
module turicheck::TuriCheck {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    
    /// A TuriCheck Badge NFT
    struct Badge has key, store {
        id: UID,
        session_id: u64,
        correct: bool,
        metadata_uri: String
    }
    
    /// Mint a new badge for a user who participated in a TuriCheck session
    public entry fun mint_badge(
        session_id: u64,
        correct: bool,
        metadata_uri: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let badge = Badge {
            id: object::new(ctx),
            session_id,
            correct,
            metadata_uri: string::utf8(metadata_uri)
        };
        
        transfer::public_transfer(badge, recipient);
    }
}
```

This contract allows the creation of NFT badges that record:
- Session ID of the TuriCheck game
- Whether the user correctly identified the AI or human
- Metadata URI containing additional session details

After deployment, you'll need to update the frontend to use the new package ID for minting badges.