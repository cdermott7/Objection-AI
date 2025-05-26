# Objection! AI

A blockchain-powered courtroom where you present your case to determine if you're facing a human or AI opponent. Engage in dramatic courtroom dialogue, analyze responses, and prove your case beyond reasonable doubt!

## Features

- **Courtroom Drama**: Engage in Phoenix Wright-style dialogue and cross-examination
- **Turing Detection**: Present evidence and determine if your opponent is human or AI
- **NFT Badge Collection**: Mint collectible courtroom victory badges for successful cases
- **Blockchain-Powered**: Built on Sui blockchain with Move smart contracts
- **Mobile Courtroom**: Responsive design works on all devices for on-the-go legal drama
- **Multiple Game Modes**: Standard chat and full Ace Attorney courtroom experience

## Tech Stack

- **Frontend:** Next.js (App Router, React 18), Tailwind CSS
- **DB & Auth:** Supabase (Auth + Postgres)
- **Blockchain:** Sui Move modules for Badge minting
- **Wallet:** @mysten/dapp-kit, zkLogin integration for gasless sign-on
- **Off-chain Storage:** Walrus for Badge metadata
- **LLM Integration:** External AI API (e.g., OpenAI/Claude)

## Getting Started

### Prerequisites

- Node.js and Yarn
- Sui CLI (for Move development)
- Supabase account (for authentication and database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/objection-ai.git
   cd objection-ai
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create environment variables:
   ```bash
   # In apps/frontend/.env.local
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_AI_API_KEY=your-ai-api-key
   NEXT_PUBLIC_AI_API_URL=your-ai-api-url
   NEXT_PUBLIC_PACKAGE_ID=your-sui-package-id
   ```

4. Deploy the Move contract (requires Sui CLI):
   ```bash
   ./scripts/deploy-move-local.sh
   ```

5. Run the development server:
   ```bash
   cd apps/frontend
   yarn dev
   ```

## Project Structure

```
/ (monorepo root)
├── apps
│   └── frontend                  # Next.js application
│       ├── public                # Static assets: favicon, logo
│       ├── src
│       │   ├── app
│       │   │   ├── layout.tsx    # Wraps providers & global styles
│       │   │   ├── page.tsx      # Landing / single-chat interface
│       │   │   └── profile       # /profile: user badges gallery
│       │   ├── components        # Reusable UI
│       │   ├── context           # AuthContext, ChatContext
│       │   ├── hooks             # useBadges
│       │   └── utils             # LLM client, Sui tx builders
│       └── package.json
│
├── contracts
│   └── move                     # Sui Move modules
│       ├── src
│       │   └── ObjectionAI.move   # entry: mint_badge(session_id, correct)
│       └── Move.toml
│
└── scripts                      # Deployment scripts
```

## License

[MIT](LICENSE)

## Game Modes

### Standard Mode
The default chat experience with a clean, modern interface. Users have 60 seconds to chat and determine if they're talking to an AI or human.

### Ace Attorney Mode
The signature experience inspired by the "Phoenix Wright: Ace Attorney" video game series. Features:

- **Full Courtroom Experience**: Complete Phoenix Wright vs. Prosecutor debate-style interface
- **Character Sprites**: Animated Phoenix and Prosecutor characters with authentic expressions
- **Dramatic Sound Effects**: Classic "OBJECTION!" calls, courtroom sounds, and text blips
- **Strategic Gameplay**: Limited messages force strategic questioning and deduction
- **Authentic Animations**: Dramatic "OBJECTION!" and "HOLD IT!" text effects

This is the primary mode that captures the true spirit of Objection! AI - step into Phoenix Wright's shoes and prove your case!

#### Adding Ace Attorney Assets
To fully experience this mode, you'll need to add sound effects and character sprites:

1. See the README in `/apps/frontend/public/ace-attorney/` for setup instructions
2. Add sound files to `/apps/frontend/public/ace-attorney/sounds/`
3. Add character sprites to `/apps/frontend/public/ace-attorney/`

## Acknowledgments

- [Sui Foundation](https://sui.io)
- [Mysten Labs](https://mystenlabs.com)
- [Supabase](https://supabase.com)
- [Next.js](https://nextjs.org)
- [Capcom](https://www.capcom.com/) - Inspiration for Ace Attorney Mode