'use client';

import { useState } from 'react';
import { useChat, ChatPartnerType } from '../context/ChatContext';
import { useWallet } from '@mysten/dapp-kit';
import { buildMintBadgeTx, signAndExecuteTransaction } from '../utils/suiTx';

export default function GuessForm() {
  const { sessionId, chatEnded, userGuess, guessCorrect, makeGuess } = useChat();
  const [selectedGuess, setSelectedGuess] = useState<ChatPartnerType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeMinted, setBadgeMinted] = useState(false);
  
  const { signAndExecuteTransactionBlock } = useWallet();

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

  // Mint a badge when the guess is correct
  const handleMintBadge = async () => {
    if (!sessionId || guessCorrect === null || badgeMinted) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Build the transaction
      const metadataUri = JSON.stringify({
        sessionId,
        result: guessCorrect ? 'correct' : 'incorrect',
        timestamp: new Date().toISOString()
      });
      
      const tx = buildMintBadgeTx(sessionId, guessCorrect, metadataUri);
      
      // Sign and execute the transaction
      await signAndExecuteTransaction(signAndExecuteTransactionBlock, tx);
      
      // Set badge as minted
      setBadgeMinted(true);
      
    } catch (error) {
      console.error('Error minting badge:', error);
      setError('Failed to mint your badge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If chat hasn't ended, don't show the form
  if (!chatEnded) {
    return null;
  }

  // If user has already made a guess, show the result
  if (userGuess !== null && guessCorrect !== null) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {guessCorrect ? '🎉 Correct!' : '😔 Incorrect!'}
        </h2>
        
        <p className="text-lg text-center mb-6">
          {guessCorrect
            ? "You correctly identified your chat partner!"
            : `Actually, you were talking to ${userGuess === ChatPartnerType.HUMAN ? 'an AI' : 'a human'}.`}
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={handleMintBadge}
            disabled={isSubmitting || badgeMinted}
            className={`px-6 py-2 rounded-lg font-medium ${
              badgeMinted
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isSubmitting
              ? 'Minting...'
              : badgeMinted
              ? 'Badge Minted! ✓'
              : 'Mint Badge NFT'}
          </button>
        </div>
        
        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}
      </div>
    );
  }

  // Show the guess form
  return (
    <form 
      onSubmit={handleSubmit}
      className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">
        Who were you talking to?
      </h2>
      
      <div className="space-y-4 mb-6">
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="guess"
            value={ChatPartnerType.HUMAN}
            checked={selectedGuess === ChatPartnerType.HUMAN}
            onChange={() => setSelectedGuess(ChatPartnerType.HUMAN)}
            className="h-5 w-5 text-indigo-600"
          />
          <span className="ml-3 text-lg font-medium">Human</span>
        </label>
        
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="guess"
            value={ChatPartnerType.AI}
            checked={selectedGuess === ChatPartnerType.AI}
            onChange={() => setSelectedGuess(ChatPartnerType.AI)}
            className="h-5 w-5 text-indigo-600"
          />
          <span className="ml-3 text-lg font-medium">AI</span>
        </label>
      </div>
      
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={!selectedGuess || isSubmitting}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Guess'}
        </button>
      </div>
      
      {error && (
        <p className="mt-4 text-red-500 text-center">{error}</p>
      )}
    </form>
  );
}