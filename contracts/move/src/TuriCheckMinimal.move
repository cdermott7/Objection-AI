module turicheck::TuriCheckMinimal {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    // Error codes
    const ESessionAlreadySettled: u64 = 0;

    /// Session info stored on-chain
    struct GameSession has key, store {
        id: UID,
        player1: address,
        player2: address,
        session_id: u64, // Matches frontend session ID
        settled: bool,
    }

    /// Event emitted when a game is started
    struct GameStarted has copy, drop {
        session_id: u64,
        player1: address,
        player2: address,
    }

    /// Event emitted when a game is settled with a winner
    struct GameSettled has copy, drop {
        session_id: u64,
        winner: address,
        guess_human: bool,
        was_human: bool,
    }

    /// Start a game
    public entry fun start_game(
        player1: address,
        player2: address,
        session_id: u64,
        ctx: &mut TxContext
    ) {
        // Create game session
        let session = GameSession {
            id: object::new(ctx),
            player1,
            player2,
            session_id,
            settled: false,
        };
        
        // Emit event
        event::emit(GameStarted {
            session_id,
            player1,
            player2,
        });
        
        // Share the game session
        transfer::share_object(session);
    }

    /// Submit guess and settle the game
    public entry fun submit_guess(
        session: &mut GameSession,
        guess_human: bool,
        was_human: bool, // The actual answer (determined off-chain)
        winner: address,
        ctx: &mut TxContext
    ) {
        // Verify session is not already settled
        assert!(!session.settled, ESessionAlreadySettled);
        
        // Mark session as settled
        session.settled = true;
        
        // Emit event
        event::emit(GameSettled {
            session_id: session.session_id,
            winner,
            guess_human,
            was_human,
        });
    }

    /// Get session details
    public fun get_session_details(session: &GameSession): (address, address, u64, bool) {
        (
            session.player1,
            session.player2,
            session.session_id,
            session.settled
        )
    }
}