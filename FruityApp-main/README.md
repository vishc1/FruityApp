# 🍊 Fruity - Community Fruit Sharing Platform

A Next.js web application that connects neighbors to share excess fruit from their yards. Built with privacy-first features and real-time messaging.






### 1 Prerequisites

- npm or yarn
- Supabase account (free tier works)



### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 3. Run Database Setup

1. Open your Supabase project
2. Go to SQL Editor
3. Run the SQL from `DATABASE_SETUP.sql`
4. Run the SQL from `DATABASE_MIGRATION_ADD_COLUMNS.sql`

### 5. Configure Environment Variables

Copy `.env.example` to `.env.local`:



### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_APP_URL` = your production URL
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

### Option 2: Deploy via CLI
bash


### Post-Deployment

1. Update your Supabase allowed redirect URLs:
   - Go to Authentication > URL Configuration
   - Add your Vercel URL: `https://your-app.vercel.app/**`
2. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables to your production URL

## Database Schema



## License

MIT

## Credits

Built with [Claude Code](https://claude.com/claude-code)
