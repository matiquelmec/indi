# 🚀 GUÍA RÁPIDA - INDI Production Setup

## ⚡ Inicio Rápido con Docker

```bash
# 1. Clonar y navegar al proyecto
cd "Indi Final"

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 3. Iniciar todo con Docker
docker-compose up -d

# 4. Ver los logs
docker-compose logs -f
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- pgAdmin: http://localhost:5050 (admin@indi.com / admin)

## 🛠️ Desarrollo Sin Docker

### Backend
```bash
cd backend
npm install
# Configurar PostgreSQL y Redis localmente
# Actualizar .env con conexiones locales
npm run dev
```

### Frontend
```bash
# Raíz del proyecto
npm install
npm run dev
```

## 📝 Tareas Pendientes Críticas

### 🔴 URGENTE (Hacer antes de producción)
1. **Implementar autenticación real** - El código base está listo en `backend/src`
2. **Mover Gemini API al backend** - NUNCA exponer en cliente
3. **Integrar Stripe real** - Reemplazar simulación actual
4. **Configurar HTTPS** - Certificado SSL obligatorio

### 🟡 IMPORTANTE
1. Migrar completamente a Vite (eliminar react-scripts)
2. Implementar tests (mínimo 70% cobertura)
3. Configurar CI/CD pipeline
4. Optimizar bundle del frontend

## 🔐 Seguridad Inmediata

```bash
# Generar secrets seguros
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para SESSION_SECRET

# NUNCA commitear .env real
echo ".env" >> .gitignore
```

## 📦 Estructura Creada

```
Indi Final/
├── backend/               # ✅ API Node.js/Express
│   ├── src/
│   │   ├── server.ts     # ✅ Servidor con seguridad
│   │   └── database/
│   │       └── schema.sql # ✅ BD completa
│   ├── Dockerfile        # ✅ Listo para producción
│   └── package.json      # ✅ Dependencias completas
├── docker-compose.yml    # ✅ Stack completo
├── .env.example         # ✅ Template seguro
├── PLAN_PRODUCCION.md   # ✅ Plan detallado
└── QUICK_START.md       # ✅ Esta guía
```

## 💡 Comandos Útiles

```bash
# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio
docker-compose logs -f backend

# Ejecutar migraciones
docker-compose exec backend npm run migrate

# Acceder a PostgreSQL
docker-compose exec postgres psql -U indi_user -d indi_db

# Limpiar todo
docker-compose down -v
```

## ⚠️ NO SUBIR A PRODUCCIÓN SIN:
- [ ] Autenticación real implementada
- [ ] API Keys movidas al backend
- [ ] Stripe configurado
- [ ] Tests pasando
- [ ] HTTPS configurado
- [ ] Variables de producción configuradas

---

**¿Necesitas ayuda?** Revisa `PLAN_PRODUCCION.md` para el plan completo.