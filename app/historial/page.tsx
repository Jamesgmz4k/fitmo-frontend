'use client';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Filter, Dumbbell, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from "../../lib/apiClient";

export default function HistorialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<any[]>([]);

  // 1. Estados para los Filtros (Agregamos el de fecha)
  const [filterMuscle, setFilterMuscle] = useState<string>('Todos');
  const [filterDate, setFilterDate] = useState<string>('');

  const userId = useMemo(() => (session?.user as any)?.id, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (userId) {
      apiClient('/api/workouts/')
        .then(res => res.json())
        .then(data => setWorkouts(data))
        .catch(err => console.error("Error al cargar historial:", err));
    }
  }, [userId]);

  // Desempaquetar, Filtrar y Agrupar
  const groupedAndFilteredWorkouts = useMemo(() => {
    if (!workouts || !userId) return {};

    const userWorkouts = workouts
      .filter(w => w.user?.toString() === userId?.toString())
      .sort((a, b) => b.id - a.id);

    const grouped = userWorkouts.reduce((acc, workout) => {
      const title = workout.title || "";
      const [musclePart, rest1] = title.split(':');
      const muscle = musclePart?.trim() || "Músculo";

      // Aplicar filtro 1: Músculo
      if (filterMuscle !== 'Todos' && muscle !== filterMuscle) return acc;

      const dateStr = workout.created_at || workout.date;
      const dateObj = new Date(dateStr);

      // Aplicar filtro 2: Fecha
      if (filterDate) {
        // Convertimos la fecha del entrenamiento a YYYY-MM-DD para compararla con el input
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const formattedWorkoutDate = `${yyyy}-${mm}-${dd}`;

        if (formattedWorkoutDate !== filterDate) return acc;
      }

      const [exercisePart] = (rest1 || "").split('|');
      const exercise = exercisePart?.trim() || "Ejercicio";
      const weightMatch = title.match(/(\d+)kg/);
      const weight = weightMatch ? parseInt(weightMatch[1]) : 0;
      const repsMatch = title.match(/Reps:\s*(.+)/);
      const sets = repsMatch ? repsMatch[1].split(',').map((r: string, i: number) => ({ id: i, reps: r.trim() })) : [];

      const displayDate = dateStr ? dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha desconocida';

      if (!acc[displayDate]) acc[displayDate] = [];
      acc[displayDate].push({ ...workout, muscle, exercise, weight, sets });
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  }, [workouts, userId, filterMuscle, filterDate]); // <-- Importante: Escuchamos cambios en filterDate

  // Obtener lista única de músculos
  const availableMuscles = useMemo(() => {
    const muscles = new Set(workouts.filter(w => w.user?.toString() === userId?.toString()).map(w => w.title.split(':')[0]?.trim()));
    return ['Todos', ...Array.from(muscles)].filter(Boolean) as string[];
  }, [workouts, userId]);

  if (status === "loading") return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-black italic">Cargando Bóveda...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        <header className="flex items-center justify-between bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 text-slate-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Dumbbell className="text-violet-500" size={24} /> Bóveda de Entrenamiento
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Tu historial completo de progresión</p>
            </div>
          </div>
        </header>

        {/* CONTROLES DE FILTROS: Músculo y Fecha en formato Grid */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Filtro: Músculo */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex gap-4 items-center shadow-lg">
            <Filter size={16} className="text-slate-500 ml-2" />
            <select
              value={filterMuscle}
              onChange={(e) => setFilterMuscle(e.target.value)}
              className="bg-transparent text-sm font-black text-white outline-none w-full appearance-none uppercase tracking-widest cursor-pointer"
            >
              {availableMuscles.map(m => (
                <option key={m} value={m} className="bg-[#0a0a0a] text-white">{m === 'Todos' ? 'Todos los músculos' : m}</option>
              ))}
            </select>
          </div>

          {/* Filtro: Fecha */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex gap-4 items-center shadow-lg relative">
            <Calendar size={16} className="text-slate-500 ml-2" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              // colorScheme: 'dark' hace que el calendario nativo del navegador se pinte oscuro y no rompa el diseño
              style={{ colorScheme: 'dark' }}
              className="bg-transparent text-sm font-black text-white outline-none w-full appearance-none uppercase tracking-widest cursor-pointer"
            />
            {/* Botoncito para limpiar la fecha rápido sin usar el teclado */}
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="absolute right-4 p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                title="Limpiar fecha"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lista Agrupada por Fechas */}
        <div className="space-y-10">
          {Object.keys(groupedAndFilteredWorkouts).length === 0 ? (
            <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[2rem]">
              <p className="text-slate-600 text-sm font-black uppercase tracking-widest mb-4">No hay registros con estos filtros</p>

              {/* Botón UX para resetear todo si la búsqueda fue fallida */}
              {(filterDate || filterMuscle !== 'Todos') && (
                <button
                  onClick={() => { setFilterDate(''); setFilterMuscle('Todos'); }}
                  className="bg-white/5 px-6 py-2 rounded-xl text-xs font-black text-cyan-400 hover:bg-white/10 hover:text-cyan-300 transition-all uppercase tracking-widest"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            Object.keys(groupedAndFilteredWorkouts).map(date => (
              <section key={date} className="relative">
                <div className="sticky top-4 z-10 inline-block bg-[#050505] px-4 py-2 rounded-xl border border-white/10 shadow-xl mb-6 ml-4">
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest capitalize">
                    {date}
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {groupedAndFilteredWorkouts[date].map((w: any) => (
                    <div key={w.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:border-violet-500/20 transition-all shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] text-violet-400 font-black uppercase tracking-widest mb-1">{w.muscle}</p>
                          <h4 className="text-white font-black italic text-lg uppercase tracking-tighter leading-tight">{w.exercise}</h4>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-center">
                          <span className="block text-[14px] font-black text-white leading-none">{w.weight}</span>
                          <span className="block text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">KG</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                        {w.sets.map((set: any, idx: number) => (
                          <div key={idx} className="bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-white/5 flex flex-col items-center min-w-[3rem]">
                            <span className="text-[9px] text-slate-500 font-black uppercase mb-0.5">S{idx + 1}</span>
                            <span className="text-xs font-black text-white">{set.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

      </div>
    </main>
  );
}