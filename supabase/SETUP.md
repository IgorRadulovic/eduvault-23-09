# Supabase Setup Guide

## Your keys explained

In Supabase → Settings → API you will see:
- **Project URL** → this is `VITE_SUPABASE_URL`
- **anon / public** key → this is `VITE_SUPABASE_ANON_KEY` (safe to use in browser)
- **service_role** key → NEVER put this in the frontend. Keep it server-side only.

So what you called "publishable" = anon key → goes in your .env.local
What you called "secret" = service_role key → keep it safe, don't add to frontend

## Step-by-step

### 1. Add environment variables
In `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

In Vercel → Settings → Environment Variables: add same two values.

### 2. Run the schema
Go to Supabase → SQL Editor → New Query
Paste the entire contents of `schema.sql` → click Run

### 3. Create Storage Buckets
Go to Supabase → Storage → New Bucket:
- Name: `product-images`
- Public bucket: ✅ YES (product thumbnails are public)
- Click Create

(Optional for ebook file delivery):
- Name: `ebook-files`  
- Public bucket: ❌ NO (private — only enrolled users)

### 4. Set up RLS for Storage
Go to Supabase → Storage → product-images → Policies → New Policy:

**For SELECT (anyone can view):**
- Policy name: `Public read`
- Allowed operation: SELECT
- Target roles: public (everyone)
- USING expression: `true`

**For INSERT (logged in users can upload):**
- Policy name: `Auth upload`
- Allowed operation: INSERT  
- Target roles: authenticated
- WITH CHECK expression: `true`

### 5. Add seed products (optional)
To pre-populate your database with demo courses, run the INSERT statements
from your existing mockData.js adapted to SQL. Example:

```sql
INSERT INTO products (type, title, slug, author, price, original_price, description, is_published, is_featured, color)
VALUES 
  ('course', 'Complete React Developer 2024', 'complete-react-developer', 'Alex Rivera', 89, 149, 'Master React from zero to expert.', true, true, '#1565C0'),
  ('ebook', 'The Future of AI in Business', 'future-of-ai-business', 'Dr. James Park', 24, 45, 'Practical AI frameworks for business leaders.', true, false, '#00695C');
```

You'll need to link to a category_id — first get category IDs:
```sql
SELECT id, name FROM categories;
```

### 6. Verify it works
Run `npm run dev` — the homepage should now show products from your Supabase database.
If it's empty, either add products via Admin Dashboard or run seed SQL above.
