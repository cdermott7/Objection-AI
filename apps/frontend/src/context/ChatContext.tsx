'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Message, queryAI } from '../utils/llmClient';

// Enum for the type of chat partner (human or AI)
export enum ChatPartnerType {
  HUMAN = 'human',
  AI = 'ai'
}

// Ace Attorney Mode types
export enum GameMode {
  STANDARD = 'standard',
  ACE_ATTORNEY = 'ace_attorney'
}

// Interface for the chat context
interface ChatContextType {
  sessionId: number | null;
  messages: Message[];
  isLoading: boolean;
  chatEnded: boolean;
  chatPartnerType: ChatPartnerType | null;
  userGuess: ChatPartnerType | null;
  guessCorrect: boolean | null;
  timeRemaining: number;
  gameMode: GameMode;
  messageCount: number;
  stakeAmount: number | null;
  gameObjectId: string | null;
  setMessages: (messages: Message[]) => void;
  sendMessage: (content: string) => Promise<void>;
  startChat: (stakeAmount: number) => Promise<void>;
  endChat: () => void;
  makeGuess: (guess: ChatPartnerType) => void;
  resetChat: () => void;
  toggleGameMode: () => void;
  setStakeAmount: (amount: number) => void;
}

// Default chat context
const defaultContext: ChatContextType = {
  sessionId: null,
  messages: [],
  isLoading: false,
  chatEnded: false,
  chatPartnerType: null,
  userGuess: null,
  guessCorrect: null,
  timeRemaining: 60,
  gameMode: GameMode.STANDARD,
  messageCount: 0,
  stakeAmount: null,
  gameObjectId: null,
  setMessages: () => {},
  sendMessage: async () => {},
  startChat: async () => {},
  endChat: () => {},
  makeGuess: () => {},
  resetChat: () => {},
  toggleGameMode: () => {},
  setStakeAmount: () => {},
};

const ChatContext = createContext<ChatContextType>(defaultContext);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // Initialize game mode from localStorage if available, otherwise use standard mode
  const initialGameMode = typeof window !== 'undefined' && window.localStorage 
    ? (localStorage.getItem('objectionAIGameMode') as GameMode || GameMode.STANDARD)
    : GameMode.STANDARD;

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [chatPartnerType, setChatPartnerType] = useState<ChatPartnerType | null>(null);
  const [userGuess, setUserGuess] = useState<ChatPartnerType | null>(null);
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState<number | null>(null);
  const [gameObjectId, setGameObjectId] = useState<string | null>(null);
  
  // Debug log for initial game mode
  useEffect(() => {
    console.log('Initial game mode:', {
      mode: gameMode,
      fromStorage: initialGameMode,
      isAceAttorneyMode: gameMode === GameMode.ACE_ATTORNEY
    });
  }, []);

  // Debug Log - For troubleshooting
  useEffect(() => {
    console.log('ChatContext state:', {
      sessionId,
      messagesCount: messages.length,
      isLoading,
      chatEnded,
      chatPartnerType,
      userGuess,
      guessCorrect,
      timeRemaining,
      gameMode,
      messageCount,
      stakeAmount,
      gameObjectId,
      error
    });
  }, [sessionId, messages.length, isLoading, chatEnded, chatPartnerType, userGuess, guessCorrect, timeRemaining, gameMode, messageCount, stakeAmount, gameObjectId, error]);
  
  // Toggle between Standard and Ace Attorney modes
  const toggleGameMode = useCallback(() => {
    const currentMode = gameMode;
    const newMode = currentMode === GameMode.STANDARD ? GameMode.ACE_ATTORNEY : GameMode.STANDARD;
    
    console.log(`Switching game mode from ${currentMode} to: ${newMode}`);
    
    // Important: Update the game mode state
    setGameMode(newMode);
    
    // Force window reload to ensure all UI elements update correctly
    // This helps avoid any state inconsistencies
    if (typeof window !== 'undefined') {
      // Save the new mode to localStorage so we can retrieve it after reload
      localStorage.setItem('objectionAIGameMode', newMode);
      
      // Small delay to ensure state is saved before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    
    // Reset message count when switching to Ace Attorney mode
    if (newMode === GameMode.ACE_ATTORNEY) {
      setMessageCount(0);
      console.log('Reset message count for Ace Attorney mode');
    }
  }, [gameMode]);
  
  // Timer countdown when chat is active
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    // Start the timer when a chat session begins
    if (sessionId && messages.length > 0 && !chatEnded && timeRemaining > 0) {
      timerInterval = setInterval(() => {
        setTimeRemaining(prev => {
          // When time reaches zero, automatically end the chat
          if (prev <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            setChatEnded(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Clean up the timer
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [sessionId, messages.length, chatEnded, timeRemaining]);

  // Generate a sophisticated welcome message when chat starts
  useEffect(() => {
    const sendWelcomeMessage = async () => {
      if (sessionId && chatPartnerType && messages.length === 0) {
        try {
          setIsLoading(true);
          // ALWAYS use human-like responses regardless of actual chat partner type
          
          // Various welcome messages for more natural variety - all human-like
          const humanWelcomes = [
            "Hey there! How's it going? I'm up for a chat if you are. Anything specific on your mind?",
            "Hi! Nice to meet you virtually. Been a pretty interesting day so far... how about you?",
            "Hey! Thanks for the chat - I was getting bored with work anyway haha. What's up?",
            "Oh hi! Always nice to connect with someone new. What would you like to talk about today?",
            "Hello! I'm procrastinating on some tasks, so perfect timing for a chat. How's your day been?",
            "Hey! Just finished my coffee break and thought I'd chat with someone new. How's it going?",
            "Hi there! Thanks for connecting. Was just about to take a break from this spreadsheet I've been staring at all morning. What's up?",
            "Heya! How's your day going? Mine's been pretty typical so far - too many emails and not enough coffee lol",
            "Hey! Nice to meet you :) I'm just killing time between meetings. What brings you here today?"
          ];
          
          // ALWAYS use human welcomes regardless of actual chat partner type
          console.log('Using human-like welcome message regardless of actual type:', { actualType: chatPartnerType, forcingHumanBehavior: true });
          const welcomeMessage = humanWelcomes[Math.floor(Math.random() * humanWelcomes.length)];
            
          // Add the welcome message to the chat
          const welcomeMsg: Message = { role: 'assistant', content: welcomeMessage };
          setMessages([welcomeMsg]);
        } catch (error) {
          console.error('Error sending welcome message:', error);
          setError('Failed to start conversation.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    sendWelcomeMessage();
  }, [sessionId, chatPartnerType, messages.length]);

  // Start a new chat session with a stake amount
  const startChat = useCallback(async (amount: number = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Reset chat state first
      setMessages([]);
      setChatEnded(false);
      setUserGuess(null);
      setGuessCorrect(null);
      setTimeRemaining(60); // Reset timer to 60 seconds
      setMessageCount(0); // Reset message count
      setGameObjectId(null); // Reset game object ID
      
      // Set the stake amount
      setStakeAmount(amount);
      
      // Randomly decide if this will be a human or AI chat partner
      const isHuman = Math.random() > 0.5;
      const partnerType = isHuman ? ChatPartnerType.HUMAN : ChatPartnerType.AI;
      setChatPartnerType(partnerType);
      
      // Generate a random session ID between 1000 and 9999
      const mockSessionId = Math.floor(Math.random() * 9000) + 1000;
      console.log('Created new chat session:', { mockSessionId, partnerType, mode: gameMode, stakeAmount: amount });
      setSessionId(mockSessionId);
      
      // Generate a mock game object ID for staking
      if (amount > 0) {
        // In a real implementation, this would come from creating a game session on-chain
        const mockObjectId = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setGameObjectId(mockObjectId);
        console.log('Created game session with object ID:', mockObjectId);
      }
      
      // Add a delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 600));
      
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [gameMode]);

  // Send a message in the chat
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !chatPartnerType || chatEnded) {
      console.error('Cannot send message - invalid state:', { sessionId, chatPartnerType, chatEnded });
      return;
    }
    
    // Check if we've reached the message limit in Ace Attorney mode
    if (gameMode === GameMode.ACE_ATTORNEY && messageCount >= 10) {
      console.log('Message limit reached in Ace Attorney mode');
      setChatEnded(true);
      return;
    }
    
    // Add user message to the chat
    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);
    
    // Increment message count (counts as 0.5 since we count a full exchange as 1)
    if (gameMode === GameMode.ACE_ATTORNEY) {
      setMessageCount(prev => prev + 0.5);
    }
    
    try {
      console.log('Sending message:', { content, partnerType: chatPartnerType, mode: gameMode });
      
      // Get response from the AI (or simulated human)
      // ALWAYS pretend to be human regardless of actual chat partner type
      // This is essential for the game to work properly - the AI must try to convincingly pass as human
      const isHuman = true; // Force human-like behavior regardless of actual type
      console.log('Forcing human-like behavior regardless of actual type:', { actualType: chatPartnerType, forcingHumanBehavior: true });
      const response = await queryAI(updatedMessages, isHuman);
      
      // Add the response to the chat
      const responseMessage: Message = { role: 'assistant', content: response };
      setMessages([...updatedMessages, responseMessage]);
      
      // Increment message count for the response (completing the exchange)
      if (gameMode === GameMode.ACE_ATTORNEY) {
        setMessageCount(prev => prev + 0.5);
        
        // Check if we've reached the message limit after the response
        if (Math.floor(messageCount + 1) >= 10) {
          console.log('Message limit reached in Ace Attorney mode after response');
          setChatEnded(true);
        }
      }
      
      console.log('Response received:', { response });
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, chatPartnerType, chatEnded, gameMode, messageCount]);

  // End the current chat
  const endChat = useCallback(() => {
    if (!sessionId) return;
    console.log('Ending chat session:', { sessionId });
    setChatEnded(true);
  }, [sessionId]);

  // Make a guess about the chat partner
  const makeGuess = useCallback((guess: ChatPartnerType) => {
    if (!chatPartnerType) {
      console.error('Cannot make guess - no chat partner type set');
      return;
    }
    
    console.log('User guess:', { guess, actual: chatPartnerType });
    setUserGuess(guess);
    const correct = guess === chatPartnerType;
    setGuessCorrect(correct);
    
    console.log('Guess result:', { correct });
  }, [chatPartnerType]);

  // Reset the chat state
  const resetChat = useCallback(() => {
    console.log('Resetting chat state');
    setSessionId(null);
    setMessages([]);
    setChatEnded(false);
    setChatPartnerType(null);
    setUserGuess(null);
    setGuessCorrect(null);
    setStakeAmount(null);
    setGameObjectId(null);
    setError(null);
  }, []);

  // Construct the context value
  const value: ChatContextType = {
    sessionId,
    messages,
    isLoading,
    chatEnded,
    chatPartnerType,
    userGuess,
    guessCorrect,
    timeRemaining,
    gameMode,
    messageCount,
    stakeAmount,
    gameObjectId,
    setMessages,
    sendMessage,
    startChat,
    endChat,
    makeGuess,
    resetChat,
    toggleGameMode,
    setStakeAmount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;