'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Flame, TrendingUp, CheckCircle2, ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import HeatMap from "../../components/dashboard/HeatMap";
import { apiClient } from '../../lib/apiClient';
import posthog from 'posthog-js';

export default function ProPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  // 1. EL "DESCONGELADOR" DE LA PÁGINA (Para el Bfcache de Safari/Chrome)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // Si la página se está cargando desde la memoria caché (al darle botón "Atrás")
      if (event.persisted) {
        setLoading(null); // Reseteamos los botones a su estado original
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    posthog.capture('pro_page_viewed');
  }, []);

  const handleSubscribe = async (planType: string) => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      alert("Error: No se pudo identificar tu sesión. Intenta iniciar sesión de nuevo.");
      return;
    }

    setLoading(planType);
    posthog.capture('subscription_checkout_started', { plan_type: planType });

    try {
      const res = await apiClient('/api/create-checkout-session/', {
        method: 'POST',
        // El apiClient ya inyecta los headers, pero lo dejamos por seguridad si lo prefieres
        body: JSON.stringify({ user_id: userId, plan_type: planType })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al conectar con la pasarela: " + (data.error || "Desconocido"));
        setLoading(null);
      }
    } catch (error) {
      posthog.captureException(error);
      console.error("Error en la petición:", error);
      alert("Error de conexión. Asegúrate de que Django esté corriendo.");
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-violet-500/30">
      <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[11px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-violet-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pago Seguro</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-24">

        {/* HERO SECTION */}
        <section className="text-center space-y-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Zap size={14} fill="currentColor" /> Sube de Nivel
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white">
            DEJA DE ADIVINAR EN EL <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-500 to-cyan-400">GIMNASIO.</span>
          </h1>

          <p className="text-slate-400 md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Fitmo Pro analiza tus datos de entrenamiento con inteligencia artificial para decirte exactamente qué músculo entrenar, cuándo descansar y cómo romper tus estancamientos.
          </p>
        </section>

        {/* PRICING GRID (3 Columnas) */}
        <section className="grid md:grid-cols-3 gap-6 items-stretch">

          {/* PLAN MENSUAL */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] text-center flex flex-col h-full hover:border-white/10 transition-colors">
            <div>
              <h2 className="text-xl font-black italic text-white uppercase tracking-tighter mb-2">Mensual</h2>
              <p className="text-slate-400 text-xs mb-8">Prueba el sistema sin compromiso.</p>

              <div className="mb-8">
                <span className="text-4xl font-black text-white">$159</span>
                <span className="text-slate-500 font-bold ml-2">mxn/mes</span>
              </div>

              <ul className="space-y-4 mb-10 text-left">
                {['Creación ilimitada de rutinas', 'Historial detallado de peso', 'Gráficas de rendimiento básicas'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 size={16} className="text-slate-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => handleSubscribe('Mensual')}
                disabled={loading !== null}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors text-white disabled:opacity-50"
              >
                {loading === 'Mensual' ? 'Conectando...' : 'Elegir Mensual'}
              </button>
            </div>
          </div>

          {/* PLAN SEMESTRAL (Intermedio) */}
          <div className="bg-white/[0.04] border border-violet-500/20 p-8 rounded-[3rem] text-center flex flex-col h-full hover:border-violet-500/40 transition-colors relative">
            
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30 whitespace-nowrap">
              Ahorro del 6%
            </div>

            <div>
              <h2 className="text-xl font-black italic text-white uppercase tracking-tighter mb-2 mt-2">Semestral</h2>
              <p className="text-slate-400 text-xs mb-8">Resultados visibles garantizados.</p>

              <div className="mb-8 flex flex-col items-center">
                <div>
                  <span className="text-4xl font-black text-white">$899</span>
                  <span className="text-slate-500 font-bold ml-2">mxn/6 meses</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-2 bg-emerald-400/10 px-3 py-1 rounded-full">
                  Equivale a $149/mes
                </span>
              </div>

              <ul className="space-y-4 mb-10 text-left">
                {['Todo lo del plan Mensual', 'Mapa de calor interactivo', 'Análisis de estancamiento medio'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                    <CheckCircle2 size={16} className="text-violet-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => handleSubscribe('Semestral')}
                disabled={loading !== null}
                className="w-full bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/50 p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors text-white disabled:opacity-50"
              >
                {loading === 'Semestral' ? 'Conectando...' : 'Elegir Semestral'}
              </button>
            </div>
          </div>

          {/* PLAN ANUAL (El Señuelo Principal) */}
          <div className="bg-gradient-to-b from-[#0a0a0a] to-[#050505] p-10 rounded-[3rem] border border-violet-500/50 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden flex flex-col h-full transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-600 to-cyan-600"></div>

            <div className="absolute top-6 right-6 bg-violet-600/20 text-violet-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-violet-500/20">
              Mejor Valor
            </div>

            <div>
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2">Anual Pro</h2>
              <p className="text-slate-400 text-xs mb-8">Compromiso real con tus ganancias.</p>

              <div className="mb-8 flex flex-col items-center">
                <div>
                  <span className="text-5xl font-black text-white">$1399</span>
                  <span className="text-slate-500 font-bold ml-2">mxn/año</span>
                </div>
                <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-2 bg-cyan-400/10 px-3 py-1 rounded-full">
                  Equivale a $116/mes
                </span>
              </div>

              <ul className="space-y-4 mb-10 text-left">
                {['Análisis predictivo de 1RM', 'Mapa de calor interactivo', 'Detector de estancamiento', 'Soporte prioritario'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => handleSubscribe('Anual')}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 p-5 rounded-2xl font-black text-[12px] tracking-[0.2em] uppercase hover:scale-[1.02] transition-transform text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading === 'Anual' ? 'Conectando...' : <>Empezar Ahora <ChevronRight size={16} /></>}
              </button>
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mt-5 font-bold flex items-center justify-center gap-1">
                <Lock size={12} /> Cancela en cualquier momento
              </p>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}