#!/bin/bash

set -e

# Create a temporary directory for the test package
TEMP_DIR=$(mktemp -d)
echo "Creating test package in $TEMP_DIR"

# Create a minimal Move package
mkdir -p $TEMP_DIR/sources
cat > $TEMP_DIR/Move.toml << EOF
[package]
name = "TuriCheckTest"
version = "0.0.1"

[addresses]
turicheck_test = "0x0"
EOF

cat > $TEMP_DIR/sources/TuriCheckTest.move << EOF
module turicheck_test::TuriCheckTest {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    
    struct TestObject has key, store {
        id: UID,
        value: u64
    }
    
    public entry fun create_test_object(value: u64, recipient: address, ctx: &mut TxContext) {
        let obj = TestObject {
            id: object::new(ctx),
            value
        };
        
        transfer::public_transfer(obj, recipient);
    }
}
EOF

# Build and publish
cd $TEMP_DIR
echo "Building test package..."
sui move build

echo "Publishing test package..."
sui client publish --gas-budget 100000000

# Clean up
echo "Cleaning up temporary directory..."
rm -rf $TEMP_DIR