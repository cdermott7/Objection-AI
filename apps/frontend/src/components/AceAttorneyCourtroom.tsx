'use client';

import { useEffect, useState } from 'react';
import AceAttorneyCharacter from './AceAttorneyCharacter';
import AceAttorneySpeechBubble from './AceAttorneySpeechBubble';
import { AnimationState, Character } from '../utils/aceAttorneyAnimations';
import { playSound, SoundEffect, startCourtAmbience, stopCourtAmbience } from '../utils/aceAttorneySounds';

// Animation sequence types
export type AnimationSequence = {
  character: Character;
  animation: AnimationState;
  text?: string;
  textPosition?: 'left' | 'right' | 'center';
  textVariant?: 'normal' | 'blue' | 'red' | 'green';
  duration?: number;
  sound?: SoundEffect;
};

interface AceAttorneyCortroomProps {
  children?: React.ReactNode;
  onSequenceComplete?: () => void;
  activeSequence?: AnimationSequence[];
  onReady?: () => void;
}

export default function AceAttorneyCourtroom({
  children,
  onSequenceComplete,
  activeSequence = [],
  onReady
}: AceAttorneyCortroomProps) {
  const [isReady, setIsReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showText, setShowText] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  
  // Initialize courtroom
  useEffect(() => {
    // Start background ambience
    startCourtAmbience();
    
    // Signal ready state
    setIsReady(true);
    if (onReady) {
      onReady();
    }
    
    // Cleanup on unmount
    return () => {
      stopCourtAmbience();
    };
  }, [onReady]);
  
  // Handle animation sequence
  useEffect(() => {
    if (activeSequence.length === 0 || !isReady) return;
    
    const currentAnimation = activeSequence[currentStep];
    
    // Play associated sound if provided
    if (currentAnimation.sound) {
      playSound(currentAnimation.sound);
    }
    
    // Show text after a short delay if provided
    let textTimer: NodeJS.Timeout | null = null;
    if (currentAnimation.text) {
      textTimer = setTimeout(() => {
        setShowText(true);
      }, 300);
    }
    
    // Auto-advance to next step after duration
    let advanceTimer: NodeJS.Timeout | null = null;
    if (currentAnimation.duration) {
      advanceTimer = setTimeout(() => {
        advanceSequence();
      }, currentAnimation.duration);
    }
    
    // Cleanup timers
    return () => {
      if (textTimer) clearTimeout(textTimer);
      if (advanceTimer) clearTimeout(advanceTimer);
    };
  }, [activeSequence, currentStep, isReady]);
  
  // Handle text completion
  const handleTextComplete = () => {
    setTextComplete(true);
    
    // If no duration is set, advance on text completion
    const currentAnimation = activeSequence[currentStep];
    if (!currentAnimation.duration) {
      // Small delay to let user read
      setTimeout(() => {
        advanceSequence();
      }, 1000);
    }
  };
  
  // Advance to next step in the sequence
  const advanceSequence = () => {
    // Reset state for next animation
    setShowText(false);
    setTextComplete(false);
    
    if (currentStep < activeSequence.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Sequence complete
      if (onSequenceComplete) {
        onSequenceComplete();
      }
    }
  };
  
  // Get current animation data
  const getCurrentAnimation = (): AnimationSequence | null => {
    if (activeSequence.length === 0 || currentStep >= activeSequence.length) return null;
    return activeSequence[currentStep];
  };
  
  const currentAnimation = getCurrentAnimation();
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-indigo-900 to-indigo-950">
      {/* Courtroom background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: "url('/ace-attorney/courtroom-bg.png')" }}>
        {/* Fallback courtroom styling if image is missing */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-800 to-indigo-950" />
      </div>
      
      {/* Judge's bench */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-800 to-gray-900 flex justify-center items-center">
        <AceAttorneyCharacter
          character={Character.JUDGE}
          initialState={AnimationState.NORMAL}
          position="center"
          scale={0.8}
        />
      </div>
      
      {/* Defense and prosecution benches */}
      <div className="absolute bottom-0 left-0 w-1/3 h-24 bg-gradient-to-r from-blue-900 to-blue-800" />
      <div className="absolute bottom-0 right-0 w-1/3 h-24 bg-gradient-to-r from-red-800 to-red-900" />
      
      {/* Active character animations */}
      {currentAnimation && (
        <AceAttorneyCharacter
          character={currentAnimation.character}
          initialState={currentAnimation.animation}
          position={currentAnimation.character === Character.PHOENIX ? 'left' : 'right'}
          scale={1.2}
        />
      )}
      
      {/* Speech bubble */}
      {currentAnimation && showText && currentAnimation.text && (
        <AceAttorneySpeechBubble
          text={currentAnimation.text}
          position={currentAnimation.textPosition || (currentAnimation.character === Character.PHOENIX ? 'left' : 'right')}
          variant={currentAnimation.textVariant || (currentAnimation.character === Character.PHOENIX ? 'blue' : 'red')}
          onTypingComplete={handleTextComplete}
        />
      )}
      
      {/* Additional UI elements */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-r from-gray-900/70 to-gray-900/70">
        <div className="text-white font-medium text-sm">
          COURT RECORD
        </div>
        <div className="text-white font-medium text-sm">
          PRESS SPACE TO CONTINUE
        </div>
      </div>
      
      {children}
    </div>
  );
}