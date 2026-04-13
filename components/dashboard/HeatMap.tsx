'use client';

import { Flame, Activity, CheckCircle, Lock, Zap } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importamos Link para que funcione igual
import { apiClient } from '../../lib/apiClient';

interface HeatMapItem {
  muscle: string;
  recovery: number;
  status: string;
  lastTrained: string;
}

export default function HeatMap({ isPro }: { isPro?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [heatMapData, setHeatMapData] = useState<HeatMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatMap = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const res = await apiClient(`/api/heatmap/?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setHeatMapData(data);
        }
      } catch (error) {
        console.error("Error cargando el mapa de calor:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchHeatMap();
    }
  }, [session]);

  const getProgressColor = (recovery: number) => {
    if (recovery <= 30) return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    if (recovery <= 70) return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
  };

  const getIcon = (recovery: number) => {
    if (recovery <= 30) return <Flame size={16} className="text-red-400" />;
    if (recovery <= 70) return <Activity size={16} className="text-yellow-400" />;
    return <CheckCircle size={16} className="text-emerald-400" />;
  };

  const HeatMapContent = () => (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 w-full h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">
            Mapa de Calor <span className="text-violet-500">Muscular</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">Estado de recuperación en tiempo real</p>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
        {heatMapData.map((item, index) => (
          <div key={index} className="group">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                {getIcon(item.recovery)}
                <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  {item.muscle}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-400 block">{item.lastTrained}</span>
                <span className="text-xs font-bold text-white">{item.status} ({item.recovery}%)</span>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(item.recovery)}`}
                style={{ width: `${item.recovery}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-slate-400 text-center py-10 text-xs uppercase tracking-widest font-bold">Analizando fibras musculares...</div>;
  }

  // ==========================================
  // CLON EXACTO DEL DISEÑO DE ANALÍTICA PRO
  // ==========================================
  if (!isPro) {
    return (
      <section className="relative bg-white/[0.02] rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden h-[380px] flex flex-col items-center justify-center p-6 w-full">
        {/* El contenido real borroso de fondo */}
        <div className="absolute inset-0 blur-md opacity-20 pointer-events-none select-none scale-95">
          <HeatMapContent />
        </div>

        {/* La caja de bloqueo con los mismos estilos de tu código */}
        <div className="relative z-10 flex flex-col items-center text-center p-8 bg-[#050505]/90 rounded-[2.5rem] border border-violet-500/20 backdrop-blur-xl w-full h-full justify-center shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shrink-0">
            <Lock size={28} className="text-violet-400" />
          </div>

          <h3 className="text-lg font-black text-white italic mb-3 tracking-tighter uppercase text-center shrink-0">Mapa de Calor Pro</h3>

          <p className="text-[11px] text-slate-400 mb-8 leading-relaxed font-medium shrink-0 max-w-[280px]">
            Visualiza el estado de recuperación exacto de cada fibra muscular y evita el sobreentrenamiento.
          </p>

          <Link
            href="/pro"
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 p-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase hover:scale-[1.02] transition-transform text-white flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] shrink-0"
          >
            <Zap size={14} fill="currentColor" /> Convertirme en Pro
          </Link>
        </div>
      </section>
    );
  }

  // Caso: Es Pro pero no tiene datos
  if (heatMapData.length === 0) {
    return (
      <section className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] h-[380px] flex items-center justify-center p-8 text-center">
        <p className="text-slate-500 text-xs font-medium">Registra un entrenamiento en el formulario para generar tu mapa de calor.</p>
      </section>
    );
  }

  // Caso: Es Pro y tiene datos
  return (
    <section className="h-[380px] w-full">
      <HeatMapContent />
    </section>
  );
}