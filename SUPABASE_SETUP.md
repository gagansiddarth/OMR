# Supabase Setup Guide for OMR Evaluation System

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a region close to your users
4. Wait for the project to be ready (2-3 minutes)

### 2. Get Your Credentials
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy your:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Set Up Environment Variables
Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to create all tables and relationships

### 5. Set Up Storage
1. Go to **Storage** in your Supabase dashboard
2. The `omr-sheets` bucket should be created automatically
3. If not, create it manually with public access

## 📊 Database Schema

### Tables Created:
- **students** - Student information
- **omr_sheets** - Uploaded OMR sheet metadata
- **evaluations** - Processing results and scores
- **flagged_answers** - AI-flagged questions for review
- **audit_logs** - Manual corrections and overrides

### Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Automatic timestamps
- ✅ Foreign key relationships
- ✅ JSONB for flexible data storage
- ✅ Optimized indexes for performance

## 🔧 Configuration

### Storage Bucket
- **Name**: `omr-sheets`
- **Public**: `true` (for direct file access)
- **File size limit**: 50MB (adjustable)

### Security Policies
- Currently set to allow all operations
- You can restrict access based on user authentication later

## 🧪 Testing the Integration

1. **Start your app**: `npm run dev`
2. **Upload a file** in the Upload page
3. **Check Supabase**:
   - Go to **Table Editor** to see data
   - Go to **Storage** to see uploaded files
   - Go to **Logs** to see API calls

## 🔍 Monitoring

### Supabase Dashboard
- **Table Editor**: View all data
- **SQL Editor**: Run custom queries
- **Logs**: Monitor API usage
- **Storage**: Manage uploaded files

### Example Queries

```sql
-- Get all evaluations with student info
SELECT 
  e.*,
  s.name as student_name,
  os.filename
FROM evaluations e
JOIN omr_sheets os ON e.sheet_id = os.id
JOIN students s ON e.student_id = s.student_id
ORDER BY e.created_at DESC;

-- Get flagged answers for review
SELECT 
  fa.*,
  e.student_id,
  os.filename
FROM flagged_answers fa
JOIN evaluations e ON fa.evaluation_id = e.id
JOIN omr_sheets os ON e.sheet_id = os.id
WHERE fa.status = 'pending'
ORDER BY fa.created_at DESC;
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Check your `.env.local` file
   - Make sure keys are correct
   - Restart your dev server

2. **"Table doesn't exist"**
   - Run the SQL schema again
   - Check table names in Supabase dashboard

3. **"Storage bucket not found"**
   - Create the `omr-sheets` bucket manually
   - Set it to public access

4. **CORS errors**
   - Add your domain to Supabase allowed origins
   - Or use localhost for development

### Getting Help:
- Check Supabase logs for detailed error messages
- Use the SQL Editor to test queries
- Check the Network tab in browser dev tools

## 🎯 Next Steps

Once Supabase is connected:
1. **Test file uploads** - Upload some test images
2. **Check data persistence** - Refresh the page and see if data loads
3. **Test evaluation modes** - Try different modes and see results
4. **Review flagged answers** - Check the flagged answers table
5. **Set up authentication** - Add user login if needed

Your OMR system now has a real database backend! 🎉
