// @ts-nocheck
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChat, ChatPartnerType } from '../context/ChatContext';

// Prevent 404 errors by intercepting problematic requests
if (typeof window !== 'undefined') {
  // Intercept all audio file requests to block known missing files
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Check if the URL contains text-bleep.mp3 which we know doesn't exist
    if (typeof url === 'string' && url.includes('text-bleep.mp3')) {
      console.log('Blocking request for non-existent file:', url);
      return Promise.reject(new Error('File not found (intercepted)'));
    }
    return originalFetch(url, options);
  };
  
  // Ensure we're in Ace Attorney mode in localStorage
  localStorage.setItem('turiCheckGameMode', 'ace_attorney');
  
  // Create placeholder for missing assets tracking
  window.missingAssets = window.missingAssets || {
    images: {},
    sounds: {}
  };
  
  // Debugging
  console.log('SimpleAceAttorneyMode component initialized');
}

// Game states
enum GameState {
  INTRO,
  QUESTIONING,
  PLAYER_TURN,
  AI_TURN,
  VERDICT,
  ENDING
}

// Character types
enum Character {
  PHOENIX = 'phoenix',
  EDGEWORTH = 'edgeworth',
  JUDGE = 'judge'
}

// Character animation states
enum AnimationState {
  NORMAL = 'stand',
  TALKING = 'stand_talk',
  OBJECTION = 'point_stand',
  DESK_SLAM = 'desk_slam',
  CONFIDENT = 'confident',
  THINKING = 'read_stand',
  DAMAGED = 'damage',
  CORNERED = 'cornered',
  ARMS_CROSSED = 'arms_crossed',
  SPECIAL = 'special_1'
}

// Dialog object type
interface Dialog {
  character: Character;
  animation: AnimationState;
  text: string;
  objection?: boolean;
}

export default function SimpleAceAttorneyMode() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [currentDialog, setCurrentDialog] = useState<Dialog | null>(null);
  const [dialogQueue, setDialogQueue] = useState<Dialog[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [userGuess, setUserGuess] = useState<string | null>(null);
  const [talking, setTalking] = useState(false);
  const [objection, setObjection] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveMatchmaking, setIsLiveMatchmaking] = useState(false);
  const [opponentMessage, setOpponentMessage] = useState<string | null>(null);
  
  // Get stake amount from localStorage (set by the Ace Attorney mode page)
  const [stakeAmount, setStakeAmount] = useState(1); // Default to 1 SUI
  
  // Initialize stake amount and matchmaking settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get stake amount
      const savedStake = localStorage.getItem('aceAttorneyStake');
      if (savedStake) {
        setStakeAmount(parseFloat(savedStake));
      }
      
      // Check if matchmaking is enabled
      const matchmakingEnabled = localStorage.getItem('aceAttorneyMatchmaking');
      setIsLiveMatchmaking(matchmakingEnabled === 'true');
      console.log('Matchmaking enabled:', matchmakingEnabled === 'true');
    }
  }, []);
  
  // Listen for opponent messages from the LiveMatchmaking component
  useEffect(() => {
    if (typeof window !== 'undefined' && isLiveMatchmaking) {
      const handleOpponentMessage = (event: CustomEvent) => {
        console.log('Received opponent message event:', event.detail);
        const message = event.detail.message;
        setOpponentMessage(message);
      };
      
      // Add event listener for opponent messages
      window.addEventListener('opponentMessage', handleOpponentMessage as EventListener);
      
      return () => {
        window.removeEventListener('opponentMessage', handleOpponentMessage as EventListener);
      };
    }
  }, [isLiveMatchmaking]);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize the music and sound system
  useEffect(() => {
    try {
      console.log('Initializing audio system...');
      
      // List of background music options to try (fallbacks)
      const bgmOptions = [
        '/ace-attorney/hackthenorth24/bgm.mp3',
        '/ace-attorney/hackthenorth24/intro1.mp3',
        '/ace-attorney/hackthenorth24/intro2.mp3'
      ];
      
      // Find the first available BGM
      const tryLoadBgm = async () => {
        for (const bgmPath of bgmOptions) {
          try {
            const bgm = new Audio(bgmPath);
            
            // Create a promise to check if the audio loads
            const bgmLoadPromise = new Promise((resolve, reject) => {
              bgm.oncanplaythrough = () => resolve(true);
              bgm.onerror = () => reject(new Error(`Failed to load BGM: ${bgmPath}`));
              
              // Set a timeout in case oncanplaythrough never fires
              setTimeout(() => reject(new Error('BGM load timeout')), 3000);
            });
            
            // Wait for the BGM to load or fail
            await bgmLoadPromise;
            
            // If we get here, the BGM loaded successfully
            console.log(`Successfully loaded BGM: ${bgmPath}`);
            bgm.loop = true;
            bgm.volume = 0.3;
            bgmRef.current = bgm;
            
            // Try to play the music (might fail due to browser autoplay restrictions)
            bgm.play().catch(err => {
              console.log('Music autoplay blocked - user needs to interact with page first');
              
              // Add a click listener to the document to start BGM on first interaction
              const startAudioOnInteraction = () => {
                if (bgmRef.current && bgmRef.current.paused) {
                  bgmRef.current.play().catch(e => console.warn('Still unable to play BGM:', e));
                }
                document.removeEventListener('click', startAudioOnInteraction);
              };
              
              document.addEventListener('click', startAudioOnInteraction);
            });
            
            return; // Exit the loop if we successfully loaded a BGM
          } catch (error) {
            console.warn(`Failed to load BGM ${bgmPath}:`, error);
            // Continue to the next BGM option
          }
        }
        
        // If we get here, all BGM options failed
        console.warn('All BGM options failed, using silent BGM');
        const silentBgm = new Audio();
        silentBgm.loop = true;
        bgmRef.current = silentBgm;
      };
      
      // Start trying to load BGM
      tryLoadBgm();
      
      // Create sound effect audio element
      const audio = new Audio();
      audio.volume = 0.5;
      audioRef.current = audio;
      
      // We'll use this function to safely play sounds with error handling
      const safePlaySound = (src: string, volume = 0.5) => {
        if (!audioRef.current) return;
        
        // Skip known problematic sounds
        if (src.includes('text-bleep.mp3')) {
          return;
        }
        
        // Keep track of which sounds are available to avoid repeated failures
        const availableSounds = (window as any).availableSounds = (window as any).availableSounds || {};
        
        // If we already know this sound is unavailable, don't try to play it
        if (availableSounds[src] === false) {
          return;
        }
        
        // Try alternative sounds if the main one isn't available
        const findAvailableSound = (mainSrc: string): string => {
          // If we already know this sound works, use it
          if (availableSounds[mainSrc] === true) {
            return mainSrc;
          }
          
          // Define fallback sounds for common effects
          const fallbacks: Record<string, string[]> = {
            'objection': [
              '/ace-attorney/hackthenorth24/phoenix-objection.mp3',
              '/ace-attorney/hackthenorth24/judgeno.mp3'
            ],
            'desk_slam': [
              '/ace-attorney/hackthenorth24/gavel.mp3',
              '/ace-attorney/hackthenorth24/intro3.mp3'
            ],
            'typing': [
              '/ace-attorney/hackthenorth24/thinking.mp3',
              '/ace-attorney/hackthenorth24/intro2.mp3'
            ]
          };
          
          // Find which category this sound belongs to
          let category = Object.keys(fallbacks).find(key => mainSrc.includes(key));
          
          // If we have fallbacks for this category and the sound isn't the main src
          if (category && fallbacks[category].indexOf(mainSrc) === -1) {
            // Try each fallback in order
            for (const fallbackSrc of fallbacks[category]) {
              if (availableSounds[fallbackSrc] === true) {
                return fallbackSrc;
              }
            }
          }
          
          // If no fallbacks are known to work, stick with the original
          return mainSrc;
        };
        
        // Get the best available sound source
        const bestSrc = findAvailableSound(src);
        
        try {
          const audio = audioRef.current;
          audio.src = bestSrc;
          audio.volume = volume;
          audio.currentTime = 0;
          
          // Set up error handler to mark this sound as unavailable if it fails
          audio.onerror = () => {
            console.warn(`Sound not available: ${bestSrc}`);
            availableSounds[bestSrc] = false;
          };
          
          return audio.play().then(() => {
            // Mark this sound as available on successful play
            availableSounds[bestSrc] = true;
          }).catch(err => {
            console.warn(`Failed to play sound: ${bestSrc}`, err);
            availableSounds[bestSrc] = false;
          });
        } catch (error) {
          console.warn(`Error setting up sound: ${bestSrc}`, error);
          availableSounds[bestSrc] = false;
        }
      };
      
      // Attach the function to window for easy access
      (window as any).safePlaySound = safePlaySound;
      
      // Add a play sound button to help with autoplay issues
      const addPlaySoundButton = () => {
        // Check if the button already exists
        if (document.getElementById('ace-attorney-play-sound')) {
          return;
        }
        
        const button = document.createElement('button');
        button.id = 'ace-attorney-play-sound';
        button.innerText = '🔊 Enable Sound';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.left = '10px';
        button.style.zIndex = '1000';
        button.style.padding = '5px 10px';
        button.style.background = 'rgba(0,0,0,0.5)';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        button.onclick = () => {
          // Try to play BGM
          if (bgmRef.current) {
            bgmRef.current.play().catch(e => console.warn('Unable to play BGM:', e));
          }
          
          // Try to play a test sound
          safePlaySound('/ace-attorney/hackthenorth24/intro1.mp3', 0.2);
          
          // Remove the button after it's clicked
          button.remove();
        };
        
        document.body.appendChild(button);
      };
      
      // Add the sound button after a short delay
      setTimeout(addPlaySoundButton, 1000);
      
      return () => {
        if (bgmRef.current) {
          bgmRef.current.pause();
          bgmRef.current = null;
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        delete (window as any).safePlaySound;
        
        // Remove the play sound button if it exists
        const soundButton = document.getElementById('ace-attorney-play-sound');
        if (soundButton) {
          soundButton.remove();
        }
      };
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }, []);
  
  // Apply fullscreen styles
  useEffect(() => {
    // Apply fullscreen styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'black';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.inset = '0';
    
    // Add class for CSS targeting
    document.body.classList.add('ace-attorney-mode');
    
    // Preload all character images
    const preloadImages = [
      // Backgrounds
      '/ace-attorney/hackthenorth24/judge/background.jpg',
      '/ace-attorney/hackthenorth24/phoenix/background.png',
      '/ace-attorney/hackthenorth24/edgeworth/background.jpg',
      
      // Phoenix animations
      '/ace-attorney/hackthenorth24/phoenix/stand.gif',
      '/ace-attorney/hackthenorth24/phoenix/stand_talk.gif',
      '/ace-attorney/hackthenorth24/phoenix/point_stand.gif',
      '/ace-attorney/hackthenorth24/phoenix/point_talk.gif',
      '/ace-attorney/hackthenorth24/phoenix/slam_stand.gif',
      '/ace-attorney/hackthenorth24/phoenix/slam_talk.gif',
      '/ace-attorney/hackthenorth24/phoenix/smirk_stand.gif',
      '/ace-attorney/hackthenorth24/phoenix/smirk_talk.gif',
      '/ace-attorney/hackthenorth24/phoenix/damage.gif',
      '/ace-attorney/hackthenorth24/phoenix/read_stand.gif',
      '/ace-attorney/hackthenorth24/phoenix/read_talk.gif',
      '/ace-attorney/hackthenorth24/phoenix/cornered.gif',
      '/ace-attorney/hackthenorth24/phoenix/cornered_talk.gif',
      
      // Edgeworth animations
      '/ace-attorney/hackthenorth24/edgeworth/stand.gif',
      '/ace-attorney/hackthenorth24/edgeworth/stand_talk.gif',
      '/ace-attorney/hackthenorth24/edgeworth/point_stand.gif',
      '/ace-attorney/hackthenorth24/edgeworth/point_talk.gif',
      '/ace-attorney/hackthenorth24/edgeworth/desk_slam.gif',
      '/ace-attorney/hackthenorth24/edgeworth/desk_talk.gif',
      '/ace-attorney/hackthenorth24/edgeworth/confident.gif',
      '/ace-attorney/hackthenorth24/edgeworth/confident_talk.gif',
      '/ace-attorney/hackthenorth24/edgeworth/read.gif',
      '/ace-attorney/hackthenorth24/edgeworth/read_talk.gif',
      '/ace-attorney/hackthenorth24/edgeworth/damage.gif',
      '/ace-attorney/hackthenorth24/edgeworth/cornered.gif',
      '/ace-attorney/hackthenorth24/edgeworth/cornered_talk.gif',
      '/ace-attorney/hackthenorth24/edgeworth/arms_crossed.gif',
      '/ace-attorney/hackthenorth24/edgeworth/arms_crossed_talk.gif',
      
      // Judge animations
      '/ace-attorney/hackthenorth24/judge/stand.gif',
      '/ace-attorney/hackthenorth24/judge/stand_talk.gif',
      '/ace-attorney/hackthenorth24/judge/special_1.gif',
      '/ace-attorney/hackthenorth24/judge/special_2.gif',
      '/ace-attorney/hackthenorth24/judge/negative_stand.gif',
      '/ace-attorney/hackthenorth24/judge/closed_eyes.gif',
      
      // Effects
      '/ace-attorney/hackthenorth24/objection.gif'
    ];
    
    // Add image availability tracking
    const availableImages = {} as Record<string, boolean>;
    (window as any).availableImages = availableImages;
    
    const imagePromises = preloadImages.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Mark this image as available
          availableImages[src] = true;
          resolve(src);
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          // Mark this image as not available
          availableImages[src] = false;
          resolve(src); // Resolve anyway to not block loading
        };
        img.src = src;
      });
    });
    
    // Wait for images to load or timeout after 3 seconds
    Promise.race([
      Promise.all(imagePromises),
      new Promise(resolve => setTimeout(resolve, 3000))
    ]).then(() => {
      setLoading(false);
      startIntro();
    });
    
    // Clean up
    return () => {
      document.body.classList.remove('ace-attorney-mode');
      document.body.style.removeProperty('margin');
      document.body.style.removeProperty('padding');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('background');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('inset');
    };
  }, []);
  
  // Start the talking animation
  useEffect(() => {
    const talkInterval = setInterval(() => {
      setTalking(prev => !prev);
    }, 300);
    
    return () => clearInterval(talkInterval);
  }, []);
  
  // Handle typing animation
  useEffect(() => {
    if (!currentDialog || typingText === currentDialog.text) return;
    
    // Clear any existing interval
    if (typingInterval.current) {
      clearInterval(typingInterval.current);
      typingInterval.current = null;
    }
    
    // Start typing animation
    setIsTyping(true);
    let index = typingText.length;
    
    typingInterval.current = setInterval(() => {
      if (index < currentDialog.text.length) {
        setTypingText(currentDialog.text.substring(0, index + 1));
        index++;
        
        // Play typing sound occasionally
        if (index % 3 === 0 && audioRef.current) {
          // No need to play sound on every character - it can get annoying
          if (index % 10 === 0 && (window as any).safePlaySound) { // Only play sound occasionally
            // Try to use the local sound first
            const soundEffects = [
              '/ace-attorney/hackthenorth24/gavel.mp3',
              '/ace-attorney/hackthenorth24/intro3.mp3'
            ];
            
            const selectedSound = soundEffects[Math.floor(Math.random() * soundEffects.length)];
            (window as any).safePlaySound(selectedSound, 0.1); // Lower volume for typing sounds
          }
        }
      } else {
        // Done typing
        setIsTyping(false);
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
          typingInterval.current = null;
        }
      }
    }, 30);
    
    return () => {
      if (typingInterval.current) {
        clearInterval(typingInterval.current);
        typingInterval.current = null;
      }
    };
  }, [currentDialog, typingText]);
  
  // Process dialog queue
  useEffect(() => {
    if (dialogQueue.length > 0 && !currentDialog) {
      const nextDialog = dialogQueue[0];
      const newQueue = dialogQueue.slice(1);
      setDialogQueue(newQueue);
      setCurrentDialog(nextDialog);
      setTypingText('');
      
      // Play objection sound if needed
      if (nextDialog.objection) {
        setObjection(true);
        
        // Use the safe sound player if available
        if ((window as any).safePlaySound) {
          (window as any).safePlaySound('/ace-attorney/hackthenorth24/phoenix-objection.mp3', 0.5);
        }
        
        // Hide objection after a delay
        setTimeout(() => setObjection(false), 1500);
      }
      
      // Log the current dialog for debugging
      console.log('Processing dialog:', { 
        character: nextDialog.character, 
        animation: nextDialog.animation,
        text: nextDialog.text.substring(0, 30) + '...',
        gameState: gameState
      });
    }
  }, [dialogQueue, currentDialog, gameState]);
  
  // Start intro sequence
  const startIntro = useCallback(() => {
    setGameState(GameState.INTRO);
    
    // Reset the question counter in localStorage to ensure proper progression
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aceAttorneyQuestionCount');
      console.log("Reset question counter in localStorage");
    }
    
    // Try to start background music if it wasn't started earlier
    if (bgmRef.current) {
      bgmRef.current.play().catch(err => console.log('Music play failed:', err));
    }
    
    // Deduct the stake amount from the mock wallet
    if (typeof window !== 'undefined') {
      try {
        const mockWalletState = localStorage.getItem('mockWalletState');
        if (mockWalletState) {
          const wallet = JSON.parse(mockWalletState);
          // Deduct the stake amount
          wallet.balance -= stakeAmount;
          localStorage.setItem('mockWalletState', JSON.stringify(wallet));
          console.log(`Deducted stake from mock wallet: -${stakeAmount} SUI`);
        }
      } catch (error) {
        console.error('Error deducting stake from mock wallet:', error);
      }
    }
    
    const introDialogs: Dialog[] = [
      { 
        character: Character.JUDGE, 
        animation: AnimationState.TALKING, 
        text: `Court is now in session for the trial of the Turing Test! A stake of ${stakeAmount} SUI has been placed.` 
      },
      { 
        character: Character.JUDGE, 
        animation: AnimationState.SPECIAL, 
        text: "The defense and prosecution will determine if the defendant is human or AI." 
      },
      { 
        character: Character.PHOENIX, 
        animation: AnimationState.NORMAL, 
        text: "The defense is ready, Your Honor." 
      },
      { 
        character: Character.EDGEWORTH, 
        animation: AnimationState.ARMS_CROSSED, 
        text: "The prosecution is ready, Your Honor." 
      },
      { 
        character: Character.JUDGE, 
        animation: AnimationState.SPECIAL, 
        text: "Very well. Let the cross-examination begin!" 
      }
    ];
    
    setDialogQueue(introDialogs);
    setMessageCount(0);
    
    // Play intro sound using safe sound player
    if ((window as any).safePlaySound) {
      (window as any).safePlaySound('/ace-attorney/hackthenorth24/intro1.mp3', 0.5);
    }
  }, [stakeAmount, isLiveMatchmaking]);
  
  // Start questioning phase with more ambiguous questions
  const startQuestioning = useCallback(() => {
    console.log("Starting questioning phase");
    setGameState(GameState.QUESTIONING);
    
    const questionDialogs: Dialog[] = [
      { 
        character: Character.JUDGE, 
        animation: AnimationState.TALKING, 
        text: "Witness, please describe your approach to solving complex technical problems." 
      }
    ];
    
    setDialogQueue(prev => [...prev, ...questionDialogs]);
  }, [isLiveMatchmaking]);
  
  // Start player turn
  const startPlayerTurn = useCallback(() => {
    console.log("Starting player's turn - showing input form");
    setGameState(GameState.PLAYER_TURN);
    setShowInput(true);
    
    // Force focus on the input field after a short delay to ensure it's rendered
    setTimeout(() => {
      const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputField) {
        inputField.focus();
        console.log("Input field focused");
      } else {
        console.warn("Could not find input field to focus");
      }
    }, 100);
  }, [isLiveMatchmaking]);
  
  // Start AI turn
  const startAiTurn = useCallback(() => {
    console.log("Starting AI's turn");
    setGameState(GameState.AI_TURN);
    setShowInput(false);
    
    // FIX: Don't rely on messageCount directly; use a snapshot from the current closure
    // Track the current question index to provide a proper response
    const safeMessageCount = messageCount; // Create a stable reference
    const currentQuestionIndex = Math.min(Math.floor(safeMessageCount), 4); // Cap at index 4 (5th question)
    
    console.log("AI turn - responding to question:", { 
      messageCount: safeMessageCount, 
      currentQuestionIndex,
      actualIndex: Math.floor(safeMessageCount),
      isLiveMatchmaking,
      hasOpponentMessage: !!opponentMessage
    });
    
    // Use opponent message from live matchmaking if available, otherwise use AI responses
    let aiResponse = "";
    
    // When in live matchmaking mode, use the opponent's message if available
    if (isLiveMatchmaking && opponentMessage) {
      console.log("Using live opponent message:", opponentMessage);
      aiResponse = opponentMessage;
      setOpponentMessage(null); // Clear after using
      
      // If we're using matchmaking but don't have an opponent message yet, send a request to the opponent
      if (typeof window !== 'undefined' && (window as any).sendMatchmakingMessage && !aiResponse) {
        // Get the current question
        const questions = [
          "Witness, please describe your approach to solving complex technical problems.",
          "Tell me about a time you failed at a project and what you learned from it.",
          "How do you feel when your code doesn't work as expected?",
          "Describe your most frustrating debugging experience and how you overcame it.",
          "What's your favorite unconventional use of technology that you've seen or created?"
        ];
        
        const questionIndex = Math.min(Math.floor(safeMessageCount), questions.length - 1);
        const currentQuestion = questions[questionIndex];
        
        console.log("Requesting response from opponent for question:", currentQuestion);
        (window as any).sendMatchmakingMessage(currentQuestion);
        
        // Use a fallback message while waiting for response
        aiResponse = "I'm considering my response to this question... [thinking]";
      }
    } else {
      // When not using live matchmaking, use pre-defined AI responses
      const responseSets = [
        // First question - Technical problem solving
        [
          "I approach complex problems by breaking them down into smaller, manageable parts. I first try to understand the root cause by analyzing the available data and constraints, then explore possible solutions systematically while weighing tradeoffs. I often use a combination of research, experimentation, and consulting with colleagues to find the most efficient solution.",
          "When facing technical challenges, I like to start by drawing diagrams to visualize the problem. This helps me identify patterns and relationships that might not be obvious at first. I then prioritize the most critical aspects and work through them methodically, implementing tests along the way to verify my approach."
        ],
        // Second question - Project failure
        [
          "Last year, I underestimated the complexity of integrating a payment system, causing us to miss a deadline. I learned to better scope projects, communicate risks earlier, and build in buffer time for unforeseen complications. The experience taught me that thorough research upfront saves time later.",
          "I once built an app with a complex architecture that was difficult to maintain. Users found it confusing too. This taught me to prioritize simplicity and user feedback from the beginning. Now I start with a minimal viable product and iterate based on real user experiences."
        ],
        // Third question - Feelings about code not working
        [
          "Honestly, it's frustrating when my code doesn't work as expected, especially after I've spent hours on it. But I've learned to see these moments as puzzles rather than failures. I take a step back, grab some coffee, and return with fresh eyes. Sometimes the solution becomes obvious after a short break.",
          "When my code breaks, there's this initial surge of annoyance that I've learned to channel into curiosity. It's like the code is challenging me to find where my understanding is incomplete. The 'aha' moment when I finally solve the issue makes the struggle worthwhile."
        ],
        // Fourth question - Debugging experience
        [
          "My most frustrating debugging experience was tracking down a memory leak in a production system that only occurred under heavy load. After days of investigation, adding logging, and analyzing patterns, I discovered it was caused by an improper cleanup of event listeners. I fixed it by implementing a robust event management system that tracked all subscriptions.",
          "Once I spent three days hunting a bug that caused random test failures about 2% of the time. It turned out to be a race condition in how we were mocking a database. I solved it by redesigning our test infrastructure to use transactions and isolation. The experience taught me to be suspicious of 'random' failures - they usually have systematic causes."
        ],
        // Fifth question - Unconventional tech use
        [
          "I used a Raspberry Pi with sensors to monitor my plants' soil moisture and automatically water them when needed. I added a camera that takes daily photos to track growth and detect potential issues. It's been running for years and has saved many plants during my vacations.",
          "I created a system that monitors my energy usage at home and uses machine learning to predict consumption patterns. It automatically adjusts my thermostat and lighting to optimize for both comfort and efficiency. The project started as a weekend hobby but has reduced my energy bills by about 15%."
        ]
      ];
      
      // FIX: Make sure we're working with valid array indices
      if (currentQuestionIndex >= responseSets.length) {
        console.error("Invalid question index:", currentQuestionIndex, "max is", responseSets.length - 1);
        return; // Prevent error by exiting early
      }
      
      // Select the appropriate response set based on the current question index
      const currentResponseSet = responseSets[currentQuestionIndex];
      aiResponse = currentResponseSet[Math.floor(Math.random() * currentResponseSet.length)];
    }
    
    setAiAnswer(aiResponse);
    
    // Add AI response to dialog queue with appropriate animation based on content
    let animation = AnimationState.TALKING;
    
    // Choose animation based on content analysis - enhanced with more triggers
    if (aiResponse.includes("frustrat") || aiResponse.includes("difficult") || aiResponse.includes("challenge") || aiResponse.includes("problem")) {
      animation = AnimationState.DESK_SLAM;
    } else if (aiResponse.includes("learned") || aiResponse.includes("discovered") || aiResponse.includes("research")) {
      animation = AnimationState.THINKING;
    } else if (aiResponse.includes("created") || aiResponse.includes("built") || aiResponse.includes("designed") || aiResponse.includes("implemented")) {
      animation = AnimationState.CONFIDENT;
    } else if (aiResponse.includes("failure") || aiResponse.includes("mistake") || aiResponse.includes("wrong")) {
      animation = AnimationState.DAMAGED;
    } else if (aiResponse.includes("understand") || aiResponse.includes("analyze") || aiResponse.includes("consider")) {
      animation = AnimationState.ARMS_CROSSED;
    } else {
      // Random animations for more variety
      const randomAnim = Math.random();
      if (randomAnim > 0.7) {
        animation = AnimationState.CONFIDENT;
      } else if (randomAnim > 0.4) {
        animation = AnimationState.ARMS_CROSSED;
      } else if (randomAnim > 0.2) {
        animation = AnimationState.THINKING;
      }
    }
    
    const aiDialog: Dialog = { 
      character: Character.EDGEWORTH, 
      animation: animation, 
      text: aiResponse 
    };
    
    setDialogQueue(prev => [...prev, aiDialog]);
    
    // FIX: Use a state update function to ensure we're working with the latest messageCount
    // This ensures that message count is correctly updated for the next question
    setMessageCount(prevCount => {
      const newCount = prevCount + 0.5;
      console.log("AI turn complete - updated message count from", prevCount, "to", newCount);
      return newCount;
    });
  }, [isLiveMatchmaking, opponentMessage, messageCount]);
  
  // Start verdict phase
  const startVerdict = useCallback(() => {
    setGameState(GameState.VERDICT);
    
    const verdictDialogs: Dialog[] = [
      { 
        character: Character.JUDGE, 
        animation: AnimationState.DESK_SLAM, 
        text: "The court has heard enough testimony. It is time to render a verdict." 
      },
      { 
        character: Character.JUDGE, 
        animation: AnimationState.TALKING, 
        text: "Defense, what do you believe? Is the witness a human or an AI?" 
      }
    ];
    
    setDialogQueue(prev => [...prev, ...verdictDialogs]);
    setShowInput(false);
  }, [isLiveMatchmaking]);
  
  // Handle dialog click to advance
  const handleDialogClick = useCallback(() => {
    // Log the current state before doing anything
    console.log("Dialog clicked - current state:", {
      gameState,
      messageCount,
      hasCurrentDialog: !!currentDialog,
      dialogQueueLength: dialogQueue.length,
      showInput
    });
    
    // If still typing, complete the typing immediately
    if (isTyping && currentDialog) {
      setTypingText(currentDialog.text);
      setIsTyping(false);
      if (typingInterval.current) {
        clearInterval(typingInterval.current);
        typingInterval.current = null;
      }
      return;
    }
    
    // Clear current dialog and process next in queue
    setCurrentDialog(null);
    
    // If dialog queue is empty, advance game state
    if (dialogQueue.length === 0) {
      // Play a sound cue to indicate state transition
      if ((window as any).safePlaySound) {
        (window as any).safePlaySound('/ace-attorney/hackthenorth24/gavel.mp3', 0.3);
      }
      
      console.log("Dialog queue empty, advancing game state:", { gameState, messageCount });
      
      // Play transition sound between states using safe sound player
      if ((window as any).safePlaySound) {
        (window as any).safePlaySound('/ace-attorney/hackthenorth24/intro2.mp3', 0.3);
      }
      
      // Debug log to track game state progression
      console.log("Game state before transition:", gameState);
      
      // Force hiding of any lingering input form if we're not supposed to be in player turn
      if (gameState !== GameState.PLAYER_TURN) {
        setShowInput(false);
      }
      
      if (gameState === GameState.INTRO) {
        startQuestioning();
      } else if (gameState === GameState.QUESTIONING) {
        startPlayerTurn();
      } else if (gameState === GameState.PLAYER_TURN) {
        startAiTurn();
      } else if (gameState === GameState.AI_TURN) {
        // Check if we've completed 5 full rounds (messageCount is 5.0 or higher)
        // Math.floor ensures we're checking for complete exchanges
        if (Math.floor(messageCount) >= 5) {
          console.log("Reached 5 complete exchanges, moving to verdict phase");
          startVerdict();
        } else {
          // New questions from the judge - more challenging to distinguish human vs AI
          const questions = [
            "Tell me about a time you failed at a project and what you learned from it.",
            "How do you feel when your code doesn't work as expected?",
            "Describe your most frustrating debugging experience and how you overcame it.",
            "What's your favorite unconventional use of technology that you've seen or created?",
            "If you could change one thing about how programming is taught, what would it be?"
          ];
          
          // Get an appropriate question for the current message count
          // Use message count to get the next question, ensuring it doesn't repeat
          // Math.floor ensures we get the correct integer index even when message count is incremented by 0.5
          
          // FIX: Directly compute index from raw messageCount to prevent stale state issues
          // The reason for the infinite repetition is likely that messageCount state updates
          // aren't being reflected immediately in this function
          const rawMessageCount = messageCount;
          const storedCount = localStorage.getItem('aceAttorneyQuestionCount');
          
          // Use a more reliable method to track question progression with localStorage
          let currentExchanges;
          if (storedCount !== null) {
            currentExchanges = parseInt(storedCount, 10);
            // Ensure we don't go backward
            if (Math.floor(rawMessageCount) > currentExchanges) {
              currentExchanges = Math.floor(rawMessageCount);
            }
          } else {
            currentExchanges = Math.floor(rawMessageCount);
          }
          
          console.log("Current exchange calculation:", { 
            storedCount,
            currentExchanges, 
            rawMessageCount,
            floored: Math.floor(rawMessageCount)
          });
          
          // Store for next time
          localStorage.setItem('aceAttorneyQuestionCount', String(currentExchanges + 1));
          
          // IMPORTANT FIX: Make sure we're not exceeding array bounds
          // This prevents us from trying to access undefined questions
          const questionIndex = Math.min(currentExchanges, questions.length - 1);
          
          // Store this index in a local variable to avoid race conditions with state updates
          const nextQuestion = questions[questionIndex];
          
          console.log("Selecting next question:", { 
            messageCount: rawMessageCount, 
            currentExchanges,
            questionIndex, 
            nextQuestion,
            totalQuestions: questions.length,
            storedCount
          });
          
          // Only proceed if we have a valid question to ask
          if (nextQuestion) {
            // Add variety to the judge's animations
            const judgeAnimations = [
              AnimationState.TALKING,
              AnimationState.DESK_SLAM,
              AnimationState.THINKING
            ];
            
            // Choose judge animation based on question content for more context-aware behavior
            let randomAnimation;
            const questionLower = nextQuestion.toLowerCase();
            if (questionLower.includes("fail") || questionLower.includes("frustrat")) {
              randomAnimation = AnimationState.DESK_SLAM;
            } else if (questionLower.includes("feel") || questionLower.includes("favorite") || questionLower.includes("change")) {
              randomAnimation = AnimationState.THINKING;
            } else {
              randomAnimation = judgeAnimations[Math.floor(Math.random() * judgeAnimations.length)];
            }
            
            const questionDialogs: Dialog[] = [
              { 
                character: Character.JUDGE, 
                animation: randomAnimation, 
                text: nextQuestion
              }
            ];
            
            // Only set the dialog queue if we're not already showing this question
            // This prevents the infinite loop by ensuring we don't keep setting the same question
            setDialogQueue(questionDialogs);
            
            // CRITICAL FIX: Change the game state to QUESTIONING after displaying a new question
            // This ensures that when this dialog is completed, we'll transition to PLAYER_TURN
            // in the handleDialogClick function
            setGameState(GameState.QUESTIONING);
          } else {
            // Fallback in case we somehow ran out of questions but haven't reached verdict phase
            console.error("No question available for index", questionIndex);
            
            // Force advance to verdict phase to recover from this state
            startVerdict();
          }
        }
      }
    }
  }, [isTyping, currentDialog, dialogQueue, gameState, messageCount, startQuestioning, startPlayerTurn, startAiTurn, startVerdict, showInput]);
  
  // Handle player input submission with more animation variety
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    console.log("Player submitting response, current message count:", messageCount);
    console.log("Game state during submission:", gameState);
    
    // If using live matchmaking, send the player's message to the opponent
    if (isLiveMatchmaking && typeof window !== 'undefined' && (window as any).sendMatchmakingMessage) {
      console.log("Sending player response to opponent:", inputValue.trim());
      (window as any).sendMatchmakingMessage(inputValue.trim());
    }
    
    // Choose a random animation based on the input content and add variety
    let animation = AnimationState.TALKING;
    let shouldObjection = false;
    
    // Analysis of input content to select appropriate animation - enhanced with more triggers
    const lowerInput = inputValue.toLowerCase();
    if (lowerInput.includes("objection") || lowerInput.includes("disagree") || lowerInput.includes("wrong") || lowerInput.includes("incorrect")) {
      animation = AnimationState.OBJECTION;
      shouldObjection = true;
    } else if (lowerInput.includes("actually") || lowerInput.includes("fact") || lowerInput.includes("truth") || lowerInput.includes("evidence")) {
      animation = AnimationState.DESK_SLAM;
    } else if (lowerInput.includes("think") || lowerInput.includes("maybe") || lowerInput.includes("perhaps") || lowerInput.includes("consider")) {
      animation = AnimationState.THINKING;
    } else if (lowerInput.includes("confident") || lowerInput.includes("sure") || lowerInput.includes("certain") || lowerInput.includes("absolutely")) {
      animation = AnimationState.CONFIDENT;
    } else if (lowerInput.includes("impossible") || lowerInput.includes("shocking") || lowerInput.includes("surprised") || lowerInput.includes("unexpected")) {
      animation = AnimationState.DAMAGED;
    } else if (lowerInput.includes("trapped") || lowerInput.includes("cornered") || lowerInput.includes("caught")) {
      animation = AnimationState.CORNERED;
    } else {
      // If no specific content triggers, randomly select an animation for variety
      const randomFactor = Math.random();
      if (randomFactor > 0.85) {
        animation = AnimationState.OBJECTION;
        shouldObjection = true;
      } else if (randomFactor > 0.7) {
        animation = AnimationState.DESK_SLAM;
      } else if (randomFactor > 0.6) {
        animation = AnimationState.THINKING;
      } else if (randomFactor > 0.5) {
        animation = AnimationState.CONFIDENT;
      } else if (randomFactor > 0.4) {
        animation = AnimationState.CORNERED;
      } else if (randomFactor > 0.3) {
        animation = AnimationState.ARMS_CROSSED;
      }
    }
    
    // Play appropriate sound effect using safe sound player
    if ((window as any).safePlaySound) {
      if (shouldObjection) {
        (window as any).safePlaySound('/ace-attorney/hackthenorth24/phoenix-objection.mp3', 0.5);
      } else if (animation === AnimationState.DESK_SLAM) {
        (window as any).safePlaySound('/ace-attorney/hackthenorth24/gavel.mp3', 0.3);
      }
    }
    
    // Add player response to dialog queue
    const playerDialog: Dialog = { 
      character: Character.PHOENIX, 
      animation: animation, 
      text: inputValue.trim(),
      objection: shouldObjection // Use the objection flag based on content or random chance
    };
    
    setDialogQueue(prev => [...prev, playerDialog]);
    setInputValue('');
    setShowInput(false);
    
    // FIX: Use a state update function to ensure we're working with the latest messageCount
    // This ensures that we're not using a stale value that could lead to incorrect question selection
    setMessageCount(prevCount => {
      const newCount = prevCount + 0.5;
      console.log("Player turn complete - updated message count from", prevCount, "to", newCount);
      return newCount;
    });
  }, [inputValue, gameState, messageCount, isLiveMatchmaking]);
  
  // Handle verdict selection
  const handleVerdict = useCallback((verdict: string) => {
    setUserGuess(verdict);
    
    // Add verdict dialog
    // For live matchmaking, check if the opponent is human or AI based on matchmaking result
    // For non-matchmaking mode, Edgeworth is always AI
    let isCorrect = false;
    
    if (isLiveMatchmaking) {
      // Check the opponent type from localStorage (set by LiveMatchmaking)
      const opponentIsHuman = localStorage.getItem('aceAttorneyOpponentIsHuman') === 'true';
      isCorrect = (verdict === 'human' && opponentIsHuman) || (verdict === 'AI' && !opponentIsHuman);
      console.log("Verdict for live matchmaking:", { verdict, opponentIsHuman, isCorrect });
    } else {
      // In non-matchmaking mode, Edgeworth is always AI
      isCorrect = verdict === 'AI';
      console.log("Verdict for AI mode:", { verdict, isCorrect });
    }
    
    // Calculate reward based on stake amount (25% bonus for correct guess)
    const rewardAmount = isCorrect ? stakeAmount * 1.25 : 0;
    
    // If this was a real implementation, here we would update the blockchain with the result
    // For now, just update the mock wallet balance
    if (typeof window !== 'undefined') {
      try {
        const mockWalletState = localStorage.getItem('mockWalletState');
        if (mockWalletState) {
          const wallet = JSON.parse(mockWalletState);
          // If correct, add the reward (which is original stake + 25% bonus)
          // If wrong, the stake is lost (already deducted)
          if (isCorrect) {
            wallet.balance += rewardAmount;
            localStorage.setItem('mockWalletState', JSON.stringify(wallet));
            console.log(`Updated mock wallet with reward: +${rewardAmount} SUI`);
          } else {
            console.log(`Lost stake: ${stakeAmount} SUI`);
          }
        }
      } catch (error) {
        console.error('Error updating mock wallet with verdict result:', error);
      }
    }
    
    const rewardText = isCorrect 
      ? `You win ${rewardAmount.toFixed(2)} SUI for your correct deduction!` 
      : `You lose your ${stakeAmount.toFixed(2)} SUI stake for your incorrect deduction.`;
    
    const verdictDialogs: Dialog[] = [
      { 
        character: Character.PHOENIX, 
        animation: isCorrect ? AnimationState.OBJECTION : AnimationState.NORMAL, 
        text: `The witness is ${verdict}!`,
        objection: isCorrect
      },
      { 
        character: isCorrect ? Character.JUDGE : Character.EDGEWORTH, 
        animation: isCorrect ? AnimationState.DESK_SLAM : AnimationState.OBJECTION, 
        text: isCorrect 
          ? "The court accepts your conclusion!" 
          : "OBJECTION! Your conclusion is incorrect!",
        objection: !isCorrect
      },
      { 
        character: Character.JUDGE, 
        animation: AnimationState.DESK_SLAM, 
        text: isCorrect 
          ? `NOT GUILTY! The defense has correctly identified the witness! ${rewardText}` 
          : `GUILTY! The defense has failed to identify the witness correctly! ${rewardText}`
      }
    ];
    
    setDialogQueue(prev => [...prev, ...verdictDialogs]);
    setGameState(GameState.ENDING);
  }, [stakeAmount, isLiveMatchmaking]);
  
  // Get the chat context
  const { toggleGameMode } = useChat();
  
  // Simple exit button to go back to home
  const handleExit = useCallback(() => {
    // Stop background music
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
    
    // Ensure we're switching back to standard mode
    if (typeof window !== 'undefined') {
      try {
        // First update localStorage
        localStorage.setItem('turiCheckGameMode', 'standard');
        
        // Then use the context function if available
        if (toggleGameMode) {
          toggleGameMode();
        }
        
        // Finally navigate home
        console.log('Exiting Ace Attorney mode, returning to home page');
        window.location.href = '/';
      } catch (error) {
        console.error('Error exiting Ace Attorney mode:', error);
        // Fallback to simple navigation
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router, toggleGameMode]);
  
  // Loading screen
  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'black',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div>Loading Ace Attorney Mode...</div>
          <div style={{ fontSize: '16px', marginTop: '10px' }}>
            (Please enable sound for the full experience)
          </div>
        </div>
      </div>
    );
  }
  
  // Get the proper animation filename based on character and state
  const getAnimationFilename = (character: Character, baseAnimation: string, isTalking: boolean) => {
    // Map animations to their correct filenames for each character
    const animationMap: Record<Character, Record<string, string>> = {
      [Character.PHOENIX]: {
        'stand': 'stand.gif',
        'stand_talk': 'stand_talk.gif',
        'point_stand': 'point_stand.gif',
        'point_talk': 'point_talk.gif',
        'desk_slam': 'slam_stand.gif',
        'desk_talk': 'slam_talk.gif',
        'confident': 'smirk_stand.gif',
        'confident_talk': 'smirk_talk.gif',
        'read_stand': 'read_stand.gif',
        'read_talk': 'read_talk.gif',
        'damage': 'damage.gif',
        'cornered': 'cornered.gif',
        'cornered_talk': 'cornered_talk.gif'
      },
      [Character.EDGEWORTH]: {
        'stand': 'stand.gif',
        'stand_talk': 'stand_talk.gif',
        'point_stand': 'point_stand.gif',
        'point_talk': 'point_talk.gif',
        'desk_slam': 'desk_slam.gif',
        'desk_talk': 'desk_talk.gif',
        'confident': 'confident.gif',
        'confident_talk': 'confident_talk.gif',
        'read_stand': 'read.gif',
        'read_talk': 'read_talk.gif',
        'damage': 'damage.gif',
        'cornered': 'cornered.gif',
        'cornered_talk': 'cornered_talk.gif',
        'arms_crossed': 'arms_crossed.gif',
        'arms_crossed_talk': 'arms_crossed_talk.gif'
      },
      [Character.JUDGE]: {
        'stand': 'stand.gif',
        'stand_talk': 'stand_talk.gif',
        'special_1': 'special_1.gif',
        'special_2': 'special_2.gif',
        'damage': 'negative_stand.gif',
        'thinking': 'closed_eyes.gif'
      }
    };
    
    // If it's a talking animation and we have a talking version, use it
    let animation = baseAnimation;
    if (isTalking) {
      const talkingVersion = `${baseAnimation}_talk`;
      if (animationMap[character][talkingVersion]) {
        animation = talkingVersion;
      }
    }
    
    // Get the mapped filename
    const mappedFilename = animationMap[character][animation] || 'stand.gif';
    
    // Check if this image was successfully loaded during preload
    const fullPath = `/ace-attorney/hackthenorth24/${character}/${mappedFilename}`;
    const availableImages = (window as any).availableImages || {};
    
    // If we know this image is unavailable, fallback to stand.gif
    if (availableImages[fullPath] === false && mappedFilename !== 'stand.gif') {
      console.log(`Animation ${fullPath} is unavailable, falling back to stand.gif`);
      return 'stand.gif';
    }
    
    return mappedFilename;
  };
  
  // Get the current character image
  const getCharacterImage = () => {
    if (!currentDialog) return '';
    
    const { character, animation } = currentDialog;
    const isTalking = isTyping || talking;
    const animationFile = getAnimationFilename(character, animation, isTalking);
    
    return `/ace-attorney/hackthenorth24/${character}/${animationFile}`;
  };
  
  // Get courtroom background image
  const getCourtroomBackground = () => {
    return '/ace-attorney/hackthenorth24/judge/background.jpg';
  };
  
  // Get character background image based on speaking character
  const getCharacterBackground = () => {
    if (!currentDialog) return '';
    
    const { character } = currentDialog;
    if (character === Character.PHOENIX) {
      return '/ace-attorney/hackthenorth24/phoenix/background.png';
    } else if (character === Character.EDGEWORTH) {
      return '/ace-attorney/hackthenorth24/edgeworth/background.jpg';
    }
    return '';
  };
  
  // Get the character position style
  const getCharacterPositionStyle = () => {
    if (!currentDialog) return {};
    
    const { character } = currentDialog;
    switch (character) {
      case Character.PHOENIX:
        return {
          position: 'absolute',
          bottom: '150px',
          left: '50px',
          height: '60%',
          zIndex: 20
        };
      case Character.EDGEWORTH:
        return {
          position: 'absolute',
          bottom: '150px',
          right: '50px',
          height: '60%',
          zIndex: 20
        };
      case Character.JUDGE:
      default:
        return {
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '40%',
          zIndex: 20
        };
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden',
      background: 'black',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Courtroom base background - always shown */}
      <div style={{ 
        position: 'absolute',
        inset: 0,
        backgroundColor: '#000033',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        width: '100%',
        height: '100%',
        zIndex: 1
      }} />
      
      {/* Judge background - only shown when Judge is speaking */}
      <div style={{
        position: 'absolute',
        inset: 0,  // Fill entire screen
        width: '100%',
        height: '100%',
        zIndex: 2,
        opacity: currentDialog?.character === Character.JUDGE ? 1 : 0,
        visibility: currentDialog?.character === Character.JUDGE ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease-in-out',
        overflow: 'hidden',
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("/ace-attorney/hackthenorth24/judge/background.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            transform: 'scale(1.01)', // Slight scale to prevent tiny borders
          }}
        />
      </div>

      {/* Defense (Phoenix) background - only shown when Phoenix speaks */}
      <div style={{
        position: 'absolute',
        inset: 0,  // Fill entire screen
        width: '100%',
        height: '100%',
        zIndex: 3,
        opacity: currentDialog?.character === Character.PHOENIX ? 1 : 0,
        visibility: currentDialog?.character === Character.PHOENIX ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease-in-out',
        filter: 'brightness(1.2)',
        overflow: 'hidden',
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("/ace-attorney/hackthenorth24/phoenix/background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            transform: 'scale(1.01)', // Slight scale to prevent tiny borders
          }}
        />
      </div>
      
      {/* Prosecution (Edgeworth) background - only shown when Edgeworth speaks */}
      <div style={{
        position: 'absolute',
        inset: 0,  // Fill entire screen
        width: '100%',
        height: '100%',
        zIndex: 3,
        opacity: currentDialog?.character === Character.EDGEWORTH ? 1 : 0,
        visibility: currentDialog?.character === Character.EDGEWORTH ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease-in-out',
        filter: 'brightness(1.2)',
        overflow: 'hidden',
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("/ace-attorney/hackthenorth24/edgeworth/background.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            transform: 'scale(1.01)', // Slight scale to prevent tiny borders
          }}
        />
      </div>
      
      {/* Character containers - each takes up the full screen */}
      
      {/* Judge character - ALIGNED WITH BOTTOM */}
      <div style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end', /* Align to bottom */
        zIndex: 20,
        opacity: currentDialog?.character === Character.JUDGE ? 1 : 0,
        visibility: currentDialog?.character === Character.JUDGE ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease-in-out'
      }}>
        <img 
          src={`/ace-attorney/hackthenorth24/judge/${
            currentDialog?.character === Character.JUDGE 
              ? getAnimationFilename(Character.JUDGE, currentDialog.animation, isTyping || talking)
              : 'stand.gif'
          }`}
          alt="Judge"
          style={{ 
            position: 'absolute',
            bottom: '0', /* Align to bottom of screen as requested */
            height: '55vh', /* Fixed height that fits well */
            width: 'auto',
            objectFit: 'contain',
            transform: 'translateX(-50%)', /* Center horizontally */
            left: '50%'
          }}
          onError={(e) => {
            console.warn(`Failed to load judge image, using fallback`);
            e.currentTarget.src = '/ace-attorney/hackthenorth24/judge/stand.gif';
          }}
        />
      </div>
      
      {/* Phoenix character - PERFECT SIZE */}
      <div style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        zIndex: 20,
        opacity: currentDialog?.character === Character.PHOENIX ? 1 : 0,
        visibility: currentDialog?.character === Character.PHOENIX ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease-in-out'
      }}>
        <img 
          src={`/ace-attorney/hackthenorth24/phoenix/${
            currentDialog?.character === Character.PHOENIX 
              ? getAnimationFilename(Character.PHOENIX, currentDialog.animation, isTyping || talking)
              : 'stand.gif'
          }`}
          alt="Phoenix Wright"
          style={{ 
            position: 'absolute',
            bottom: '0', /* PERFECTLY aligned with bottom of screen */
            left: '5%',
            height: '80vh', /* Tall enough to fill most of the screen */
            width: 'auto',
            objectFit: 'contain'
          }}
          onError={(e) => {
            console.warn(`Failed to load Phoenix image, using fallback`);
            e.currentTarget.src = '/ace-attorney/hackthenorth24/phoenix/stand.gif';
          }}
        />
      </div>
      
      {/* Edgeworth character - PERFECT SIZE */}
      <div style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        zIndex: 20,
        opacity: currentDialog?.character === Character.EDGEWORTH ? 1 : 0,
        visibility: currentDialog?.character === Character.EDGEWORTH ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease-in-out'
      }}>
        <img 
          src={`/ace-attorney/hackthenorth24/edgeworth/${
            currentDialog?.character === Character.EDGEWORTH 
              ? getAnimationFilename(Character.EDGEWORTH, currentDialog.animation, isTyping || talking)
              : 'stand.gif'
          }`}
          alt="Miles Edgeworth"
          style={{ 
            position: 'absolute',
            bottom: '0', /* PERFECTLY aligned with bottom of screen */
            right: '5%',
            height: '80vh', /* Tall enough to fill most of the screen */
            width: 'auto',
            objectFit: 'contain'
          }}
          onError={(e) => {
            console.warn(`Failed to load Edgeworth image, using fallback`);
            e.currentTarget.src = '/ace-attorney/hackthenorth24/edgeworth/stand.gif';
          }}
        />
      </div>
      
      {/* Objection animation - GIGANTIC SIZE */}
      {objection && (
        <div style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 40
        }}>
          <img 
            src="/ace-attorney/hackthenorth24/objection.gif"
            alt="Objection!"
            style={{ 
              maxWidth: '100%', /* Full width */
              height: '50vh', /* 50% of viewport height */
              objectFit: 'contain',
              transform: 'scale(2.0)' /* Make 2x larger */
            }}
          />
        </div>
      )}
      
      {/* Text box - GIGANTIC SIZE */}
      {currentDialog && (
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            minHeight: '30vh', /* Much taller */
            maxHeight: '35vh', /* Taller max height */
            padding: '20px 30px', /* Much more padding */
            backgroundColor: 'rgba(0, 0, 0, 0.95)', /* More opaque for better contrast */
            borderTop: '6px solid gold', /* Much thicker border */
            zIndex: 50,
            color: 'white',
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={handleDialogClick}
        >
          <div style={{
            fontWeight: 'bold',
            fontSize: '36px', /* MUCH larger font */
            borderBottom: '3px solid rgba(255, 255, 255, 0.5)', /* Thicker border */
            paddingBottom: '10px',
            marginBottom: '15px',
            color: currentDialog.character === Character.PHOENIX ? '#6cb6ff' : 
                  currentDialog.character === Character.EDGEWORTH ? '#ff6c6c' : 
                  '#ffdb6c',
            textShadow: '2px 2px 3px rgba(0,0,0,0.5)' /* Add text shadow for better visibility */
          }}>
            {currentDialog.character === Character.PHOENIX ? 'Phoenix Wright' : 
             currentDialog.character === Character.EDGEWORTH ? 'Miles Edgeworth' : 
             'The Judge'}
          </div>
          <p style={{
            fontSize: '30px', /* MUCH larger font */
            lineHeight: 1.5,
            flex: 1,
            margin: 0,
            overflowY: 'auto',
            letterSpacing: '0.02em', /* Slightly increased for readability */
            paddingRight: '10px',
            fontWeight: '400',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)' /* Add text shadow for better visibility */
          }}>
            {typingText}
            {isTyping && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
          </p>
          
          {!isTyping && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '30px',
              animation: 'bounce 1s infinite',
              fontSize: '32px' /* Larger indicator */
            }}>
              ▼
            </div>
          )}
        </div>
      )}
      
      {/* Input form for player's turn */}
      {showInput && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          padding: 'clamp(0.5rem, 2vh, 1rem)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderTop: '2px solid gold',
          zIndex: 50,
          boxSizing: 'border-box'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Type your response..."
              style={{
                flex: 1,
                padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                borderRadius: '4px',
                border: '1px solid #4a4a4a',
                backgroundColor: '#252525',
                color: 'white',
                fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)',
                minHeight: '44px',
                maxHeight: 'min(60px, 8vh)'
              }}
            />
            <button
              type="submit"
              style={{
                marginLeft: '0.5rem',
                padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1.5rem)',
                backgroundColor: '#aa0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                maxHeight: 'min(60px, 8vh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              TAKE THAT!
            </button>
          </form>
        </div>
      )}
      
      {/* Verdict selection */}
      {gameState === GameState.VERDICT && !currentDialog && !userGuess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 100,
          backdropFilter: 'blur(5px)'
        }}>
          <h2 style={{ 
            color: 'white', 
            marginBottom: 'clamp(1rem, 5vh, 3rem)', 
            fontSize: 'clamp(1.5rem, 5vw, 3rem)',
            textAlign: 'center',
            padding: '0 1rem'
          }}>
            Is the witness a human or an AI?
          </h2>
          <div style={{ 
            display: 'flex', 
            gap: 'clamp(1rem, 3vw, 3rem)',
            flexDirection: window.innerWidth < 600 ? 'column' : 'row',
            width: '100%',
            maxWidth: '600px',
            justifyContent: 'center',
            padding: '0 1rem'
          }}>
            <button
              onClick={() => handleVerdict('human')}
              style={{
                padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 3rem)',
                backgroundColor: '#3366cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: 'clamp(1.25rem, 3vw, 2rem)',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease-in-out',
                transform: 'scale(1)',
                flex: 1,
                minHeight: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              HUMAN
            </button>
            <button
              onClick={() => handleVerdict('AI')}
              style={{
                padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 3rem)',
                backgroundColor: '#cc3366',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: 'clamp(1.25rem, 3vw, 2rem)',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease-in-out',
                transform: 'scale(1)',
                flex: 1,
                minHeight: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              AI
            </button>
          </div>
        </div>
      )}
      
      {/* Control buttons */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        zIndex: 100
      }}>
        {/* Debug button */}
        <button 
          onClick={() => {
            // Display debug info
            console.log('Debug info:');
            console.log('Game state:', gameState);
            console.log('Message count:', messageCount);
            console.log('Current dialog:', currentDialog);
            console.log('Dialog queue:', dialogQueue);
            console.log('Available images:', (window as any).availableImages);
            console.log('Available sounds:', (window as any).availableSounds);
            
            // Force advance if needed
            if (gameState === GameState.INTRO) {
              startQuestioning();
            } else if (gameState === GameState.QUESTIONING) {
              startPlayerTurn();
            } else if (gameState === GameState.PLAYER_TURN) {
              if (!inputValue) {
                setInputValue('I believe this is an AI');
              }
              handleSubmit(new Event('submit') as any);
            } else if (gameState === GameState.AI_TURN) {
              if (messageCount >= 5) {
                startVerdict();
              } else {
                // Advance to next question
                setCurrentDialog(null);
              }
            } else if (gameState === GameState.VERDICT && !userGuess) {
              handleVerdict('AI');
            } else {
              // Just clear current dialog to advance
              setCurrentDialog(null);
            }
            
            // Try to play BGM again if it's not playing
            if (bgmRef.current && bgmRef.current.paused) {
              bgmRef.current.play().catch(err => console.log('Music play failed:', err));
            }
          }}
          style={{
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          DEBUG
        </button>
        
        {/* Exit button */}
        <button 
          onClick={handleExit}
          style={{
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          EXIT COURT
        </button>
      </div>
      
      {/* Debug info - number of messages */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        zIndex: 100
      }}>
        Messages: {messageCount}/5
      </div>
      
      {/* Hidden audio elements for iOS support */}
      <audio id="bgm-player" loop style={{ display: 'none' }} />
      <audio id="sfx-player" style={{ display: 'none' }} />
      
      {/* Global styles */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}