'use client';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import posthog from 'posthog-js';

export default function Paywall({ isPro }: { isPro?: boolean }) {
  const router = useRouter();

  // Si el usuario ya pagó, no le mostramos este anuncio
  if (isPro) return null; 

  return (
    <div className="bg-gradient-to-r from-violet-600/10 to-cyan-600/10 border border-violet-500/20 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
      <div>
        <h3 className="text-xl font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
          <Zap className="text-violet-400" fill="currentColor" size={20} />
          Desbloquea Fitmo Pro
        </h3>
        <p className="text-slate-400 text-sm mt-1 font-medium">Obtén acceso a tus métricas avanzadas y el mapa de calor muscular.</p>
      </div>
      <button
        onClick={() => { posthog.capture('paywall_cta_clicked'); router.push('/pro'); }}
        className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-transform hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
      >
        Ver Planes
      </button>
    </div>
  );
}