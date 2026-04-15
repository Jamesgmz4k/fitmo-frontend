'use client';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Hero from './Hero';
import AuthForm from '../components/auth/AuthForm';
import confetti from 'canvas-confetti';
import { signIn, signOut, useSession } from "next-auth/react";
import posthog from 'posthog-js';
import HeatMap from '../components/dashboard/HeatMap';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { 
   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Dumbbell, History, LogOut, Trash2, Edit3, ShieldCheck, User as UserIcon, Plus, Layers, AlertCircle, Lock, Zap, Flame, TrendingUp,  Target
} from 'lucide-react';
import PersonalRecords from '../components/dashboard/PersonalRecords';
import ProgressionChart from '../components/dashboard/ProgressionChart';
import ExerciseCatalog from '../components/dashboard/ExerciseCatalog';
import HistoryFeed from '../components/dashboard/HistoryFeed';

const EXERCISES_DATABASE: Record<string, string[]> = {
  "Pecho": ["Press inclinado", "Press recto", "Peck flys maquina", "Peckdeck cable", "Press inclinado con mancuernas"],
  "Triceps": ["Jalón con polea barra recta", "Overhead extensions barra recta", "Press de triceps", "Skullcrushers", "Jalon con polea unilateral", "Fondos"],
  "Bicep": ["Curl mancuernas", "Curl barra z", "Martillos", "Curl en polea barra recta", "Curl en maquina", "Curl predicador", "Curl concentrado", "Bayessian", "Curl en banco inclinado con mancuernas", "Spider curl"],
  "Espalda": ["Remo en smith", "Remo sentado en maquina", "Remo con triquete abierto", "Pulldown agarre abierto", "Pulldown vertical", "Pullover con barra recta", "Pulldown agarre V", "Dominadas abiertas", "Dominadas cerradas", "Pulldown agarre neutro"],
  "Pierna": ["Sentadilla regular", "Sentadilla cerrada", "Abductor abrir", "Abductor cerrar", "Desplantes en smith", "Curl de cuadricep en maquina", "Femoral acostado", "Femoral sentado", "Hip trust", "Prensa"],
  "Abdomen": ["Crunches banco inclinado", "Twist ruso", "Aplastamiento de abdomen", "Elevaciones de piernas", "Plancha"],
  "Hombro": ["Press militar", "Laterales", "Frontales"]
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  // ==========================================
  // 1. ESTADOS (useState)
  // ==========================================
  
  // Control de la aplicación
  const [showApp, setShowApp] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  // Datos principales
  const [workouts, setWorkouts] = useState<any[]>([]);
  
  // Catálogo Personalizado
  const [customExercises, setCustomExercises] = useState<Record<string, string[]>>({});
  
  // UI y Análisis
  const [selectedAnalysisExercise, setSelectedAnalysisExercise] = useState<string>('');
  
  // ==========================================
  // 2. MEMORIAS (useMemo)
  // ==========================================
  
  const userId = useMemo(() => (session?.user as any)?.id, [session]);

  const ALL_EXERCISES = useMemo(() => {
    const combined = { ...EXERCISES_DATABASE };
    Object.keys(customExercises).forEach(muscle => {
      combined[muscle] = [...(combined[muscle] || []), ...customExercises[muscle]];
    });
    return combined;
  }, [customExercises]);

  const userExercises = useMemo(() => {
    if (!workouts || !userId) return [];
    const names = workouts
      .filter(w => w.user?.toString() === userId?.toString())
      .map(w => w.title.split(':')[1]?.split('|')[0]?.trim());
    return Array.from(new Set(names)).filter(Boolean) as string[];
  }, [workouts, userId]);

  const personalRecords = useMemo(() => {
    if (!userId) return [];
    
    const userLogs = workouts.filter(w => w.user?.toString() === userId.toString());
    const recordsMap: Record<string, number> = {};
    
    userLogs.forEach(log => {
      const exName = log.title.split(':')[1]?.split('|')[0]?.trim();
      const weightMatch = log.title.match(/(\d+)kg/);
      const weightVal = weightMatch ? parseInt(weightMatch[1]) : 0;
      if (exName && (!recordsMap[exName] || weightVal > recordsMap[exName])) {
        recordsMap[exName] = weightVal;
      }
    });
    
    return Object.entries(recordsMap).map(([name, weight]) => ({ name, weight }));
  }, [workouts, userId]);

  const sessionsCount = useMemo(() => {
    if (!selectedAnalysisExercise) return 0;
    return workouts.filter(w => w.title.includes(selectedAnalysisExercise)).length;
  }, [workouts, selectedAnalysisExercise]);

  const progressPercent = Math.min((sessionsCount / 3) * 100, 100);

  const chartData = useMemo(() => {
    if (!isPro) return [];
    if (!selectedAnalysisExercise || !userId) return [];
    
    const exerciseLogs = workouts.filter(w => 
      w.user?.toString() === userId?.toString() && 
      w.title.includes(selectedAnalysisExercise)
    ).reverse();    

    const sessionData = exerciseLogs.map(w => {
      const weightMatch = w.title.match(/(\d+)kg/);
      const repsMatch = w.title.match(/Reps:\s*(.+)/);
      const weightVal = weightMatch ? parseInt(weightMatch[1]) : 0;
      const repsArray = repsMatch ? repsMatch[1].split(',').map(Number) : [];
      
      const totalReps = repsArray.reduce((a: number, b: number) => a + b, 0);      
      const hypertrophyScore = (weightVal * 10) + totalReps;
      
      return { cargaEfectiva: hypertrophyScore };
    }).filter(d => d.cargaEfectiva > 0);

    if (sessionData.length < 2) return []; 
    
    const baseline = sessionData[0].cargaEfectiva; 
    
    return sessionData.map((s, i) => ({
      session: `S${i + 1}`,
      ip: parseFloat(((s.cargaEfectiva / baseline) * 100).toFixed(1))
    }));
  }, [workouts, selectedAnalysisExercise, userId]);

  // ==========================================
  // 3. EFECTOS (useEffect)
  // ==========================================
  
  useEffect(() => {
    if (status === "authenticated") {
      setShowApp(true);
      if (userId) {
        posthog.identify(userId, {
          name: session?.user?.name ?? undefined,
          email: session?.user?.email ?? undefined,
        });
      }
    }
  }, [status, userId]);

  const fetchData = async () => {
    try {
      const resW = await fetch(`${API_URL}/api/workouts/`);      
      if (resW.ok) setWorkouts(await resW.json());
    } catch (error) { console.error("Error fetching workouts:", error); }
  };

  useEffect(() => { 
    if (status === "authenticated" && userId && showApp) {
      fetchData(); 
      
      const checkOnboardingStatus = async () => {
        try {
          const res = await fetch(`${API_URL}/api/profile/?user_id=${userId}`);
          if (res.ok) {
            const profileData = await res.json();
            setIsPro(profileData.is_pro);
            if (!profileData.is_onboarded) {
              router.push('/onboarding');
            }
          }
        } catch (error) {
          console.error("Error al validar estatus de onboarding:", error);
        }
      };

      checkOnboardingStatus();
    } 
  }, [status, userId, router, showApp]);

  useEffect(() => {
    if (userExercises.length > 0 && !selectedAnalysisExercise) {
      setSelectedAnalysisExercise(userExercises[0]);
    }
  }, [userExercises, selectedAnalysisExercise]);

  // ==========================================
  // 4. FUNCIONES DE MANEJO DE EVENTOS
  // ==========================================
  
  const getStatus = (exName: string) => {
    if (!userId) return { label: "Iniciando", color: "text-blue-400", bg: "bg-blue-500/10", icon: <Plus size={12}/> };
    
    const history = workouts
      .filter(w => w.user?.toString() === userId?.toString() && w.title.includes(exName))
      .sort((a, b) => b.id - a.id)
      .slice(0, 3);

    if (history.length < 2) return { label: "Iniciando", color: "text-blue-400", bg: "bg-blue-500/10", icon: <Plus size={12}/> };

    const getProgressionScore = (t: string) => {
      const wMatch = t.match(/(\d+)kg/);
      const w = wMatch ? parseInt(wMatch[1]) : 0;
      
      const rsMatch = t.match(/Reps:\s*(.+)/);
      const reps = rsMatch ? rsMatch[1].split(',').map(Number) : [];
      
     const totalReps = reps.reduce((a: number, r: number) => a + r, 0);
     return (w * 10) + totalReps;
    };

    const currentScore = getProgressionScore(history[0].title);
    const previousScore = getProgressionScore(history[1].title);

    const ratio = previousScore > 0 ? currentScore / previousScore : 1;

    if (ratio > 1.01) return { label: "Progresando", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <TrendingUp size={12}/> };
    
    if (ratio < 0.99 && history.length === 3) {
      const oldestScore = getProgressionScore(history[2].title);
      if (previousScore < oldestScore) {
        return { label: "Estancado", color: "text-red-400", bg: "bg-red-500/10", icon: <AlertCircle size={12}/> };
      }
    }
    
    return { label: "Estable", color: "text-amber-400", bg: "bg-amber-500/10", icon: <Target size={12}/> };
  };

  const handleAddCustomExercise = async (category: string, name: string) => {
    try {
      const res = await fetch(`${API_URL}/api/exercises/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, category: category })
      });

      if (res.ok) {
        setCustomExercises(prev => ({ 
          ...prev, 
          [category]: [...(prev[category] || []), name] 
        })); 
        alert(`¡${name} guardado en tu base de datos!`);
      }
    } catch (error) {
      console.error("Error al guardar catálogo:", error);
    }
  };

  // ==========================================
  // 5. RENDERIZADO (UI)
  // ==========================================
  
  if (!showApp) return <Hero onEnterApp={() => setShowApp(true)} />;
  if (status === "unauthenticated" || status === "loading") {
    return <AuthForm />;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <DashboardHeader userName={session?.user?.name} onSignOut={() => { posthog.reset(); signOut(); }} />
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-8">
          
            <ProgressionChart
                isPro={isPro} 
                exercises={userExercises}
                selectedExercise={selectedAnalysisExercise}
                onExerciseChange={setSelectedAnalysisExercise}
                data={chartData}
                sessionsCount={sessionsCount}
                progressPercent={progressPercent}
              />

            <HeatMap isPro={isPro} />
                 
            <PersonalRecords records={personalRecords} />

            <ExerciseCatalog 
              databaseCategories={Object.keys(EXERCISES_DATABASE)} 
              onAddExercise={handleAddCustomExercise} 
            />
            <DashboardLayout isPro={isPro} userName={session?.user?.name}><div /></DashboardLayout>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
              <h2 className="text-slate-400 font-black mb-6 text-[10px] uppercase tracking-[0.2em]">Estado de tus Ejercicios</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {userExercises.slice(0, 6).map(ex => {
                    const s = getStatus(ex);
                    return (
                      <div key={ex} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                        <span className="text-xs font-bold">{ex}</span>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${s.bg} ${s.color} text-[8px] font-black uppercase`}>{s.icon} {s.label}</div>
                      </div>
                    );
                  })}
                </div>
            </section> 

            <HistoryFeed 
              isPro={isPro}
              workouts={workouts.filter(w => w.user?.toString() === userId?.toString()).sort((a,b) => b.id - a.id)} 
              onDelete={(id) => {
                fetch(`${API_URL}/api/workouts/${id}/`, { method: 'DELETE' })
                  .then(() => fetchData());
              }}
              getStatus={getStatus}
            />
          </div>
        </div>
      </div>
    </main>
  );
}