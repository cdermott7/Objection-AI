'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SimpleAceAttorneyMode from '../../src/components/SimpleAceAttorneyMode';
import { GameMode } from '../../src/context/ChatContext';
import LiveMatchmaking from '../../src/components/LiveMatchmaking';

// This is the Ace Attorney game page with matchmaking
export default function AceAttorneyModePage() {
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [mockAddress, setMockAddress] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isMatchmakingEnabled, setIsMatchmakingEnabled] = useState(false);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [opponentIsHuman, setOpponentIsHuman] = useState<boolean | null>(null);
  const [connectionState, setConnectionState] = useState<string>('waiting');
  const router = useRouter();
  
  // Set up Ace Attorney mode in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set game mode
      localStorage.setItem('turiCheckGameMode', GameMode.ACE_ATTORNEY);
      
      // Set up mock wallet (always use mock wallet for Ace Attorney mode)
      try {
        // Generate a mock address
        const newMockAddress = '0x' + Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        setMockAddress(newMockAddress);
        
        // Generate a session ID
        const newSessionId = Date.now().toString();
        setSessionId(newSessionId);
        
        // Create or update mock wallet state
        localStorage.setItem('mockWalletState', JSON.stringify({
          isConnected: true,
          address: newMockAddress,
          balance: 10 // Start with 10 SUI
        }));
        
        // Mark user as connected in auth context
        localStorage.setItem('turicheck_wallet_user', JSON.stringify({
          id: newMockAddress,
          address: newMockAddress,
          isConnected: true,
          createdAt: new Date().toISOString()
        }));
        
        console.log('Mock wallet set up for Ace Attorney mode:', { newMockAddress, newSessionId });
        
        // Set loading to false after a short delay to ensure everything is initialized
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error setting up mock wallet for Ace Attorney mode:', error);
        setLoading(false);
      }
    }
  }, []);
  
  // Handle starting the game
  const handleStartGame = useCallback((enableMatchmaking: boolean) => {
    setIsMatchmakingEnabled(enableMatchmaking);
    setGameStarted(true);
    
    // We use a default stake of 1 SUI for simplicity
    localStorage.setItem('aceAttorneyStake', '1');
    
    console.log(`Starting Ace Attorney game with fixed stake: 1 SUI, matchmaking: ${enableMatchmaking}`);
    
    // Store matchmaking preference
    localStorage.setItem('aceAttorneyMatchmaking', enableMatchmaking ? 'true' : 'false');
  }, []);
  
  // Return to standard mode
  const handleReturnToStandard = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('turiCheckGameMode', GameMode.STANDARD);
      router.push('/');
    }
  }, [router]);
  
  // Handle opponent messages
  const handleOpponentMessage = useCallback((message: string) => {
    console.log('Received message from opponent:', message);
    
    // Make the message available to the Ace Attorney component
    if (typeof window !== 'undefined') {
      (window as any).latestOpponentMessage = message;
      
      // Dispatch a custom event that SimpleAceAttorneyMode can listen for
      const event = new CustomEvent('opponentMessage', { detail: { message } });
      window.dispatchEvent(event);
    }
  }, []);
  
  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: string) => {
    console.log('Connection state changed:', state);
    setConnectionState(state);
    
    // Make the connection state available to the Ace Attorney component
    if (typeof window !== 'undefined') {
      (window as any).connectionState = state;
      
      // Dispatch a custom event that SimpleAceAttorneyMode can listen for
      const event = new CustomEvent('connectionStateChange', { detail: { state } });
      window.dispatchEvent(event);
    }
  }, []);
  
  // Handle match completion
  const handleMatchComplete = useCallback((isHuman: boolean) => {
    console.log('Match complete, opponent is human:', isHuman);
    setOpponentIsHuman(isHuman);
    
    // Make the opponent type available to the Ace Attorney component
    if (typeof window !== 'undefined') {
      (window as any).opponentIsHuman = isHuman;
      localStorage.setItem('aceAttorneyOpponentIsHuman', isHuman ? 'true' : 'false');
      
      // Dispatch a custom event that SimpleAceAttorneyMode can listen for
      const event = new CustomEvent('matchComplete', { detail: { isHuman } });
      window.dispatchEvent(event);
    }
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-white mt-4">Loading Ace Attorney Mode...</h2>
        </div>
      </div>
    );
  }
  
  // Show start screen if game not started
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-lg shadow-2xl border border-red-800">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-red-600 mb-4">ACE ATTORNEY MODE</h2>
            <p className="text-gray-300 text-lg">
              Enter the courtroom and decide if Prosecutor Edgeworth is human or AI!
            </p>
          </div>
          
          <div className="bg-black/50 p-6 rounded-lg mb-6 border border-red-900">
            <h3 className="text-xl font-bold text-white mb-3">How to Play:</h3>
            <ul className="text-gray-300 space-y-2 list-disc pl-5">
              <li>The Judge will ask 5 questions to both parties</li>
              <li>Analyze Edgeworth's responses carefully</li>
              <li>Decide if Edgeworth is human or AI</li>
              <li>Make your case with proper objections!</li>
            </ul>
          </div>
          
          <div className="bg-red-900/20 p-4 rounded-lg mb-8 text-center">
            <p className="text-red-400 font-medium">
              Automatic stake: 1 SUI
            </p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => handleStartGame(true)}
              className="w-full py-4 bg-red-700 text-white text-xl font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg"
            >
              ENTER WITH LIVE MATCHMAKING
            </button>
            
            <button
              onClick={() => handleStartGame(false)}
              className="w-full py-4 bg-blue-700 text-white text-xl font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              ENTER WITH AI OPPONENT
            </button>
            
            <button
              onClick={handleReturnToStandard}
              className="w-full py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              Return to Standard Mode
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {isMatchmakingEnabled && (
        <LiveMatchmaking
          sessionId={sessionId}
          userAddress={mockAddress}
          onOpponentMessage={handleOpponentMessage}
          onConnectionStateChange={handleConnectionStateChange}
          onMatchComplete={handleMatchComplete}
        />
      )}
      <SimpleAceAttorneyMode />
    </>
  );
}