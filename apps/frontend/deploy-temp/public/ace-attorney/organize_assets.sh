#!/bin/bash

# This script organizes the extracted Ace Attorney assets into a more usable structure

echo "Organizing Ace Attorney assets..."

# Create directories for organized assets
mkdir -p organized/phoenix
mkdir -p organized/edgeworth
mkdir -p organized/judge
mkdir -p organized/sounds
mkdir -p organized/ui

# Copy sound effects with clearer names
cp "tmp/sfx_general/sfx general/sfx-bleep.wav" organized/sounds/text-bleep.mp3
cp "tmp/sfx_general/sfx general/sfx-deskslam.wav" organized/sounds/desk-slam.mp3
cp "tmp/sfx_general/sfx general/sfx-damage1.wav" organized/sounds/damage.mp3
cp "tmp/sfx_general/sfx general/sfx-gallery.wav" organized/sounds/gallery.mp3
cp "tmp/sfx_general/sfx general/sfx-dramapound.wav" organized/sounds/objection.mp3
cp "tmp/sfx_general/sfx general/sfx-thump.wav" organized/sounds/hold-it.mp3
cp "tmp/sfx_general/sfx general/sfx-happyping.wav" organized/sounds/take-that.mp3

# Create directories for each animation
echo "Creating directories for Phoenix animations..."
find "tmp/phoenix/phoenix" -type d -name "Animation_*" | while read dir; do
  # Extract animation number
  anim_num=$(basename "$dir" | sed 's/Animation_//')
  mkdir -p "organized/phoenix/anim_$anim_num"
  
  # Copy frames
  cp "$dir"/*.gif "organized/phoenix/anim_$anim_num/"
done

echo "Creating directories for Edgeworth animations..."
find "tmp/edgeworth/edgeworth" -type d -name "Animation_*" | while read dir; do
  # Extract animation number
  anim_num=$(basename "$dir" | sed 's/Animation_//')
  mkdir -p "organized/edgeworth/anim_$anim_num"
  
  # Copy frames
  cp "$dir"/*.gif "organized/edgeworth/anim_$anim_num/"
done

echo "Creating directories for Judge animations..."
find "tmp/judge/judge" -type d -name "Animation_*" | while read dir; do
  # Extract animation number
  anim_num=$(basename "$dir" | sed 's/Animation_//')
  mkdir -p "organized/judge/anim_$anim_num"
  
  # Copy frames
  cp "$dir"/*.gif "organized/judge/anim_$anim_num/"
done

# Create animation.json files with metadata about each animation
echo "Creating animation metadata files..."

cat > organized/phoenix/animations.json << EOF
{
  "normal": {"folder": "anim_000", "start": 1, "end": 3, "loop": true},
  "talking": {"folder": "anim_001", "start": 8, "end": 13, "loop": true},
  "objection": {"folder": "anim_002", "start": 8, "end": 16, "loop": false, "sound": "objection.mp3"},
  "desk_slam": {"folder": "anim_011", "start": 33, "end": 40, "loop": false, "sound": "desk-slam.mp3"},
  "pointing": {"folder": "anim_003", "start": 17, "end": 22, "loop": true},
  "thinking": {"folder": "anim_004", "start": 23, "end": 26, "loop": true},
  "confident": {"folder": "anim_005", "start": 27, "end": 32, "loop": true},
  "damaged": {"folder": "anim_012", "start": 41, "end": 50, "loop": false, "sound": "damage.mp3"}
}
EOF

cat > organized/edgeworth/animations.json << EOF
{
  "normal": {"folder": "anim_000", "start": 1, "end": 3, "loop": true},
  "talking": {"folder": "anim_001", "start": 8, "end": 13, "loop": true},
  "objection": {"folder": "anim_002", "start": 8, "end": 16, "loop": false, "sound": "hold-it.mp3"},
  "desk_slam": {"folder": "anim_003", "start": 33, "end": 40, "loop": false, "sound": "desk-slam.mp3"},
  "pointing": {"folder": "anim_004", "start": 8, "end": 15, "loop": true},
  "thinking": {"folder": "anim_005", "start": 23, "end": 26, "loop": true},
  "confident": {"folder": "anim_006", "start": 27, "end": 32, "loop": true},
  "damaged": {"folder": "anim_032", "start": 93, "end": 95, "loop": false, "sound": "damage.mp3"}
}
EOF

cat > organized/judge/animations.json << EOF
{
  "normal": {"folder": "anim_000", "start": 1, "end": 3, "loop": true},
  "talking": {"folder": "anim_001", "start": 4, "end": 7, "loop": true},
  "objection": {"folder": "anim_002", "start": 8, "end": 11, "loop": false, "sound": "gallery.mp3"},
  "desk_slam": {"folder": "anim_003", "start": 12, "end": 15, "loop": false, "sound": "gallery.mp3"}
}
EOF

# Create UI elements (simplified)
cp objection.png organized/ui/
cp hold-it.png organized/ui/
cp take-that.png organized/ui/
cp courtroom-bg.png organized/ui/

echo "Assets organized! You can now use them with the new structure."
echo "The assets are in the 'organized' directory."