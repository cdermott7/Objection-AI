module turicheck::TuriCheckGame {
    use sui::object::{Self, UID, ID};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    // Error codes
    const ESessionNotFound: u64 = 0;
    const ESessionAlreadySettled: u64 = 1;
    const EInvalidPayout: u64 = 2;
    const EUnauthorized: u64 = 3;
    const EInsufficientStake: u64 = 4;

    /// Resource holding the pool of stakes
    struct GamePool has key {
        id: UID,
        total_staked: Balance<SUI>,
        admin: address,
    }

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
        game_id: ID,
    }

    /// Event emitted when a game is settled with a winner
    struct GameSettled has copy, drop {
        session_id: u64,
        winner: address,
        payout: u64,
        guess_human: bool,
        was_human: bool,
    }

    /// Initialize the pool once
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        // Create and share the GamePool
        let pool = GamePool {
            id: object::new(ctx),
            total_staked: balance::zero<SUI>(),
            admin
        };
        
        transfer::share_object(pool);
    }

    /// Start a game by staking
    public entry fun start_game(
        initiator: &mut Coin<SUI>,
        opponent: address,
        stake_amount: u64,
        session_id: u64,
        pool: &mut GamePool,
        ctx: &mut TxContext
    ) {
        // Check stake amount is not zero
        assert!(stake_amount > 0, EInsufficientStake);
        
        // Check initiator has enough funds
        assert!(coin::value(initiator) >= stake_amount, EInsufficientStake);
        
        // Extract stake from initiator's coin
        let stake_coin = coin::split(initiator, stake_amount, ctx);
        let stake_balance = coin::into_balance(stake_coin);
        
        // Add stake to pool
        balance::join(&mut pool.total_staked, stake_balance);
        
        // Create game session
        let game_id = object::new(ctx);
        let game_id_copy = object::uid_to_inner(&game_id);
        
        let session = GameSession {
            id: game_id,
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
            game_id: game_id_copy,
        });
        
        // Share the game session
        transfer::share_object(session);
    }

    /// Submit guess and settle the stake
    public entry fun submit_guess(
        player: address,
        session: &mut GameSession,
        guess_human: bool,
        was_human: bool, // The actual answer (determined off-chain)
        pool: &mut GamePool,
        ctx: &mut TxContext
    ) {
        // Verify session is not already settled
        assert!(!session.settled, ESessionAlreadySettled);
        
        // Verify player is either player1 or player2
        assert!(
            player == session.player1 || player == session.player2,
            EUnauthorized
        );
        
        // Determine winner: correct guess = winner
        let winner = if (guess_human == was_human) { 
            player 
        } else { 
            if (player == session.player1) { 
                session.player2 
            } else { 
                session.player1 
            }
        };
        
        // Calculate payout: 125% of stake (or could be a different formula)
        let payout_amount = session.stake_amount * 125 / 100;
        
        // Verify pool has enough funds
        assert!(balance::value(&pool.total_staked) >= payout_amount, EInvalidPayout);
        
        // Extract payout from pool
        let payout = coin::from_balance(balance::split(&mut pool.total_staked, payout_amount), ctx);
        
        // Transfer payout to winner
        transfer::public_transfer(payout, winner);
        
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

    /// Get pool stats
    public fun get_pool_stats(pool: &GamePool): (u64) {
        (balance::value(&pool.total_staked))
    }

    /// Allow pool admin to withdraw excess funds
    public entry fun withdraw_excess_funds(
        pool: &mut GamePool,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Only admin can withdraw
        assert!(tx_context::sender(ctx) == pool.admin, EUnauthorized);
        
        // Extract funds from pool
        let withdraw_coin = coin::from_balance(balance::split(&mut pool.total_staked, amount), ctx);
        
        // Transfer to admin
        transfer::public_transfer(withdraw_coin, pool.admin);
    }
}