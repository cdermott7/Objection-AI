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