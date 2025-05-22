# TuriCheck Vercel Deployment Instructions

## Important: Use Vercel UI for Deployment

After multiple attempts with the Vercel CLI, we've determined that the most reliable way to deploy this project is through the Vercel UI (Dashboard).

## Step-by-Step Instructions

1. **Push your code to GitHub** (if not already done)

2. **Create a new project in Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the TuriCheck repository

3. **Configure the project settings**:
   - Framework Preset: Next.js
   - Root Directory: `apps/frontend`
   - Build Command: `next build`
   - Install Command: `yarn install`
   - Output Directory: `.next`

4. **Set Environment Variables**:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_AI_API_KEY
   - NEXT_PUBLIC_AI_API_URL
   - NEXT_PUBLIC_AI_MODEL
   - NEXT_PUBLIC_PACKAGE_ID
   - NEXT_PUBLIC_SUI_NETWORK

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Troubleshooting

If you encounter the "No Next.js version detected" error:

1. Ensure you've selected `apps/frontend` as the Root Directory
2. Verify that the package.json in that directory has `next` in the dependencies
3. Check that you're using next.config.js (not .ts)
4. Try downgrading Next.js and React versions in package.json to more stable versions:
   - next: "14.0.4"
   - react: "18.2.0"
   - react-dom: "18.2.0"

## For Subsequent Deployments

Once you've set up the project correctly in Vercel, subsequent deployments will happen automatically when you push to the main branch, or you can trigger manual deployments from the Vercel Dashboard.