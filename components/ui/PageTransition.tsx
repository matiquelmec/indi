/**
 * Page Transition Component
 * Elegant transitions between views with INDI branding
 */

import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
  type?: 'create' | 'load' | 'save' | 'general';
}

const PageTransition: React.FC<PageTransitionProps> = ({
  isVisible,
  message = 'Cargando...',
  submessage = 'Un momento por favor',
  type = 'general'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const getIcon = () => {
    switch (type) {
      case 'create':
        return (
          <div className="relative w-16 h-16">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-emerald-400/20 rounded-full animate-pulse"></div>
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-emerald-400 border-r-emerald-400/60 rounded-full animate-spin"></div>
            {/* Inner glow */}
            <div className="absolute inset-2 bg-gradient-to-br from-emerald-400/30 to-blue-500/20 rounded-full animate-pulse"></div>
            {/* Plus icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-emerald-400 font-bold text-2xl">+</div>
            </div>
          </div>
        );
      case 'save':
        return (
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-400/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-blue-400/60 rounded-full animate-spin"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-blue-400/30 to-emerald-500/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-blue-400 font-bold text-xl">💾</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative w-16 h-16">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
            {/* Main ring */}
            <div className="absolute inset-1 border-4 border-slate-700/20 rounded-full"></div>
            {/* Spinning element */}
            <div className="absolute inset-1 border-4 border-transparent border-t-emerald-400 border-r-blue-400 rounded-full animate-spin"></div>
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-emerald-400 font-black text-sm tracking-tight">INDI</span>
            </div>
          </div>
        );
    }
  };

  const getMessages = () => {
    switch (type) {
      case 'create':
        return {
          main: message || 'Creando tu tarjeta',
          sub: submessage || 'Configurando tu espacio digital'
        };
      case 'save':
        return {
          main: message || 'Guardando cambios',
          sub: submessage || 'Sincronizando con la nube'
        };
      default:
        return {
          main: message,
          sub: submessage
        };
    }
  };

  if (!isAnimating) return null;

  const messages = getMessages();

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"></div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, #8b5cf6 0%, transparent 30%),
            radial-gradient(circle at 60% 80%, #06b6d4 0%, transparent 30%)
          `,
          backgroundSize: '200px 200px, 300px 300px, 150px 150px, 250px 250px',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-sm mx-auto">

          {/* Loading Icon */}
          <div className="mb-8 flex justify-center">
            {getIcon()}
          </div>

          {/* Text content */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {messages.main}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {messages.sub}
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-emerald-400/60 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
      `}</style>
    </div>
  );
};

export default PageTransition;