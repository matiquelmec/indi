import React from 'react';

interface CardSkeletonProps {
  mode?: 'preview' | 'live';
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ mode = 'live' }) => {
  const isLive = mode === 'live';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content skeleton */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          {/* Profile section skeleton */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Avatar skeleton */}
            <div className="w-28 h-28 bg-slate-800/50 rounded-full mx-auto mb-4 animate-pulse backdrop-blur-sm"></div>

            {/* Name skeleton */}
            <div className="h-8 bg-slate-800/50 rounded-lg w-48 mx-auto mb-2 animate-pulse backdrop-blur-sm"></div>

            {/* Title skeleton */}
            <div className="h-5 bg-slate-800/30 rounded-lg w-32 mx-auto mb-6 animate-pulse backdrop-blur-sm"></div>

            {/* Action buttons skeleton */}
            <div className="flex gap-4 justify-center">
              <div className="w-14 h-14 bg-slate-800/30 rounded-full animate-pulse backdrop-blur-sm"></div>
              <div className="w-40 h-14 bg-slate-800/50 rounded-full animate-pulse backdrop-blur-sm"></div>
            </div>
          </div>

          {/* Info card skeleton */}
          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-7">
            {/* Bio section */}
            <div className="mb-8">
              <div className="h-4 bg-slate-800/30 rounded w-20 mb-3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-800/20 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-800/20 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-slate-800/20 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>

            {/* Contact info skeleton */}
            <div className="space-y-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-slate-800/30 rounded animate-pulse"></div>
                  <div className={`h-4 bg-slate-800/20 rounded animate-pulse`} style={{ width: `${60 + i * 10}%` }}></div>
                </div>
              ))}
            </div>

            {/* Social links skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-slate-800/30 rounded w-24 mb-3 animate-pulse"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-800/20 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
              ))}
            </div>
          </div>

          {/* INDI branding skeleton */}
          <div className="text-center mt-8">
            <div className="h-3 bg-slate-800/20 rounded w-20 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Refined loading indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/60 backdrop-blur-sm rounded-full border border-slate-700/50">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
          <span className="text-slate-400 text-sm font-medium">Cargando tarjeta</span>
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;