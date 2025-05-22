module 0x0::TuriCheck {
    // Bring in the transaction context and its sender() function
    use sui::tx_context::sender;

    // The native SUI coin type and Coin<T> abstraction
    use sui::sui::SUI;
    use sui::coin::Coin;

    // Unrestricted object transfer (works for Coin<SUI>)
    use sui::transfer::public_transfer;

    /// A user stakes a Coin<SUI> to start a game.
    public entry fun start_game(
        stake: Coin<SUI>,
        _opponent: address,      // still accepted but unused
        _ctx: &mut tx_context::TxContext
    ) {
        // Send the entire stake into the “house” (hard-coded to package address 0x1)
        public_transfer(stake, @0x1);
    }

    /// After the off-chain game finishes, the user calls this with their original stake coin.
    /// If they guessed correctly, they get 1.25× back immediately; otherwise the entire stake
    /// stays in the house.
    public entry fun submit_guess(
        mut stake: Coin<SUI>,
        correct: bool,
        ctx: &mut TxContext
    ) {
        let player = sender(ctx);
        let house  = @0x1;

        if (correct) {
            // Compute 1.25× payout
            let payout_amount = stake.value() * 125 / 100;
            // Split off exactly that amount, leaving the rest in `stake`
            let payout_coin = stake.split(payout_amount, ctx);
            // Pay the user
            public_transfer(payout_coin, player);
            // And send whatever’s left back to the house
            public_transfer(stake, house);
        } else {
            // Wrong guess → entire stake goes to the house
            public_transfer(stake, house);
        }
    }
}
