import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Placeholder for AI opponent address
export const AI_ADDRESS = '0xAI000000000000000000000000000000000000000000000000';

/**
 * Hook for matchmaking in TuriCheck games
 * @param sessionId A unique session identifier for this matchmaking instance
 * @param userAddress The current user's wallet address
 * @param timeout Time in ms before falling back to AI opponent (default: 15000)
 */
export function useMatchmaking(sessionId: string = uuidv4(), userAddress: string, timeout: number = 15000) {
  const [opponent, setOpponent] = useState<string | null>(null);
  const [status, setStatus] = useState<'waiting' | 'matched' | 'ai_fallback'>('waiting');

  useEffect(() => {
    if (!userAddress) return;

    // Generate a session ID if none provided
    const session = sessionId || uuidv4();
    console.log(`[Matchmaking] Starting with session ${session} for user ${userAddress}`);

    // 1. Hit the Edge Function to enqueue + attempt auto-match
    fetch('/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: session, userAddress }),
    }).catch(err => {
      console.error('[Matchmaking] Error enqueueing:', err);
    });

    // 2. Listen for our row being updated with an opponent_address
    const channel = supabase
      .channel(`public:match_queue:${userAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_queue',
          filter: `user_address=eq.${userAddress}`,
        },
        (payload: any) => {
          console.log('[Matchmaking] Received update:', payload);
          const matchedOpponent = payload.new.opponent_address;
          if (matchedOpponent) {
            console.log(`[Matchmaking] Matched with ${matchedOpponent}`);
            setOpponent(matchedOpponent);
            setStatus('matched');
          }
        }
      )
      .subscribe((status: any) => {
        console.log('[Matchmaking] Subscription status:', status);
      });

    // 3. Timeout → fallback to AI after specified time
    const timer = setTimeout(() => {
      if (!opponent) {
        console.log('[Matchmaking] No match found, falling back to AI');
        setOpponent(AI_ADDRESS);
        setStatus('ai_fallback');
      }
    }, timeout);

    return () => {
      clearTimeout(timer);
      channel.unsubscribe();
    };
  }, [userAddress, sessionId, timeout]);

  return { opponent, status };
}