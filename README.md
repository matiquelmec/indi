# 🚀 INDI Digital Cards - Production Ready

> Professional Digital Business Card Platform with Real-time Analytics

## ✨ Features

- 🎨 **Beautiful Card Design** - Professional templates with customization
- 📊 **Real-time Analytics** - Track views, clicks, and engagement 
- 🔗 **Smart Sharing** - SEO-friendly URLs and social sharing
- 📱 **Mobile Optimized** - Perfect experience on all devices
- 🔐 **Secure & Fast** - Production-ready security and performance

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express (Vercel Serverless)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Frontend & API)

## 🚀 Quick Start

### Development
```bash
# Clone repository
git clone <repository-url>
cd indi-final

# Install dependencies
npm install
cd backend && npm install

# Start development servers
npm run dev          # Frontend (localhost:3000)
cd backend && npm run dev  # Backend (localhost:5003)
```

### Production Deployment

1. **Configure Environment Variables** in Vercel:
   ```bash
   # Copy from backend/.env.production.example
   NODE_ENV=production
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-service-key
   JWT_SECRET=your-jwt-secret-64-chars
   # ... see full list in .env.production.example
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

## 📁 Project Structure

```
📦 INDI Digital Cards
├── 🎨 Frontend/
│   ├── components/     # React components
│   ├── lib/           # Utilities (urlUtils, i18n)
│   ├── constants.ts   # App constants
│   └── types.ts       # TypeScript types
├── ⚡ Backend/
│   ├── api/           # Vercel API routes
│   └── src/           # Development server
├── 📄 Documentation/
│   ├── README.md      # This file
│   ├── DEPLOYMENT.md  # Deployment guide
│   └── QUICK_START.md # Quick start guide
└── 🔧 Config/
    ├── vercel.json    # Vercel configuration
    ├── package.json   # Dependencies
    └── .env.example   # Environment template
```

## 🔐 Security Features

- ✅ **Environment Protection** - Secrets never exposed to frontend
- ✅ **Security Headers** - XSS, CSRF, Content Security Policy
- ✅ **Input Validation** - All user inputs sanitized
- ✅ **Rate Limiting** - API protection against abuse
- ✅ **HTTPS Only** - Secure communication

## 📊 Performance

- ⚡ **Fast Loading** - < 2s initial load time
- 🎯 **SEO Optimized** - Perfect Lighthouse scores
- 📱 **Mobile First** - Responsive design
- 🗜️ **Optimized Bundle** - Tree-shaking and minification

## 🛠️ Scripts

```bash
# Development
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build

# Testing
npm test           # Run tests
npm run test:watch # Watch mode

# Linting
npm run lint       # Check code quality
npm run lint:fix   # Fix lint issues
```

## 📋 Environment Variables

### Frontend (.env.production)
```env
VITE_APP_MODE=production
VITE_API_URL=https://your-backend-url/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Vercel Environment)
```env
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-64-char-secret
# See backend/.env.production.example for full list
```

## 🚨 Security Checklist

- [ ] ✅ All environment files added to .gitignore
- [ ] ✅ Production secrets configured in Vercel
- [ ] ✅ Database RLS policies enabled
- [ ] ✅ API rate limiting configured
- [ ] ✅ Security headers implemented
- [ ] ✅ Input validation on all endpoints

## 📈 Monitoring

- **Analytics**: Built-in engagement tracking
- **Performance**: Vercel Analytics integration
- **Errors**: Console logging (upgrade to Sentry for production)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- 📧 Email: support@indi.com
- 📱 Create GitHub Issue
- 📖 Check Documentation

---

**Built with ❤️ for professional networking**

*Ready for production • Scalable • Secure*