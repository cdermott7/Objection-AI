// @ts-nocheck
// Ace Attorney Animation Utilities

// Character animation states
export enum AnimationState {
  NORMAL = 'normal',
  TALKING = 'talking',
  OBJECTION = 'objection',
  DESK_SLAM = 'desk_slam',
  POINTING = 'pointing',
  THINKING = 'thinking',
  CONFIDENT = 'confident',
  DAMAGED = 'damaged',
  SWEATING = 'sweating'
}

// Character definitions
export enum Character {
  PHOENIX = 'phoenix',
  EDGEWORTH = 'edgeworth',
  JUDGE = 'judge'
}

// Define animation set for each character
interface AnimationSet {
  [AnimationState.NORMAL]: {
    animationFolder: string;
    frameStart: number;
    frameEnd: number;
    loop: boolean;
  };
  [AnimationState.TALKING]: {
    animationFolder: string;
    frameStart: number;
    frameEnd: number;
    loop: boolean;
  };
  [AnimationState.OBJECTION]: {
    animationFolder: string;
    frameStart: number;
    frameEnd: number;
    loop: boolean;
    sound: string;
  };
  [AnimationState.DESK_SLAM]: {
    animationFolder: string;
    frameStart: number;
    frameEnd: number;
    loop: boolean;
    sound: string;
  };
  [AnimationState.POINTING]: {
    animationFolder: string;
    frameStart: number;
    frameEnd: number;
    loop: boolean;
  };
  [key: string]: {
    animationFolder: string;
    frameStart: number;
    frameEnd: number;
    loop: boolean;
    sound?: string;
  };
}

// Animation mapping for Phoenix Wright
const phoenixAnimations: AnimationSet = {
  [AnimationState.NORMAL]: {
    animationFolder: 'Animation_000',
    frameStart: 1,
    frameEnd: 3,
    loop: true
  },
  [AnimationState.TALKING]: {
    animationFolder: 'Animation_001',
    frameStart: 8,
    frameEnd: 13,
    loop: true
  },
  [AnimationState.OBJECTION]: {
    animationFolder: 'Animation_002',
    frameStart: 8,
    frameEnd: 16,
    loop: false,
    sound: 'objection.mp3'
  },
  [AnimationState.DESK_SLAM]: {
    animationFolder: 'Animation_011',
    frameStart: 33,
    frameEnd: 40,
    loop: false,
    sound: 'sfx-deskslam.wav'
  },
  [AnimationState.POINTING]: {
    animationFolder: 'Animation_003',
    frameStart: 17,
    frameEnd: 22,
    loop: true
  },
  [AnimationState.THINKING]: {
    animationFolder: 'Animation_004',
    frameStart: 23,
    frameEnd: 26,
    loop: true
  },
  [AnimationState.CONFIDENT]: {
    animationFolder: 'Animation_005',
    frameStart: 27,
    frameEnd: 32,
    loop: true
  },
  [AnimationState.DAMAGED]: {
    animationFolder: 'Animation_012',
    frameStart: 41,
    frameEnd: 50,
    loop: false,
    sound: 'sfx-damage1.wav'
  },
  [AnimationState.SWEATING]: {
    animationFolder: 'Animation_007',
    frameStart: 27,
    frameEnd: 30,
    loop: true
  }
};

// Animation mapping for Edgeworth
const edgeworthAnimations: AnimationSet = {
  [AnimationState.NORMAL]: {
    animationFolder: 'Animation_000',
    frameStart: 1,
    frameEnd: 3,
    loop: true
  },
  [AnimationState.TALKING]: {
    animationFolder: 'Animation_001',
    frameStart: 8,
    frameEnd: 13,
    loop: true
  },
  [AnimationState.OBJECTION]: {
    animationFolder: 'Animation_002',
    frameStart: 8,
    frameEnd: 16,
    loop: false,
    sound: 'hold-it.mp3'
  },
  [AnimationState.DESK_SLAM]: {
    animationFolder: 'Animation_003',
    frameStart: 33,
    frameEnd: 40,
    loop: false,
    sound: 'sfx-deskslam.wav'
  },
  [AnimationState.POINTING]: {
    animationFolder: 'Animation_004',
    frameStart: 8,
    frameEnd: 15,
    loop: true
  },
  [AnimationState.THINKING]: {
    animationFolder: 'Animation_005',
    frameStart: 23,
    frameEnd: 26,
    loop: true
  },
  [AnimationState.CONFIDENT]: {
    animationFolder: 'Animation_006',
    frameStart: 27,
    frameEnd: 32,
    loop: true
  },
  [AnimationState.DAMAGED]: {
    animationFolder: 'Animation_032',
    frameStart: 93,
    frameEnd: 95,
    loop: false,
    sound: 'sfx-damage1.wav'
  },
  [AnimationState.SWEATING]: {
    animationFolder: 'Animation_033',
    frameStart: 96,
    frameEnd: 100,
    loop: true
  }
};

// Animation mapping for Judge
const judgeAnimations: AnimationSet = {
  [AnimationState.NORMAL]: {
    animationFolder: 'Animation_000',
    frameStart: 1,
    frameEnd: 3,
    loop: true
  },
  [AnimationState.TALKING]: {
    animationFolder: 'Animation_001',
    frameStart: 4,
    frameEnd: 7,
    loop: true
  },
  [AnimationState.OBJECTION]: {
    animationFolder: 'Animation_002',
    frameStart: 8,
    frameEnd: 11,
    loop: false,
    sound: 'sfx-blink.wav'
  },
  [AnimationState.DESK_SLAM]: {
    animationFolder: 'Animation_003',
    frameStart: 12,
    frameEnd: 15,
    loop: false,
    sound: 'sfx-gallery.wav'
  },
  [AnimationState.POINTING]: {
    animationFolder: 'Animation_004',
    frameStart: 16,
    frameEnd: 19,
    loop: false
  },
  [AnimationState.THINKING]: {
    animationFolder: 'Animation_005',
    frameStart: 20,
    frameEnd: 23,
    loop: true
  },
  [AnimationState.CONFIDENT]: {
    animationFolder: 'Animation_006',
    frameStart: 24,
    frameEnd: 27,
    loop: true
  },
  [AnimationState.DAMAGED]: {
    animationFolder: 'Animation_007',
    frameStart: 28,
    frameEnd: 31,
    loop: false,
    sound: 'sfx-damage1.wav'
  },
  [AnimationState.SWEATING]: {
    animationFolder: 'Animation_008',
    frameStart: 32,
    frameEnd: 35,
    loop: true
  }
};

// Main animation mapping
export const animations = {
  [Character.PHOENIX]: phoenixAnimations,
  [Character.EDGEWORTH]: edgeworthAnimations,
  [Character.JUDGE]: judgeAnimations
};

// Helper function to get frame path for a specific character animation
export const getFramePath = (
  character: Character,
  state: AnimationState,
  frameIndex: number
): string => {
  const characterMap = animations[character];
  const animation = characterMap[state];
  
  if (!animation) {
    console.warn(`Animation state ${state} not found for character ${character}`);
    return '';
  }
  
  // Calculate the actual frame number within the animation's range
  const totalFrames = animation.frameEnd - animation.frameStart + 1;
  let frameNumber;
  
  if (animation.loop) {
    // For looping animations, wrap around the frame index
    frameNumber = animation.frameStart + (frameIndex % totalFrames);
  } else {
    // For non-looping animations, stop at the last frame
    frameNumber = Math.min(animation.frameStart + frameIndex, animation.frameEnd);
  }
  
  // Format the frame number with leading zeros (Frame_0001.gif)
  const paddedFrameNumber = String(frameNumber).padStart(4, '0');
  
  // Construct the path to the frame
  return `/ace-attorney/tmp/${character}/${character}/${animation.animationFolder}/Frame_${paddedFrameNumber}.gif`;
};

// Helper function to get sound for a specific character animation
export const getAnimationSound = (character: Character, state: AnimationState): string | null => {
  const characterMap = animations[character];
  const animation = characterMap[state];
  
  if (!animation || !animation.sound) {
    return null;
  }
  
  return animation.sound;
};

// Animation timing constants
export const FRAME_DURATION = 100; // milliseconds per frame
export const TEXT_SPEED = 50; // milliseconds per character for text typing