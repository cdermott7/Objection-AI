// Ace Attorney asset management
import { Character, AnimationState } from './aceAttorneyAnimations';

// Base path for all Ace Attorney assets
const BASE_PATH = '/ace-attorney';

// Character sprite paths
export const getCharacterSpritePath = (character: Character, state: AnimationState, frame = 0): string => {
  // Use a simplified approach with common assets
  const characterFolder = character.toLowerCase();
  const stateFolder = state.toLowerCase().replace('_', '-');
  
  // Use numbered frames (many sprite sheets use frame numbers)
  const frameNumber = frame % 4; // Limit to 4 frames per animation
  
  return `${BASE_PATH}/sprites/${characterFolder}/${stateFolder}_${frameNumber}.png`;
};

// Character animation paths
export const getCharacterAnimationPath = (character: Character, state: AnimationState): string => {
  const characterFolder = character.toLowerCase();
  const stateFolder = state.toLowerCase().replace('_', '-');
  
  return `${BASE_PATH}/sprites/${characterFolder}/${stateFolder}.gif`;
};

// Background paths
export const getBackgroundPath = (location: string): string => {
  return `${BASE_PATH}/backgrounds/${location}.jpg`;
};

// Sound effect paths
export const getSoundPath = (sound: string): string => {
  return `${BASE_PATH}/sounds/${sound}.mp3`;
};

// Objection graphics
export const getObjectionPath = (type: 'objection' | 'holdit' | 'takethat'): string => {
  return `${BASE_PATH}/objections/${type}.gif`;
};

// Character name display
export const getCharacterName = (character: Character): string => {
  switch (character) {
    case Character.PHOENIX:
      return 'Phoenix Wright';
    case Character.EDGEWORTH:
      return 'Miles Edgeworth';
    case Character.JUDGE:
      return 'The Judge';
    default:
      return 'Unknown';
  }
};

// Character position in courtroom
export const getCharacterPosition = (character: Character): string => {
  switch (character) {
    case Character.PHOENIX:
      return 'defense';
    case Character.EDGEWORTH:
      return 'prosecution';
    case Character.JUDGE:
      return 'judge';
    default:
      return 'center';
  }
};

// Character color theme
export const getCharacterTheme = (character: Character): string => {
  switch (character) {
    case Character.PHOENIX:
      return 'blue';
    case Character.EDGEWORTH:
      return 'red';
    case Character.JUDGE:
      return 'brown';
    default:
      return 'gray';
  }
};

// Character animation state based on dialogue context
export const getContextualAnimationState = (character: Character, message: string): AnimationState => {
  // Simple pattern matching for animation selection
  const msg = message.toLowerCase();
  
  // Keywords that trigger specific animations
  if (msg.includes('objection') || msg.includes('protest')) {
    return AnimationState.OBJECTION;
  }
  
  if (msg.includes('evidence') || msg.includes('proof') || msg.includes('present')) {
    return AnimationState.POINTING;
  }
  
  if (msg.includes('think') || msg.includes('consider') || msg.includes('perhaps')) {
    return AnimationState.THINKING;
  }
  
  if (msg.includes('slam') || msg.includes('bang') || msg.includes('hit')) {
    return AnimationState.DESK_SLAM;
  }
  
  if (msg.includes('confident') || msg.includes('certain') || msg.includes('sure')) {
    return AnimationState.CONFIDENT;
  }
  
  if (msg.includes('what') || msg.includes('how') || msg.includes('why') || msg.includes('?')) {
    return AnimationState.SWEATING;
  }
  
  // Default to talking animation
  return AnimationState.TALKING;
};

// Simple asset preloading
export const preloadAssets = () => {
  if (typeof window === 'undefined') return;
  
  // Characters to preload
  const characters = [Character.PHOENIX, Character.EDGEWORTH, Character.JUDGE];
  
  // States to preload
  const states = [
    AnimationState.NORMAL, 
    AnimationState.TALKING,
    AnimationState.OBJECTION,
    AnimationState.DESK_SLAM,
    AnimationState.POINTING
  ];
  
  // Preload character sprites
  characters.forEach(character => {
    states.forEach(state => {
      const img = new Image();
      img.src = getCharacterAnimationPath(character, state);
    });
  });
  
  // Preload backgrounds
  ['courtroom', 'judge-bench', 'defense-bench', 'prosecution-bench'].forEach(bg => {
    const img = new Image();
    img.src = getBackgroundPath(bg);
  });
  
  // Preload objections
  ['objection', 'holdit', 'takethat'].forEach(obj => {
    const img = new Image();
    img.src = getObjectionPath(obj as any);
  });
};

// Fallback asset paths if the primary assets aren't available
export const getFallbackAssetPath = (character: Character): string => {
  switch (character) {
    case Character.PHOENIX:
      return `${BASE_PATH}/phoenix.png`;
    case Character.EDGEWORTH:
      return `${BASE_PATH}/prosecutor.png`;
    case Character.JUDGE:
      return `${BASE_PATH}/judge.png`;
    default:
      return `${BASE_PATH}/default.png`;
  }
};