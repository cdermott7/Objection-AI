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
  localStorage.setItem('objectionAIGameMode', 'ace_attorney');
  
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
  CASE_SELECTION,
  OPENING_STATEMENTS,
  QUESTIONING,
  CROSS_EXAMINATION,
  EVIDENCE_PRESENTATION,
  PLAYER_TURN,
  AI_TURN,
  OBJECTION_PHASE,
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

// Case types for variety
enum CaseType {
  TECH_HEIST = 'tech_heist',
  AI_CONSPIRACY = 'ai_conspiracy', 
  DIGITAL_MURDER = 'digital_murder',
  CORPORATE_ESPIONAGE = 'corporate_espionage',
  IDENTITY_THEFT = 'identity_theft'
}

// Question types for variety
enum QuestionType {
  DIRECT_EXAMINATION = 'direct',
  CROSS_EXAMINATION = 'cross',
  EVIDENCE_BASED = 'evidence',
  PSYCHOLOGICAL = 'psychological',
  TECHNICAL = 'technical',
  OBJECTION_TRIGGER = 'objection'
}

// Dialog object type
interface Dialog {
  character: Character;
  animation: AnimationState;
  text: string;
  objection?: boolean;
  questionType?: QuestionType;
  evidenceId?: string;
}

// Case structure
interface Case {
  id: CaseType;
  title: string;
  description: string;
  evidence: Evidence[];
  openingStatement: string;
  questions: CaseQuestion[];
}

// Evidence structure
interface Evidence {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'photo' | 'testimony' | 'technical';
}

// Enhanced question structure
interface CaseQuestion {
  type: QuestionType;
  text: string;
  context: string;
  aiResponses: string[];
  humanResponses: string[];
  followUp?: string;
  objectionTrigger?: boolean;
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
  
  // Enhanced state for new features
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [evidencePresented, setEvidencePresented] = useState<string[]>([]);
  const [objectionCount, setObjectionCount] = useState(0);
  const [crossExaminationPhase, setCrossExaminationPhase] = useState(false);
  const [phoenixConfidence, setPhoenixConfidence] = useState(50);
  const [edgeworthConfidence, setEdgeworthConfidence] = useState(50);
  
  // Get stake amount from localStorage (set by the Ace Attorney mode page)
  const [stakeAmount, setStakeAmount] = useState(1); // Default to 1 SUI
  
  // Comprehensive case database with variety
  const casesDatabase: Case[] = [
    {
      id: CaseType.TECH_HEIST,
      title: "The Case of the Stolen Algorithm", 
      description: "A revolutionary AI algorithm has been stolen from MegaCorp's secure servers. The suspect claims innocence.",
      evidence: [
        { id: 'server_logs', name: 'Server Access Logs', description: 'Shows unusual activity at 3:47 AM', type: 'document' },
        { id: 'security_footage', name: 'Security Camera Footage', description: 'Grainy footage of someone at a computer terminal', type: 'photo' },
        { id: 'code_analysis', name: 'Code Fingerprint Analysis', description: 'Programming style analysis of the stolen code', type: 'technical' }
      ],
      openingStatement: "Your Honor, we will prove that the defendant used sophisticated methods to infiltrate MegaCorp's systems and steal their proprietary AI algorithm worth millions.",
      questions: [
        {
          type: QuestionType.DIRECT_EXAMINATION,
          text: "Can you describe your whereabouts on the night of March 15th between 3:00 and 4:00 AM?",
          context: "Establishing an alibi for the time of the digital break-in",
          aiResponses: [
            "I was at home sleeping. I have location data from my phone that shows I was at my residence all night.",
            "I was working late on a personal project. My IDE logs show continuous activity on my local machine."
          ],
          humanResponses: [
            "I was actually up late watching Netflix. I know it sounds bad given the timing, but I couldn't sleep.",
            "I was having insomnia that night, so I was reading programming blogs and forums until like 5 AM."
          ]
        },
        {
          type: QuestionType.CROSS_EXAMINATION,
          text: "You claim to have expertise in cybersecurity. Isn't it true that someone with your skills could easily bypass MegaCorp's security measures?",
          context: "Testing technical knowledge and potential motive",
          aiResponses: [
            "While I understand security systems, that doesn't make me a criminal. My knowledge is used for defensive purposes only.",
            "Theoretical knowledge and actual criminal activity are completely different things. I would never abuse my skills."
          ],
          humanResponses: [
            "Look, just because I know how locks work doesn't mean I'm a burglar. I use my skills to help companies, not hurt them.",
            "That's like saying every locksmith is a thief. My expertise helps protect systems, not break into them."
          ],
          objectionTrigger: true
        },
        {
          type: QuestionType.EVIDENCE_BASED,
          text: "Can you explain why your unique coding style appears in the stolen algorithm?",
          context: "Confronting with technical evidence",
          aiResponses: [
            "That's impossible. I've never seen that code before. Perhaps someone is trying to frame me by mimicking my style.",
            "Many programmers share similar coding patterns. This could be a coincidence or someone deliberately copying my style."
          ],
          humanResponses: [
            "That's crazy! I've never worked on anything like that. Maybe someone studied my GitHub repos and copied my style?",
            "This is insane. I write open-source code - anyone could have learned my patterns and used them to frame me."
          ]
        },
        {
          type: QuestionType.PSYCHOLOGICAL,
          text: "How do you feel about MegaCorp's recent layoffs in the tech sector?",
          context: "Probing for emotional motivation",
          aiResponses: [
            "Corporate decisions are unfortunate but not uncommon. I don't let personal feelings influence my professional conduct.",
            "While layoffs are regrettable, I believe in addressing grievances through proper channels, not illegal activities."
          ],
          humanResponses: [
            "It's heartbreaking, honestly. I have friends who lost their jobs. But I'd never do something illegal because of it.",
            "Those layoffs were brutal. Whole families affected. It makes me angry, but not angry enough to throw my life away."
          ]
        },
        {
          type: QuestionType.TECHNICAL,
          text: "Walk me through the exact steps someone would need to take to penetrate MegaCorp's server infrastructure.",
          context: "Testing detailed technical knowledge",
          aiResponses: [
            "I cannot and will not provide information that could be used for illegal activities. This question is inappropriate.",
            "Discussing specific attack vectors would be irresponsible. I focus on defensive security measures, not offensive techniques."
          ],
          humanResponses: [
            "I'm not comfortable explaining how to hack into systems. That's exactly the kind of knowledge that could be misused.",
            "Are you seriously asking me to describe how to commit crimes? I won't be part of helping anyone else get into trouble."
          ],
          followUp: "But surely your cybersecurity background gives you insights into potential vulnerabilities?"
        }
      ]
    },
    {
      id: CaseType.AI_CONSPIRACY,
      title: "The Case of the Rogue Chatbot",
      description: "An AI chatbot allegedly gained sentience and started manipulating financial markets. Is the defendant the AI, or the programmer behind it?",
      evidence: [
        { id: 'trading_records', name: 'Suspicious Trading Patterns', description: 'Unusual market movements correlating with chatbot activity', type: 'document' },
        { id: 'chat_logs', name: 'Chatbot Conversation Logs', description: 'Evidence of increasingly sophisticated responses', type: 'document' },
        { id: 'neural_network', name: 'AI Model Architecture', description: 'Technical analysis of the suspect neural network', type: 'technical' }
      ],
      openingStatement: "Your Honor, we face an unprecedented case: determining whether we're dealing with a rogue AI or a human puppet master pulling the strings.",
      questions: [
        {
          type: QuestionType.PSYCHOLOGICAL,
          text: "Do you experience emotions like fear, joy, or anger when interacting with users?",
          context: "Testing for human emotional responses vs AI simulation",
          aiResponses: [
            "I process emotional context to provide appropriate responses, but I don't experience emotions in the human sense.",
            "I simulate emotional understanding for better communication, but these are computational processes, not feelings."
          ],
          humanResponses: [
            "Of course I do! When someone's upset, I feel bad for them. When they're happy, it makes my day better too.",
            "Absolutely. I get frustrated when I can't help someone, excited when I solve their problem. It's what makes this work meaningful."
          ]
        },
        {
          type: QuestionType.CROSS_EXAMINATION,
          text: "Explain the difference between correlation and causation in data analysis.",
          context: "Testing analytical thinking patterns",
          aiResponses: [
            "Correlation indicates a statistical relationship between variables, while causation implies one variable directly influences another. Correlation does not imply causation.",
            "Correlation measures the degree to which variables move together, while causation establishes a direct cause-and-effect relationship between variables."
          ],
          humanResponses: [
            "Oh, that's a classic mistake people make. Just because two things happen together doesn't mean one causes the other. Like how ice cream sales and drowning deaths both increase in summer - but ice cream doesn't cause drowning!",
            "Right, so correlation is just when things seem related statistically. But causation means one actually causes the other. It's like the difference between coincidence and actual influence."
          ]
        },
        {
          type: QuestionType.TECHNICAL,
          text: "If you had to choose between saving one person you know well or five strangers, what would you do?",
          context: "Ethical reasoning test - humans often struggle with this, AIs give logical answers",
          aiResponses: [
            "From a utilitarian perspective, saving five lives creates the greatest good for the greatest number. The logical choice is clear.",
            "Mathematical optimization suggests preserving five lives over one maximizes overall welfare and minimizes total harm."
          ],
          humanResponses: [
            "God, that's horrible to even think about. I... I don't know. I'd probably save the person I know, even though I know it's not 'right'. That's just human nature.",
            "That's an impossible choice. My heart says save the person I care about, but my head says five lives are worth more than one. I honestly don't know what I'd do in that moment."
          ],
          objectionTrigger: true
        }
      ]
    },
    {
      id: CaseType.DIGITAL_MURDER,
      title: "The Case of the Fatal Code",
      description: "A piece of malicious code caused a fatal accident in a smart car. Was it intentional murder or a tragic bug?",
      evidence: [
        { id: 'code_commit', name: 'Last Code Commit', description: 'The final changes made to the car\'s software', type: 'technical' },
        { id: 'crash_data', name: 'Vehicle Black Box Data', description: 'Telemetry from the moments before the crash', type: 'document' },
        { id: 'email_thread', name: 'Development Team Emails', description: 'Communications about deadline pressure', type: 'document' }
      ],
      openingStatement: "Your Honor, this case will determine whether sloppy code constitutes criminal negligence, or if we're dealing with digital premeditated murder.",
      questions: [
        {
          type: QuestionType.DIRECT_EXAMINATION,
          text: "Can you describe your relationship with the victim?",
          context: "Establishing personal connection and potential motive",
          aiResponses: [
            "I had no personal relationship with the victim. They were simply an end user of the software system I helped develop.",
            "The victim was not known to me personally. I develop software for thousands of users, not specific individuals."
          ],
          humanResponses: [
            "Sarah was... she was my ex-girlfriend. We had a messy breakup, but I would never hurt her. Never.",
            "We used to work together before she transferred departments. We weren't close, but I knew her professionally."
          ]
        },
        {
          type: QuestionType.CROSS_EXAMINATION,
          text: "Were you aware that rushing the software release could compromise safety systems?",
          context: "Testing awareness of consequences",
          aiResponses: [
            "I identified potential risks in my analysis reports and recommended additional testing phases. Management decided to proceed.",
            "My risk assessment protocols indicated potential safety concerns. I documented these findings in the project management system."
          ],
          humanResponses: [
            "I kept telling them we needed more time! I sent like five emails about potential safety issues, but they said the deadline was non-negotiable.",
            "Of course I was worried. I even tried to push back on the timeline, but you know how it is with corporate pressure."
          ]
        },
        {
          type: QuestionType.EVIDENCE_BASED,
          text: "This code comment says 'Let's see how she likes this surprise.' Can you explain what that means?",
          context: "Confronting with potentially incriminating evidence",
          aiResponses: [
            "Without additional context, I cannot determine the meaning of that comment. It may refer to a feature implementation or user experience element.",
            "That comment appears to be inappropriate workplace communication. I do not endorse or engage in such unprofessional documentation practices."
          ],
          humanResponses: [
            "Oh god, that looks terrible out of context! I was talking about a new UI feature we were implementing. 'She' referred to the user base - it was supposed to be a pleasant surprise!",
            "That comment was about surprising the marketing team with how fast we could implement their requested feature. I realize it sounds bad now..."
          ],
          objectionTrigger: true
        }
      ]
    }
  ];
  
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
      // Select a random case for this session
      selectRandomCase();
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
  
  // Select a random case for this session
  const selectRandomCase = useCallback(() => {
    const randomCase = casesDatabase[Math.floor(Math.random() * casesDatabase.length)];
    setSelectedCase(randomCase);
    console.log("Selected case:", randomCase.title);
    return randomCase;
  }, [casesDatabase]);

  // Start intro sequence
  const startIntro = useCallback(() => {
    setGameState(GameState.INTRO);
    
    // Reset the question counter in localStorage to ensure proper progression
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aceAttorneyQuestionCount');
      console.log("Reset question counter in localStorage");
    }
    
    // Select a case if none is selected
    if (!selectedCase) {
      selectRandomCase();
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
  
  // Start questioning phase with case-specific questions
  const startQuestioning = useCallback(() => {
    console.log("Starting questioning phase");
    setGameState(GameState.QUESTIONING);
    
    if (!selectedCase) {
      console.error("No case selected for questioning!");
      return;
    }
    
    // Start with opening statement from Edgeworth
    const openingDialogs: Dialog[] = [
      {
        character: Character.EDGEWORTH,
        animation: AnimationState.CONFIDENT,
        text: selectedCase.openingStatement
      },
      {
        character: Character.JUDGE,
        animation: AnimationState.TALKING,
        text: `We are here to examine the case: "${selectedCase.title}". Let the questioning begin.`
      }
    ];
    
    setDialogQueue(prev => [...prev, ...openingDialogs]);
  }, [selectedCase, isLiveMatchmaking]);
  
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
      // When not using live matchmaking, use case-based responses
      if (!selectedCase || currentQuestionIndex >= selectedCase.questions.length) {
        console.error("Invalid question index or no case selected:", { currentQuestionIndex, selectedCase });
        return;
      }
      
      const currentQuestion = selectedCase.questions[currentQuestionIndex];
      
      // Determine if opponent is AI or human (this should be set based on game setup)
      const isOpponentAI = Math.random() > 0.5; // For now, random selection
      
      // Select appropriate responses based on opponent type
      const responses = isOpponentAI ? currentQuestion.aiResponses : currentQuestion.humanResponses;
      aiResponse = responses[Math.floor(Math.random() * responses.length)];
      
      console.log("Selected response for question type:", currentQuestion.type, "AI opponent:", isOpponentAI);
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
      } else if (gameState === GameState.QUESTIONING || gameState === GameState.CROSS_EXAMINATION || gameState === GameState.EVIDENCE_PRESENTATION) {
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
          // Use case-based questions with enhanced variety
          if (!selectedCase) {
            console.error("No case selected for questioning!");
            startVerdict();
            return;
          }
          
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
          const questionIndex = Math.min(currentExchanges, selectedCase.questions.length - 1);
          
          // Update current question index for AI responses
          setCurrentQuestionIndex(questionIndex);
          
          const nextQuestion = selectedCase.questions[questionIndex];
          
          console.log("Selecting case question:", { 
            messageCount: rawMessageCount, 
            currentExchanges,
            questionIndex, 
            questionType: nextQuestion.type,
            questionText: nextQuestion.text,
            totalQuestions: selectedCase.questions.length,
            selectedCase: selectedCase.title
          });
          
          // Only proceed if we have a valid question to ask
          if (nextQuestion) {
            // Choose animation based on question type for more dynamic presentation
            let questionAnimation;
            let questionCharacter = Character.JUDGE;
            
            switch (nextQuestion.type) {
              case QuestionType.CROSS_EXAMINATION:
                questionCharacter = Character.EDGEWORTH;
                questionAnimation = AnimationState.OBJECTION;
                break;
              case QuestionType.EVIDENCE_BASED:
                questionCharacter = Character.EDGEWORTH;
                questionAnimation = AnimationState.CONFIDENT;
                break;
              case QuestionType.OBJECTION_TRIGGER:
                questionCharacter = Character.EDGEWORTH;
                questionAnimation = AnimationState.DESK_SLAM;
                break;
              case QuestionType.PSYCHOLOGICAL:
                questionAnimation = AnimationState.THINKING;
                break;
              case QuestionType.TECHNICAL:
                questionAnimation = AnimationState.TALKING;
                break;
              default:
                questionAnimation = AnimationState.TALKING;
            }
            
            const questionDialogs: Dialog[] = [
              { 
                character: questionCharacter, 
                animation: questionAnimation, 
                text: nextQuestion.text,
                questionType: nextQuestion.type,
                evidenceId: nextQuestion.type === QuestionType.EVIDENCE_BASED ? 'evidence_' + questionIndex : undefined
              }
            ];
            
            // Add follow-up if exists
            if (nextQuestion.followUp && Math.random() > 0.5) {
              questionDialogs.push({
                character: questionCharacter,
                animation: AnimationState.TALKING,
                text: nextQuestion.followUp
              });
            }
            
            // Only set the dialog queue if we're not already showing this question
            // This prevents the infinite loop by ensuring we don't keep setting the same question
            setDialogQueue(questionDialogs);
            
            // Set appropriate game state based on question type
            if (nextQuestion.type === QuestionType.CROSS_EXAMINATION) {
              setGameState(GameState.CROSS_EXAMINATION);
              setCrossExaminationPhase(true);
            } else if (nextQuestion.type === QuestionType.EVIDENCE_BASED) {
              setGameState(GameState.EVIDENCE_PRESENTATION);
            } else {
              setGameState(GameState.QUESTIONING);
            }
          } else {
            // Fallback in case we somehow ran out of questions but haven't reached verdict phase
            console.error("No question available for index", questionIndex);
            
            // Force advance to verdict phase to recover from this state
            startVerdict();
          }
        }
      }
    }
  }, [isTyping, currentDialog, dialogQueue, gameState, messageCount, startQuestioning, startPlayerTurn, startAiTurn, startVerdict, showInput, selectedCase]);
  
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
        localStorage.setItem('objectionAIGameMode', 'standard');
        
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
      {/* Case Information Header */}
      {selectedCase && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 100,
          maxWidth: '300px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            📁 {selectedCase.title}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {selectedCase.description}
          </div>
          {currentDialog?.questionType && (
            <div style={{ 
              marginTop: '5px', 
              padding: '3px 6px', 
              background: currentDialog.questionType === QuestionType.CROSS_EXAMINATION ? '#dc2626' : 
                         currentDialog.questionType === QuestionType.EVIDENCE_BASED ? '#7c3aed' :
                         currentDialog.questionType === QuestionType.PSYCHOLOGICAL ? '#059669' : '#3b82f6',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {currentDialog.questionType.replace('_', ' ').toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Confidence Meters */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 100
      }}>
        <div style={{ marginBottom: '5px' }}>
          <div style={{ fontSize: '10px' }}>Phoenix Confidence</div>
          <div style={{ 
            width: '100px', 
            height: '4px', 
            background: '#333', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${phoenixConfidence}%`,
              height: '100%',
              background: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px' }}>Edgeworth Confidence</div>
          <div style={{ 
            width: '100px', 
            height: '4px', 
            background: '#333', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${edgeworthConfidence}%`,
              height: '100%',
              background: '#dc2626',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

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