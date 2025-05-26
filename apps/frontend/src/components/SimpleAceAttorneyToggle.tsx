'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChat, GameMode } from '../context/ChatContext';

export default function SimpleAceAttorneyToggle() {
  const { gameMode, toggleGameMode } = useChat();
  const [isAceAttorneyMode, setIsAceAttorneyMode] = useState(false);
  
  // Update local state when gameMode changes
  useEffect(() => {
    setIsAceAttorneyMode(gameMode === GameMode.ACE_ATTORNEY);
    console.log('SimpleAceAttorneyToggle: gameMode updated:', {
      gameMode,
      isAceAttorney: gameMode === GameMode.ACE_ATTORNEY
    });
  }, [gameMode]);
  
  // Direct toggle handler that navigates to the Ace Attorney mode page
  const handleToggle = useCallback(() => {
    console.log('Toggle button clicked, current mode:', isAceAttorneyMode ? 'ACE_ATTORNEY' : 'STANDARD');
    
    if (isAceAttorneyMode) {
      // If we're already in Ace Attorney mode, go back to standard mode
      if (typeof window !== 'undefined') {
        try {
          // First update context via the context method
          toggleGameMode();
          
          // Then ensure localStorage is updated
          localStorage.setItem('objectionAIGameMode', GameMode.STANDARD);
          
          // Finally navigate
          console.log('Navigating to standard mode (/)');
          window.location.href = '/';
        } catch (error) {
          console.error('Error switching to standard mode:', error);
          // Fallback direct navigation
          window.location.href = '/';
        }
      }
    } else {
      // Navigate to the dedicated Ace Attorney mode page
      if (typeof window !== 'undefined') {
        try {
          // First update context via the context method
          toggleGameMode();
          
          // Then ensure localStorage is updated
          localStorage.setItem('objectionAIGameMode', GameMode.ACE_ATTORNEY);
          
          // Finally navigate
          console.log('Navigating to Ace Attorney mode (/ace-attorney-mode)');
          window.location.href = '/ace-attorney-mode';
        } catch (error) {
          console.error('Error switching to Ace Attorney mode:', error);
          // Fallback direct navigation
          window.location.href = '/ace-attorney-mode';
        }
      }
    }
  }, [isAceAttorneyMode, toggleGameMode]);
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggle}
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
          isAceAttorneyMode 
            ? 'bg-red-600 text-white shadow-lg' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <span className="mr-2 text-xs font-bold">
          {isAceAttorneyMode ? 'NORMAL MODE' : 'ACE ATTORNEY'}
        </span>
      </button>
      
      {isAceAttorneyMode && (
        <div className="text-xs text-red-600 font-medium">
          Only 10 messages allowed in Ace Attorney Mode!
        </div>
      )}
    </div>
  );
}