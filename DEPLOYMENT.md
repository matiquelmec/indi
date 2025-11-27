# 🚀 INDI Digital Cards - Deployment Guide

## 📋 Pre-Deployment Checklist

### 🔐 Security Requirements
- [ ] ✅ All sensitive environment variables removed from code
- [ ] ✅ Production secrets configured in hosting platform
- [ ] ✅ Database access properly configured
- [ ] ✅ API rate limiting enabled
- [ ] ✅ CORS origins configured correctly

### 🗄️ Database Setup (Supabase)
- [ ] ✅ Supabase project created
- [ ] ✅ Database tables configured
- [ ] ✅ RLS policies enabled
- [ ] ✅ Service role key obtained

## 🌐 Vercel Deployment

### 1. Frontend Deployment

```bash
# Build and deploy frontend
npm run build
npx vercel --prod
```

**Environment Variables to set in Vercel:**
```env
VITE_APP_MODE=production
VITE_API_URL=https://your-backend-domain.vercel.app/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_ANALYTICS=true
```

### 2. Backend API Deployment

**Environment Variables for Backend:**
```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-64-character-secret
JWT_REFRESH_SECRET=your-64-character-refresh-secret
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Domain Configuration

1. **Custom Domain** (Optional):
   ```bash
   # Add custom domain in Vercel dashboard
   # Configure DNS settings
   # Enable SSL certificate
   ```

2. **Environment URLs**:
   - Production: `https://your-domain.com`
   - Backend API: `https://your-backend.vercel.app/api`

## 🔧 Alternative Hosting Platforms

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Netlify Deployment

```bash
# Build for Netlify
npm run build

# Deploy with Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

## 📊 Production Monitoring

### Performance Monitoring
- **Vercel Analytics**: Built-in performance tracking
- **Web Vitals**: Core Web Vitals monitoring
- **Error Tracking**: Console error logging

### Recommended Upgrades
```bash
# Add production monitoring (optional)
npm install @sentry/react @sentry/node
npm install @vercel/analytics
npm install mixpanel-browser
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   ```bash
   # Check Vercel environment variables
   vercel env ls
   
   # Pull environment to local
   vercel env pull .env.local
   ```

2. **Database Connection Issues**:
   ```bash
   # Test Supabase connection
   curl -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        https://your-project.supabase.co/rest/v1/cards
   ```

3. **Build Failures**:
   ```bash
   # Clear build cache
   rm -rf node_modules .next dist
   npm install
   npm run build
   ```

4. **CORS Errors**:
   ```javascript
   // Update CORS origins in backend
   const corsOptions = {
     origin: [
       'https://your-domain.com',
       'https://your-domain.vercel.app'
     ]
   };
   ```

## 📈 Post-Deployment

### 1. Performance Testing
```bash
# Test with Lighthouse
npx lighthouse https://your-domain.com --view

# Load testing (optional)
npx artillery quick --count 10 --num 5 https://your-domain.com
```

### 2. Security Scan
```bash
# Security headers check
curl -I https://your-domain.com

# SSL/TLS test
nmap --script ssl-enum-ciphers -p 443 your-domain.com
```

### 3. Monitoring Setup
- Configure uptime monitoring
- Set up error alerting
- Monitor database performance
- Track user analytics

## 🎯 Production Checklist

- [ ] ✅ Frontend deployed and accessible
- [ ] ✅ Backend API responding correctly
- [ ] ✅ Database connections working
- [ ] ✅ All environment variables configured
- [ ] ✅ HTTPS/SSL enabled
- [ ] ✅ Security headers configured
- [ ] ✅ Performance optimized (< 2s load time)
- [ ] ✅ Error monitoring active
- [ ] ✅ Backup strategy implemented

## 📞 Support

If you encounter deployment issues:
- Check Vercel deployment logs
- Verify environment variables
- Test API endpoints manually
- Review security configurations

---

**🚀 Ready for production deployment!**