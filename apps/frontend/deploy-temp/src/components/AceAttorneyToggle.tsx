'use client';

import { useChat, GameMode } from '../context/ChatContext';

export default function AceAttorneyToggle() {
  const { gameMode, toggleGameMode } = useChat();
  
  const isAceAttorneyMode = gameMode === GameMode.ACE_ATTORNEY;
  
  // Add debug logging to help troubleshoot
  console.log('AceAttorneyToggle rendering with mode:', { 
    gameMode, 
    isAceAttorneyMode,
    standardMode: GameMode.STANDARD,
    aceAttorneyMode: GameMode.ACE_ATTORNEY
  });
  
  // Define a handler to log the toggle action
  const handleToggle = () => {
    console.log('Toggle button clicked, switching from:', isAceAttorneyMode ? 'ACE_ATTORNEY' : 'STANDARD');
    toggleGameMode();
    
    // Log after a short delay to see the updated state
    // Don't call hooks inside callbacks!
    setTimeout(() => {
      console.log('Game mode toggle requested');
    }, 100);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggle}
        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
          isAceAttorneyMode 
            ? 'bg-red-600 text-white shadow-lg' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <div className="flex items-center">
          {isAceAttorneyMode ? (
            <>
              <span className="mr-2 text-xs font-bold">OBJECTION!</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM11 15V17H13V15H11ZM11 7V13H13V7H11Z" fill="currentColor"/>
              </svg>
            </>
          ) : (
            <>
              <span className="mr-2 text-xs font-bold">ACE ATTORNEY</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20Z" fill="currentColor"/>
              </svg>
            </>
          )}
        </div>
      </button>
      
      {isAceAttorneyMode && (
        <div className="text-xs text-red-600 font-medium animate-pulse">
          Only 10 messages allowed in Ace Attorney Mode!
        </div>
      )}
    </div>
  );
}