# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
VITE_API_URL=http://localhost:8000
```

## How to Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## Example .env.local

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
```

## After Setting Up

1. Save the `.env.local` file
2. Restart the development server: `npm run dev`
3. The app will now connect to your Supabase database

## Troubleshooting

- Make sure there are no spaces around the `=` sign
- Make sure the file is named exactly `.env.local`
- Make sure the file is in the project root directory
- Restart the development server after making changes
