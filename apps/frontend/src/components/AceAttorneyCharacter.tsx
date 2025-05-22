'use client';

import { useEffect, useState, useRef } from 'react';
import { Character, AnimationState, getFramePath, getAnimationSound, FRAME_DURATION } from '../utils/aceAttorneyAnimations';
import { playSound } from '../utils/aceAttorneySounds';

interface AceAttorneyCharacterProps {
  character: Character;
  initialState: AnimationState;
  position: 'left' | 'right' | 'center';
  onAnimationComplete?: () => void;
  scale?: number;
}

export default function AceAttorneyCharacter({
  character,
  initialState,
  position,
  onAnimationComplete,
  scale = 1
}: AceAttorneyCharacterProps) {
  const [animationState, setAnimationState] = useState<AnimationState>(initialState);
  const [frameIndex, setFrameIndex] = useState(0);
  const [imagePath, setImagePath] = useState('');
  const animationTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Handle animation frame updates
  useEffect(() => {
    // Clear any existing timer
    if (animationTimer.current) {
      clearInterval(animationTimer.current);
    }
    
    // Reset frame index when animation state changes
    setFrameIndex(0);
    
    // Play sound effect if the animation has one
    const sound = getAnimationSound(character, animationState);
    if (sound) {
      playSound(sound);
    }
    
    // Start animation timer
    animationTimer.current = setInterval(() => {
      setFrameIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        
        // Get current frame path
        const path = getFramePath(character, animationState, newIndex);
        setImagePath(path);
        
        // If we're at the end of a non-looping animation, call the completion callback
        const animationDef = require('../utils/aceAttorneyAnimations').animations[character][animationState];
        
        if (!animationDef.loop && newIndex >= (animationDef.frameEnd - animationDef.frameStart)) {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
          
          // Clear the interval for non-looping animations
          if (animationTimer.current) {
            clearInterval(animationTimer.current);
            animationTimer.current = null;
          }
          
          // Return the last frame index
          return animationDef.frameEnd - animationDef.frameStart;
        }
        
        return newIndex;
      });
    }, FRAME_DURATION);
    
    // Initial frame
    setImagePath(getFramePath(character, animationState, 0));
    
    // Cleanup timer on unmount
    return () => {
      if (animationTimer.current) {
        clearInterval(animationTimer.current);
      }
    };
  }, [character, animationState, onAnimationComplete]);
  
  // Change animation state method
  const changeAnimationState = (newState: AnimationState) => {
    setAnimationState(newState);
  };
  
  // Position styles
  const positionStyles = {
    left: position === 'left' ? '5%' : position === 'center' ? '50%' : 'auto',
    right: position === 'right' ? '5%' : 'auto',
    transform: position === 'center' 
      ? `translateX(-50%) scale(${scale})` 
      : `scale(${scale})`,
  };
  
  return (
    <div 
      className="absolute bottom-0 z-10 transition-all duration-500"
      style={positionStyles}
    >
      {imagePath && (
        <img 
          src={imagePath}
          alt={`${character} ${animationState}`}
          className="h-auto max-h-64 object-contain"
          onError={(e) => {
            console.error(`Failed to load animation frame: ${imagePath}`);
            // Fall back to a different frame or default image
            const target = e.target as HTMLImageElement;
            target.src = `/ace-attorney/${character}.png`;
          }}
        />
      )}
    </div>
  );
}

// Export a hook to control animations from parent components
export function useCharacterAnimation() {
  const characterRef = useRef<{changeAnimationState: (state: AnimationState) => void} | null>(null);
  
  const setCharacterRef = (ref: {changeAnimationState: (state: AnimationState) => void} | null) => {
    characterRef.current = ref;
  };
  
  const animate = (state: AnimationState) => {
    if (characterRef.current) {
      characterRef.current.changeAnimationState(state);
    }
  };
  
  return { setCharacterRef, animate };
}