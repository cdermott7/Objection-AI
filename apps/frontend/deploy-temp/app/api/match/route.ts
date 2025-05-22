import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../src/utils/supabaseClient';

/**
 * API route handler for matchmaking
 * 
 * This route handles the following:
 * 1. Inserts a player's request into the match_queue table
 * 2. Looks for another unmatched peer in the same session
 * 3. If found, marks both as matched and sets each other as opponents
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { sessionId, userAddress } = await req.json();
    
    if (!sessionId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userAddress' },
        { status: 400 }
      );
    }
    
    // Insert this player's request
    const { data: inserted, error: insertError } = await supabase
      .from('match_queue')
      .insert({ session_id: sessionId, user_address: userAddress })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting into match_queue:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert player into match queue' },
        { status: 500 }
      );
    }
    
    // Look for another unmatched peer
    const { data: pair, error: pairError } = await supabase
      .from('match_queue')
      .select('*')
      .eq('session_id', sessionId)
      .is('matched', false)
      .order('joined_at', { ascending: true })
      .limit(2);
    
    if (pairError) {
      console.error('Error finding match pair:', pairError);
      return NextResponse.json(
        { error: 'Failed to find match pair' },
        { status: 500 }
      );
    }
    
    // If we found a pair, update both as matched
    if (pair && pair.length === 2) {
      const [a, b] = pair;
      
      // Update player A with player B as opponent
      const { error: updateAError } = await supabase
        .from('match_queue')
        .update({ matched: true, opponent_address: b.user_address })
        .eq('id', a.id);
      
      if (updateAError) {
        console.error('Error updating player A:', updateAError);
        return NextResponse.json(
          { error: 'Failed to update player A match status' },
          { status: 500 }
        );
      }
      
      // Update player B with player A as opponent
      const { error: updateBError } = await supabase
        .from('match_queue')
        .update({ matched: true, opponent_address: a.user_address })
        .eq('id', b.id);
      
      if (updateBError) {
        console.error('Error updating player B:', updateBError);
        return NextResponse.json(
          { error: 'Failed to update player B match status' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Successfully matched players',
        playerA: a.user_address,
        playerB: b.user_address
      });
    }
    
    return NextResponse.json({
      message: 'Player added to match queue',
      id: inserted.id
    });
  } catch (error) {
    console.error('Error in match API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}