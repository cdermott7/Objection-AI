module turicheck::TuriCheckSimple {
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    // Error codes
    const ESessionAlreadySettled: u64 = 0;
    const EInsufficientStake: u64 = 1;

    /// Session info stored on-chain
    struct GameSession has key {
        id: UID,
        player1: address,
        player2: address,
        stake_amount: u64,
        settled: bool,
        session_id: u64, // Matches frontend session ID
    }

    /// Event emitted when a game is started
    struct GameStarted has copy, drop {
        session_id: u64,
        player1: address,
        player2: address,
        stake_amount: u64,
    }

    /// Event emitted when a game is settled with a winner
    struct GameSettled has copy, drop {
        session_id: u64,
        winner: address,
        payout: u64,
        guess_human: bool,
        was_human: bool,
    }

    /// Start a game by staking
    public entry fun start_game(
        initiator: &mut Coin<SUI>,
        opponent: address,
        stake_amount: u64,
        session_id: u64,
        ctx: &mut TxContext
    ) {
        // Check stake amount is not zero
        assert!(stake_amount > 0, EInsufficientStake);
        
        // Check initiator has enough funds
        assert!(coin::value(initiator) >= stake_amount, EInsufficientStake);
        
        // Extract stake from initiator's coin
        let stake_coin = coin::split(initiator, stake_amount, ctx);
        
        // Create game session
        let session = GameSession {
            id: object::new(ctx),
            player1: tx_context::sender(ctx),
            player2: opponent,
            stake_amount,
            settled: false,
            session_id,
        };
        
        // Emit event
        event::emit(GameStarted {
            session_id,
            player1: tx_context::sender(ctx),
            player2: opponent,
            stake_amount,
        });
        
        // Transfer stake to opponent (for simplicity in this version)
        transfer::public_transfer(stake_coin, opponent);
        
        // Share the game session
        transfer::share_object(session);
    }

    /// Submit guess and settle the stake
    public entry fun submit_guess(
        session: &mut GameSession,
        guess_human: bool,
        was_human: bool, // The actual answer (determined off-chain)
        winner: address,
        ctx: &mut TxContext
    ) {
        // Verify session is not already settled
        assert!(!session.settled, ESessionAlreadySettled);
        
        // Calculate payout (just for the event, no actual transfer in simplified version)
        let payout_amount = session.stake_amount * 125 / 100;
        
        // Mark session as settled
        session.settled = true;
        
        // Emit event
        event::emit(GameSettled {
            session_id: session.session_id,
            winner,
            payout: payout_amount,
            guess_human,
            was_human,
        });
    }

    /// Get session details
    public fun get_session_details(session: &GameSession): (address, address, u64, bool, u64) {
        (
            session.player1,
            session.player2,
            session.stake_amount,
            session.settled,
            session.session_id
        )
    }
}