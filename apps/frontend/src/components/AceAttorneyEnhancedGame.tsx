'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import AceAttorneyEnhancedCourtroom from './AceAttorneyEnhancedCourtroom';
import { AnimationState, Character } from '../utils/aceAttorneyAnimations';
import { playSound, SoundEffect } from '../utils/aceAttorneySounds';

// Game states with simplified flow
enum GameState {
  INTRO,
  JUDGE_QUESTION,
  PLAYER_INPUT,
  PLAYER_ANSWER,
  AI_ANSWER,
  GAME_END,
  VERDICT
}

// Scene structure for the story flow
interface Scene {
  character: Character;
  animation: AnimationState;
  dialogue: string;
  objection?: 'objection' | 'holdit' | 'takethat' | null;
  sound?: SoundEffect;
  autoAdvance?: boolean;
}

export default function AceAttorneyEnhancedGame() {
  const { 
    messages, 
    isLoading, 
    chatEnded, 
    sendMessage, 
    startChat, 
    endChat 
  } = useChat();
  
  // Core game state
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [inputValue, setInputValue] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // Character states
  const [phoenixState, setPhoenixState] = useState<AnimationState>(AnimationState.NORMAL);
  const [edgeworthState, setEdgeworthState] = useState<AnimationState>(AnimationState.NORMAL);
  const [judgeState, setJudgeState] = useState<AnimationState>(AnimationState.NORMAL);
  
  // Dialogue state
  const [dialogueText, setDialogueText] = useState('');
  const [speakingCharacter, setSpeakingCharacter] = useState<Character>(Character.JUDGE);
  const [objectionType, setObjectionType] = useState<'objection' | 'holdit' | 'takethat' | null>(null);
  const [isAutoAdvance, setIsAutoAdvance] = useState(false);
  
  // Current scene management
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const sceneTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Question tracking with simplified state management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [waitingForPlayerInput, setWaitingForPlayerInput] = useState(false);
  const [waitingForAIResponse, setWaitingForAIResponse] = useState(false);
  const [lastMessageSentIndex, setLastMessageSentIndex] = useState(0);
  const [lastHandledMessageIndex, setLastHandledMessageIndex] = useState(0);
  
  // DEBUG - Verbose logging of state changes
  useEffect(() => {
    console.log("GAME STATE CHANGED:", {
      gameState: GameState[gameState],
      currentQuestionIndex,
      waitingForPlayerInput,
      waitingForAIResponse,
      messagesLength: messages.length,
      lastHandledMessageIndex,
      isLoading
    });
  }, [gameState, currentQuestionIndex, waitingForPlayerInput, waitingForAIResponse, messages.length, lastHandledMessageIndex, isLoading]);
  
  // Judge questions for the 5-question flow
  const judgeQuestions = [
    "If you were a song, what would you be and why?",
    "Describe a time when you made a mistake and what you learned from it.",
    "If you could solve one global problem instantly, which would it be and how would your solution work?",
    "What's something widely loved that you dislike, and why do you feel that way?",
    "Create a metaphor for how it feels to lose track of time doing something you enjoy."
  ];
  
  // Intro sequence
  const introScenes: Scene[] = [
    {
      character: Character.JUDGE,
      animation: AnimationState.NORMAL,
      dialogue: "Court is now in session for the trial of the Turing Test.",
      sound: SoundEffect.COURT_AMBIENCE,
      autoAdvance: true
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      dialogue: "The prosecution and defense will determine if the defendant is human or AI.",
      autoAdvance: true
    },
    {
      character: Character.PHOENIX,
      animation: AnimationState.NORMAL,
      dialogue: "The defense is ready, Your Honor.",
      autoAdvance: true
    },
    {
      character: Character.EDGEWORTH,
      animation: AnimationState.NORMAL,
      dialogue: "The prosecution is ready, Your Honor.",
      autoAdvance: true
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      dialogue: "Very well. I will pose 5 questions to both parties, and they will respond. Both sides will then guess if the other is human or AI.",
      sound: SoundEffect.GUILTY,
      objection: null,
      autoAdvance: true
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.TALKING,
      dialogue: "The questions are designed to be challenging and ambiguous to test your ability to discern human from AI responses.",
      autoAdvance: true
    },
    {
      character: Character.PHOENIX,
      animation: AnimationState.CONFIDENT,
      dialogue: "We understand, Your Honor. The defense is prepared for this challenge.",
      autoAdvance: true
    },
    {
      character: Character.EDGEWORTH,
      animation: AnimationState.CONFIDENT,
      dialogue: "As is the prosecution. We will reveal the truth through careful analysis.",
      autoAdvance: true
    },
    {
      character: Character.JUDGE,
      animation: AnimationState.DESK_SLAM,
      dialogue: "Let the cross-examination begin!",
      sound: SoundEffect.GUILTY,
      objection: null,
      autoAdvance: true
    }
  ];
  
  // Initialize game based on state
  useEffect(() => {
    if (!isReady) return;
    
    // Clear any existing scene timeout
    if (sceneTimeout.current) {
      clearTimeout(sceneTimeout.current);
      sceneTimeout.current = null;
    }
    
    console.log("Game state changed to:", GameState[gameState]);
    
    switch (gameState) {
      case GameState.INTRO:
        setScenes(introScenes);
        setCurrentSceneIndex(0);
        break;
        
      case GameState.JUDGE_QUESTION:
        if (currentQuestionIndex < judgeQuestions.length) {
          console.log(`Judge asking question ${currentQuestionIndex + 1}:`, judgeQuestions[currentQuestionIndex]);
          setScenes([{
            character: Character.JUDGE,
            animation: AnimationState.DESK_SLAM,
            dialogue: judgeQuestions[currentQuestionIndex],
            autoAdvance: true
          }]);
          setCurrentSceneIndex(0);
        } else {
          // All questions asked, end the game
          console.log("All questions completed, ending chat");
          endChat();
          setGameState(GameState.GAME_END);
        }
        break;
        
      case GameState.PLAYER_INPUT:
        // Waiting for player to type their answer - no scenes to set
        console.log(`Waiting for player input for question ${currentQuestionIndex + 1}`);
        setWaitingForPlayerInput(true);
        break;
        
      case GameState.PLAYER_ANSWER:
        // This state is handled in handleSubmit by setting the scenes directly
        console.log(`Showing player's answer for question ${currentQuestionIndex + 1}`);
        break;
        
      case GameState.AI_ANSWER:
        if (messages.length > lastHandledMessageIndex && messages[messages.length - 1].role !== 'user') {
          console.log(`Showing AI response for question ${currentQuestionIndex + 1}`);
          
          // Mark this message as handled
          setLastHandledMessageIndex(messages.length);
          
          // Clean up the message content to prevent character spamming
          const cleanedContent = messages[messages.length - 1].content
            .replace(/([A-Z])\\1{2,}/g, '$1')
            .replace(/([a-z])\\1{2,}/g, '$1$1')
            .replace(/([!?.,])\\1{2,}/g, '$1$1')
            .replace(/\\s{2,}/g, ' ')
            .replace(/([^a-zA-Z0-9\\s])\\1{2,}/g, '$1$1')
            .replace(/([A-Z]{3,})/g, (match) => match.charAt(0) + match.slice(1).toLowerCase())
            .replace(/(^|[.!?]\\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
            .replace(/<[^>]*>/g, '')
            .replace(/\\n{3,}/g, '\\n\\n');
            
          setScenes([{
            character: Character.EDGEWORTH,
            animation: AnimationState.DESK_SLAM,
            dialogue: cleanedContent,
            autoAdvance: true
          }]);
          setCurrentSceneIndex(0);
          setWaitingForAIResponse(false);
        } else {
          console.error("Tried to show AI response but couldn't find a new message!");
          // Try to recover gracefully by moving to the next question
          setCurrentQuestionIndex(prev => prev + 1);
          setGameState(GameState.JUDGE_QUESTION);
        }
        break;
        
      case GameState.GAME_END:
        // Show guess form with two large buttons - no scenes to set
        break;
        
      default:
        break;
    }
  }, [gameState, isReady, currentQuestionIndex, messages, judgeQuestions.length, lastHandledMessageIndex, endChat]);
  
  // Process current scene
  useEffect(() => {
    if (!isReady || scenes.length === 0 || currentSceneIndex >= scenes.length) return;
    
    const currentScene = scenes[currentSceneIndex];
    
    // Update character states
    if (currentScene.character === Character.PHOENIX) {
      setPhoenixState(currentScene.animation);
      setEdgeworthState(AnimationState.NORMAL);
      setJudgeState(AnimationState.NORMAL);
    } else if (currentScene.character === Character.EDGEWORTH) {
      setEdgeworthState(currentScene.animation);
      setPhoenixState(AnimationState.NORMAL);
      setJudgeState(AnimationState.NORMAL);
    } else {
      setJudgeState(currentScene.animation);
      setPhoenixState(AnimationState.NORMAL);
      setEdgeworthState(AnimationState.NORMAL);
    }
    
    // Update dialogue
    setDialogueText(currentScene.dialogue);
    setSpeakingCharacter(currentScene.character);
    
    // Set objection
    setObjectionType(currentScene.objection || null);
    
    // Play sound
    if (currentScene.sound) {
      playSound(currentScene.sound);
    }
    
    // Set auto advance
    setIsAutoAdvance(!!currentScene.autoAdvance);
    
    // Clean up existing timeout
    if (sceneTimeout.current) {
      clearTimeout(sceneTimeout.current);
      sceneTimeout.current = null;
    }
    
    // If this is the last scene in intro sequence, prepare to start the game
    if (gameState === GameState.INTRO && currentSceneIndex === scenes.length - 1) {
      sceneTimeout.current = setTimeout(() => {
        startChat();
        setIsGameStarted(true);
        setCurrentQuestionIndex(0);
        setGameState(GameState.JUDGE_QUESTION);
      }, 2000);
    }
    
  }, [currentSceneIndex, scenes, isReady, gameState, startChat]);
  
  // Handle form submission (player answer)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!inputValue.trim() || isLoading || !isGameStarted) return;
    
    console.log(`Submitting answer for question ${currentQuestionIndex + 1}`);
    
    // Immediately clear input and disable form to prevent duplicate submissions
    const message = inputValue.trim();
    setInputValue('');
    setWaitingForPlayerInput(false);
    
    // Switch to player answer state
    setGameState(GameState.PLAYER_ANSWER);
    
    // Show player's answer with Phoenix animation
    setScenes([{
      character: Character.PHOENIX,
      animation: currentQuestionIndex % 2 === 0 ? AnimationState.TALKING : AnimationState.CONFIDENT,
      dialogue: message,
      autoAdvance: true
    }]);
    setCurrentSceneIndex(0);
    
    try {
      // Track this message being sent
      setLastMessageSentIndex(messages.length + 1);
      setWaitingForAIResponse(true);
      
      // Send message to the chat system
      await sendMessage(message);
      console.log('Message sent successfully, waiting for AI to respond');
    } catch (error) {
      console.error('Error sending message:', error);
      // If there's an error, allow player to try again
      setWaitingForPlayerInput(true);
      setWaitingForAIResponse(false);
    }
  };
  
  // Watch for AI responses when we're waiting
  useEffect(() => {
    if (!isGameStarted || !waitingForAIResponse) return;
    
    // Only process messages we haven't handled yet
    if (messages.length > lastHandledMessageIndex && 
        messages[messages.length - 1].role !== 'user' && 
        !isLoading) {
      
      console.log('New AI message detected:', {
        messageIndex: messages.length,
        waitingForAI: waitingForAIResponse
      });
      
      // Switch to AI answer state
      setGameState(GameState.AI_ANSWER);
    }
  }, [messages, isLoading, waitingForAIResponse, isGameStarted, lastHandledMessageIndex]);
  
  // Handle scene completion
  const handleSceneComplete = useCallback(() => {
    if (currentSceneIndex < scenes.length - 1) {
      // Move to next scene in multi-scene sequence
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      console.log('Last scene completed in state:', GameState[gameState]);
      
      // Last scene in sequence, decide what to do next based on game state
      switch (gameState) {
        case GameState.JUDGE_QUESTION:
          // After judge asks question, switch to player input state
          console.log('Judge question completed, waiting for player input');
          setGameState(GameState.PLAYER_INPUT);
          break;
          
        case GameState.PLAYER_ANSWER:
          // Player finished answering, just wait for AI to respond
          // The message has already been sent, and the AI_ANSWER state
          // will be triggered by the useEffect watching for new messages
          console.log('Player answer scene completed, waiting for AI response');
          break;
          
        case GameState.AI_ANSWER:
          // After AI answers, move to next question
          console.log('AI answer completed, moving to next question', currentQuestionIndex + 2);
          setCurrentQuestionIndex(prev => prev + 1);
          setGameState(GameState.JUDGE_QUESTION);
          break;
          
        case GameState.INTRO:
          // Intro completed, will be handled by the scene timeout
          console.log('Intro completed');
          break;
      }
    }
  }, [currentSceneIndex, scenes.length, gameState]);
  
  // Handle courtroom ready state
  const handleCourtroomReady = useCallback(() => {
    setIsReady(true);
  }, []);
  
  // End the trial (chat)
  const handleEndTrial = useCallback(() => {
    endChat();
    setGameState(GameState.GAME_END);
  }, [endChat]);
  
  // Handle making a guess about Edgeworth
  const handleGuessSubmit = (isHuman: boolean) => {
    console.log('User guessed that Edgeworth is:', isHuman ? 'Human' : 'AI');
    
    // Determine if the guess is correct (in a real implementation, this would be based on actual data)
    // For now we'll randomly determine if Edgeworth was human or AI
    const wasActuallyHuman = Math.random() > 0.5;
    const isCorrect = isHuman === wasActuallyHuman;
    
    // Create verdict scenes based on result
    const verdictScenes: Scene[] = [
      {
        character: Character.JUDGE,
        animation: AnimationState.DESK_SLAM,
        dialogue: "The court has reached a verdict on the true nature of Prosecutor Edgeworth!",
        autoAdvance: true
      },
      {
        character: isCorrect ? Character.PHOENIX : Character.EDGEWORTH,
        animation: isCorrect ? AnimationState.CONFIDENT : Character.EDGEWORTH ? AnimationState.DESK_SLAM : AnimationState.OBJECTION,
        dialogue: isCorrect 
          ? "Your perception is impressive! You correctly identified Edgeworth as " + (isHuman ? "human!" : "AI!")
          : "Your perception has failed you! Edgeworth was actually " + (wasActuallyHuman ? "human!" : "AI!"),
        objection: isCorrect ? 'takethat' : 'objection',
        sound: isCorrect ? SoundEffect.NOT_GUILTY : SoundEffect.GUILTY,
        autoAdvance: true
      },
      {
        character: Character.JUDGE,
        animation: AnimationState.DESK_SLAM,
        dialogue: isCorrect 
          ? "NOT GUILTY! The defense has proven their perceptive abilities!" 
          : "GUILTY of poor perception! The defense has failed to identify the true nature of the prosecution!",
        sound: isCorrect ? SoundEffect.NOT_GUILTY : SoundEffect.GUILTY,
        autoAdvance: false
      }
    ];
    
    setScenes(verdictScenes);
    setCurrentSceneIndex(0);
    setGameState(GameState.VERDICT);
  };
  
  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden fixed inset-0 z-[9999]">
      {/* Courtroom scene */}
      <div className="flex-1 relative overflow-hidden w-full h-full">
        <AceAttorneyEnhancedCourtroom
          onReady={handleCourtroomReady}
          onComplete={handleSceneComplete}
          phoenixState={phoenixState}
          edgeworthState={edgeworthState}
          judgeState={judgeState}
          dialogueText={dialogueText}
          speakingCharacter={speakingCharacter}
          objectionType={objectionType}
          isAutoAdvance={isAutoAdvance}
        >
          {/* Overlay UI elements */}
          {gameState === GameState.PLAYER_INPUT && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-3/4 max-w-md z-50">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Present your evidence..."
                    className="w-full px-4 py-2 rounded-full border-2 border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-900/70 text-white"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-4 rounded-full font-medium shadow-sm hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                  >
                    TAKE THAT!
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Guess form at the end of the game */}
          {gameState === GameState.GAME_END && chatEnded && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-2xl z-50 bg-black/80 rounded-xl border-4 border-yellow-600 p-8">
              <h2 className="text-3xl font-bold text-white text-center mb-6">
                Was Prosecutor Edgeworth Human or AI?
              </h2>
              <p className="text-yellow-200 text-center mb-8 text-xl">
                Based on the cross-examination, make your determination!
              </p>
              
              <div className="flex flex-col md:flex-row justify-center gap-6">
                {/* Human button */}
                <button
                  onClick={() => handleGuessSubmit(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-6 px-12 rounded-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  HUMAN
                </button>
                
                {/* AI button */}
                <button
                  onClick={() => handleGuessSubmit(false)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI
                </button>
              </div>
            </div>
          )}
        </AceAttorneyEnhancedCourtroom>
      </div>
      
      {/* Control bar - fixed at bottom */}
      <div className="bg-black p-3 border-t border-yellow-800 flex justify-between items-center z-40 relative">
        <div className="text-white text-sm">
          <span className="font-bold text-yellow-400">Questions:</span> {Math.min(currentQuestionIndex + 1, 5)}/5
        </div>
        
        {isGameStarted && !chatEnded && (
          <button 
            onClick={handleEndTrial}
            className="bg-red-700 text-white px-4 py-1 rounded text-sm font-medium hover:bg-red-800 transition-all duration-200"
          >
            END TRIAL
          </button>
        )}
        
        <div className="text-yellow-400 text-xs font-bold">
          ACE ATTORNEY MODE
        </div>
      </div>
    </div>
  );
}