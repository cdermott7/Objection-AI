# TuriCheck

A streamlined "Human or AI?" one-shot chat experience on Sui: users engage in a brief dialogue, make a single guess, and mint a collectible Badge NFT for correct answers.

## Features

- **One-shot Chat**: Brief conversation with either an AI or human respondent
- **Turing Test**: Users guess if they were chatting with a human or AI
- **NFT Badge**: Mint a collectible NFT badge for your guesses
- **Blockchain Integration**: Built on Sui blockchain with Move contracts
- **Mobile-friendly**: Responsive design works on all devices
- **Ace Attorney Mode**: Phoenix Wright-themed gameplay mode with courtroom style chat

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
   git clone https://github.com/yourusername/TuriCheck.git
   cd TuriCheck
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
│       │   └── TuriCheck.move   # entry: mint_badge(session_id, correct)
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
A special mode inspired by the "Phoenix Wright: Ace Attorney" video game series. Features:

- **Courtroom Theme**: Phoenix Wright vs. Prosecutor debate-style interface
- **Character Sprites**: Phoenix and Prosecutor characters present arguments
- **Sound Effects**: Objections, dramatic courtroom sounds, and text blips
- **10-Message Limit**: A more challenging format with limited messages
- **Special Animations**: "OBJECTION!" and "HOLD IT!" dramatic text bubbles

To toggle between modes, use the Ace Attorney Mode toggle in the header (when signed in).

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