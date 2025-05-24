# Pushing TuriCheck to GitHub

Follow these steps to push your TuriCheck project to GitHub:

## 1. Authenticate with GitHub

First, authenticate the GitHub CLI:

```bash
gh auth login
```

Follow the prompts to complete authentication.

## 2. Create a new GitHub repository

Create a new repository on GitHub:

```bash
cd /Users/coledermott/TuriCheck
gh repo create TuriCheck --private --source=. --remote=origin
```

Or create it manually on GitHub's website and then add the remote:

```bash
git remote add origin https://github.com/your-username/TuriCheck.git
```

## 3. Push your code

Push your code to the remote repository:

```bash
git push -u origin master
```

## 4. Vercel Deployment from GitHub

Once your code is on GitHub, you can deploy to Vercel directly from the repository:

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project settings as mentioned in VERCEL_DEPLOYMENT.md:
   - Framework Preset: Next.js
   - Root Directory: `apps/frontend`
   - Build Command: `yarn build`
   - Install Command: `yarn install`
   - Output Directory: `.next`

4. Add the required environment variables
5. Click "Deploy"

This will set up continuous deployment from your GitHub repository.