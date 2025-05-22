module turicheck::turi_check_v2 {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};
    use sui::event;

    /// Holds the total staked coins in the system
    struct GamePool has key {
        id: UID,
        total_staked: Balance<SUI>,
        admin: address
    }

    /// Represents a single game session
    struct GameSession has key {
        id: UID,
        player1: address,
        player2: address,
        stake: u64,
        settled: bool,
    }
    
    /// Event emitted when a game is started
    struct GameStarted has copy, drop {
        session_id: ID,
        player1: address,
        player2: address,
        stake: u64
    }
    
    /// Event emitted when a game is settled
    struct GameSettled has copy, drop {
        session_id: ID,
        winner: address,
        guess_human: bool,
        was_human: bool,
        payout: u64
    }

    /// Initialize the shared pool (call once)
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        let pool = GamePool { 
            id: object::new(ctx), 
            total_staked: balance::zero<SUI>(),
            admin
        };
        // Share the pool as a shared object
        transfer::share_object(pool);
    }

    /// Start a new game by staking SUI
    public entry fun start_game(
        initiator: &mut Coin<SUI>,
        opponent: address,
        stake_amount: u64,
        pool: &mut GamePool,
        ctx: &mut TxContext
    ) {
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
            stake: stake_amount,
            settled: false
        };
        
        // Emit event
        event::emit(GameStarted {
            session_id: game_id_copy,
            player1: tx_context::sender(ctx),
            player2: opponent,
            stake: stake_amount
        });
        
        // Share the game session
        transfer::share_object(session);
    }

    /// Submit a guess and settle stakes accordingly
    public entry fun submit_guess(
        session: &mut GameSession,
        guess_human: bool,
        was_human: bool,
        pool: &mut GamePool,
        ctx: &mut TxContext
    ) {
        // Verify session is not already settled
        assert!(!session.settled, 1);
        
        // Determine winner
        let guesser = tx_context::sender(ctx);
        let winner = if (guess_human == was_human) {
            guesser
        } else if (guesser == session.player1) {
            session.player2
        } else {
            session.player1
        };
        
        // Compute payout
        let payout = (session.stake * 125) / 100;
        
        // Extract payout from pool
        let payout_coin = coin::from_balance(balance::split(&mut pool.total_staked, payout), ctx);
        
        // Transfer to winner
        transfer::public_transfer(payout_coin, winner);
        
        // Mark session as settled
        session.settled = true;
        
        // Emit event
        event::emit(GameSettled {
            session_id: object::uid_to_inner(&session.id),
            winner,
            guess_human,
            was_human,
            payout
        });
    }
}