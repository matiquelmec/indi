<div align="center">
<img width="1200" height="475" alt="INDI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# INDI - Digital Card Platform 🚀

**Estado:** En migración a arquitectura de producción  
**Versión:** 2.0 (Backend + Frontend)

## ⚡ Inicio Rápido

**Opción 1: Script Automático (Recomendado)**
```bash
# Ejecutar script de desarrollo
double-click start-dev.bat
```

**Opción 2: Manual**
```bash
# 1. Frontend
npm install
npm run dev

# 2. Backend (en otra terminal)
cd backend
npm install
npm run dev
```

## 🌐 URLs de Desarrollo
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **API Health:** http://localhost:5000/api/health

## 🔧 Configuración

### Variables de Entorno
1. **Frontend** (`.env.local`):
   ```bash
   VITE_GEMINI_API_KEY=tu-gemini-api-key
   VITE_API_URL=http://localhost:5000/api
   ```

2. **Backend** (`backend/.env.development`):
   ```bash
   NODE_ENV=development
   PORT=5000
   GEMINI_API_KEY=tu-gemini-api-key
   JWT_SECRET=tu-jwt-secret
   ```

## 🎯 Funcionalidades Actuales

✅ **Funciona (Frontend)**
- Interfaz completa de usuario
- Editor de tarjetas
- Preview en tiempo real
- Temas personalizables
- Simulación de pagos

✅ **Nuevo (Backend)**
- API REST completa
- Autenticación JWT
- Rutas protegidas
- Manejo de errores
- Logging estructurado

⚠️ **En Desarrollo**
- Conexión frontend-backend
- Base de datos real
- Sistema de pagos real
- Tests automatizados

## 🔄 Estado de Migración

### ✅ Completado
- [x] Migración a Vite
- [x] Estructura del backend
- [x] Servicios API del frontend
- [x] Rutas del backend
- [x] Sistema de autenticación
- [x] Middleware de seguridad

### 🔄 En Progreso
- [ ] Integración frontend-backend
- [ ] Tests de integración
- [ ] Base de datos PostgreSQL
- [ ] Sistema de archivos (S3)

### 📋 Próximos Pasos
- [ ] Deploy a staging
- [ ] CI/CD pipeline
- [ ] Monitoreo y logs
- [ ] Deploy a producción

## 📁 Estructura del Proyecto

```
Indi Final/
├── 📱 Frontend (React + Vite)
│   ├── components/         # Componentes UI
│   ├── services/          # API calls
│   ├── lib/              # Utilidades
│   └── types.ts          # TypeScript types
│
├── 🔧 Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, logging, etc
│   │   ├── config/       # DB, Redis config
│   │   └── utils/        # Helpers
│   └── package.json
│
├── 🐳 DevOps
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .env.example
│
└── 📚 Documentación
    ├── PLAN_PRODUCCION.md
    ├── QUICK_START.md
    └── README.md (este archivo)
```

## 🧪 Testing

```bash
# Frontend (cuando esté listo)
npm test

# Backend (cuando esté listo)
cd backend
npm test
```

## 🚨 Problemas Conocidos

1. **API Keys expuestas**: Mover GEMINI_API_KEY al backend
2. **Sin base de datos**: Actualmente usa localStorage + mock
3. **Sin autenticación real**: Solo simulación en frontend
4. **Sin sistema de pagos real**: Mock de Stripe

## 🔒 Seguridad

⚠️ **NO SUBIR A PRODUCCIÓN** sin resolver:
- [ ] Mover API keys al backend
- [ ] Implementar base de datos real
- [ ] Configurar HTTPS
- [ ] Implementar rate limiting
- [ ] Agregar validación de inputs

## 📞 Soporte

- **Issues**: Ver `PLAN_PRODUCCION.md` para roadmap completo
- **Quick Start**: Ver `QUICK_START.md` para guía rápida
- **Desarrollo**: Usar `start-dev.bat` para ambiente local

---

**Última actualización:** 26/11/2024  
**Desarrollado por:** Claude Code + Equipo INDI
