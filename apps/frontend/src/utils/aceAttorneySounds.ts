// Ace Attorney sound effects utility
// 
// IMPORTANT: This module requires actual sound files to work properly.
// You need to add the following sound files to the /public/ace-attorney/sounds/ directory:
// - objection.mp3: Phoenix Wright's objection sound
// - hold-it.mp3: Prosecutor's "Hold it!" sound
// - take-that.mp3: "Take that!" sound effect
// - court-ambience.mp3: Courtroom ambience/background noise
// - text-bleep.mp3: Text display sound effect
// - guilty.mp3: End of trial sound effect
// - not-guilty.mp3: Alternate end sound effect
//
// See the README.md in the /public/ace-attorney/ directory for more information
// on how to obtain or create these sound assets.

// List of available sound effects
export enum SoundEffect {
  OBJECTION = 'phoenix-objection',
  HOLD_IT = 'hold-it',
  TAKE_THAT = 'take-that',
  COURT_AMBIENCE = 'bgm',
  TEXT_BLEEP = 'text-bleep',
  GUILTY = 'judgeno',
  NOT_GUILTY = 'judgeyes',
  GAVEL = 'gavel',
  THINKING = 'thinking',
  INTRO1 = 'intro1',
  INTRO2 = 'intro2',
  INTRO3 = 'intro3',
}

// Cache for preloaded audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

// Preload sound effects for better performance
export const preloadSounds = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Create audio elements for each sound
  Object.values(SoundEffect).forEach(effect => {
    try {
      const audio = new Audio(`/ace-attorney/sounds/${effect}.mp3`);
      audio.preload = 'auto';
      audioCache[effect] = audio;
    } catch (error) {
      console.warn(`Failed to preload sound effect: ${effect}`, error);
    }
  });
};

// Play a sound effect
export const playSound = (effect: SoundEffect | string, volume = 1.0) => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    // Check if we're in development mode to show friendly warnings
    const isDev = process.env.NODE_ENV === 'development';
    
    // If we have a cached audio element, use it
    if (audioCache[effect]) {
      audioCache[effect].currentTime = 0;
      audioCache[effect].volume = volume;
      audioCache[effect].play().catch(error => {
        // Only show detailed warnings in development
        if (isDev) {
          console.warn(`Failed to play sound effect: ${effect}.`, error);
        }
      });
      return;
    }
    
        // Try multiple paths for sounds - prioritize hackthenorth24 directory
    const soundPaths = [
      `/ace-attorney/hackthenorth24/${effect}.mp3`,
      `/ace-attorney/hackthenorth24/phoenix/${effect}.mp3`,
      `/ace-attorney/hackthenorth24/edgeworth/${effect}.mp3`,
      `/ace-attorney/hackthenorth24/judge/${effect}.mp3`,
      `/ace-attorney/sounds/${effect}.mp3`,
      // Add additional backup paths here
      'https://objection.lol/Audio/bloop.mp3', // Fallback for text-bleep
    ];
    
    // Function to try the next path
    const tryPath = (index: number) => {
      if (index >= soundPaths.length) {
        // We've tried all paths, silently fail
        return;
      }
      
      const currentPath = soundPaths[index];
      
      // Try to create and play the audio
      const audio = new Audio(currentPath);
      audio.volume = volume;
      
      audio.oncanplaythrough = () => {
        // Successfully loaded, play it
        audio.play().catch(error => {
          if (isDev) {
            console.warn(`Sound loaded but failed to play: ${effect} (${currentPath})`, error);
          }
          // Try next path on error
          tryPath(index + 1);
        });
        
        // Cache for future use
        audioCache[effect] = audio;
      };
      
      audio.onerror = () => {
        // Failed to load this path, try the next one
        if (isDev) {
          console.warn(`Sound file not found: ${currentPath}, trying next option.`);
        }
        tryPath(index + 1);
      };
    };
    
    // Start trying paths
    tryPath(0);
  } catch (error) {
    // Suppress errors in production to avoid breaking the UI
    if (isDev) {
      console.warn(`Error playing sound effect: ${effect}`, error);
    }
  }
};

// Stop a playing sound effect
export const stopSound = (effect: SoundEffect) => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    if (audioCache[effect]) {
      audioCache[effect].pause();
      audioCache[effect].currentTime = 0;
    }
  } catch (error) {
    console.warn(`Error stopping sound effect: ${effect}`, error);
  }
};

// Play the court ambient sound on a loop with reduced volume
export const startCourtAmbience = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    const ambienceSound = SoundEffect.COURT_AMBIENCE; // 'bgm'
    const isDev = process.env.NODE_ENV === 'development';
    
    // If already cached, use it
    if (audioCache[ambienceSound]) {
      audioCache[ambienceSound].loop = true;
      audioCache[ambienceSound].volume = 0.2; // Lower volume for better experience
      audioCache[ambienceSound].play().catch(error => {
        // Only show detailed warnings in development
        if (isDev) {
          console.warn(`Failed to play court ambience.`, error);
        }
      });
      return;
    }
    
    // Try multiple paths for the ambience sound - prioritize hackthenorth24 directory
    const ambiencePaths = [
      `/ace-attorney/hackthenorth24/${ambienceSound}.mp3`,
      `/ace-attorney/sounds/${ambienceSound}.mp3`,
      // Backup paths if needed
      'https://objection.lol/Audio/takethat.mp3', // Last resort fallback
    ];
    
    // Function to try the next path
    const tryPath = (index: number) => {
      if (index >= ambiencePaths.length) {
        // We've tried all paths, create a silent audio as fallback
        if (isDev) {
          console.warn(`Court ambience sound not available from any path. Creating silent audio.`);
        }
        const silentAudio = new Audio();
        silentAudio.volume = 0;
        audioCache[ambienceSound] = silentAudio;
        return;
      }
      
      const currentPath = ambiencePaths[index];
      
      // Try to create and play the audio
      const audio = new Audio(currentPath);
      audio.loop = true;
      audio.volume = 0.2; // Lower volume for background sound
      
      audio.oncanplaythrough = () => {
        // Successfully loaded, play it
        audio.play().catch(error => {
          if (isDev) {
            console.warn(`Ambience loaded but failed to play (${currentPath})`, error);
          }
          // Try next path on error
          tryPath(index + 1);
        });
        
        // Cache for future use
        audioCache[ambienceSound] = audio;
      };
      
      audio.onerror = () => {
        // Failed to load this path, try the next one
        if (isDev) {
          console.warn(`Ambience file not found: ${currentPath}, trying next option.`);
        }
        tryPath(index + 1);
      };
    };
    
    // Start trying paths
    tryPath(0);
  } catch (error) {
    // Suppress errors in production to avoid breaking the UI
    if (isDev) {
      console.warn(`Error starting court ambience`, error);
    }
  }
};

// Stop the court ambient sound
export const stopCourtAmbience = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    const ambienceSound = SoundEffect.COURT_AMBIENCE;
    if (audioCache[ambienceSound]) {
      audioCache[ambienceSound].pause();
      audioCache[ambienceSound].currentTime = 0;
    }
  } catch (error) {
    console.warn(`Error stopping court ambience`, error);
  }
};

// Initialize sound system - call this once at app startup
export const initSounds = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Create sounds directory
  preloadSounds();
  
  // Clean up function to stop all sounds
  return () => {
    Object.values(SoundEffect).forEach(effect => {
      try {
        if (audioCache[effect]) {
          audioCache[effect].pause();
          audioCache[effect].currentTime = 0;
        }
      } catch (error) {
        console.warn(`Error cleaning up sound effect: ${effect}`, error);
      }
    });
  };
};