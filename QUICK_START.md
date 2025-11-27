# ⚡ INDI Digital Cards - Quick Start

> Get up and running in under 5 minutes!

## 🚀 Local Development

### 1. Prerequisites
```bash
# Required versions
Node.js >= 18.0.0
npm >= 9.0.0
```

### 2. Installation
```bash
# Clone and install
git clone <repository-url>
cd indi-final
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup
```bash
# Copy environment files
cp .env.example .env.local
cp backend/.env.development.example backend/.env.development

# Configure your Supabase credentials in:
# - backend/.env.development
```

### 4. Start Development
```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend
cd backend && npm run dev
```

🎉 **You're ready!**
- Frontend: http://localhost:3000
- Backend: http://localhost:5003

## 🌐 Production Deployment

### 1. Quick Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

### 2. Environment Variables for Vercel
```env
# Frontend
VITE_APP_MODE=production
VITE_API_URL=https://your-backend.vercel.app/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-64-char-secret
```

## 📁 Key Files

```
📦 Project Structure
├── 🎨 Frontend
│   ├── App.tsx              # Main app component
│   ├── components/          # UI components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── editor/          # Card editor
│   │   └── card/            # Card display
│   ├── lib/urlUtils.ts      # URL utilities
│   └── constants.ts         # App constants
├── ⚡ Backend
│   ├── api/index.ts         # Production API (Vercel)
│   └── src/server-functional.js # Development server
└── 📄 Config
    ├── vercel.json          # Deployment config
    ├── package.json         # Dependencies
    └── .env.example         # Environment template
```

## 🔧 Development Commands

```bash
# Frontend
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm test           # Run tests

# Backend
cd backend
npm run dev         # Start development server
npm run build       # Build TypeScript
npm test           # Run backend tests
```

## 🎯 Core Features

### 📇 Digital Cards
- Professional card templates
- Real-time editing
- Custom branding
- Social media integration

### 📊 Analytics
- View tracking
- Engagement metrics
- Performance insights
- Export capabilities

### 🔗 Sharing
- SEO-friendly URLs
- Social media optimization
- QR code generation
- Contact export

## 🛠️ Development Workflow

### 1. Creating New Features
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Test locally
npm test

# Commit and push
git commit -m "Add: new feature"
git push origin feature/new-feature
```

### 2. Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "component name"
```

### 3. Production Build
```bash
# Test production build locally
npm run build
npm run preview

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

## 🚨 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Use different port
PORT=3001 npm run dev
```

### Environment Variables Not Loading
```bash
# Check file exists
ls -la .env.local

# Restart development server
npm run dev
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist .next
npm install
npm run build
```

### Database Connection Issues
```bash
# Test Supabase connection
curl -H "apikey: YOUR_KEY" \
     https://your-project.supabase.co/rest/v1/cards
```

## 📚 Next Steps

1. **Customize Design** - Update themes in `components/`
2. **Add Features** - Extend functionality in `App.tsx`
3. **Configure Analytics** - Set up tracking in `constants.ts`
4. **Deploy** - Follow deployment guide in `DEPLOYMENT.md`
5. **Monitor** - Set up production monitoring

## 🎉 You're All Set!

Your INDI Digital Cards platform is ready for development and deployment. Check out:

- 📖 **Full Documentation**: `README.md`
- 🚀 **Deployment Guide**: `DEPLOYMENT.md`
- 💡 **Best Practices**: Follow the project structure

---

**Happy coding! 🚀**