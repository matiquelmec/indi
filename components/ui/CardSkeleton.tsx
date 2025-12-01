/**
 * Card Skeleton Component
 * Elegant skeleton loading for card preview
 */

import React from 'react';

interface CardSkeletonProps {
  mode?: 'preview' | 'live';
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ mode = 'preview' }) => {
  return (
    <div className={`${mode === 'live' ? 'min-h-screen' : ''} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6`}>
      <div className="w-full max-w-md mx-auto">
        {/* Card Container Skeleton */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl animate-pulse">

          {/* Avatar Skeleton */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Name Skeleton */}
          <div className="text-center mb-6 space-y-3">
            <div className="h-8 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg mx-auto w-48 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
            </div>
            <div className="h-5 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-lg mx-auto w-32 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Bio Section Skeleton */}
          <div className="mb-6 space-y-2">
            <div className="h-4 bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
            </div>
            <div className="h-4 bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
            </div>
            <div className="h-4 bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Contact Info Skeleton */}
          <div className="space-y-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Social Links Skeleton */}
          <div className="flex justify-center gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-12 h-12 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
              </div>
            ))}
          </div>

          {/* Save Contact Button Skeleton */}
          <div className="h-12 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center mt-8">
          <div className="text-slate-400 text-sm animate-pulse">
            Preparando tu tarjeta digital...
          </div>
        </div>
      </div>

      {/* Custom CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default CardSkeleton;