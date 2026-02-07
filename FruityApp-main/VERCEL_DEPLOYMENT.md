# 🚀 Deploy Fruity to Vercel

## Quick Deploy (5 Minutes)

### Step 1: Push to GitHub (Already Done! ✅)
Your code is already on GitHub at: https://github.com/rcube769/FruityApp

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Log In"
   - Choose "Continue with GitHub"

2. **Import Project**
   - Click "Add New..." → "Project"
   - Find "rcube769/FruityApp" in the list
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

4. **Add Environment Variables** ⚠️ **IMPORTANT**
   Click "Environment Variables" and add these:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: your_supabase_anon_key_here

   NEXT_PUBLIC_MAPBOX_TOKEN
   Value: pk.your_mapbox_token_here

   NEXT_PUBLIC_APP_URL
   Value: https://your-app.vercel.app (you'll get this after deployment)
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live! 🎉

---

## Step 3: Update URLs in Supabase

After deployment, you'll get a URL like: `https://fruity-app-xyz.vercel.app`

1. Go to your Supabase project
2. Click "Authentication" → "URL Configuration"
3. Add these URLs:
   - **Site URL**: `https://fruity-app-xyz.vercel.app`
   - **Redirect URLs**: `https://fruity-app-xyz.vercel.app/auth/callback`

4. Save changes

---

## Step 4: Update Environment Variable

1. Go back to Vercel → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Redeploy (Vercel → Deployments → click "..." → Redeploy)

---

## Step 5: Test Your Live App! 🎉

Visit your Vercel URL and test:
- ✅ Sign in with magic link
- ✅ Create a listing
- ✅ Browse the map
- ✅ Dashboard

---

## Automatic Deployments

Every time you push to GitHub, Vercel will automatically:
1. Build your app
2. Run tests
3. Deploy if successful

**Production URL**: Your main branch deploys to `https://your-app.vercel.app`

**Preview URLs**: Other branches get preview URLs like `https://your-app-git-feature.vercel.app`

---

## Custom Domain (Optional)

Want a custom domain like `fruity.app`?

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In Vercel → Settings → Domains
3. Add your domain
4. Update DNS records (Vercel will show you how)
5. Wait 10-60 minutes for DNS propagation

---

## Database Setup on Vercel

⚠️ **Important**: Run the new SQL for property features!

1. Go to Supabase SQL Editor
2. Run the SQL from `DATABASE_UPDATE.sql`:

```sql
-- Create properties table for user homes
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property" ON properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own property" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own property" ON properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own property" ON properties FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_properties_user_id ON properties(user_id);

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE listings ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_listings_property_id ON listings(property_id);
```

---

## Environment Variables Summary

Make sure these are set in Vercel:

| Variable | Where to Get It |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox → Access Tokens |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

---

## Monitoring & Logs

**View Logs**:
- Vercel → Your Project → Deployments → Click a deployment → "Runtime Logs"

**View Analytics**:
- Vercel → Your Project → Analytics
- See visitor stats, performance, etc.

**Error Tracking**:
- Check Runtime Logs for errors
- Check Supabase logs for database errors

---

## Cost

**Vercel Free Tier**:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ HTTPS included
- ✅ Preview deployments
- ✅ Analytics

**You'll stay free unless you get massive traffic!**

**Supabase Free Tier**:
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 50 MB API requests/day
- ✅ Unlimited API requests (Fair Use)

**Mapbox Free Tier**:
- ✅ 50,000 map loads/month
- ✅ 100,000 geocode requests/month

**Total Cost for Getting Started: $0** 🎉

---

## Troubleshooting

**Build fails on Vercel**:
- Check the build logs
- Usually a TypeScript error or missing dependency
- Make sure all environment variables are set

**Magic links not working**:
- Check Supabase → Authentication → URL Configuration
- Make sure redirect URLs include your Vercel domain

**Map not loading**:
- Check Mapbox token is correct
- Make sure it's the public token (starts with `pk.`)

**Database errors**:
- Check Supabase logs
- Verify RLS policies are set up
- Make sure you ran the UPDATE SQL

---

## 🎉 That's It!

Your app is now:
- ✅ Live on the internet
- ✅ Automatically deployed on every push
- ✅ Running on fast global CDN
- ✅ 100% free (for now)

**Your live URL**: `https://your-app.vercel.app`

Share it with friends and start reducing food waste! 🍊🌍
