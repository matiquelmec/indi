# 🔍 AUDITORÍA DETALLADA: PRELOAD VISIBLE EN TARJETAS EXTERNAS

## 📱 PROBLEMA IDENTIFICADO

**URL afectada:** https://frontindi.vercel.app/card/elena-castillo-2
**Síntoma:** Preload/skeleton visible al abrir tarjetas compartidas
**Duración:** ~1-2 segundos de skeleton antes de mostrar la tarjeta

## 🔬 ANÁLISIS PASO A PASO DEL FLUJO ACTUAL

### 1. **Montaje del Componente App.tsx**
```typescript
useEffect(() => {
  // 🟡 PROBLEMA: Se ejecutan 2 operaciones asíncronas en paralelo
  refetchCardsFromBackend();  // ⏱️ ~500ms-1s - Fetch TODAS las tarjetas
  checkRouting();             // ⏱️ Ejecuta inmediatamente
}, [isAuthenticated, user]);
```

### 2. **Función checkRouting() - Líneas 189-278**
```typescript
const checkRouting = () => {
  const path = window.location.pathname; // "/card/elena-castillo-2"

  // ✅ Detecta correctamente la ruta
  if (path.startsWith('/card/')) {
    cardId = path.split('/card/')[1]; // "elena-castillo-2"
  }

  // 🔴 PROBLEMA: cards array está VACÍO aquí
  let sharedCard = cards.find(c => c.id === cardId); // undefined

  if (sharedCard) {
    // ✅ Nunca se ejecuta porque cards está vacío
  } else {
    // 🔴 SIEMPRE se ejecuta - fetch innecesario
    fetchCardFromBackend(cardId); // ⏱️ +500ms-1s más
  }
};
```

### 3. **Doble Fetch Innecesario**
```typescript
// FETCH #1: refetchCardsFromBackend() - línea 186
// Trae todas las tarjetas del usuario autenticado (innecesario para externos)
const response = await fetch(`${API_URL}/cards`); // ⏱️ 500ms-1s

// FETCH #2: fetchCardFromBackend() - línea 275
// Trae la tarjeta específica que queremos ver
const response = await fetch(`${API_URL}/cards/by-slug/${cardId}`); // ⏱️ +500ms-1s
```

### 4. **Renderizado con card = null**
```typescript
// Mientras se ejecutan los fetches, CardPreview renderiza:
if (!card) {
  return <CardSkeleton mode={mode} />; // 👀 VISIBLE PARA EL USUARIO
}
```

## 🎯 ANÁLISIS DE CAUSA RAÍZ

### **Problema Principal: Race Condition**
1. `refetchCardsFromBackend()` se ejecuta asincrónamente
2. `checkRouting()` se ejecuta inmediatamente cuando `cards = []`
3. Como `cards` está vacío, siempre se llama `fetchCardFromBackend()`
4. Resultado: **doble fetch + 1-2 segundos de skeleton visible**

### **Problemas Secundarios:**
1. **Fetch innecesario**: Para tarjetas externas no necesitamos `refetchCardsFromBackend()`
2. **No hay cache**: Si el usuario recarga, vuelve a hacer fetch
3. **No hay optimización**: No se aprovecha que ya conocemos el slug/ID de la URL

## ✅ SOLUCIONES PROPUESTAS (PASO A PASO)

### **FASE 1: Optimización Conservadora (Sin riesgo)**
Detectar si es una ruta externa y evitar el fetch innecesario de todas las tarjetas:

```typescript
useEffect(() => {
  const path = window.location.pathname;
  const isExternalCard = path.startsWith('/card/') || path.startsWith('/u/');

  if (!isExternalCard) {
    // Solo hacer fetch completo si NO es tarjeta externa
    refetchCardsFromBackend();
  }

  checkRouting();
}, [isAuthenticated, user]);
```

### **FASE 2: Pre-carga Inteligente (Medio riesgo)**
Cargar la tarjeta específica antes del routing:

```typescript
useEffect(() => {
  const path = window.location.pathname;

  if (path.startsWith('/card/')) {
    const cardSlug = path.split('/card/')[1];
    // Pre-cargar tarjeta específica
    preloadSpecificCard(cardSlug);
  } else {
    // Cargar todas las tarjetas para usuarios autenticados
    refetchCardsFromBackend();
  }

  checkRouting();
}, [isAuthenticated, user]);
```

### **FASE 3: Cache Inteligente (Bajo riesgo)**
Implementar cache en localStorage para tarjetas visitadas:

```typescript
const getCardFromCache = (cardId: string) => {
  const cached = localStorage.getItem(`card_cache_${cardId}`);
  if (cached) {
    const { card, timestamp } = JSON.parse(cached);
    // Cache válido por 1 hora
    if (Date.now() - timestamp < 3600000) {
      return card;
    }
  }
  return null;
};
```

## 🚀 IMPLEMENTACIÓN RECOMENDADA

### **Paso 1: Implementación Mínima (SEGURA)**
```typescript
// En App.tsx - línea ~186
useEffect(() => {
  const path = window.location.pathname;
  const isExternalCardView = path.startsWith('/card/') || path.startsWith('/u/');

  if (isAuthenticated && !isExternalCardView) {
    // Solo cargar todas las tarjetas si es usuario autenticado viendo su dashboard
    refetchCardsFromBackend();
  }

  checkRouting();
}, [isAuthenticated, user]);
```

### **Paso 2: Mejorar checkRouting() (SEGURA)**
```typescript
// Agregar cache simple en checkRouting
if (cardId) {
  // Primero verificar cache local
  const cachedCard = getCachedCard(cardId);
  if (cachedCard) {
    setCard(cachedCard);
    setCurrentView('live');
    return;
  }

  // Luego verificar array de cards
  let sharedCard = cards.find(c => c.id === cardId);
  // ... resto igual
}
```

## 📊 RESULTADOS ESPERADOS

### **Antes:**
- ⏱️ 1-2 segundos de skeleton visible
- 🔄 2 requests HTTP innecesarios
- 📱 Experiencia poco profesional

### **Después:**
- ⏱️ <300ms de carga (con cache)
- 🔄 1 request HTTP optimizado
- 📱 Experiencia fluida y profesional

## 🔧 RIESGO DE IMPLEMENTACIÓN

### **RIESGO BAJO** ✅
- Cambios mínimos en lógica existente
- Solo optimización condicional
- No afecta funcionalidad actual

### **IMPACTO POSITIVO** 📈
- Mejora experiencia de usuario
- Reduce carga de servidor
- Optimiza performance general

## 🧪 PLAN DE TESTING

1. **Test rutas externas:** `/card/elena-castillo-2`
2. **Test usuario autenticado:** Dashboard y editor
3. **Test rutas legacy:** `?shareId=123&view=live`
4. **Test navegación:** Back/Forward browser
5. **Test cache:** Recargar página

---

**Recomendación:** Implementar FASE 1 inmediatamente (riesgo cero) y luego evaluar FASE 2.