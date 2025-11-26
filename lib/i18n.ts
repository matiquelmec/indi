import { Language } from '../types';

type TranslationKeys = {
  nav: {
    dashboard: string;
    editor: string;
    logout: string;
    login: string;
    getStarted: string;
  };
  landing: {
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      cta: string;
      secondaryCta: string;
    };
    features: {
      title: string;
      list: {
        title: string;
        desc: string;
      }[];
    };
  };
  auth: {
    welcome: string;
    subtitle: string;
    googleBtn: string;
    emailLabel: string;
    passwordLabel: string;
    loginBtn: string;
    loggingIn: string;
    noAccount: string;
    signUp: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    createNew: string;
    yourCards: string;
    noCards: string;
    startBuilding: string;
    createFirst: string;
    performance: string;
    draft: string;
    published: string;
    actions: {
      preview: string;
      edit: string;
      delete: string;
      deleteConfirm: string;
      upgrade: string;
    };
    subscription: {
      trialActive: string;
      daysLeft: string;
      expired: string;
      proActive: string;
    };
  };
  editor: {
    back: string;
    saved: string;
    saving: string;
    publish: string;
    publishing: string;
    tabs: {
      profile: string;
      design: string;
      links: string;
    };
    profile: {
      photo: string;
      photoDesc: string;
      upload: string;
      firstName: string;
      lastName: string;
      jobTitle: string;
      company: string;
      bio: string;
      aiButton: string;
      aiThinking: string;
      contactGroup: string;
      email: string;
      phone: string;
      location: string;
    };
    design: {
      themes: string;
      brand: string;
      brandDesc: string;
      atmosphere: string;
      layout: string;
    };
    links: {
      title: string;
      add: string;
      empty: string;
      emptyDesc: string;
      platform: string;
      label: string;
      url: string;
    };
  };
  preview: {
    saveContact: string;
    about: string;
    connect: string;
    poweredBy: string;
  };
  share: {
    title: string;
    subtitle: string;
    scan: string;
    publicLink: string;
    saveQr: string;
    openPublic: string;
    copied: string;
    copiedError: string;
  };
  analytics: {
    totalViews: string;
    totalInteractions: string;
    conversionRate: string;
    performanceOverview: string;
    days: Record<string, string>;
  };
  pricing: {
    title: string;
    subtitle: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    processing: string;
    secure: string;
  };
};

export const translations: Record<Language, TranslationKeys> = {
  es: {
    nav: {
      dashboard: "Mis Tarjetas",
      editor: "Editor",
      logout: "Salir",
      login: "Iniciar Sesión",
      getStarted: "Empezar Gratis"
    },
    landing: {
      hero: {
        badge: "Plataforma de Identidad Digital",
        title: "Tu Presentación Profesional, Elevada.",
        subtitle: "Crea tarjetas digitales de alto impacto que convierten contactos en clientes. Diseño inteligente, analíticas reales y 100% móvil.",
        cta: "Comenzar Prueba Gratis",
        secondaryCta: "Ver Demo en Vivo"
      },
      features: {
        title: "Todo lo que necesitas para destacar",
        list: [
          { title: "Diseño Inteligente", desc: "Elige tu color de marca y nuestra IA genera paletas de contraste perfecto." },
          { title: "Analíticas Reales", desc: "Mide quién ve tu tarjeta y cuántos guardan tu contacto." },
          { title: "Compartir sin Fricción", desc: "QR dinámico, link personalizado y descarga de vCard en un clic." }
        ]
      }
    },
    auth: {
      welcome: "Bienvenido a INDI",
      subtitle: "Ingresa para gestionar tu identidad digital",
      googleBtn: "Continuar con Google",
      emailLabel: "Correo Electrónico",
      passwordLabel: "Contraseña",
      loginBtn: "Entrar al Dashboard",
      loggingIn: "Iniciando...",
      noAccount: "¿No tienes cuenta?",
      signUp: "Regístrate gratis"
    },
    dashboard: {
      title: "Panel de Control",
      subtitle: "Gestiona tus identidades digitales. Crea, edita y monitorea el rendimiento de tus tarjetas en un solo lugar.",
      createNew: "Crear Nueva Tarjeta",
      yourCards: "Tus Tarjetas",
      noCards: "No se encontraron tarjetas",
      startBuilding: "Comienza a construir tu presencia digital hoy.",
      createFirst: "Crea tu primera tarjeta",
      performance: "Rendimiento Global",
      draft: "Borrador",
      published: "Pública",
      actions: {
        preview: "Vista Previa",
        edit: "Editar",
        delete: "Borrar",
        deleteConfirm: "¿Estás seguro de que quieres eliminar esta tarjeta?",
        upgrade: "Activar Plan"
      },
      subscription: {
        trialActive: "Prueba Gratuita",
        daysLeft: "días restantes",
        expired: "Expirada",
        proActive: "Plan PRO Activo"
      }
    },
    editor: {
      back: "Panel",
      saved: "Guardado",
      saving: "Guardando...",
      publish: "Publicar Tarjeta",
      publishing: "Publicando...",
      tabs: {
        profile: "Perfil",
        design: "Diseño",
        links: "Enlaces"
      },
      profile: {
        photo: "Foto de Perfil",
        photoDesc: "Una buena foto genera confianza.",
        upload: "Subir Imagen",
        firstName: "Nombre",
        lastName: "Apellido",
        jobTitle: "Cargo / Título",
        company: "Empresa",
        bio: "Biografía Profesional",
        aiButton: "Mejorar con IA",
        aiThinking: "Pensando...",
        contactGroup: "Información de Contacto",
        email: "Email",
        phone: "Teléfono",
        location: "Ubicación"
      },
      design: {
        themes: "Temas Profesionales",
        brand: "Identidad de Marca",
        brandDesc: "Color Principal",
        atmosphere: "Atmósfera",
        layout: "Estructura"
      },
      links: {
        title: "Tu Ecosistema Digital",
        add: "Agregar Enlace",
        empty: "No hay enlaces agregados aún.",
        emptyDesc: "Agrega tus redes sociales para conectar.",
        platform: "Plataforma",
        label: "Etiqueta",
        url: "URL"
      }
    },
    preview: {
      saveContact: "Guardar Contacto",
      about: "Sobre Mí",
      connect: "Conectar",
      poweredBy: "Creado con INDI"
    },
    share: {
      title: "¡Tarjeta Publicada!",
      subtitle: "Tu identidad digital ya está en línea.",
      scan: "Escanea para guardar contacto",
      publicLink: "Enlace Público",
      saveQr: "Guardar QR",
      openPublic: "Ver Página Pública",
      copied: "¡Copiado!",
      copiedError: "Error al copiar"
    },
    analytics: {
      totalViews: "Vistas Totales",
      totalInteractions: "Interacciones",
      conversionRate: "Tasa de Conversión",
      performanceOverview: "Resumen de Rendimiento",
      days: {
        'Mon': 'Lun',
        'Tue': 'Mar',
        'Wed': 'Mié',
        'Thu': 'Jue',
        'Fri': 'Vie',
        'Sat': 'Sáb',
        'Sun': 'Dom'
      }
    },
    pricing: {
      title: "Desbloquea todo el potencial",
      subtitle: "Mantén tu tarjeta activa y accede a funciones premium.",
      price: "$4.990",
      period: "CLP / Semestral",
      features: [
        "Tarjeta Digital activa 24/7",
        "Ediciones ilimitadas en tiempo real",
        "Analíticas avanzadas de visitas",
        "Sin marca de agua (Próximamente)",
        "Soporte prioritario"
      ],
      cta: "Pagar y Activar",
      processing: "Procesando pago...",
      secure: "Pago 100% seguro vía MercadoPago / Stripe"
    }
  },
  en: {
    nav: {
      dashboard: "My Cards",
      editor: "Editor",
      logout: "Logout",
      login: "Login",
      getStarted: "Start Free"
    },
    landing: {
      hero: {
        badge: "Digital Identity Platform",
        title: "Your Professional Presence, Elevated.",
        subtitle: "Create high-impact digital cards that convert contacts into clients. Smart design, real analytics, and 100% mobile.",
        cta: "Start Free Trial",
        secondaryCta: "View Live Demo"
      },
      features: {
        title: "Everything you need to stand out",
        list: [
          { title: "Smart Design", desc: "Choose your brand color and our AI generates perfectly contrasted palettes." },
          { title: "Real Analytics", desc: "Track who views your card and how many save your contact." },
          { title: "Frictionless Sharing", desc: "Dynamic QR, custom link, and one-click vCard download." }
        ]
      }
    },
    auth: {
      welcome: "Welcome back",
      subtitle: "Login to manage your digital identity",
      googleBtn: "Continue with Google",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      loginBtn: "Enter Dashboard",
      loggingIn: "Logging in...",
      noAccount: "No account?",
      signUp: "Sign up free"
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Manage your digital identities. Create, edit, and track the performance of your cards in one place.",
      createNew: "Create New Card",
      yourCards: "Your Cards",
      noCards: "No cards found",
      startBuilding: "Start building your digital presence today.",
      createFirst: "Create your first card",
      performance: "Global Performance",
      draft: "Draft",
      published: "Published",
      actions: {
        preview: "Preview",
        edit: "Edit",
        delete: "Delete",
        deleteConfirm: "Are you sure you want to delete this card?",
        upgrade: "Activate Plan"
      },
      subscription: {
        trialActive: "Free Trial",
        daysLeft: "days left",
        expired: "Expired",
        proActive: "PRO Plan Active"
      }
    },
    editor: {
      back: "Dashboard",
      saved: "Saved",
      saving: "Saving...",
      publish: "Publish Card",
      publishing: "Publishing...",
      tabs: {
        profile: "Profile",
        design: "Design",
        links: "Links"
      },
      profile: {
        photo: "Profile Photo",
        photoDesc: "Professional headshots build trust.",
        upload: "Upload Image",
        firstName: "First Name",
        lastName: "Last Name",
        jobTitle: "Job Title",
        company: "Company",
        bio: "Professional Bio",
        aiButton: "AI Enhance",
        aiThinking: "Thinking...",
        contactGroup: "Contact Info",
        email: "Email",
        phone: "Phone",
        location: "Location"
      },
      design: {
        themes: "Professional Themes",
        brand: "Brand Identity",
        brandDesc: "Primary Brand Color",
        atmosphere: "Atmosphere",
        layout: "Layout Structure"
      },
      links: {
        title: "Your Digital Ecosystem",
        add: "Add Link",
        empty: "No links added yet.",
        emptyDesc: "Add your social media to connect.",
        platform: "Platform",
        label: "Label",
        url: "URL"
      }
    },
    preview: {
      saveContact: "Save Contact",
      about: "About",
      connect: "Connect",
      poweredBy: "Powered by INDI"
    },
    share: {
      title: "Card Published!",
      subtitle: "Your digital identity is now online.",
      scan: "Scan to save contact instantly",
      publicLink: "Public Link",
      saveQr: "Save QR",
      openPublic: "Open Public Page",
      copied: "Copied!",
      copiedError: "Copy Error"
    },
    analytics: {
      totalViews: "Total Views",
      totalInteractions: "Total Interactions",
      conversionRate: "Conversion Rate",
      performanceOverview: "Performance Overview",
      days: {
        'Mon': 'Mon',
        'Tue': 'Tue',
        'Wed': 'Wed',
        'Thu': 'Thu',
        'Fri': 'Fri',
        'Sat': 'Sat',
        'Sun': 'Sun'
      }
    },
    pricing: {
      title: "Unlock Full Potential",
      subtitle: "Keep your card active and access premium features.",
      price: "$4,990",
      period: "CLP / 6 Months",
      features: [
        "Digital Card active 24/7",
        "Unlimited real-time edits",
        "Advanced visitor analytics",
        "Remove branding (Coming soon)",
        "Priority support"
      ],
      cta: "Pay & Activate",
      processing: "Processing payment...",
      secure: "100% secure payment via Stripe/MercadoPago"
    }
  }
};