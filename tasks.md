# TuriCheck MVP: Granular Step-by-Step Build Plan

Each task is **incredibly small**, **testable**, and has a **clear start + end**. Follow in order and verify the **Test** before proceeding.

---

## 1. Monorepo Initialization

### Task 1.1: Initialize Git Repo

* **Start:** Empty project folder.
* **End:** Run `git init`; `.git` directory exists.
* **Test:** `git status` outputs clean working tree.

### Task 1.2: Configure Yarn Workspaces

* **Start:** No `package.json` at root.
* **End:** Create root `package.json` with:

  ```json
  {
    "private": true,
    "workspaces": ["apps/*","contracts","sdk"]
  }
  ```
* **Test:** Running `yarn install` completes; `yarn workspaces info` lists workspaces.

---

## 2. Frontend Setup (apps/frontend)

### Task 2.1: Scaffold Next.js App

* **Start:** `apps/frontend` exists and empty.
* **End:** Inside `apps/frontend`, run:

  ```bash
  npx create-next-app@latest . --typescript --eslint --app
  ```
* **Test:** `cd apps/frontend && yarn dev` serves default page at `http://localhost:3000`.

### Task 2.2: Install Tailwind CSS

* **Start:** Clean Next.js TS project.
* **End:** Run:

  ```bash
  yarn add -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

  Update `globals.css` with Tailwind directives.
* **Test:** Add `<h1 className="text-green-500">Tailwind</h1>` to `app/page.tsx`; text appears green.

---

## 3. Supabase Integration

### Task 3.1: Create Supabase Project & Env

* **Start:** No Supabase config.
* **End:** Create project on supabase.io; in `apps/frontend/.env.local` add:

  ```bash
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```
* **Test:** `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)` in `app/page.tsx` prints URL.

### Task 3.2: Add Supabase Client

* **Start:** No Supabase client code.
* **End:** Create `src/utils/supabaseClient.ts` exporting:

  ```ts
  import { createClient } from '@supabase/supabase-js';
  export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  ```
* **Test:** Import and call `await supabase.from('profiles').select()` in `getServerSideProps`; no errors.

### Task 3.3: Enable Auth in Supabase

* **Start:** Auth providers disabled.
* **End:** In Supabase dashboard, enable Email/Password under Auth > Settings.
* **Test:** In console `await supabase.auth.signInWithPassword({ email, password })` returns session.

---

## 4. Authentication Flow

### Task 4.1: Build Login Page

* **Start:** No `/login` route.
* **End:** Create `src/app/login/page.tsx` with email/password form that calls `supabase.auth.signInWithPassword`.
* **Test:** Navigate to `/login`, submit valid creds, redirect to `/`.

### Task 4.2: Implement AuthContext

* **Start:** No React context for auth.
* **End:** Create `src/context/AuthContext.tsx` providing `user`, `signOut()`; wrap `layout.tsx`.
* **Test:** In `app/page.tsx`, access `useContext(AuthContext).user`; logs user object.

---

## 5. Move Contract Setup

### Task 5.1: Scaffold Move Package

* **Start:** `contracts/move` exists but empty.
* **End:** Add `Move.toml` and `src/TuriCheck.move` stub with:

  ```move
  module 0x1::TuriCheck {
    public entry fun mint_badge(session_id: u64, correct: bool) {}
  }
  ```
* **Test:** Run `cd contracts/move && sui move build`; build succeeds.

### Task 5.2: Local Deployment Script

* **Start:** No deployment script.
* **End:** Create `scripts/deploy-move-local.sh` that:

  1. Starts Sui localnet (if needed).
  2. Publishes `TuriCheck` module.
  3. Prints module address.
* **Test:** Run script; output shows valid module address.

---

## 6. Wallet & Transaction Utility

### Task 6.1: Install Wallet Adapter

* **Start:** No wallet libs.
* **End:** In frontend, run:

  ```bash
  yarn add @mysten/wallet-adapter-react @mysten/wallet-adapter-wallets
  ```
* **Test:** Wrap `<WalletProvider>` in `layout.tsx`; `useWallet()` returns connectors.

### Task 6.2: Implement Sui Tx Builder

* **Start:** No tx builder.
* **End:** Create `src/utils/suiTx.ts` exporting `buildMintBadgeTx(sessionId: number, correct: boolean)` that returns a `TransactionBlock` calling `mint_badge`.
* **Test:** Import and call with dummy values; returns `TransactionBlock` instance.

---

## 7. LLM Client Integration

### Task 7.1: Scaffold LLM Client

* **Start:** No AI API code.
* **End:** Create `src/utils/llmClient.ts` with `async function queryAI(prompt: string): Promise<string>` calling external API.
* **Test:** Call `await queryAI('Hello')` in console; returns mock AI response (or actual API output).

---

## 8. Chat UI & State

### Task 8.1: Create ChatContext

* **Start:** No chat context.
* **End:** Create `src/context/ChatContext.tsx` with state: `sessionId`, `messages`, `setMessages`, `endChat()`.
* **Test:** Wrap app; in a test component, update `messages` and see re-render.

### Task 8.2: Build ChatBox Component

* **Start:** No chat UI.
* **End:** Create `components/ChatBox.tsx` that renders `messages` and input box; on submit, calls `queryAI` and appends both messages to context.
* **Test:** Render `<ChatBox>`; type message; see user and AI messages appear.

### Task 8.3: Session Logging

* **Start:** No session tracking.
* **End:** On first user message, call Supabase RPC Edge Function `create_session` to insert into `sessions` table and set `sessionId` in context.
* **Test:** Submit first message; new row in Supabase `sessions` with correct `session_id`.

---

## 9. Guess & Badge Mint Flow

### Task 9.1: Build GuessForm Component

* **Start:** No guess UI.
* **End:** Create `components/GuessForm.tsx` with radio buttons “Human”/“AI” and “Submit” button.
* **Test:** Render `<GuessForm>`; select option; internal state updates.

### Task 9.2: Wire Mint Badge Flow

* **Start:** GuessForm unconnected.
* **End:** On submit, call `buildMintBadgeTx(sessionId, correct)` → `signAndExecuteTransaction`, then show success toast.
* **Test:** Make a guess; wallet popup appears; on-chain badge minted (verify on localnet explorer).

---

## 10. Profile & Badge Display

### Task 10.1: Create BadgeCard Component

* **Start:** No badge UI.
* **End:** Create `components/BadgeCard.tsx` displaying badge image, sessionId, result.
* **Test:** Pass mock props; badge card renders correctly.

### Task 10.2: Implement useBadges Hook

* **Start:** No hook.
* **End:** Create `src/hooks/useBadges.ts` that fetches Sui NFTs by module and returns badge data.
* **Test:** Call in test component; returns empty array or mock data without errors.

### Task 10.3: Build Profile Page

* **Start:** No `/profile` route.
* **End:** Create `app/profile/page.tsx` that uses `useBadges()` to render a grid of `<BadgeCard>`s.
* **Test:** Navigate to `/profile`; see zero or more badge cards.

---

## 11. Walrus Metadata (Optional)

### Task 11.1: Configure Walrus Client

* **Start:** No Walrus code.
* **End:** Create `src/utils/walrusClient.ts` stub for storing/retrieving badge metadata.
* **Test:** Call stub; returns placeholder.

---

## 12. CI / CD Setup

### Task 12.1: GitHub Actions for CI

* **Start:** No CI file.
* **End:** Add `.github/workflows/ci.yml` that:

  1. Runs `yarn install`.
  2. Builds Move (`sui move build`).
  3. Builds frontend (`yarn workspace apps-frontend build`).
* **Test:** Push commit; GitHub Actions runs and passes.

### Task 12.2: Vercel Deployment

* **Start:** No deployment.
* **End:** Connect `apps/frontend` to Vercel for auto-deploy on `main`.
* **Test:** Merge to `main`; live demo updates.

---

> *Completing these \~25 tasks yields a fully functional TuriCheck MVP: login → chat with AI/human → guess → mint Badge → view profile.*
