'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimationState, Character, FRAME_DURATION } from '../utils/aceAttorneyAnimations';
import { playSound, SoundEffect, startCourtAmbience, stopCourtAmbience } from '../utils/aceAttorneySounds';

interface AceAttorneyEnhancedCourtroomProps {
  children?: React.ReactNode;
  onReady?: () => void;
  onComplete?: () => void;
  
  // Active character states
  phoenixState?: AnimationState;
  edgeworthState?: AnimationState;
  judgeState?: AnimationState;
  
  // Text content
  dialogueText?: string;
  speakingCharacter?: Character;
  
  // Control flags
  showTextBox?: boolean;
  typingSpeed?: number;
  isAutoAdvance?: boolean;
  objectionType?: 'objection' | 'holdit' | 'takethat' | null;
}

const DEFAULT_TYPING_SPEED = 30; // ms per character

export default function AceAttorneyEnhancedCourtroom({
  children,
  onReady,
  onComplete,
  phoenixState = AnimationState.NORMAL,
  edgeworthState = AnimationState.NORMAL,
  judgeState = AnimationState.NORMAL,
  dialogueText = '',
  speakingCharacter = Character.JUDGE,
  showTextBox = true,
  typingSpeed = DEFAULT_TYPING_SPEED,
  isAutoAdvance = false,
  objectionType = null
}: AceAttorneyEnhancedCourtroomProps) {
  const [isReady, setIsReady] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [showObjection, setShowObjection] = useState(false);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Character animation frames
  const [phoenixFrame, setPhoenixFrame] = useState(0);
  const [edgeworthFrame, setEdgeworthFrame] = useState(0);
  const [judgeFrame, setJudgeFrame] = useState(0);
  
  // Animation timers
  const phoenixTimer = useRef<NodeJS.Timeout | null>(null);
  const edgeworthTimer = useRef<NodeJS.Timeout | null>(null);
  const judgeTimer = useRef<NodeJS.Timeout | null>(null);
  
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
      
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (phoenixTimer.current) clearTimeout(phoenixTimer.current);
      if (edgeworthTimer.current) clearTimeout(edgeworthTimer.current);
      if (judgeTimer.current) clearTimeout(judgeTimer.current);
    };
  }, [onReady]);
  
  // Handle objection display
  useEffect(() => {
    if (objectionType) {
      setShowObjection(true);
      
      // Play appropriate sound
      switch (objectionType) {
        case 'objection':
          playSound(SoundEffect.OBJECTION);
          break;
        case 'holdit':
          playSound(SoundEffect.HOLD_IT);
          break;
        case 'takethat':
          playSound(SoundEffect.TAKE_THAT);
          break;
      }
      
      // Hide objection after a delay
      const timer = setTimeout(() => {
        setShowObjection(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [objectionType]);
  
  // Handle text typing animation
  useEffect(() => {
    if (!dialogueText || !showTextBox) {
      setDisplayText('');
      setIsTyping(false);
      setTypingIndex(0);
      setIsTextComplete(false);
      return;
    }
    
    // Reset when text changes
    setDisplayText('');
    setTypingIndex(0);
    setIsTyping(true);
    setIsTextComplete(false);
    
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    
    // Clean and normalize the input text to prevent character spamming
    // This fixes the issue where capital letters were being spammed
    let cleanedText = dialogueText || '';
    
    // Enhanced text normalization to prevent all types of character spamming
    cleanedText = cleanedText
      // Fix repeated uppercase letters (AAAAA → A)
      .replace(/([A-Z])\1{2,}/g, '$1')
      // Fix repeated lowercase letters (aaaaa → aa) - allow up to 2 for emphasis
      .replace(/([a-z])\1{2,}/g, '$1$1')
      // Fix repeated punctuation (!!!!! → !!)
      .replace(/([!?.,])\1{2,}/g, '$1$1')
      // Fix repeated spaces and line breaks
      .replace(/\s{2,}/g, ' ')
      // Fix repeated special characters and symbols
      .replace(/([^a-zA-Z0-9\s])\1{2,}/g, '$1$1')
      // Remove excessive capitalization (more than 3 capital letters in a row)
      .replace(/([A-Z]{3,})/g, (match) => match.charAt(0) + match.slice(1).toLowerCase())
      // Ensure sentence casing for better readability
      .replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
      // Remove any HTML tags that might be in the text
      .replace(/<[^>]*>/g, '')
      // Normalize multiple line breaks
      .replace(/\n{3,}/g, '\n\n');
    
    // Start typing animation
    const typeNextChar = () => {
      if (typingIndex < cleanedText.length) {
        const nextChar = cleanedText[typingIndex];
        setDisplayText(prev => prev + nextChar);
        setTypingIndex(prev => prev + 1);
        
        // Play typing sound for non-space characters
        if (nextChar !== ' ' && typingIndex % 3 === 0) {
          playSound(SoundEffect.TEXT_BLEEP, 0.2);
        }
        
        // Schedule next character - slightly randomize the typing speed for more natural effect
        const randomVariation = Math.random() * 10 - 5; // -5 to +5ms variation
        typingTimer.current = setTimeout(typeNextChar, typingSpeed + randomVariation);
      } else {
        setIsTyping(false);
        setIsTextComplete(true);
        
        // Auto advance if enabled
        if (isAutoAdvance && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      }
    };
    
    // Start typing
    typingTimer.current = setTimeout(typeNextChar, typingSpeed);
    
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, [dialogueText, showTextBox, typingSpeed, isAutoAdvance, onComplete]);
  
  // Handle clicking to complete text immediately
  const completeTyping = () => {
    if (isTyping) {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      setDisplayText(dialogueText || '');
      setTypingIndex(dialogueText?.length || 0);
      setIsTyping(false);
      setIsTextComplete(true);
    } else if (isTextComplete && onComplete) {
      onComplete();
    }
  };
  
  // Handle Phoenix animation
  useEffect(() => {
    if (phoenixTimer.current) {
      clearTimeout(phoenixTimer.current);
    }
    
    const animate = () => {
      setPhoenixFrame(prev => (prev + 1) % 4);
      phoenixTimer.current = setTimeout(animate, FRAME_DURATION);
    };
    
    phoenixTimer.current = setTimeout(animate, FRAME_DURATION);
    
    return () => {
      if (phoenixTimer.current) {
        clearTimeout(phoenixTimer.current);
      }
    };
  }, [phoenixState]);
  
  // Handle Edgeworth animation
  useEffect(() => {
    if (edgeworthTimer.current) {
      clearTimeout(edgeworthTimer.current);
    }
    
    const animate = () => {
      setEdgeworthFrame(prev => (prev + 1) % 4);
      edgeworthTimer.current = setTimeout(animate, FRAME_DURATION);
    };
    
    edgeworthTimer.current = setTimeout(animate, FRAME_DURATION);
    
    return () => {
      if (edgeworthTimer.current) {
        clearTimeout(edgeworthTimer.current);
      }
    };
  }, [edgeworthState]);
  
  // Handle Judge animation
  useEffect(() => {
    if (judgeTimer.current) {
      clearTimeout(judgeTimer.current);
    }
    
    const animate = () => {
      setJudgeFrame(prev => (prev + 1) % 4);
      judgeTimer.current = setTimeout(animate, FRAME_DURATION);
    };
    
    judgeTimer.current = setTimeout(animate, FRAME_DURATION);
    
    return () => {
      if (judgeTimer.current) {
        clearTimeout(judgeTimer.current);
      }
    };
  }, [judgeState]);
  
  // Get character image path using hackthenorth24 assets
  const getCharacterImagePath = (character: Character, state: AnimationState, frame: number) => {
    // Map animation state to GIF file names from the hackthenorth24 assets
    const getAnimationFile = (character: Character, state: AnimationState) => {
      switch (character) {
        case Character.PHOENIX:
          switch (state) {
            case AnimationState.NORMAL:
              return 'stand.gif';
            case AnimationState.TALKING:
              return 'stand_talk.gif';
            case AnimationState.OBJECTION:
              return 'point_stand.gif';
            case AnimationState.DESK_SLAM:
              return 'slam_talk.gif'; // Now this is in the phoenix directory
            case AnimationState.POINTING:
              return 'point_talk.gif';
            case AnimationState.THINKING:
              return 'read_stand.gif';
            case AnimationState.CONFIDENT:
              return 'smirk_talk.gif';
            case AnimationState.DAMAGED:
              return 'damage.gif';
            case AnimationState.SWEATING:
              return 'cornered_talk.gif';
            default:
              return 'stand.gif';
          }
        
        case Character.EDGEWORTH:
          switch (state) {
            case AnimationState.NORMAL:
              return 'stand.gif';
            case AnimationState.TALKING:
              return 'stand_talk.gif';
            case AnimationState.OBJECTION:
              return 'point_stand.gif';
            case AnimationState.DESK_SLAM:
              return 'desk_slam.gif';
            case AnimationState.POINTING:
              return 'point_talk.gif';
            case AnimationState.THINKING:
              return 'read.gif';
            case AnimationState.CONFIDENT:
              return 'desk_talk.gif';
            case AnimationState.DAMAGED:
              return 'damage.gif';
            case AnimationState.SWEATING:
              return 'cornered_talk.gif';
            default:
              return 'stand.gif';
          }
          
        case Character.JUDGE:
          switch (state) {
            case AnimationState.NORMAL:
              return 'stand.gif';
            case AnimationState.TALKING:
              return 'stand_talk.gif';
            case AnimationState.OBJECTION:
              return 'surprised_talk.gif';
            case AnimationState.DESK_SLAM:
              return 'special_1.gif';
            case AnimationState.THINKING:
              return 'closed_eyes.gif';
            default:
              return 'stand.gif';
          }
          
        default:
          return 'stand.gif';
      }
    };
    
    // Get the animation file name
    const animationFile = getAnimationFile(character, state);
    
    // Build the path to the animation - always use the hackthenorth24 directory
    return `/ace-attorney/hackthenorth24/${character}/${animationFile}`;
  };
  
  // Get text box color based on speaking character
  const getTextBoxColorClass = () => {
    switch (speakingCharacter) {
      case Character.PHOENIX:
        return 'bg-blue-800 border-blue-400';
      case Character.EDGEWORTH:
        return 'bg-red-800 border-red-400';
      case Character.JUDGE:
      default:
        return 'bg-yellow-800 border-yellow-400';
    }
  };
  
  // Get speaking character name
  const getSpeakingCharacterName = () => {
    switch (speakingCharacter) {
      case Character.PHOENIX:
        return 'Phoenix Wright';
      case Character.EDGEWORTH:
        return 'Miles Edgeworth';
      case Character.JUDGE:
        return 'The Judge';
      default:
        return '';
    }
  };
  
  // Add CSS for default sprite animations
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Add CSS file for fallback sprites if it doesn't exist
    if (!document.getElementById('ace-attorney-sprites')) {
      const link = document.createElement('link');
      link.id = 'ace-attorney-sprites';
      link.rel = 'stylesheet';
      link.href = '/ace-attorney/default-sprites.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Courtroom background with solid color fallback */}
      <div 
        className="absolute inset-0 bg-blue-900 bg-cover bg-center aa-courtroom-bg" 
        style={{ 
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          opacity: 1
        }}
      >
        {/* Judge background - position centered at top */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-3xl">
          <img 
            src="/ace-attorney/hackthenorth24/judge/background.jpg" 
            alt="Judge Bench" 
            className="w-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              console.error('Failed to load judge background');
            }}
          />
        </div>
        
        {/* Phoenix background - position at bottom left */}
        <div className="absolute bottom-0 left-0 w-1/2">
          <img 
            src="/ace-attorney/hackthenorth24/phoenix/background.png" 
            alt="Defense Background" 
            className="w-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              console.error('Failed to load phoenix background');
            }}
          />
        </div>
        
        {/* Edgeworth background - position at bottom right */}
        <div className="absolute bottom-0 right-0 w-1/2">
          <img 
            src="/ace-attorney/hackthenorth24/edgeworth/background.jpg" 
            alt="Prosecution Background" 
            className="w-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              console.error('Failed to load edgeworth background');
            }}
          />
        </div>
      </div>
      
      {/* Desks overlay */}
      <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-gray-900 to-transparent" />
      
      {/* Judge's bench - GIGANTIC SIZE */}
      <div className="aa-character-judge" style={{ 
        position: 'absolute',
        top: '-60%', /* Positioned MUCH higher to make judge truly gigantic */
        left: '50%',
        transform: 'translateX(-50%) scale(3.5)', /* Scale up by 250% - GIGANTIC */
        height: '150%', /* Taller than screen height */
        zIndex: 10
      }}>
        <img 
          src={getCharacterImagePath(Character.JUDGE, judgeState, judgeFrame)}
          alt="Judge"
          className="h-full object-contain"
          style={{ height: '100%', maxHeight: '3000px', minHeight: '2500px' }} /* GIGANTIC size */
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/ace-attorney/judge.png';
          }}
        />
      </div>
      
      {/* Defense side - GIGANTIC SIZE */}
      <div className="aa-character-defense" style={{ 
        position: 'absolute',
        bottom: '0%', /* Flush with bottom as requested */
        left: '-20%', /* Extend far outside viewport for GIGANTIC appearance */
        height: '150%', /* Much taller than screen height */
        zIndex: 10,
        transform: 'scale(3.5)', /* Scale up by 250% - GIGANTIC */
        transformOrigin: 'bottom left' /* Scale from bottom left corner */
      }}>
        <img 
          src={getCharacterImagePath(Character.PHOENIX, phoenixState, phoenixFrame)}
          alt="Phoenix Wright"
          className="h-full object-contain"
          style={{ height: '100%', maxHeight: '3500px', minHeight: '3000px' }} /* GIGANTIC size */
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/ace-attorney/phoenix.png';
          }}
        />
      </div>
      
      {/* Prosecution side - GIGANTIC SIZE */}
      <div className="aa-character-prosecution" style={{ 
        position: 'absolute',
        bottom: '0%', /* Flush with bottom as requested */
        right: '-20%', /* Extend far outside viewport for GIGANTIC appearance */
        height: '150%', /* Much taller than screen height */
        zIndex: 10,
        transform: 'scale(3.5)', /* Scale up by 250% - GIGANTIC */
        transformOrigin: 'bottom right' /* Scale from bottom right corner */
      }}>
        <img 
          src={getCharacterImagePath(Character.EDGEWORTH, edgeworthState, edgeworthFrame)}
          alt="Miles Edgeworth"
          className="h-full object-contain"
          style={{ height: '100%', maxHeight: '3500px', minHeight: '3000px' }} /* GIGANTIC size */
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/ace-attorney/prosecutor.png';
          }}
        />
      </div>
      
      {/* Objection animation - GIGANTIC SIZE */}
      {showObjection && (
        <div className="ace-attorney-objection" style={{
          position: 'absolute',
          top: '20%', /* Higher position */
          left: '50%',
          transform: 'translateX(-50%) scale(3.0)', /* Scale up by 200% - GIGANTIC */
          zIndex: 100
        }}>
          {objectionType === 'objection' ? (
            <img 
              src="/ace-attorney/hackthenorth24/objection.gif"
              alt="Objection!"
              style={{ height: '1200px', width: 'auto' }} /* GIGANTIC objection */
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = document.createElement('div');
                fallback.className = "text-[12rem] font-extrabold text-red-600 px-20 py-14 bg-white border-12 border-red-600 rounded-xl shadow-2xl rotate-3";
                fallback.textContent = 'OBJECTION!';
                target.parentNode?.replaceChild(fallback, target);
              }}
            />
          ) : (
            <div className="text-[15rem] font-extrabold text-red-600 px-28 py-24 bg-white border-12 border-red-600 rounded-xl shadow-2xl rotate-3">
              {objectionType?.toUpperCase() || 'OBJECTION!'}
            </div>
          )}
        </div>
      )}
      
      {/* Text box - GIGANTIC SIZE */}
      {showTextBox && (
        <div 
          className={`aa-textbox ${speakingCharacter === Character.PHOENIX ? 'border-blue-400' : speakingCharacter === Character.EDGEWORTH ? 'border-red-400' : 'border-yellow-400'}`}
          onClick={completeTyping}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '95%', /* Almost full width */
            maxWidth: '2000px', /* GIGANTIC width */
            minHeight: '500px', /* GIGANTIC height */
            backgroundColor: 'rgba(0, 0, 0, 0.95)', /* Almost black for better contrast */
            borderWidth: '16px', /* Very thick border */
            borderStyle: 'solid',
            borderRadius: '30px',
            padding: '50px', /* More padding */
            zIndex: 100
          }}
        >
          <div className="aa-textbox-character" style={{ 
            fontSize: '85px', /* GIGANTIC font */
            fontWeight: 'bold',
            marginBottom: '25px',
            color: speakingCharacter === Character.PHOENIX ? '#4299e1' : 
                   speakingCharacter === Character.EDGEWORTH ? '#f56565' : '#ecc94b',
            textShadow: '4px 4px 6px rgba(0,0,0,0.6)' /* Add text shadow for better visibility */
          }}>
            {getSpeakingCharacterName()}
          </div>
          <p className="aa-textbox-content" style={{
            fontSize: '70px', /* GIGANTIC font */
            lineHeight: '1.5',
            color: 'white',
            minHeight: '300px', /* Taller */
            letterSpacing: '0.03em', /* Improved readability */
            textShadow: '3px 3px 4px rgba(0,0,0,0.6)', /* Add text shadow for better visibility */
            fontWeight: '500' /* Slightly bolder for better visibility */
          }}>
            {displayText}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
          
          {isTextComplete && (
            <div className="absolute bottom-10 right-10 animate-pulse">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      {/* Additional children */}
      {children}
    </div>
  );
}