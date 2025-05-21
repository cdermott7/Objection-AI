'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Message, queryAI } from '../utils/llmClient';

// Enum for the type of chat partner (human or AI)
export enum ChatPartnerType {
  HUMAN = 'human',
  AI = 'ai'
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
  setMessages: (messages: Message[]) => void;
  sendMessage: (content: string) => Promise<void>;
  startChat: () => Promise<void>;
  endChat: () => void;
  makeGuess: (guess: ChatPartnerType) => void;
  resetChat: () => void;
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
  setMessages: () => {},
  sendMessage: async () => {},
  startChat: async () => {},
  endChat: () => {},
  makeGuess: () => {},
  resetChat: () => {},
};

const ChatContext = createContext<ChatContextType>(defaultContext);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [chatPartnerType, setChatPartnerType] = useState<ChatPartnerType | null>(null);
  const [userGuess, setUserGuess] = useState<ChatPartnerType | null>(null);
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);

  // Start a new chat session
  const startChat = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Randomly decide if this will be a human or AI chat partner
      const isHuman = Math.random() > 0.5;
      const partnerType = isHuman ? ChatPartnerType.HUMAN : ChatPartnerType.AI;
      setChatPartnerType(partnerType);
      
      // Create a new session in Supabase
      const { data, error } = await supabase.rpc('create_session', { 
        partner_type: partnerType 
      });
      
      if (error) throw error;
      
      // Set the session ID from the response
      setSessionId(data.session_id);
      
      // Reset chat state
      setMessages([]);
      setChatEnded(false);
      setUserGuess(null);
      setGuessCorrect(null);
      
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a message in the chat
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !chatPartnerType || chatEnded) return;
    
    // Add user message to the chat
    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    try {
      // Get response from the AI (or simulated human)
      const isHuman = chatPartnerType === ChatPartnerType.HUMAN;
      const response = await queryAI(updatedMessages, isHuman);
      
      // Add the response to the chat
      const responseMessage: Message = { role: 'assistant', content: response };
      setMessages([...updatedMessages, responseMessage]);
      
      // Log the exchange to Supabase
      await supabase.rpc('log_chat_message', {
        session_id: sessionId,
        user_message: content,
        response: response
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, chatPartnerType, chatEnded]);

  // End the current chat
  const endChat = useCallback(() => {
    if (!sessionId) return;
    setChatEnded(true);
  }, [sessionId]);

  // Make a guess about the chat partner
  const makeGuess = useCallback((guess: ChatPartnerType) => {
    if (!chatPartnerType) return;
    
    setUserGuess(guess);
    const correct = guess === chatPartnerType;
    setGuessCorrect(correct);
    
    // Log the guess to Supabase
    if (sessionId) {
      supabase.rpc('log_guess', {
        session_id: sessionId,
        guess,
        correct
      }).catch(error => {
        console.error('Error logging guess:', error);
      });
    }
  }, [chatPartnerType, sessionId]);

  // Reset the chat state
  const resetChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setChatEnded(false);
    setChatPartnerType(null);
    setUserGuess(null);
    setGuessCorrect(null);
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
    setMessages,
    sendMessage,
    startChat,
    endChat,
    makeGuess,
    resetChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;