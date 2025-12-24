# Deployment Guide

This guide covers deploying the AI Live Chat Agent to production environments.

## Prerequisites for Deployment

- GitHub repository with your code
- OpenAI API key
- Account on a hosting platform (Render, Vercel, Railway, etc.)

## Deployment Options

### Option 1: Render (Recommended for Full-Stack)

Render is excellent for deploying both frontend and backend.

#### Backend Deployment on Render

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure settings:**
   - **Build Command:** `cd backend && npm install && npm run db:generate && npm run build`
   - **Start Command:** `cd backend && npm run start`
   - **Environment:** Node
   - **Root Directory:** `backend`

4. **Add Environment Variables:**
   ```
   PORT=3001
   DATABASE_URL=postgresql://user:password@host/dbname  # Use PostgreSQL for production
   OPENAI_API_KEY=your-openai-api-key
   NODE_ENV=production
   ```

5. **Database Setup:**
   - Create a PostgreSQL database on Render
   - Update DATABASE_URL with the connection string
   - Run migrations: `npm run db:migrate` (you may need to SSH in or use a one-off command)

#### Frontend Deployment on Render (or Vercel/Netlify)

**Option A: Render Static Site**
1. Create a new Static Site
2. Connect GitHub repo
3. Build Command: `cd frontend && npm install && npm run build`
4. Publish Directory: `frontend/build` (or `.svelte-kit` for SvelteKit)
5. Update API_URL in frontend to point to your backend URL

**Option B: Vercel (Easier for SvelteKit)**
1. Import your GitHub repo to Vercel
2. Set root directory to `frontend`
3. Vercel auto-detects SvelteKit
4. Add environment variable for API URL if needed
5. Update `API_URL` in `+page.svelte` to your backend URL

### Option 2: Railway

Railway makes it easy to deploy full-stack apps.

1. **Connect GitHub repository**
2. **Add PostgreSQL service** (Railway will create it)
3. **Add backend service:**
   - Root directory: `backend`
   - Build command: `npm install && npm run db:generate && npm run build`
   - Start command: `npm start`
   - Add environment variables (Railway auto-provides DATABASE_URL)

4. **Add frontend service:**
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview` (or use static hosting)

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

This is often the easiest approach:

1. **Deploy Backend to Railway/Render** (see above)
2. **Deploy Frontend to Vercel:**
   - Import repo, set root to `frontend`
   - Vercel handles SvelteKit automatically
   - Update API_URL in code to backend URL

## Important Configuration Changes for Production

### Backend Changes

1. **Update CORS settings** in `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
  credentials: true
}));
```

2. **Use PostgreSQL instead of SQLite:**
   - Update `DATABASE_URL` to PostgreSQL connection string
   - Update `prisma/schema.prisma` datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Add production error handling:**
   - Consider adding error logging (Sentry, etc.)
   - Add request logging

### Frontend Changes

1. **Update API URL** in `frontend/src/routes/+page.svelte`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

2. **Add environment variable** in your hosting platform:
   - `VITE_API_URL=https://your-backend-url.com`

3. **Build for production:**
```bash
cd frontend
npm run build
```

## Database Migration for Production

If using PostgreSQL:

1. **Update schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Generate Prisma client:**
```bash
npm run db:generate
```

3. **Run migrations:**
```bash
npm run db:migrate
```

## Environment Variables Checklist

### Backend
- [ ] `PORT` (usually auto-set by hosting platform)
- [ ] `DATABASE_URL` (PostgreSQL connection string for production)
- [ ] `OPENAI_API_KEY` (your OpenAI API key)
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (for CORS)

### Frontend
- [ ] `VITE_API_URL` (your backend URL)

## Testing Deployment

1. **Backend Health Check:**
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Test Chat Endpoint:**
   ```bash
   curl -X POST https://your-backend-url.com/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

3. **Frontend:**
   - Visit your frontend URL
   - Try sending a message
   - Check browser console for errors

## Common Issues

### CORS Errors
- Make sure backend CORS allows your frontend domain
- Check that FRONTEND_URL environment variable is set correctly

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check that migrations have run
- Ensure database is accessible from your backend server

### Build Failures
- Check Node.js version compatibility (use LTS)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### API Key Issues
- Verify OPENAI_API_KEY is set correctly
- Check for extra spaces or quotes in environment variables
- Test API key locally first

## Security Checklist

- [ ] API keys stored as environment variables (never in code)
- [ ] CORS configured to only allow your frontend domain
- [ ] Database connection string is secure
- [ ] HTTPS enabled (most platforms do this automatically)
- [ ] Rate limiting considered (add if needed)
- [ ] Input validation in place (already implemented)

## Monitoring & Logs

- Check your hosting platform's logs for errors
- Monitor OpenAI API usage and costs
- Set up alerts for backend downtime
- Consider adding error tracking (Sentry, etc.)

## Cost Considerations

- **Hosting:** Many platforms offer free tiers (Render, Railway, Vercel)
- **Database:** PostgreSQL may have costs on some platforms
- **OpenAI API:** Monitor usage - GPT-3.5-turbo is relatively cheap (~$0.001 per message)

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed and healthy
- [ ] Database created and migrations run
- [ ] Environment variables set
- [ ] Frontend deployed and pointing to backend
- [ ] CORS configured
- [ ] Tested end-to-end chat flow
- [ ] Health check endpoints working

