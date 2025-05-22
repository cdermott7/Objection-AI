'use client';

import { useState, useEffect, useRef } from 'react';
import { TEXT_SPEED } from '../utils/aceAttorneyAnimations';
import { playSound, SoundEffect } from '../utils/aceAttorneySounds';

interface AceAttorneySpeechBubbleProps {
  text: string;
  position: 'left' | 'right' | 'center';
  variant?: 'normal' | 'blue' | 'red' | 'green';
  onTypingComplete?: () => void;
  autoComplete?: boolean;
  typingSpeed?: number;
}

export default function AceAttorneySpeechBubble({
  text,
  position,
  variant = 'normal',
  onTypingComplete,
  autoComplete = false,
  typingSpeed = TEXT_SPEED
}: AceAttorneySpeechBubbleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [typingIndex, setTypingIndex] = useState(0);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle text typing animation
  useEffect(() => {
    // Reset when text changes
    setDisplayText('');
    setTypingIndex(0);
    setIsTyping(true);
    
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    
    // Start typing animation
    const typeNextChar = () => {
      if (typingIndex < text.length) {
        const nextChar = text[typingIndex];
        setDisplayText(prev => prev + nextChar);
        setTypingIndex(prev => prev + 1);
        
        // Play typing sound for non-space characters
        if (nextChar !== ' ') {
          playSound(SoundEffect.TEXT_BLEEP, 0.2);
        }
        
        // Schedule next character
        typingTimer.current = setTimeout(typeNextChar, typingSpeed);
      } else {
        setIsTyping(false);
        if (onTypingComplete) {
          onTypingComplete();
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
  }, [text, typingSpeed, onTypingComplete]);
  
  // Handle clicking to complete text immediately
  const completeTyping = () => {
    if (isTyping) {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      setDisplayText(text);
      setTypingIndex(text.length);
      setIsTyping(false);
      
      if (onTypingComplete) {
        onTypingComplete();
      }
    }
  };
  
  // Auto-complete after a timeout if enabled
  useEffect(() => {
    let autoCompleteTimer: NodeJS.Timeout | null = null;
    
    if (autoComplete && isTyping) {
      autoCompleteTimer = setTimeout(() => {
        completeTyping();
      }, text.length * typingSpeed * 2); // Give double the normal typing time before auto-completing
    }
    
    return () => {
      if (autoCompleteTimer) {
        clearTimeout(autoCompleteTimer);
      }
    };
  }, [autoComplete, isTyping, text.length, typingSpeed]);
  
  // Get variant styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'blue':
        return 'bg-blue-600 text-white border-blue-800';
      case 'red':
        return 'bg-red-600 text-white border-red-800';
      case 'green':
        return 'bg-green-600 text-white border-green-800';
      case 'normal':
      default:
        return 'bg-white text-gray-900 border-gray-300';
    }
  };
  
  // Position styles
  const positionClasses = {
    left: position === 'left' ? 'left-0 ml-32' : '',
    right: position === 'right' ? 'right-0 mr-32' : '',
    center: position === 'center' ? 'left-1/2 transform -translate-x-1/2' : '',
  };
  
  return (
    <div 
      ref={containerRef}
      className={`absolute bottom-32 max-w-lg p-5 rounded-lg border-2 shadow-lg cursor-pointer ${getVariantClasses()} ${positionClasses[position]}`}
      onClick={completeTyping}
    >
      <p className="font-medium text-lg leading-relaxed whitespace-pre-wrap">
        {displayText}
        {isTyping && <span className="animate-pulse">|</span>}
      </p>
    </div>
  );
}