// TuriCheck contract for minting badges based on Turing test results
module turicheck::TuriCheck {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::url::{Self, Url};
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use std::vector;
    
    /// Error codes
    const EInvalidSessionId: u64 = 0;
    const EBadgeNotFound: u64 = 1;
    
    /// A TuriCheck Badge NFT with enhanced metadata
    struct Badge has key, store {
        id: UID,
        // Core badge data
        session_id: u64,
        correct: bool,
        // Enhanced metadata
        timestamp_ms: u64,
        display_url: Url,
        name: String,
        description: String,
    }
    
    /// Registry to track all badges minted for stats
    struct BadgeRegistry has key {
        id: UID,
        badge_count: u64,
        correct_count: u64,
        badges_by_session: Table<u64, ID>,
    }
    
    /// Event emitted when a badge is minted
    struct BadgeMinted has copy, drop {
        session_id: u64,
        correct: bool,
        recipient: address,
        timestamp_ms: u64,
        badge_id: ID,
    }
    
    /// Module initializer creates the badge registry
    fun init(ctx: &mut TxContext) {
        let registry = BadgeRegistry {
            id: object::new(ctx),
            badge_count: 0,
            correct_count: 0,
            badges_by_session: table::new(ctx),
        };
        transfer::share_object(registry);
    }
    
    /// Mint a new badge for a user who participated in a TuriCheck session
    public entry fun mint_badge(
        session_id: u64,
        correct: bool,
        recipient: address,
        display_url: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        registry: &mut BadgeRegistry,
        ctx: &mut TxContext
    ) {
        // Basic validation
        assert!(session_id > 0, EInvalidSessionId);
        
        // Get current timestamp
        let timestamp_ms = tx_context::epoch_timestamp_ms(ctx);
        
        // Create badge with enhanced metadata
        let badge = Badge {
            id: object::new(ctx),
            session_id,
            correct,
            timestamp_ms,
            display_url: url::new_unsafe_from_bytes(display_url),
            name: string::utf8(name),
            description: string::utf8(description),
        };
        
        // Update registry stats
        registry.badge_count = registry.badge_count + 1;
        if (correct) {
            registry.correct_count = registry.correct_count + 1;
        };
        
        // Record the badge ID in the registry
        let badge_id = object::id(&badge);
        table::add(&mut registry.badges_by_session, session_id, badge_id);
        
        // Emit event for indexing
        event::emit(BadgeMinted {
            session_id,
            correct,
            recipient,
            timestamp_ms,
            badge_id,
        });
        
        // Transfer badge to recipient
        transfer::public_transfer(badge, recipient);
    }
    
    /// Simplified mint function that uses default values for optional fields
    public entry fun mint_simple_badge(
        session_id: u64,
        correct: bool,
        recipient: address,
        registry: &mut BadgeRegistry,
        ctx: &mut TxContext
    ) {
        // Default values for optional fields
        let default_url = b"https://turicheck.com/badges/default.png";
        let name = if (correct) {
            b"TuriCheck - Correct Guess"
        } else {
            b"TuriCheck - Incorrect Guess"
        };
        let description = if (correct) {
            b"Successfully identified whether you were talking to a human or AI!"
        } else {
            b"Better luck next time determining if you were talking to a human or AI."
        };
        
        // Call the full mint function with default values
        mint_badge(
            session_id,
            correct,
            recipient,
            default_url,
            name,
            description,
            registry,
            ctx
        );
    }
    
    /// Get registry statistics
    public fun get_stats(registry: &BadgeRegistry): (u64, u64) {
        (registry.badge_count, registry.correct_count)
    }
    
    /// Check if a badge exists for a session
    public fun has_badge_for_session(registry: &BadgeRegistry, session_id: u64): bool {
        table::contains(&registry.badges_by_session, session_id)
    }
    
    /// Get badge ID for a specific session
    public fun get_badge_id_for_session(registry: &BadgeRegistry, session_id: u64): ID {
        assert!(table::contains(&registry.badges_by_session, session_id), EBadgeNotFound);
        *table::borrow(&registry.badges_by_session, session_id)
    }
    
    /// Get badge session ID (for use in client apps)
    public fun get_session_id(badge: &Badge): u64 {
        badge.session_id
    }
    
    /// Check if badge represents a correct guess
    public fun is_correct(badge: &Badge): bool {
        badge.correct
    }
    
    /// Get badge timestamp
    public fun get_timestamp(badge: &Badge): u64 {
        badge.timestamp_ms
    }
    
    /// Get badge display URL as a string
    public fun get_display_url(badge: &Badge): String {
        url::inner_url(&badge.display_url)
    }
    
    /// Get badge name
    public fun get_name(badge: &Badge): String {
        badge.name
    }
    
    /// Get badge description
    public fun get_description(badge: &Badge): String {
        badge.description
    }
}