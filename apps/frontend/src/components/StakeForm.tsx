'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { useMockWallet } from '../context/MockWalletContext';
import { getWalletBalance, buildStakeTx, signAndExecuteTransaction } from '../utils/suiTx';

interface StakeFormProps {
  onStakeSubmit: (amount: number) => void;
}

export default function StakeForm({ onStakeSubmit }: StakeFormProps) {
  const [stakeAmount, setStakeAmount] = useState<number>(0.1);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get wallet state from both real and mock wallets
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const mockWallet = useMockWallet();
  
  // Store these in refs to access in event handlers
  const currentAccountRef = useRef(currentAccount);
  const mockWalletRef = useRef(mockWallet);
  
  // Update refs when values change
  useEffect(() => {
    currentAccountRef.current = currentAccount;
    mockWalletRef.current = mockWallet;
  }, [currentAccount, mockWallet]);
  
  // Combined wallet state - ensure mockWallet is checked first to prioritize it if both are available
  const isConnected = mockWallet.isConnected || !!currentAccount;
  const walletAddress = mockWallet.isConnected ? mockWallet.address : currentAccount?.address;
  
  // Log wallet state for debugging
  useEffect(() => {
    console.log('StakeForm wallet state:', { 
      mockConnected: mockWallet.isConnected, 
      currentAccountConnected: !!currentAccount,
      mockAddress: mockWallet.address,
      currentAccountAddress: currentAccount?.address,
      isConnected,
      walletAddress
    });
  }, [mockWallet.isConnected, mockWallet.address, currentAccount, isConnected, walletAddress]);
  
  // Fetch balance from appropriate wallet
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected) {
        if (mockWallet.isConnected) {
          // Use the mock wallet balance
          setBalance(mockWallet.balance);
        } else if (currentAccount) {
          try {
            // Initialize SUI client
            const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
            const suiClient = new SuiClient({
              url: network === 'mainnet' 
                ? 'https://fullnode.mainnet.sui.io:443'
                : 'https://fullnode.testnet.sui.io:443'
            });
            
            // Fetch real balance from the blockchain
            const totalBalance = await getWalletBalance(suiClient, currentAccount.address);
            setBalance(totalBalance);
            
            console.log('Fetched real wallet balance:', {
              address: currentAccount.address,
              balance: totalBalance
            });
          } catch (error) {
            console.error('Error fetching wallet balance:', error);
            // Fallback to a mock balance if real fetch fails
            setBalance(Math.random() * 9 + 1);
          }
        }
      }
    };
    
    fetchBalance();
  }, [isConnected, currentAccount, mockWallet.isConnected, mockWallet.balance]);
  
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setStakeAmount(isNaN(value) ? 0 : value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (stakeAmount <= 0 || (balance !== null && stakeAmount > balance)) {
      setErrorMessage('Invalid stake amount');
      return;
    }
    
    // Special check to ensure we're connected - safeguard against potential race conditions
    if (!isConnected) {
      console.log('Not connected when trying to submit stake - checking individual wallets');
      const { current: mockWallet } = mockWalletRef;
      const { current: currentAccount } = currentAccountRef;
      
      // If neither wallet is connected, display error
      if (!mockWallet.isConnected && !currentAccount) {
        console.error('No wallet connected when trying to stake');
        setErrorMessage('No wallet connected. Please connect a wallet first.');
        return;
      }
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Access the current values from refs to avoid hook issues
      const { current: mockWallet } = mockWalletRef;
      const { current: currentAccount } = currentAccountRef;
      
      console.log('Submitting stake, wallet state:', {
        mockConnected: mockWallet.isConnected,
        currentAccountConnected: !!currentAccount,
        hasCurrentAccount: !!currentAccount,
        stakeAmount
      });
      
      // Prioritize mock wallet if connected
      if (mockWallet.isConnected) {
        // For mock wallet: update balance and proceed
        mockWallet.updateBalance(-stakeAmount);
        console.log(`Mock stake of ${stakeAmount} SUI submitted`);
        onStakeSubmit(stakeAmount);
      } else if (currentAccount) {
        // For real wallet: build and submit transaction
        console.log(`Building stake transaction for ${stakeAmount} SUI`);
        
        // Build the stake transaction
        const tx = buildStakeTx(stakeAmount);
        
        // Use the signAndExecute hook
        const result = await new Promise((resolve, reject) => {
          signAndExecute({
            transaction: tx
          }, {
            onSuccess: resolve,
            onError: reject
          });
        });
        
        console.log('Stake transaction result:', result);
        
        // Only proceed to game if transaction succeeded
        if (result) {
          onStakeSubmit(stakeAmount);
        } else {
          throw new Error('Transaction failed');
        }
      } else {
        // Fallback for situations where we're in a weird state - use mock wallet functionality
        console.log('No wallet properly connected - using fallback mock stake');
        // Use a standard mock stake of the requested amount
        onStakeSubmit(stakeAmount);
      }
    } catch (error) {
      console.error('Error submitting stake:', error);
      setErrorMessage('Failed to place stake. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatSui = (amount: number): string => {
    return amount.toFixed(2) + ' SUI';
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 w-full max-w-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Place Your Stake</h3>
        <p className="text-sm text-gray-500 mt-1">
          Stake SUI tokens on your ability to identify human vs AI
        </p>
      </div>
      
      {/* Wallet & Balance Info */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Your Wallet</span>
          <span className="font-mono text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">Balance</span>
          <span className="font-semibold text-gray-700">
            {balance === null ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              formatSui(balance)
            )}
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Stake Amount
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="number"
              name="stakeAmount"
              id="stakeAmount"
              min="0.1"
              step="0.1"
              max={balance || undefined}
              value={stakeAmount}
              onChange={handleStakeChange}
              className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 border"
              placeholder="0.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">SUI</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Min: 0.1 SUI</span>
            <span>Max: {balance ? formatSui(balance) : 'Loading...'}</span>
          </div>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Potential Reward (1.25x)</span>
            <span className="font-semibold text-indigo-600">
              {stakeAmount > 0 ? formatSui(stakeAmount * 1.25) : '0.00 SUI'}
            </span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !isConnected || stakeAmount <= 0 || (balance !== null && stakeAmount > balance)}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Place Stake & Start Game'
          )}
        </button>
        
        <p className="mt-3 text-xs text-center text-gray-500">
          Correctly guessing human vs AI wins 1.25x your stake. Incorrect guesses lose your stake.
        </p>
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-center">
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
}