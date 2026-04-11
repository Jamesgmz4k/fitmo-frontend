import React from 'react';
import { History, Trash2, Edit3, AlertTriangle, Lock, Zap, Utensils, Clock, Moon, X, ChevronRight, BarChart3, TrendingDown, MinusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface HistoryFeedProps {
  workouts: any[];
  isPro?: boolean; 
  onEdit: (workout: any) => void;
  onDelete: (id: number) => void;
  getStatus: (exerciseName: string) => { label: string, color: string, bg: string, icon: React.ReactNode };
}

  export default function HistoryFeed({ workouts = [], isPro = false, onEdit, onDelete, getStatus }: HistoryFeedProps) {
  const [warningModalData, setWarningModalData] = useState<any | null>(null);
  const [showRestInfo, setShowRestInfo] = useState(false);

  const getHypertrophyScore = (title: string) => {
    const weightMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i) || title.match(/(\d+)kg/);
    const w = weightMatch ? parseFloat(weightMatch[1]) : 0;
    const repsMatch = title.match(/Reps:\s*(.+)/);
    const reps = repsMatch ? repsMatch[1].split(',').map((r: string) => parseInt(r.trim())) : [];
    const totalReps = reps.reduce((a: number, b: number) => a + (b||0), 0);
    return { score: (w * 10) + totalReps, weight: w, totalReps };
  };

    const groupedWorkouts = (workouts || []).reduce((acc, workout) => {
    const title = workout.title || "";
    const [musclePart, rest1] = title.split(':');
    const muscle = musclePart?.trim() || "Músculo";
    const [exercisePart, rest2] = (rest1 || "").split('|');
    const exercise = exercisePart?.trim() || "Ejercicio";
    const weightMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i) || title.match(/(\d+)kg/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    const unit = weightMatch ? weightMatch[2] : 'KG';
    const repsMatch = title.match(/Reps:\s*(.+)/);
    const sets = repsMatch ? repsMatch[1].split(',').map((r: string, i: number) => ({ id: i, reps: r.trim() })) : [];
    
    const dateStr = workout.created_at || workout.date; 
    const displayDate = dateStr ? new Date(dateStr).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Fecha desconocida';

    const exerciseLogs = workouts.filter(log => log.title.includes(exercise));
    const currentIndex = exerciseLogs.findIndex(log => log.id === workout.id);
    const prevWorkout = exerciseLogs[currentIndex + 1]; 
    
    let hasDropped = false;
    let dropDetails = null;

    if (prevWorkout) {
      const currentStats = getHypertrophyScore(workout.title);
      const prevStats = getHypertrophyScore(prevWorkout.title);
      
      if (currentStats.score < prevStats.score) {
        hasDropped = true;
        dropDetails = { current: currentStats, prev: prevStats };
      }
    }

    if (!acc[displayDate]) acc[displayDate] = [];
    acc[displayDate].push({ ...workout, muscle, exercise, weight, unit, sets, hasDropped, dropDetails });
    return acc;
  }, {} as Record<string, any[]>);

  const recentDates = Object.keys(groupedWorkouts).slice(0, 2);

  return (
    <>
      {warningModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-red-500/30 w-full max-w-lg rounded-[2.5rem] shadow-[0_0_80px_rgba(239,68,68,0.15)] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                  <AlertTriangle size={18} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Alerta de Rendimiento</span>
                </div>
                <h2 className="text-2xl font-black italic text-white tracking-tighter">¿Por qué bajó mi rendimiento?</h2>
              </div>
              <button onClick={() => { setWarningModalData(null); setShowRestInfo(false); }} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
              <p className="text-sm text-slate-400 mb-6 font-medium">
                Detectamos una caída en tu volumen de hipertrofia en <strong className="text-white">{warningModalData.exercise}</strong>. 
                Tu score bajó de <span className="text-emerald-400">{warningModalData.dropDetails.prev.score}</span> a <span className="text-red-400">{warningModalData.dropDetails.current.score}</span>.
              </p>

              {!isPro ? (
                <div className="relative bg-white/5 rounded-3xl p-6 mb-8 border border-white/5 overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute inset-0 backdrop-blur-[6px] flex flex-col items-center justify-center bg-[#050505]/60 z-10 p-4 text-center">
                    <Lock size={32} className="text-violet-400 mb-3" />
                    <h3 className="text-white font-black italic text-lg uppercase tracking-tighter mb-2">Análisis de Fatiga Bloqueado</h3>
                    <p className="text-[10px] text-slate-400 mb-4 max-w-[250px]">Descubre si es fatiga central, falta de glucógeno o sobreentrenamiento.</p>
                    <Link href="/pro" className="bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform shadow-lg">
                      <Zap size={14} fill="currentColor" /> Desbloquear Análisis
                    </Link>
                  </div>
                  <div className="h-32 flex items-end justify-between gap-2 opacity-50 px-4">
                    {[40, 70, 50, 90, 30, 80].map((h, i) => (
                       <div key={i} className="w-8 bg-violet-500/40 rounded-t-lg" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-violet-600/10 to-cyan-600/10 rounded-3xl p-6 mb-8 border border-violet-500/20">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2 text-violet-400">
                       <BarChart3 size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Motor Fitmo Pro</span>
                     </div>
                     <div className="bg-violet-500/20 px-3 py-1 rounded-full text-[8px] text-violet-300 font-black uppercase tracking-widest border border-violet-500/30">
                       Autoregulación Activa
                     </div>
                   </div>
                   <p className="text-sm text-slate-300 leading-relaxed font-medium mb-5">
                     La caída en tu volumen indica fatiga residual acumulada en el Sistema Nervioso Central (SNC) para este grupo muscular. Continuar forzando la progresión lineal aumentará el riesgo de lesión y detendrá el crecimiento.
                   </p>
                   <div className="bg-[#050505] p-5 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] uppercase font-black text-cyan-500 tracking-widest mb-4">Protocolo de Descarga Propuesto:</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                          <TrendingDown size={18} className="text-cyan-400" />
                          <p className="text-xs font-bold text-slate-200">Reduce el peso de trabajo entre un <span className="text-white">10% y 15%</span>.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                          <MinusCircle size={18} className="text-cyan-400" />
                          <p className="text-xs font-bold text-slate-200">Elimina <span className="text-white">1 serie (set)</span> total del ejercicio.</p>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">Checklist Integral de Recuperación</h3>
              
              <div className="space-y-3">
                <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400"><Utensils size={16} /></div>
                    <p className="text-sm font-bold text-slate-200">¿Te estás nutriendo lo suficiente?</p>
                  </div>
                  <Link href="/nutricion" className="w-full bg-white/5 hover:bg-white/10 text-emerald-400 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-between items-center transition-colors border border-emerald-500/10">
                    Descubre tu dieta correcta <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400"><Clock size={16} /></div>
                    <p className="text-sm font-bold text-slate-200">¿Descansaste el tiempo adecuado entre sets?</p>
                  </div>
                  {!showRestInfo ? (
                    <button onClick={() => setShowRestInfo(true)} className="w-full bg-white/5 hover:bg-white/10 text-cyan-400 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-between items-center transition-colors border border-cyan-500/10">
                      Cuánto debo descansar <ChevronRight size={14} />
                    </button>
                  ) : (
                    <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 text-xs text-slate-300 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <p><strong className="text-cyan-400">Fuerza (1-5 reps):</strong> 3 a 5 minutos.</p>
                      <p><strong className="text-cyan-400">Hipertrofia (6-15 reps):</strong> 1.5 a 3 minutos.</p>
                      <p><strong className="text-cyan-400">Resistencia (+15 reps):</strong> 30 a 90 segundos.</p>
                    </div>
                  )}
                </div>

                <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400"><Moon size={16} /></div>
                    <p className="text-sm font-bold text-slate-200">¿Dormiste lo suficiente para recuperarte?</p>
                  </div>
                  <Link href="/sueno" className="w-full bg-white/5 hover:bg-white/10 text-violet-400 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-between items-center transition-colors border border-violet-500/10">
                    Configura tu ciclo de sueño <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <section className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-xl flex flex-col h-full relative z-0">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
            <History size={16} className="text-cyan-400" /> Entrenamientos Recientes
          </h2>
        </div>
        
        <div className="space-y-8 flex-1">
          {recentDates.map(date => (
            <div key={date} className="space-y-4">
              <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-white/5 pb-2 capitalize">
                {date}
              </h3>
              
              <div className="space-y-3">
                {groupedWorkouts[date].map((w: any) => {
                  return (
                    <div key={w.id} className="group bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl hover:border-violet-500/30 transition-all shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold text-sm uppercase tracking-tighter">{w.exercise}</h4>
                            {w.hasDropped && (
                              <button 
                                onClick={() => setWarningModalData(w)} 
                                className="text-yellow-500 hover:text-yellow-400 transition-colors hover:scale-110 flex items-center justify-center bg-yellow-500/10 p-1.5 rounded-md border border-yellow-500/20"
                                title="Rendimiento inferior al anterior. Ver diagnóstico."
                              >
                                <AlertTriangle size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{w.muscle}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(w)} className="p-1.5 bg-white/5 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"><Edit3 size={12} /></button>
                          <button onClick={() => onDelete(w.id)} className="p-1.5 bg-white/5 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        <div className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1">
                          <span className="text-[11px] font-black text-white">{w.weight}<span className="text-[8px] text-violet-500 ml-0.5">{w.unit || 'KG'}</span></span>
                        </div>
                        {w.sets.map((set: any, idx: number) => (
                          <div key={idx} className="bg-violet-500/5 px-2.5 py-1 rounded-lg border border-violet-500/10 flex items-center gap-1">
                            <span className="text-[8px] text-violet-400/50 font-black">S{idx + 1}</span>
                            <span className="text-[11px] font-black text-violet-300">{set.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {recentDates.length === 0 && (
            <div className="text-center py-10 border border-dashed border-white/5 rounded-4xl">
              <p className="text-slate-600 text-xs font-black uppercase tracking-widest">No hay entrenamientos recientes</p>
            </div>
          )}
        </div>

        {/* --- BOTÓN RESTAURADO --- */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <Link href="/historial" className="w-full bg-white/5 p-4 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2 border border-white/5">
            Ver historial completo <ArrowRight size={14} />
          </Link>
        </div>

      </section>
    </>
  );
}