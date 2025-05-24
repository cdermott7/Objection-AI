// @ts-nocheck
/**
 * Sui blockchain transaction utilities for TuriCheck
 * 
 * This module handles all blockchain-related operations:
 * - Building transactions
 * - Signing and executing transactions
 * - Wallet connection
 * - Game session management and staking
 */

// Import from the correct paths in the Sui SDK
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Initialize Sui client based on network from environment variables
const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
const gameModule = process.env.NEXT_PUBLIC_GAME_MODULE || 'turicheckminimal';
const isMockDeployment = process.env.NEXT_PUBLIC_MOCK_DEPLOYMENT === 'true';

// Initialize Sui client for the appropriate network
const getSuiClient = () => {
  return new SuiClient({
    url: network === 'mainnet' 
      ? 'https://fullnode.mainnet.sui.io:443'
      : 'https://fullnode.testnet.sui.io:443'
  });
};

console.log('Sui TX initialization:', { 
  network, 
  packageId, 
  gameModule, 
  isMockDeployment 
});

// Badge image URLs
const CORRECT_BADGE_URL = '/badge-correct.svg';
const INCORRECT_BADGE_URL = '/badge-incorrect.svg';

/**
 * Build a transaction to start a game with a stake
 * 
 * @param playerAddress The player's address
 * @param stakeAmount The amount of SUI to stake (in SUI units, not MIST)
 * @param sessionId Unique session ID from the frontend
 * @returns Transaction object ready to be signed and executed
 */
export function buildStartGameTx(
  playerAddress: string,
  stakeAmount: number,
  sessionId: number
): Transaction {
  const txb = new Transaction();
  
  console.log(`Building start game transaction: player=${playerAddress}, stake=${stakeAmount}, sessionId=${sessionId}`);
  console.log(`Game module: ${gameModule}`);
  console.log(`Mock deployment: ${isMockDeployment}`);

  if (isMockDeployment) {
    // For mock deployment, just return an empty transaction
    console.log("Using mock deployment transaction");
    return txb;
  }

  if (!packageId || !gameModule) {
    console.error('Missing packageId or gameModule in environment variables');
    throw new Error('Contract configuration is missing');
  }

  // Convert SUI to MIST (1 SUI = 10^9 MIST)
  const stakeAmountMist = Math.floor(stakeAmount * 1_000_000_000);

  // Split a coin for the stake amount
  txb.splitCoins(txb.gas, [txb.pure.u64(stakeAmountMist)]);

  // Add the start_game call
  txb.moveCall({
    target: `${packageId}::${gameModule}::start_game`,
    arguments: [
      txb.pure.address(playerAddress), // Player address
      txb.pure.u64(sessionId), // Session ID
      txb.object(txb.cursor() - 1), // Use the coin we just split
    ],
  });

  return txb;
}

/**
 * Build a transaction to submit a guess and settle the game
 * 
 * @param gameObjectId The ID of the game object
 * @param guessHuman Whether the player guesses human (true) or AI (false)
 * @param wasHuman The actual answer (determined off-chain)
 * @param winnerAddress The address of the winner
 * @returns Transaction object ready to be signed and executed
 */
export function buildSubmitGuessTx(
  gameObjectId: string,
  guessHuman: boolean,
  wasHuman: boolean,
  winnerAddress: string
): Transaction {
  const txb = new Transaction();
  
  console.log(`Building submit guess transaction: guess=${guessHuman}, actual=${wasHuman}, winner=${winnerAddress}`);
  console.log(`Game module: ${gameModule}`);
  console.log(`Mock deployment: ${isMockDeployment}`);

  if (isMockDeployment) {
    // For mock deployment, just return an empty transaction
    console.log("Using mock deployment transaction");
    return txb;
  }

  if (!packageId || !gameModule) {
    console.error('Missing packageId or gameModule in environment variables');
    throw new Error('Contract configuration is missing');
  }

  // Add the submit_guess call
  txb.moveCall({
    target: `${packageId}::${gameModule}::submit_guess`,
    arguments: [
      txb.object(gameObjectId), // Game session object
      txb.pure.bool(guessHuman), // Player's guess
      txb.pure.bool(wasHuman), // Actual answer
      txb.pure.address(winnerAddress), // Winner address
    ],
  });

  return txb;
}

/**
 * Function to sign and execute a transaction using the provided wallet adapter
 * 
 * @param walletAdapter Function to handle wallet interactions
 * @param transaction The transaction to execute
 * @returns Promise resolving to the transaction result
 */
export async function signAndExecuteTransaction(
  walletAdapter: any,
  transaction: Transaction
): Promise<any> {
  try {
    // If we're in mock mode, use the mock function directly
    if (isMockDeployment) {
      console.log('Using mock transaction execution');
      return mockSignAndExecuteTransactionBlock(transaction);
    }
    
    console.log('Sending transaction to wallet for signing...');
    console.log('Wallet adapter type:', typeof walletAdapter);
    
    // Set the proper gas budget
    transaction.setGasBudget(10000000);
    
    // Debug log transaction
    console.log('Transaction to execute:', transaction);
    
    // Use a try-catch specifically for the adapter call
    try {
      // Handle real transaction execution - additional error handling
      if (typeof walletAdapter !== 'function') {
        throw new Error('Wallet adapter is not a function. This might indicate wallet is not properly connected.');
      }
      
      // Check if this is mock wallet or real wallet
      const isMockWallet = walletAdapter.name === 'mockSignAndExecuteTransactionBlock';
      
      // Extract sender address from adapter
      let senderAddress = null;
      
      // Try different methods to get the sender address
      if (walletAdapter.sender) {
        senderAddress = walletAdapter.sender;
        console.log('Found sender in walletAdapter.sender:', senderAddress);
      } else if (walletAdapter.currentAddress) {
        senderAddress = walletAdapter.currentAddress;
        console.log('Found sender in walletAdapter.currentAddress:', senderAddress);
      } else if (typeof walletAdapter.getSender === 'function') {
        senderAddress = walletAdapter.getSender();
        console.log('Found sender using walletAdapter.getSender():', senderAddress);
      } else if (walletAdapter.currentAccount && walletAdapter.currentAccount.address) {
        senderAddress = walletAdapter.currentAccount.address;
        console.log('Found sender in walletAdapter.currentAccount.address:', senderAddress);
      } else if (typeof window !== 'undefined') {
        // Try different browser-specific locations
        if ((window as any).suiWallet?.currentAddress) {
          senderAddress = (window as any).suiWallet.currentAddress;
          console.log('Found sender in window.suiWallet.currentAddress:', senderAddress);
        } else if (localStorage.getItem('sui_wallet_address')) {
          senderAddress = localStorage.getItem('sui_wallet_address');
          console.log('Found sender in localStorage:', senderAddress);
        }
      }
      
      // Set the sender address on the transaction if found
      if (senderAddress) {
        console.log('Setting transaction sender:', senderAddress);
        transaction.setSender(senderAddress);
      } else {
        // If no sender address was found from the adapter, check if it's already set on the transaction
        console.warn('No sender address found in wallet context, checking transaction...');
        
        // Try to access the sender from the transaction object directly
        const transactionSender = (transaction as any).sender || (transaction as any).tx?.sender;
        if (transactionSender) {
          console.log('Transaction already has sender:', transactionSender);
        } else {
          console.error('CRITICAL: No sender address available for transaction');
          throw new Error('Missing transaction sender - wallet not properly connected or address not available');
        }
      }
      
      // Verify the transaction has a sender before building
      if (!transaction.sender) {
        console.error('ERROR: Transaction has no sender set');
        throw new Error('Missing transaction sender - wallet not properly connected or address not available');
      }
      
      // Make sure transaction is serialized properly
      console.log('Building transaction with sender:', transaction.sender);
      const txBytes = await transaction.build();
      console.log('Transaction bytes built successfully:', txBytes);
      
      // Execute the transaction
      console.log('Executing transaction...');
      const result = await walletAdapter(transaction);
      console.log('Transaction executed successfully:', result);
      return result;
    } catch (adapterError) {
      console.error('Error in wallet adapter execution:', adapterError);
      throw new Error(`Transaction execution failed: ${adapterError.message || 'Unknown wallet error'}`);
    }
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
}

/**
 * Get coin objects for a wallet address
 * 
 * @param suiClient The SuiClient instance
 * @param address The wallet address
 * @param minAmount Optional minimum amount to filter by
 * @returns Promise resolving to an array of coin objects
 */
export async function getWalletCoins(
  suiClient: SuiClient,
  address: string,
  minAmount: number = 0
): Promise<any[]> {
  if (isMockDeployment) {
    // Return mock coins in development
    return [
      {
        coinObjectId: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 1000000000 // 1 SUI
      },
      {
        coinObjectId: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 5000000000 // 5 SUI
      }
    ];
  }
  
  try {
    // Get all SUI coins owned by the address
    const coins = await suiClient.getCoins({
      owner: address,
      coinType: '0x2::sui::SUI'
    });
    
    // Filter and format coins
    return coins.data
      .filter(coin => parseInt(coin.balance) >= minAmount)
      .map(coin => ({
        coinObjectId: coin.coinObjectId,
        balance: parseInt(coin.balance)
      }));
  } catch (error) {
    console.error('Error fetching wallet coins:', error);
    return [];
  }
}

/**
 * Get the total SUI balance for a wallet address
 * 
 * @param suiClient The SuiClient instance
 * @param address The wallet address
 * @returns Promise resolving to the total balance in SUI (not MIST)
 */
export async function getWalletBalance(
  suiClient: SuiClient,
  address: string
): Promise<number> {
  if (isMockDeployment) {
    // Return mock balance in development (between 1-10 SUI)
    return 5 + Math.random() * 5;
  }
  
  try {
    console.log('Fetching balance for wallet:', address);
    
    // Get total balance directly from wallet's gas object
    const { totalBalance } = await suiClient.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI'
    });
    
    // Convert from MIST to SUI (1 SUI = 10^9 MIST)
    const balanceSui = Number(totalBalance) / 1_000_000_000;
    console.log('Wallet balance:', balanceSui, 'SUI');
    
    return balanceSui;
  } catch (error) {
    console.error('Error calculating wallet balance:', error);
    return 0;
  }
}

/**
 * Get all active game sessions for an address
 * 
 * @param suiClient The SuiClient instance
 * @param address The wallet address
 * @returns Promise resolving to an array of game sessions
 */
export async function getUserGameSessions(
  suiClient: SuiClient,
  address: string
): Promise<any[]> {
  if (isMockDeployment) {
    // Return mock game sessions in development
    return [
      {
        objectId: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        player1: address,
        player2: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        sessionId: 12345,
        stakeAmount: 1000000000, // 1 SUI
        settled: false
      }
    ];
  }
  
  try {
    // Query all owned objects of the game session type
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        MatchAll: [
          {
            StructType: `${packageId}::turicheckminimal::turi_check::GameSession`
          }
        ]
      },
      options: {
        showContent: true
      }
    });
    
    // Format the game sessions
    return objects.data
      .filter(obj => obj.data && obj.data.content)
      .map(obj => {
        const content = obj.data!.content as any;
        const fields = content.fields;
        
        return {
          objectId: obj.data!.objectId,
          player1: fields.player1,
          player2: fields.player2,
          sessionId: parseInt(fields.session_id),
          stakeAmount: parseInt(fields.stake_amount),
          settled: fields.settled
        };
      });
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    return [];
  }
}

/**
 * Build a transaction to stake SUI tokens
 * 
 * @param amount The amount to stake in SUI units (not MIST)
 * @returns Transaction object ready to be signed and executed
 */
export function buildStakeTx(amount: number): Transaction {
  const txb = new Transaction();
  
  console.log(`Building stake transaction: ${amount} SUI`);
  console.log(`Game module: ${gameModule}`);
  console.log(`Mock deployment: ${isMockDeployment}`);

  if (isMockDeployment) {
    // For mock deployment, just return an empty transaction
    console.log("Using mock deployment transaction");
    return txb;
  }

  if (!packageId || !gameModule) {
    console.error('Missing packageId or gameModule in environment variables');
    throw new Error('Contract configuration is missing');
  }

  // Convert SUI to MIST (1 SUI = 10^9 MIST)
  const amountMist = Math.floor(amount * 1_000_000_000);

  // Split a coin for the stake amount
  txb.splitCoins(txb.gas, [txb.pure(amountMist)]);

  // Add the stake call
  txb.moveCall({
    target: `${packageId}::${gameModule}::stake`,
    arguments: [
      txb.object(txb.cursor() - 1), // Use the coin we just split
    ],
  });

  return txb;
}

// Mock function for transaction execution
export function mockSignAndExecuteTransactionBlock(transaction: any) {
  console.log('MOCK: Signing and executing transaction:', transaction);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a random digest that looks like a real Sui transaction ID
      const mockDigest = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Generate a random object ID for the created object
      const mockObjectId = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      resolve({
        digest: mockDigest,
        effects: { 
          status: { status: 'success' },
          created: [{ 
            reference: { objectId: mockObjectId },
            owner: { AddressOwner: '0xd0c2e258507dca532c7ba699aee4b6c2f9cd1881eb8ede689269d3bd89ba75ac' }
          }]
        },
        timestamp_ms: Date.now(),
        checkpoint: Math.floor(Math.random() * 1000000)
      });
    }, 1500); // Simulate network delay
  });
}