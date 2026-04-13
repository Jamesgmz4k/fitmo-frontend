'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useSession, signOut } from 'next-auth/react';
import { Moon, Clock, Shield, CheckCircle2, Circle, Lock, Zap, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SuenoPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de la Calculadora REM
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepSuggestions, setSleepSuggestions] = useState<{ time: string, cycles: number, hours: number }[]>([]);

  // Estados del Checklist (Solo visuales por ahora)
  const [habits, setHabits] = useState([
    { id: 1, text: 'Cero pantallas 1 hora antes', done: false },
    { id: 2, text: 'Última comida hace >2 horas', done: false },
    { id: 3, text: 'Habitación totalmente oscura', done: false },
    { id: 4, text: 'Suplementación (Magnesio/Zinc)', done: false },
  ]);

  // Simulación de carga del perfil
  useEffect(() => {
    const checkProStatus = async () => {
      if (!userId) return;
      try {
        const res = await apiClient(`/api/profile/?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.is_pro);
        }
      } catch (error) {
        console.error("Error cargando estatus:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkProStatus();
  }, [userId]);

  // Lógica de la Calculadora REM (Ciclos de 90 minutos)
  useEffect(() => {
    if (!wakeTime) return;

    const [hours, minutes] = wakeTime.split(':').map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(hours, minutes, 0, 0);

    const suggestions = [
      { cycles: 6, hours: 9 },    // 9 horas
      { cycles: 5, hours: 7.5 },  // 7.5 horas (Óptimo)
      { cycles: 4, hours: 6 },    // 6 horas (Mínimo)
    ].map(cycle => {
      const sleepDate = new Date(wakeDate.getTime() - (cycle.hours * 60 * 60 * 1000));
      // Restamos 15 minutos que es el promedio que toma quedarse dormido
      sleepDate.setMinutes(sleepDate.getMinutes() - 15);

      return {
        time: sleepDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
        cycles: cycle.cycles,
        hours: cycle.hours
      };
    });

    setSleepSuggestions(suggestions);
  }, [wakeTime]);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  return (
    <DashboardLayout userName={session?.user?.name}>
      <div className="p-4 md:p-10 font-sans text-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">

          <DashboardHeader userName={session?.user?.name} onSignOut={() => signOut()} />

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Moon className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                Recovery <span className="text-indigo-500">Center</span>
              </h1>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20 text-slate-500 text-sm font-bold animate-pulse">
              Cargando métricas de recuperación...
            </div>
          ) : (
            <div className="space-y-8">

              {/* =========================================
                  SECCIÓN 1: CALCULADORA REM (GRATIS PARA TODOS)
                  ========================================= */}
              <section className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Clock size={20} className="text-indigo-400" /> Planificador de Ciclos REM
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Despertar a mitad de un ciclo arruina tu energía. Calcula a qué hora debes dormir.</p>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Hora de despertar:</span>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {sleepSuggestions.map((s, i) => (
                    <div key={i} className={`p-6 rounded-3xl border transition-all ${i === 1 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#050505] border-white/5'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{s.cycles} Ciclos ({s.hours}h)</p>
                      <p className={`text-4xl font-black italic ${i === 1 ? 'text-indigo-400' : 'text-white'}`}>{s.time}</p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        {i === 0 ? 'Máxima recuperación muscular' : i === 1 ? 'El balance perfecto (Recomendado)' : 'Lo mínimo para no catabolizar'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* =========================================
                  SECCIÓN 2: HERRAMIENTAS PRO (PAYWALL)
                  ========================================= */}
              <div className="grid lg:grid-cols-2 gap-8 relative">

                {/* CAPA DE BLOQUEO (Si no es Pro) */}
                {!isPro && (
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-[#050505]/80 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                      <Lock size={28} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">Desbloquea el Análisis de Recuperación</h3>
                    <p className="text-slate-400 text-sm max-w-md mb-8">
                      Los usuarios Fitmo Pro acceden al <strong>Recovery Score</strong>, cruzando su intensidad de entrenamiento con sus métricas de sueño para evitar el estancamiento y maximizar la hipertrofia.
                    </p>
                    <Link href="/pro" className="bg-white text-black px-8 py-4 rounded-full font-black text-[11px] tracking-[0.2em] uppercase hover:bg-slate-200 transition-all">
                      Conocer Planes Pro
                    </Link>
                  </div>
                )}

                {/* CONTENIDO PRO (Se ve borroso y no clickable si no es pro, o normal si es pro) */}
                <div className={`space-y-8 transition-all ${!isPro ? 'opacity-30 select-none pointer-events-none blur-sm' : ''}`}>

                  {/* Recovery Score */}
                  <section className="bg-gradient-to-br from-white/[0.02] to-transparent p-8 rounded-[2.5rem] border border-white/5 shadow-xl h-full flex flex-col justify-center items-center text-center">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 w-full text-left flex items-center gap-2">
                      <Activity size={16} /> Fitmo Recovery Score
                    </h2>

                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="552" strokeDashoffset="110" className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" strokeLinecap="round" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-black italic text-white">82<span className="text-xl text-indigo-400">%</span></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Listo para entrenar</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-8 leading-relaxed px-4">
                      Tu volumen de ayer en Press Recto fue altísimo. Basado en tus ciclos de sueño planeados, tus fibras musculares estarán recuperadas.
                    </p>
                  </section>
                </div>

                <div className={`transition-all ${!isPro ? 'opacity-30 select-none pointer-events-none blur-sm' : ''}`}>
                  {/* Checklist de Higiene */}
                  <section className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-xl h-full">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Shield size={16} /> Higiene del Sueño
                    </h2>

                    <div className="space-y-3">
                      {habits.map((habit) => (
                        <button
                          key={habit.id}
                          onClick={() => toggleHabit(habit.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${habit.done
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                              : 'bg-[#050505] border-white/5 text-slate-400 hover:bg-white/5'
                            }`}
                        >
                          {habit.done ? <CheckCircle2 className="text-indigo-400 shrink-0" size={20} /> : <Circle className="text-slate-600 shrink-0" size={20} />}
                          <span className="text-sm font-bold text-left">{habit.text}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}