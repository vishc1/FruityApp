# 🔧 Fix Build Error - Quick Guide

## The Problem

You're getting this error because:
1. ❌ No `.env.local` file with Supabase credentials
2. ⚠️ Next.js trying to pre-render pages that need auth

## ✅ Solution (5 Minutes)

### Step 1: Get Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project (or create one)

2. **Get Your API Keys**
   - Click **Settings** (gear icon in sidebar)
   - Click **API**
   - Copy these two values:
     - **Project URL** (like: `https://xxxxx.supabase.co`)
     - **anon public** key (long string starting with `eyJ...`)

### Step 2: Get Mapbox Token

1. **Go to Mapbox**
   - Visit: https://account.mapbox.com/access-tokens/
   - Copy your **Default public token** (starts with `pk.`)

### Step 3: Update `.env.local`

I created a `.env.local` file for you. Open it and replace the placeholder values:

```bash
# Edit this file: fruity-app/.env.local

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co       # ← Replace
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...                # ← Replace
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...                  # ← Replace
NEXT_PUBLIC_APP_URL=http://localhost:3000                # ← Keep as-is
```

### Step 4: Try Building Again

```bash
npm run build
```

If it works, you'll see:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

---

## 🚀 For Vercel Deployment

The build will work on Vercel once you add the environment variables there:

1. **Go to Vercel Dashboard**
   - Import your GitHub repo: `rcube769/FruityApp`

2. **Add Environment Variables**
   Before deploying, click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   NEXT_PUBLIC_MAPBOX_TOKEN = pk.eyJ1...
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! 🎉

---

## ⚠️ About the Middleware Warning

The warning:
```
⚠ The "middleware" file convention is deprecated
```

**Don't worry!** This is just a warning in Next.js 15. Your app will still work perfectly. The middleware file is correct and necessary for auth.

You can ignore this warning for now. It will be resolved in future Next.js updates.

---

## 🧪 Quick Test Checklist

After building successfully:

```bash
# 1. Build works
npm run build

# 2. Start production server
npm start

# 3. Visit in browser
open http://localhost:3000

# 4. Test login
# - Click "Sign In"
# - Enter your email
# - Check inbox for magic link
```

---

## 📝 Summary

**The error happened because:**
- No `.env.local` file with Supabase credentials
- Build process tried to access Supabase without credentials

**The fix:**
1. ✅ Created `.env.local` file
2. ✅ Updated next.config.ts
3. ⏳ You need to add your actual API keys

**Next steps:**
1. Get Supabase URL and key
2. Get Mapbox token
3. Update `.env.local`
4. Run `npm run build`
5. Deploy to Vercel!

---

## 🆘 Still Having Issues?

### Error: "Cannot find module..."
```bash
npm install
```

### Error: "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

### Error: "Invalid API key"
- Double-check you copied the **anon** key (not service_role)
- Make sure there are no extra spaces
- Restart dev server: `npm run dev`

### Build still fails
- Delete `.next` folder: `rm -rf .next`
- Clear cache: `npm cache clean --force`
- Reinstall: `npm install`
- Try again: `npm run build`

---

## ✅ You're Almost There!

Just add those 3 API keys and you're ready to deploy! 🚀

Need help getting the keys? Check: [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
