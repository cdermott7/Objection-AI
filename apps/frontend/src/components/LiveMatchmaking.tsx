// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMatchmaking, AI_ADDRESS } from '../hooks/useMatchmaking';
import { WebRTCConnection, ChatMessage } from '../utils/webrtc';
import { queryAI } from '../utils/llmClient';

interface LiveMatchmakingProps {
  sessionId: string;
  userAddress: string;
  onOpponentMessage: (message: string) => void;
  onConnectionStateChange: (state: string) => void;
  onMatchComplete: (isHuman: boolean) => void;
}

/**
 * LiveMatchmaking component that handles player pairing and communication
 */
export default function LiveMatchmaking({
  sessionId,
  userAddress,
  onOpponentMessage,
  onConnectionStateChange,
  onMatchComplete
}: LiveMatchmakingProps) {
  const { opponent, status } = useMatchmaking(sessionId, userAddress);
  const [connection, setConnection] = useState<WebRTCConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isAi, setIsAi] = useState(false);

  // Handle opponent matching
  useEffect(() => {
    if (opponent) {
      console.log(`[LiveMatchmaking] Matched with opponent: ${opponent}`);
      
      // Check if this is the AI fallback
      if (opponent === AI_ADDRESS) {
        console.log('[LiveMatchmaking] Using AI fallback');
        setIsAi(true);
        onMatchComplete(false); // false = AI opponent
        onConnectionStateChange('ai_fallback');
      } else {
        console.log('[LiveMatchmaking] Matched with human player, initiating WebRTC connection');
        setIsAi(false);
        onMatchComplete(true); // true = human opponent
        
        // Set up WebRTC connection for human-human chat
        const rtcConnection = new WebRTCConnection(userAddress, opponent, sessionId);
        setConnection(rtcConnection);
        
        // Set up message handling
        rtcConnection.onMessage((message: ChatMessage) => {
          console.log('[LiveMatchmaking] Received message from peer:', message);
          setLastMessage(message.text);
          onOpponentMessage(message.text);
        });
        
        // Set up connection state handling
        rtcConnection.onStateChange((state: RTCIceConnectionState) => {
          console.log('[LiveMatchmaking] WebRTC connection state changed:', state);
          setIsConnected(state === 'connected' || state === 'completed');
          onConnectionStateChange(state);
        });
        
        // Initiate the connection
        rtcConnection.initiateConnection();
      }
    }
    
    // Clean up connection when component unmounts
    return () => {
      if (connection) {
        console.log('[LiveMatchmaking] Cleaning up WebRTC connection');
        connection.close();
      }
    };
  }, [opponent, sessionId, userAddress, onOpponentMessage, onConnectionStateChange, onMatchComplete]);

  /**
   * Send a message to the opponent
   */
  const sendMessage = useCallback(async (message: string) => {
    // Different handling based on whether opponent is human or AI
    if (isAi) {
      // Use AI client for AI opponent
      console.log('[LiveMatchmaking] Sending message to AI:', message);
      
      try {
        // Create a simple message history for the AI
        const messageHistory = [
          { role: 'user', content: message },
        ];
        
        // Force human-like response mode (true)
        const response = await queryAI(messageHistory, true);
        
        // Process the AI response
        console.log('[LiveMatchmaking] Received AI response:', response);
        onOpponentMessage(response);
        return true;
      } catch (error) {
        console.error('[LiveMatchmaking] Error getting AI response:', error);
        return false;
      }
    } else if (connection) {
      // Use WebRTC for human opponent
      console.log('[LiveMatchmaking] Sending message to human peer:', message);
      return connection.sendMessage(message);
    } else {
      console.error('[LiveMatchmaking] Cannot send message - no connection available');
      return false;
    }
  }, [connection, isAi, onOpponentMessage]);

  // Expose the sendMessage function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).sendMatchmakingMessage = sendMessage;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).sendMatchmakingMessage;
      }
    };
  }, [sendMessage]);

  return (
    <div style={{ display: 'none' }}>
      {/* This is a utility component that doesn't render UI */}
      {/* Status: {status}, Opponent: {opponent || 'Waiting...'} */}
    </div>
  );
}