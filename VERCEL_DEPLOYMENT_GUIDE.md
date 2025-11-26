# 🚀 INDI Platform - Guía de Deployment en Vercel

## ✅ Configuración Completa para Vercel

He configurado tu proyecto para funcionar perfectamente en Vercel con dos deployments separados:

### 📁 **Estructura de Deployment:**
- **Frontend:** Proyecto principal (React + Vite)
- **Backend:** Carpeta `backend/` como proyecto separado

## 🚀 **Pasos para Deploy en Vercel**

### 1. **Deploy del Backend (API)**

```bash
# 1. Ve a vercel.com y conecta tu cuenta de GitHub
# 2. Importa el proyecto
# 3. Configura como sigue:

Project Name: indi-backend
Root Directory: backend/
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Variables de Entorno del Backend:**
```
NODE_ENV=production
SUPABASE_URL=https://ikrpcaahwyibclvxbgtn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcnBjYWFod3lpYmNsdnhiZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NjYzMzcsImV4cCI6MjA0NjQ0MjMzN30.o2MYC5WDMR8CjAj5iCPGVs0eWLPXgF6YHbqJ-jnZcXM
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcnBjYWFod3lpYmNsdnhiZ3RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDg2NjMzNywiZXhwIjoyMDQ2NDQyMzM3fQ.Rno_rKhfA9XGZEHmKTQGmzxTTwfLNsmrU1ycv-0d5yE
```

### 2. **Deploy del Frontend**

```bash
# 1. Importa el proyecto principal (raíz)
# 2. Configura como sigue:

Project Name: indi-frontend
Root Directory: ./
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Variables de Entorno del Frontend:**
```
VITE_APP_MODE=real
VITE_API_URL=https://indi-backend.vercel.app/api
VITE_BACKEND_URL=https://indi-backend.vercel.app
VITE_SUPABASE_URL=https://ikrpcaahwyibclvxbgtn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcnBjYWFod3lpYmNsdnhiZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NjYzMzcsImV4cCI6MjA0NjQ0MjMzN30.o2MYC5WDMR8CjAj5iCPGVs0eWLPXgF6YHbqJ-jnZcXM
```

**⚠️ IMPORTANTE:** Reemplaza `indi-backend.vercel.app` con tu URL real del backend.

## 📋 **Archivos Creados para Vercel:**

### ✅ **Frontend:**
- `vercel.json` - Configuración de rutas y variables
- `.env.production` - Variables de producción
- `vite.config.ts` - Optimizado para producción

### ✅ **Backend:**
- `backend/vercel.json` - Configuración para Node.js
- `backend/.env.production` - Variables del backend

## 🔧 **Configuraciones Aplicadas:**

### Frontend Optimizado:
✅ **Build optimizado** con chunks separados
✅ **Proxy solo en desarrollo** (no en producción)
✅ **Variables de entorno** configuradas para Vercel
✅ **Rutas SPA** configuradas correctamente

### Backend Optimizado:
✅ **Runtime Node.js 18** configurado
✅ **Rutas API** mapeadas correctamente
✅ **Variables de Supabase** incluidas
✅ **CORS** configurado para frontend

## 🚀 **Proceso de Deploy Completo:**

### Paso 1: Deploy Backend
1. Ve a [vercel.com](https://vercel.com)
2. "Import Project" → Selecciona tu repositorio
3. **Root Directory:** `backend`
4. Agrega las variables de entorno del backend
5. Deploy

### Paso 2: Obtener URL del Backend
- Copia la URL del backend desplegado (ej: `indi-backend-abc123.vercel.app`)

### Paso 3: Deploy Frontend
1. "Import Project" → Mismo repositorio
2. **Root Directory:** `./` (raíz)
3. En variables de entorno, usa la URL real del backend:
   ```
   VITE_API_URL=https://tu-backend-real.vercel.app/api
   ```
4. Deploy

## 🧪 **Testing Post-Deploy:**

```bash
# Verificar backend
curl https://tu-backend.vercel.app/api/health

# Verificar frontend
curl https://tu-frontend.vercel.app

# Verificar integración
# Accede al frontend y prueba login/registro
```

## 📊 **URLs Finales:**

```
Frontend: https://indi-frontend-[hash].vercel.app
Backend:  https://indi-backend-[hash].vercel.app/api
Database: https://ikrpcaahwyibclvxbgtn.supabase.co (ya configurado)
```

## 🔒 **Seguridad en Producción:**

### ✅ **Ya Configurado:**
- HTTPS automático en Vercel
- Variables de entorno seguras
- CORS configurado
- Credenciales de Supabase válidas

### ⚠️ **Recomendaciones Adicionales:**
- Configurar dominio personalizado
- Activar Vercel Analytics
- Configurar monitoring con Sentry

## 🆘 **Troubleshooting:**

### Error "API not found":
- Verificar que `VITE_API_URL` apunte a la URL correcta del backend

### Error de CORS:
- Verificar que el frontend esté en la lista de orígenes permitidos

### Error de Supabase:
- Verificar que las variables de entorno estén correctamente configuradas

---

## 🎉 **¡Listo para Vercel!**

Tu proyecto está **completamente configurado** para Vercel. Solo sigue los pasos de deployment y tendrás tu aplicación funcionando en producción.

**Orden de deployment:**
1. 🔧 Backend primero
2. 📱 Frontend segundo (usando URL del backend)
3. ✅ Testing completo

---

**Última actualización:** 26/11/2024
**Estado:** 🟢 LISTO PARA VERCEL