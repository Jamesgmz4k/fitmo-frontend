'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle, Zap } from 'lucide-react';

export default function SuccessPage() {
  
  useEffect(() => {
    // Fiesta en la pantalla cuando el pago es exitoso
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#22d3ee']
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
        
        {/* Resplandor de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
            <CheckCircle size={40} className="text-cyan-400" />
          </div>

          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
            ¡Eres Atleta <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Pro</span>!
          </h1>

          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
            Tu suscripción se procesó con éxito. Prepárate para llevar tus entrenamientos al siguiente nivel con analítica avanzada.
          </p>

          <Link
            href="/"
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 p-4 rounded-xl font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all text-white flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            <Zap size={16} fill="currentColor" /> Ir a mi Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}