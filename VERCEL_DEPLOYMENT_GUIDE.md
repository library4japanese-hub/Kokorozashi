# Vercel Deployment Guide for Kokorozashi

## Prerequisites
- Vercel account
- GitHub repository
- Node.js installed

## Setting Up the Project
1. Clone the repository:
   ```bash
   git clone https://github.com/library4japanese-hub/Kokorozashi.git
   ```
2. Navigate into the project directory:
   ```bash
   cd Kokorozashi
   ```

## Deploying to Vercel
1. Log into Vercel:
   ```bash
   vercel login
   ```
2. Initialize the project on Vercel:
   ```bash
   vercel init
   ```
3. Set the project settings in the Vercel dashboard as needed (e.g., environment variables, build settings).
4. Deploy the project:
   ```bash
   vercel --prod
   ```

## Integrating with GitHub
- Link the GitHub repository to the Vercel project for automatic deployments on push or pull request.
