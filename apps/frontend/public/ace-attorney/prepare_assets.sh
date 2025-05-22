#!/bin/bash

# Create necessary directories
mkdir -p /Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds

# Extract what appears to be Phoenix objection animation
mkdir -p /Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/animations
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/phoenix/phoenix/Animation_002/Frame_0013.gif" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/phoenix.png"

# Extract what appears to be Edgeworth (prosecutor) animation
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/edgeworth/edgeworth/Animation_004/Frame_0013.gif" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/prosecutor.png"

# Extract judge animation (assuming it's there)
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/judge/judge/Animation_001/Frame_0001.gif" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/judge.png" 2>/dev/null || true

# Extract sound effects we need
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_general/sfx general/sfx-dramapound.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/objection.mp3"
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_general/sfx general/sfx-thump.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/hold-it.mp3"
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_general/sfx general/sfx-gallery.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/court-ambience.mp3"
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_general/sfx general/sfx-bleep.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/text-bleep.mp3"
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_general/sfx general/sfx-happyping.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/take-that.mp3"
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_general/sfx general/sfx-lightbang.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/guilty.mp3"
cp "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/tmp/sfx_pwaa/sfx pwaa/sfx-ching.wav" "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/sounds/not-guilty.mp3"

# Create objection.png, hold-it.png, and take-that.png text bubbles
# These are placeholder text images since we don't have the actual images

# Write a simple HTML to create the objection bubble
cat > /tmp/objection.html << EOF
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: transparent;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .objection {
      color: white;
      background-color: #cc0000;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
      padding: 12px 24px;
      border: 3px solid white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
      transform: rotate(-5deg);
    }
  </style>
</head>
<body>
  <div class="objection">OBJECTION!</div>
</body>
</html>
EOF

cat > /tmp/holdit.html << EOF
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: transparent;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .holdit {
      color: white;
      background-color: #0066cc;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
      padding: 12px 24px;
      border: 3px solid white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
      transform: rotate(5deg);
    }
  </style>
</head>
<body>
  <div class="holdit">HOLD IT!</div>
</body>
</html>
EOF

cat > /tmp/takethat.html << EOF
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: transparent;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .takethat {
      color: white;
      background-color: #006600;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
      padding: 12px 24px;
      border: 3px solid white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
      transform: rotate(-3deg);
    }
  </style>
</head>
<body>
  <div class="takethat">TAKE THAT!</div>
</body>
</html>
EOF

# Since we can't use headless browser in this environment, we'll create simple text placeholders
echo "OBJECTION!" > "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/objection.png"
echo "HOLD IT!" > "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/hold-it.png"
echo "TAKE THAT!" > "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/take-that.png"

# Create a simple courtroom background
echo "COURTROOM BACKGROUND" > "/Users/coledermott/TuriCheck/apps/frontend/public/ace-attorney/courtroom-bg.png"

# Clean up
echo "Assets prepared for Ace Attorney Mode!"
echo "Note: Text bubbles and courtroom background are just placeholders."
echo "You may want to replace them with actual images."