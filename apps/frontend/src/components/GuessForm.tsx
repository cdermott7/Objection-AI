// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat, ChatPartnerType } from '../context/ChatContext';
import { useWalletKit } from '@mysten/wallet-kit';
import { useMockWallet } from '../context/MockWalletContext';
// Import the transaction utilities
import { buildSubmitGuessTx, signAndExecuteTransaction } from '../utils/suiTx';

export default function GuessForm() {
  const { sessionId, chatEnded, userGuess, guessCorrect, makeGuess, chatPartnerType, stakeAmount, gameObjectId } = useChat();
  const [selectedGuess, setSelectedGuess] = useState<ChatPartnerType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  
  // Get wallet state from both real and mock wallets
  const walletKit = useWalletKit();
  const mockWallet = useMockWallet();
  
  // Store wallet states in refs to avoid hook issues in event handlers
  const walletKitRef = useRef(walletKit);
  const mockWalletRef = useRef(mockWallet);
  
  // Update refs when values change
  useEffect(() => {
    walletKitRef.current = walletKit;
    mockWalletRef.current = mockWallet;
  }, [walletKit, mockWallet]);
  
  // Use the appropriate wallet address
  const walletAddress = walletKit.currentAccount?.address || mockWallet.address || 'mock-address';
  
  // Track transaction in progress
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  // Handle submitting the guess
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuess || !sessionId || !chatEnded || userGuess !== null || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Make the guess
      makeGuess(selectedGuess);
      
      // Give a moment to update the state
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error submitting guess:', error);
      setError('Failed to submit your guess. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Claim reward when the guess is correct
  const handleClaimReward = useCallback(async () => {
    if (!sessionId || guessCorrect === null || rewardClaimed || !chatPartnerType) return;
    
    setIsSubmitting(true);
    setError(null);
    setTransactionStatus('Building transaction...');
    
    try {
      // Access the current values from refs to avoid hook issues
      const { current: mockWallet } = mockWalletRef;
      const { current: walletKit } = walletKitRef;
      
      console.log('Building submit guess transaction');
      
      const guessHuman = userGuess === ChatPartnerType.HUMAN;
      const wasHuman = chatPartnerType === ChatPartnerType.HUMAN;
      
      // Use mock game object ID if real one is not available
      const gameId = gameObjectId || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Only use mock wallet if real wallet is not connected
      const isRealWalletConnected = walletKit.isConnected;
      
      // Fall back to mock wallet only if real wallet is not available
      if (!isRealWalletConnected && stakeAmount) {
        // Simulate a successful transaction with mock wallet
        setTransactionStatus('Using mock wallet (no real wallet connected)...');
        
        // Create a delay to simulate transaction processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (guessCorrect) {
          // If guess is correct, add reward to mock balance
          const rewardAmount = stakeAmount * 0.25; // 25% reward
          mockWallet.updateBalance(rewardAmount);
          console.log(`Added reward of ${rewardAmount} SUI to mock wallet`);
        } else {
          // If guess is incorrect, deduct stake from mock balance
          mockWallet.updateBalance(-stakeAmount);
          console.log(`Deducted stake of ${stakeAmount} SUI from mock wallet`);
        }
        
        setRewardClaimed(true);
        setTransactionStatus('Transaction completed successfully');
        return;
      }
      
      // Real wallet integration - use our extended wallet context
      setTransactionStatus('Creating transaction...');
      
      // Determine if we can use the real wallet
      const isWalletConnected = walletKit.isConnected;
      const shouldUseMock = !isWalletConnected;
      
      // Debug wallet state
      console.log('WALLET CONNECTION STATUS:', {
        walletKit: {
          isConnected: walletKit.isConnected,
          address: walletKit.currentAccount?.address
        },
        mockWallet: {
          isConnected: mockWallet.isConnected,
          address: mockWallet.address
        },
        decision: {
          isExtendedWalletConnected,
          isWalletAdapterConnected,
          shouldUseMock
        }
      });
      
      // Get the winner address
      const winnerAddress = guessCorrect ? (
        walletKit.currentAccount?.address || 
        mockWallet.address || 
        '0x0000000000000000000000000000000000000000'
      ) : '0x0000000000000000000000000000000000000000';
      
      if (!winnerAddress || winnerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('No wallet address available. Please connect your wallet.');
      }
      
      console.log('Transaction details:', {
        gameId,
        guessHuman,
        wasHuman,
        winnerAddress,
        walletConnected: isWalletConnected,
        shouldUseMock
      });
      
      // Build the transaction
      const tx = buildSubmitGuessTx(
        gameId,
        guessHuman,
        wasHuman,
        winnerAddress
      );
      
      // CRITICAL: Explicitly set sender address
      tx.setSender(winnerAddress);
      console.log('Explicitly set transaction sender:', winnerAddress);
      
      setTransactionStatus('Preparing for signing...');
      
      // Execute the transaction
      try {
        setTransactionStatus('Sending to wallet for approval...');
        
        // Different execution paths based on wallet availability
        if (isWalletConnected) {
          // Use wallet kit
          console.log('Executing transaction with wallet kit');
          const result = await walletKit.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: { showEffects: true, showEvents: true }
          });
          console.log('Transaction successful:', result);
        }
        else {
          // Use mock wallet as last resort
          console.log('Using mock wallet (no real wallet connected)');
          if (!mockWallet.mockSignAndExecuteTransactionBlock) {
            throw new Error('Mock wallet not properly initialized');
          }
          
          const result = await mockWallet.mockSignAndExecuteTransactionBlock(tx);
          console.log('Mock transaction successful:', result);
          
          // Update mock wallet balance
          if (guessCorrect && stakeAmount) {
            const rewardAmount = stakeAmount * 0.25; // 25% reward
            mockWallet.updateBalance(rewardAmount);
            console.log(`Added reward of ${rewardAmount} SUI to mock wallet`);
          }
        }
        
        // Update UI state
        setTransactionStatus('Transaction complete!');
        setRewardClaimed(true);
      } catch (txError) {
        console.error('Transaction failed:', txError);
        throw new Error('Transaction failed: ' + (txError.message || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Error claiming reward:', error);
      // Provide more specific error messages based on the error type
      if (error.message && error.message.includes('sender')) {
        setError('Wallet connection issue: Make sure your wallet is connected and try again.');
      } else if (error.message && error.message.includes('transaction')) {
        setError('Transaction error: There was a problem processing the transaction. Please try again.');
      } else {
        setError('Failed to claim your reward. Please refresh the page and try again.');
      }
      setTransactionStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, guessCorrect, rewardClaimed, chatPartnerType, userGuess, walletAddress, stakeAmount, gameObjectId]);
  
  // Auto-claim rewards only for mock wallet when no real wallet is connected
  useEffect(() => {
    // Check if any real wallet is connected
    const isAnyRealWalletConnected = walletKit.isConnected;
    
    // Only auto-claim for mock wallet when no real wallet is connected
    if (!isAnyRealWalletConnected && guessCorrect && stakeAmount && !rewardClaimed && !isSubmitting) {
      console.log('Setting up auto-claim for mock wallet (no real wallet connected)');
      
      // Auto-claim after a short delay
      const timer = setTimeout(() => {
        if (!isAnyRealWalletConnected && guessCorrect && stakeAmount && !rewardClaimed && !isSubmitting) {
          console.log('Auto-claiming reward for correct guess (mock wallet only)');
          
          // Update mock wallet balance directly
          const { current: mockWallet } = mockWalletRef;
          const rewardAmount = stakeAmount * 0.25; // 25% reward
          
          try {
            mockWallet.updateBalance(rewardAmount);
            console.log(`Added reward of ${rewardAmount} SUI to mock wallet`);
            setRewardClaimed(true);
          } catch (err) {
            console.error('Error auto-claiming reward:', err);
          }
        }
      }, 2000); // Give a longer delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [
    guessCorrect, 
    stakeAmount, 
    rewardClaimed, 
    isSubmitting, 
    walletKit.isConnected
  ]);

  // If chat hasn't ended, don't show the form
  if (!chatEnded) {
    return null;
  }

  // If user has already made a guess, show the result with premium styling
  if (userGuess !== null && guessCorrect !== null) {
    // Calculate reward amount if correct
    const rewardAmount = stakeAmount ? stakeAmount * 1.25 : 0;
    const formattedStakeAmount = stakeAmount ? stakeAmount.toFixed(2) : '0.00';
    const formattedRewardAmount = rewardAmount.toFixed(2);
    
    return (
      <div className="mt-8 p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-100 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
        
        <div className={`mx-auto w-20 h-20 rounded-full mb-6 flex items-center justify-center ${
          guessCorrect ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
        }`}>
          {guessCorrect ? (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">
          {guessCorrect ? 'Correct!' : 'Incorrect!'}
        </h2>
        
        {/* Show stake and reward information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">You staked:</span>
            <span className="font-semibold">{formattedStakeAmount} SUI</span>
          </div>
          
          {guessCorrect ? (
            <div className="flex justify-between items-center text-green-600">
              <span>You won:</span>
              <span className="font-bold">{formattedRewardAmount} SUI</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-red-500">
              <span>You lost:</span>
              <span className="font-bold">{formattedStakeAmount} SUI</span>
            </div>
          )}
        </div>
        
        <p className="text-center mb-8 text-gray-600">
          {guessCorrect
            ? "You successfully identified your chat partner. Your perception skills are impressive!"
            : `Actually, you were talking to ${userGuess === ChatPartnerType.HUMAN ? 'an AI' : 'a human'}. The line between human and AI interaction is getting blurrier!`}
        </p>
        
        {guessCorrect && stakeAmount && stakeAmount > 0 && (
          <div className="flex flex-col items-center">
            {/* Status banner for wallet info */}
            <div className="mb-4 w-full px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm text-center">
              {walletKit.isConnected ? (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wallet connected: {walletKit.currentAccount?.address?.slice(0, 8)}...{walletKit.currentAccount?.address?.slice(-6)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Using mock wallet - connect a real wallet to claim SUI tokens</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleClaimReward}
              disabled={isSubmitting || rewardClaimed}
              className={`px-8 py-3 rounded-full font-semibold shadow-md transition-all duration-200 flex items-center ${
                rewardClaimed
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:shadow-lg transform hover:-translate-y-0.5'
              } disabled:opacity-70 disabled:transform-none`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Claiming Reward...
                </>
              ) : rewardClaimed ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Reward Successfully Claimed
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Claim {formattedRewardAmount} SUI Reward
                </>
              )}
            </button>
            
            {/* Connect wallet button if not connected */}
            {!walletKit.isConnected && !rewardClaimed && (
              <button 
                onClick={() => console.log('Connect wallet clicked')}
                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect real wallet instead
              </button>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-center">
            {error}
          </div>
        )}
        
        {transactionStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-500 text-center">
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{transactionStatus}</span>
            </div>
          </div>
        )}
        
        {rewardClaimed && (
          <div className="mt-6 text-center text-green-600 font-medium">
            Your rewards have been sent to your wallet!
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
          >
            Play Again
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Show the premium styled guess form
  return (
    <div className="mt-8 p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-100 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full opacity-20"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
      
      <div className="flex items-center justify-center mb-6">
        <div className="bg-indigo-100 text-indigo-600 rounded-full p-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
        Make Your Guess
      </h2>
      
      <p className="text-center text-gray-600 mb-8">
        Based on your 60-second conversation, who do you think you were talking to?
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedGuess === ChatPartnerType.HUMAN 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-200 hover:bg-gray-50'
          }`}>
            <input
              type="radio"
              name="guess"
              value={ChatPartnerType.HUMAN}
              checked={selectedGuess === ChatPartnerType.HUMAN}
              onChange={() => setSelectedGuess(ChatPartnerType.HUMAN)}
              className="sr-only"
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              selectedGuess === ChatPartnerType.HUMAN 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className={`text-lg font-medium ${
              selectedGuess === ChatPartnerType.HUMAN 
                ? 'text-indigo-600' 
                : 'text-gray-700'
            }`}>Human</span>
          </label>
          
          <label className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedGuess === ChatPartnerType.AI 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-200 hover:bg-gray-50'
          }`}>
            <input
              type="radio"
              name="guess"
              value={ChatPartnerType.AI}
              checked={selectedGuess === ChatPartnerType.AI}
              onChange={() => setSelectedGuess(ChatPartnerType.AI)}
              className="sr-only"
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              selectedGuess === ChatPartnerType.AI 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className={`text-lg font-medium ${
              selectedGuess === ChatPartnerType.AI 
                ? 'text-indigo-600' 
                : 'text-gray-700'
            }`}>AI</span>
          </label>
        </div>
        
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={!selectedGuess || isSubmitting}
            className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:transform-none flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <span>Submit Your Guess</span>
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-center">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}