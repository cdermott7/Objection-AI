'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import AceAttorneyCourtroom, { AnimationSequence } from './AceAttorneyCourtroom';
import { AnimationState, Character } from '../utils/aceAttorneyAnimations';
import { playSound, SoundEffect } from '../utils/aceAttorneySounds';

// Game states
enum GameState {
  INTRO,
  PLAYER_TURN,
  AI_TURN,
  TRANSITION,
  WAITING_FOR_INPUT,
  GAME_END
}

export default function AceAttorneyGame() {
  const { 
    messages, 
    isLoading, 
    chatEnded, 
    messageCount, 
    sendMessage, 
    startChat, 
    endChat 
  } = useChat();
  
  const [gameState, setGameState] = useState(GameState.INTRO);
  const [inputValue, setInputValue] = useState('');
  const [activeSequence, setActiveSequence] = useState<AnimationSequence[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // Intro sequence
  const introSequence: AnimationSequence[] = [
    {
      character: Character.JUDGE,
      animation: AnimationState.NORMAL,
      text: "Court is now in session for the trial of the Turing Test.",
      textPosition: 'center',
      textVariant: 'normal',
      sound: SoundEffect.COURT_AMBIENCE
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      text: "The prosecution and defense will determine if the defendant is human or AI.",
      textPosition: 'center',
      textVariant: 'normal'
    },
    {
      character: Character.PHOENIX,
      animation: AnimationState.NORMAL,
      text: "The defense is ready, Your Honor.",
      textPosition: 'left',
      textVariant: 'blue'
    },
    {
      character: Character.EDGEWORTH,
      animation: AnimationState.NORMAL,
      text: "The prosecution is ready, Your Honor.",
      textPosition: 'right',
      textVariant: 'red'
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      text: "Very well. Let the cross-examination begin!",
      textPosition: 'center',
      textVariant: 'normal',
      sound: SoundEffect.GUILTY
    }
  ];
  
  // End sequences
  const createEndSequence = (isCorrect: boolean): AnimationSequence[] => [
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      text: "The court has reached a verdict!",
      textPosition: 'center',
      textVariant: 'normal'
    },
    {
      character: isCorrect ? Character.PHOENIX : Character.EDGEWORTH,
      animation: isCorrect ? AnimationState.OBJECTION : AnimationState.DESK_SLAM,
      text: isCorrect ? "CORRECT! Your perception skills are impressive!" : "INCORRECT! Better luck next time.",
      textPosition: isCorrect ? 'left' : 'right',
      textVariant: isCorrect ? 'blue' : 'red',
      sound: isCorrect ? SoundEffect.NOT_GUILTY : SoundEffect.GUILTY
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      text: isCorrect ? "NOT GUILTY! The defendant is indeed what you guessed!" : "GUILTY of deceiving you! The defendant was not what you guessed!",
      textPosition: 'center',
      textVariant: 'normal'
    }
  ];
  
  // Handle game state changes
  useEffect(() => {
    if (!isReady) return;
    
    switch (gameState) {
      case GameState.INTRO:
        setActiveSequence(introSequence);
        break;
        
      case GameState.PLAYER_TURN:
        setActiveSequence([
          {
            character: Character.PHOENIX,
            animation: AnimationState.NORMAL,
            text: "Present your evidence...",
            textPosition: 'left',
            textVariant: 'blue'
          }
        ]);
        break;
        
      case GameState.AI_TURN:
        if (messages.length > 0 && messages[messages.length - 1].role !== 'user') {
          // AI's response
          setActiveSequence([
            {
              character: Character.EDGEWORTH,
              animation: AnimationState.DESK_SLAM,
              text: messages[messages.length - 1].content,
              textPosition: 'right',
              textVariant: 'red'
            }
          ]);
        }
        break;
        
      case GameState.GAME_END:
        // We'd need the result to determine if the player guessed correctly
        const isCorrect = true; // Placeholder - this would come from your game logic
        setActiveSequence(createEndSequence(isCorrect));
        break;
        
      default:
        break;
    }
  }, [gameState, isReady, messages]);
  
  // Handle sequence completion
  const handleSequenceComplete = useCallback(() => {
    switch (gameState) {
      case GameState.INTRO:
        // Start the actual chat
        startChat();
        setIsGameStarted(true);
        setGameState(GameState.PLAYER_TURN);
        break;
        
      case GameState.PLAYER_TURN:
        // Keep in player turn state, waiting for input
        setGameState(GameState.WAITING_FOR_INPUT);
        break;
        
      case GameState.AI_TURN:
        // Go back to player turn
        setGameState(GameState.PLAYER_TURN);
        break;
        
      case GameState.GAME_END:
        // End the game
        break;
        
      default:
        break;
    }
  }, [gameState, startChat]);
  
  // Handle message changes
  useEffect(() => {
    if (!isGameStarted) return;
    
    // If we have messages and the last one is from the AI
    if (messages.length > 0 && messages[messages.length - 1].role !== 'user' && !isLoading) {
      setGameState(GameState.AI_TURN);
    }
    
    // Check if we've hit the message limit
    if (messageCount >= 10) {
      endChat();
      setGameState(GameState.GAME_END);
    }
    
  }, [messages, isLoading, messageCount, isGameStarted, endChat]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    // Phoenix objection animation for user input
    setGameState(GameState.TRANSITION);
    setActiveSequence([
      {
        character: Character.PHOENIX,
        animation: AnimationState.OBJECTION,
        text: inputValue,
        textPosition: 'left',
        textVariant: 'blue',
        sound: SoundEffect.OBJECTION
      }
    ]);
    
    // Submit the message
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };
  
  // Handle courtroom ready state
  const handleCourtroomReady = () => {
    setIsReady(true);
  };
  
  // End the trial (chat)
  const handleEndTrial = () => {
    endChat();
    setGameState(GameState.GAME_END);
  };
  
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-black rounded-lg shadow-xl overflow-hidden border border-indigo-900">
      {/* Courtroom scene */}
      <div className="flex-1 relative overflow-hidden">
        <AceAttorneyCourtroom
          activeSequence={activeSequence}
          onSequenceComplete={handleSequenceComplete}
          onReady={handleCourtroomReady}
        >
          {/* Overlay UI elements can go here */}
          {gameState === GameState.WAITING_FOR_INPUT && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-3/4 max-w-md">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter your statement..."
                    className="w-full px-4 py-2 rounded-full border-2 border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-indigo-900 text-white"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-4 rounded-full font-medium shadow-sm hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                  >
                    Present
                  </button>
                </div>
              </form>
            </div>
          )}
        </AceAttorneyCourtroom>
      </div>
      
      {/* Control bar */}
      <div className="bg-gray-900 p-3 border-t border-indigo-800 flex justify-between items-center">
        <div className="text-white text-sm">
          <span className="font-bold">Messages:</span> {messageCount}/10
        </div>
        
        {isGameStarted && !chatEnded && (
          <button 
            onClick={handleEndTrial}
            className="bg-red-600 text-white px-4 py-1 rounded text-sm font-medium hover:bg-red-700 transition-all duration-200"
          >
            End Trial
          </button>
        )}
        
        <div className="text-indigo-300 text-xs font-medium">
          ACE ATTORNEY MODE
        </div>
      </div>
    </div>
  );
}