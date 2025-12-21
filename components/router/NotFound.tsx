import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
    onGoHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in text-white">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/20 border border-slate-800 relative">
                <span className="text-4xl">🤔</span>
                <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-pulse"></div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                Tarjeta No Encontrada
            </h1>

            <p className="text-slate-400 text-lg max-w-md mb-8 leading-relaxed">
                Lo sentimos, no pudimos encontrar esta tarjeta. Es posible que haya sido eliminada o que la dirección (URL) sea incorrecta.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-900 text-slate-300 font-medium transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Volver atrás
                </button>

                <button
                    onClick={onGoHome}
                    className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2"
                >
                    <Home size={18} />
                    Ir al Inicio
                </button>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-900 w-full max-w-sm">
                <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold">INDI DIGITAL CARDS</p>
            </div>
        </div>
    );
};
