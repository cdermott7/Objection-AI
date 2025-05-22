#[test_only]
module turicheck::turicheck_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::object::{Self, ID};
    use std::string;
    use turicheck::TuriCheck::{Self, Badge, BadgeRegistry};
    
    // Test addresses
    const ADMIN: address = @0xA55;
    const USER1: address = @0xB0B;
    const USER2: address = @0xCAFE;
    
    // Test session ID
    const SESSION_ID: u64 = 12345;
    
    // Helper to setup a test scenario with the TuriCheck module initialized
    fun setup_test(): Scenario {
        let scenario = ts::begin(ADMIN);
        {
            ts::next_tx(&mut scenario, ADMIN);
            // This will trigger the init function of the TuriCheck module
        };
        scenario
    }
    
    // Helper to get the shared badge registry
    fun get_registry(scenario: &Scenario): BadgeRegistry {
        ts::take_shared<BadgeRegistry>(scenario)
    }
    
    // Helper to return the badge registry
    fun return_registry(registry: BadgeRegistry, scenario: &mut Scenario) {
        ts::return_shared(registry, scenario);
    }
    
    #[test]
    fun test_mint_badge_correct() {
        let scenario = setup_test();
        let registry = get_registry(&scenario);
        
        // Mint a badge for correct guess
        ts::next_tx(&mut scenario, ADMIN);
        {
            TuriCheck::mint_simple_badge(
                SESSION_ID,
                true, // Correct guess
                USER1,
                &mut registry,
                ts::ctx(&mut scenario)
            );
        };
        
        // Verify badge exists in registry
        {
            assert!(TuriCheck::has_badge_for_session(&registry, SESSION_ID), 0);
            
            // Get stats
            let (badge_count, correct_count) = TuriCheck::get_stats(&registry);
            assert!(badge_count == 1, 0);
            assert!(correct_count == 1, 0);
        };
        
        // Check that USER1 received a Badge
        ts::next_tx(&mut scenario, USER1);
        {
            let badge = ts::take_from_address<Badge>(&scenario, USER1);
            
            // Verify badge properties
            assert!(TuriCheck::get_session_id(&badge) == SESSION_ID, 0);
            assert!(TuriCheck::is_correct(&badge), 0);
            
            let name = TuriCheck::get_name(&badge);
            assert!(string::length(&name) > 0, 0);
            
            // Return the badge
            ts::return_to_address(USER1, badge);
        };
        
        return_registry(registry, &mut scenario);
        ts::end(scenario);
    }
    
    #[test]
    fun test_mint_badge_incorrect() {
        let scenario = setup_test();
        let registry = get_registry(&scenario);
        
        // Mint a badge for incorrect guess
        ts::next_tx(&mut scenario, ADMIN);
        {
            TuriCheck::mint_simple_badge(
                SESSION_ID,
                false, // Incorrect guess
                USER2,
                &mut registry,
                ts::ctx(&mut scenario)
            );
        };
        
        // Verify badge exists in registry
        {
            assert!(TuriCheck::has_badge_for_session(&registry, SESSION_ID), 0);
            
            // Get stats
            let (badge_count, correct_count) = TuriCheck::get_stats(&registry);
            assert!(badge_count == 1, 0);
            assert!(correct_count == 0, 0); // No correct guesses
        };
        
        // Check that USER2 received a Badge
        ts::next_tx(&mut scenario, USER2);
        {
            let badge = ts::take_from_address<Badge>(&scenario, USER2);
            
            // Verify badge properties
            assert!(TuriCheck::get_session_id(&badge) == SESSION_ID, 0);
            assert!(!TuriCheck::is_correct(&badge), 0); // Should be incorrect
            
            let name = TuriCheck::get_name(&badge);
            assert!(string::length(&name) > 0, 0);
            
            // Return the badge
            ts::return_to_address(USER2, badge);
        };
        
        return_registry(registry, &mut scenario);
        ts::end(scenario);
    }
    
    #[test]
    fun test_get_badge_id_for_session() {
        let scenario = setup_test();
        let registry = get_registry(&scenario);
        
        // Mint a badge
        ts::next_tx(&mut scenario, ADMIN);
        {
            TuriCheck::mint_simple_badge(
                SESSION_ID,
                true,
                USER1,
                &mut registry,
                ts::ctx(&mut scenario)
            );
        };
        
        // Get badge ID from registry
        let badge_id = TuriCheck::get_badge_id_for_session(&registry, SESSION_ID);
        
        // Verify badge exists at USER1 with matching ID
        ts::next_tx(&mut scenario, USER1);
        {
            let badge = ts::take_from_address<Badge>(&scenario, USER1);
            assert!(object::id(&badge) == badge_id, 0);
            ts::return_to_address(USER1, badge);
        };
        
        return_registry(registry, &mut scenario);
        ts::end(scenario);
    }
    
    #[test]
    #[expected_failure(abort_code = turicheck::TuriCheck::EInvalidSessionId)]
    fun test_mint_badge_invalid_session_id() {
        let scenario = setup_test();
        let registry = get_registry(&scenario);
        
        // Try to mint a badge with invalid session ID (0)
        ts::next_tx(&mut scenario, ADMIN);
        {
            TuriCheck::mint_simple_badge(
                0, // Invalid session ID
                true,
                USER1,
                &mut registry,
                ts::ctx(&mut scenario)
            );
        };
        
        return_registry(registry, &mut scenario);
        ts::end(scenario);
    }
    
    #[test]
    #[expected_failure(abort_code = turicheck::TuriCheck::EBadgeNotFound)]
    fun test_get_badge_id_nonexistent_session() {
        let scenario = setup_test();
        let registry = get_registry(&scenario);
        
        // Try to get badge ID for a session that doesn't exist
        let _badge_id = TuriCheck::get_badge_id_for_session(&registry, 9999);
        
        return_registry(registry, &mut scenario);
        ts::end(scenario);
    }
}