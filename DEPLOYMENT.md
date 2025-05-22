# TuriCheck Deployment Guide

This guide explains how to deploy and set up the TuriCheck application.

## 1. Supabase Setup

You need to set up a Supabase project for authentication, database, and matchmaking:

1. Create a project at [Supabase](https://supabase.com)
2. Run the SQL setup script in Supabase:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the content from `apps/frontend/supabase/schema.sql`
   - Run the script to create the matchmaking tables and policies
   - Verify tables were created in the Table Editor

3. Copy your Supabase credentials to your environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## 2. Move Contract Deployment

The Move contract in `contracts/move/src/TuriCheck.move` needs to be deployed to the Sui blockchain:

### Regular Deployment (for Production)

1. Make sure you have Sui CLI installed (`sui --version`)
2. Configure your Sui client and wallet using `sui client`
3. Ensure you have sufficient SUI tokens in your wallet
4. Navigate to `contracts/move` directory
5. Modify `Move.toml` if needed for your target network
6. Run:
   ```bash
   sui move build
   sui client publish --gas-budget 100000000
   ```
7. Make note of the package ID and update it in your .env.local

### Development Mode

For development purposes, you can use the mock package ID in your .env.local:
```
NEXT_PUBLIC_PACKAGE_ID=0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

The application is configured to use mock data when in development mode, allowing you to test the full functionality without deploying the contract.

## 3. Environment Variables

Required environment variables for `apps/frontend/.env.local`:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI API Configuration
NEXT_PUBLIC_AI_API_KEY=your-openai-or-claude-api-key
NEXT_PUBLIC_AI_API_URL=https://api.openai.com/v1/chat/completions
NEXT_PUBLIC_AI_MODEL=gpt-4

# Sui Blockchain Configuration
NEXT_PUBLIC_PACKAGE_ID=your-package-id-from-deployment
NEXT_PUBLIC_SUI_NETWORK=testnet  # or mainnet for production
```

## 4. Vercel Deployment

### Recommended: Deploy via Vercel Dashboard (UI)

The recommended approach for deploying this monorepo is through the Vercel Dashboard:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Create a new project in the [Vercel Dashboard](https://vercel.com/new)
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `apps/frontend`
   - Build Command: `yarn build`
   - Install Command: `yarn install`
   - Output Directory: `.next`

5. Add the environment variables from Step 3 to your Vercel project settings
6. Click Deploy

### Simplified: Using the Deployment Script

We've created a deployment script to simplify the process:

1. Run the deployment script:
   ```bash
   # From the repository root
   ./scripts/deploy-to-vercel.sh
   ```

2. Follow the prompts and instructions
3. Add the required environment variables using the Vercel dashboard

### Advanced: Manual Deployment via Vercel CLI

For advanced users who need to deploy via the CLI manually:

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. **Important**: Due to the monorepo structure, it's better to deploy directly from the frontend directory:
   ```bash
   cd apps/frontend
   
   # Create simplified vercel.json if not exists
   echo '{"framework":"nextjs","buildCommand":"yarn build","installCommand":"yarn install","outputDirectory":".next"}' > vercel.json
   
   # Deploy with reduced file count
   vercel --yes
   ```

4. Add the required environment variables using the Vercel dashboard

**Important Notes for Vercel Deployment:**

- Monorepo deployments can be complex; the Vercel Dashboard is usually more reliable
- If using CLI, deploy directly from the frontend directory to avoid file count limits
- Ensure your frontend's package.json includes Next.js as a dependency
- For large repositories, consider using the `--archive=tgz` flag with the CLI

## 5. Running the Application Locally

```bash
cd apps/frontend
yarn install
yarn dev  # for development
yarn build && yarn start  # for production
```

## 6. Troubleshooting Deployment

### Contract Deployment Issues

If you encounter issues with the contract deployment, try these steps:

1. Update the Sui CLI to the latest version
2. Use the `--skip-fetch-latest-git-deps` flag:
   ```
   sui move build --skip-fetch-latest-git-deps
   sui client publish --gas-budget 100000000 --skip-fetch-latest-git-deps
   ```
3. Ensure there are no permission issues with your git repositories

If you still have issues, the application works in development mode with mock data.

### Supabase Function Issues

If you encounter permission errors with Supabase functions:

1. Verify Row Level Security (RLS) policies are correctly set
2. Check if the functions have the `SECURITY DEFINER` attribute
3. Ensure the JWT token from the client is valid

### WebRTC Connection Issues

If you encounter issues with WebRTC connections:

1. Check browser console for errors
2. Ensure both users are on HTTPS (required for WebRTC)
3. Verify Supabase realtime subscriptions are working
4. Check that the schema was correctly applied in Supabase

### Vercel Deployment Issues

If you encounter issues with deploying to Vercel:

1. **No Next.js Version Detected**:
   - Ensure `next` is in the dependencies of your `package.json` (it should be listed in the frontend package.json)
   - Verify the Root Directory setting points to where your `package.json` is located (should be `apps/frontend`)
   - Deploy directly from the frontend directory using the provided script or manual CLI commands
   - If deploying via the dashboard, make sure to set the correct Root Directory

2. **Monorepo Build Failures**:
   - For monorepos like this one, use a simplified configuration focused on the frontend directory
   - Avoid complex dependency relationships between packages in the deployment process
   - Use a direct approach: deploy from the frontend directory with a simplified vercel.json
   - Consider using the Vercel Dashboard which handles monorepos better than the CLI

3. **Too Many Files Error**:
   - If you see `Invalid request: files should NOT have more than 15000 items`, use the following approaches:
     - Deploy directly from the frontend directory instead of the root
     - Use `--archive=tgz` flag with the CLI to compress files
     - Deploy from the Vercel Dashboard which handles large repositories better

4. **Environment Variable Issues**:
   - Verify all required environment variables are set in the Vercel dashboard
   - For local development with Vercel CLI, use a `.env.local` file
   - Prefix client-side variables with `NEXT_PUBLIC_`
   - Ensure you've added all the environment variables listed in Step 3 of this guide

5. **Build Command Failures**:
   - Check the build logs in the Vercel dashboard for specific errors
   - Verify your Next.js version is compatible with your dependencies
   - Make sure you're using a compatible Node.js version (set in Vercel project settings)
   - Test building locally with `yarn build` in the frontend directory before deploying