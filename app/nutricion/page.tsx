'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useSession, signOut } from 'next-auth/react';
import { Flame, Target, Activity, Utensils, Info, PieChart, Zap, Lock } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export default function NutricionPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [isPro, setIsPro] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Estados inicializados (Si el usuario es nuevo, verá esto por defecto)
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(176);
  const [weight, setWeight] = useState(75);
  const [gender, setGender] = useState('M');
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState('volumen');

  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [targetCals, setTargetCals] = useState(0);
  const [macros, setMacros] = useState({ protein: 0, fat: 0, carbs: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // 1. CARGAR DATOS
  useEffect(() => {
    const loadSavedDiet = async () => {
      if (!userId) return;
      try {
        const res = await apiClient(`/api/profile/?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.is_pro);

          if (data.weight) setWeight(Number(data.weight));
          if (data.age) setAge(data.age);
          if (data.height) setHeight(Number(data.height));
          if (data.gender) setGender(data.gender);
          if (data.activity_level) setActivity(data.activity_level);
          if (data.gym_goal) setGoal(data.gym_goal);
        }
      } catch (error) {
        console.error("Error cargando el perfil nutricional:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadSavedDiet();
  }, [userId]);

  // 2. EL MOTOR NUTRICIONAL
  useEffect(() => {
    let calculatedBmr = (10 * weight) + (6.25 * height) - (5 * age);
    calculatedBmr += gender === 'M' ? 5 : -161;
    setBmr(Math.round(calculatedBmr));

    const calculatedTdee = calculatedBmr * activity;
    setTdee(Math.round(calculatedTdee));

    let cals = calculatedTdee;
    if (goal === 'definicion') cals -= 500;
    if (goal === 'volumen') cals += 400;
    setTargetCals(Math.round(cals));

    const proteinGrams = Math.round(weight * 2.2);
    const fatGrams = Math.round(weight * 1);
    const remainingCals = cals - (proteinGrams * 4) - (fatGrams * 9);
    const carbGrams = Math.max(0, Math.round(remainingCals / 4));

    setMacros({ protein: proteinGrams, fat: fatGrams, carbs: carbGrams });
  }, [age, height, weight, gender, activity, goal]);

  // 3. GUARDAR DATOS EN DJANGO
  const handleSaveDiet = async () => {
    if (!userId) return alert("Debes iniciar sesión");
    setIsSaving(true);

    try {
      const res = await apiClient('/api/update-nutrition/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          age, height, weight, gender, activity_level: activity, goal,
          target_calories: targetCals,
          target_protein: macros.protein,
          target_carbs: macros.carbs,
          target_fat: macros.fat
        }),
      });

      if (res.ok) {
        alert("¡Plan Nutricional guardado con éxito!");
      } else {
        alert("Hubo un error al guardar tu dieta.");
      }
    } catch (error) {
      console.error("Error guardando dieta:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout userName={session?.user?.name}>
      <div className="p-4 md:p-10 font-sans text-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">

          <DashboardHeader userName={session?.user?.name} onSignOut={() => signOut()} />

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Utensils className="text-emerald-400" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                Motor <span className="text-emerald-500">Nutricional</span>
              </h1>
            </div>
          </div>

          {/* SI ESTÁ CARGANDO, NO MOSTRAMOS NADA TODAVÍA */}
          {isLoadingProfile ? (
            <div className="flex justify-center py-20 text-slate-500 text-sm font-bold animate-pulse">
              Analizando perfil de atleta...
            </div>
          ) : !isPro ? (

            /* =========================================
               PANTALLA DE PAYWALL (PARA USUARIOS FREE)
               ========================================= */
            <div className="relative overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-[2.5rem] p-10 md:p-20 text-center flex flex-col items-center justify-center">

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-600 to-cyan-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  <Lock size={32} className="text-white" />
                </div>

                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6">
                  Nutrición de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Alto Rendimiento</span>
                </h2>

                <p className="text-slate-400 max-w-lg mx-auto mb-10 text-sm md:text-base leading-relaxed">
                  El Motor Nutricional de Fitmo calcula matemáticamente tus macros exactos usando la fórmula de Mifflin-St Jeor para garantizar que estés en el superávit o déficit perfecto según tu objetivo.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
                  <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                    <Target size={20} className="text-cyan-400 mb-2" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Macros Exactos</span>
                  </div>
                  <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                    <Zap size={20} className="text-violet-400 mb-2" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Cálculo de TDEE</span>
                  </div>
                  <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                    <Flame size={20} className="text-emerald-400 mb-2" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Ajuste Dinámico</span>
                  </div>
                </div>

                <a
                  href="/pro" // <-- Cambia esto aquí
                  className="inline-block bg-white text-black px-10 py-5 rounded-full font-black text-[13px] tracking-[0.2em] uppercase hover:bg-slate-200 hover:scale-105 transition-all shadow-xl"
                >
                  Desbloquear Fitmo Pro
                </a>
              </div>
            </div>

          ) : (

            /* =========================================
               MOTOR NUTRICIONAL (PARA USUARIOS PRO)
               ========================================= */
            <div className="grid lg:grid-cols-12 gap-8">

              {/* PANEL IZQUIERDO: CONTROLES */}
              <div className="lg:col-span-5 space-y-6">
                <section className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-8">

                  {/* Sexo */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Sexo Biológico</label>
                    <div className="flex gap-4">
                      <button onClick={() => setGender('M')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${gender === 'M' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>Hombre</button>
                      <button onClick={() => setGender('F')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${gender === 'F' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>Mujer</button>
                    </div>
                  </div>

                  {/* Deslizadores */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-400">Peso actual</span>
                        <span className="text-white">{weight} kg</span>
                      </div>
                      <input type="range" min="40" max="150" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-400">Altura</span>
                        <span className="text-white">{height} cm</span>
                      </div>
                      <input type="range" min="140" max="220" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-400">Edad</span>
                        <span className="text-white">{age} años</span>
                      </div>
                      <input type="range" min="15" max="80" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full accent-emerald-500" />
                    </div>
                  </div>

                  {/* Nivel de Actividad */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2"><Activity size={14} /> Nivel de Actividad Diaria</label>
                    <select
                      value={activity}
                      onChange={(e) => setActivity(Number(e.target.value))}
                      className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-white text-xs appearance-none"
                    >
                      <option value={1.2}>Sedentario (Trabajo de oficina, poco ejercicio)</option>
                      <option value={1.375}>Ligero (Entrena 1-3 días por semana)</option>
                      <option value={1.55}>Moderado (Entrena 3-5 días por semana)</option>
                      <option value={1.725}>Muy Activo (Entrena 6 días + Trabajo físico)</option>
                    </select>
                  </div>

                  {/* Objetivo */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2"><Target size={14} /> Objetivo Fitmo</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setGoal('definicion')} className={`py-4 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border flex flex-col items-center gap-1 ${goal === 'definicion' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-[#050505] border-white/5 text-slate-500 hover:bg-white/5'}`}>
                        <Flame size={16} /> Definición
                      </button>
                      <button onClick={() => setGoal('mantenimiento')} className={`py-4 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border flex flex-col items-center gap-1 ${goal === 'mantenimiento' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-[#050505] border-white/5 text-slate-500 hover:bg-white/5'}`}>
                        <Activity size={16} /> Mantener
                      </button>
                      <button onClick={() => setGoal('volumen')} className={`py-4 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border flex flex-col items-center gap-1 ${goal === 'volumen' ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' : 'bg-[#050505] border-white/5 text-slate-500 hover:bg-white/5'}`}>
                        <Zap size={16} /> Volumen
                      </button>
                    </div>
                  </div>

                </section>
              </div>

              {/* PANEL DERECHO: RESULTADOS */}
              <div className="lg:col-span-7 space-y-6">
                <section className="bg-gradient-to-br from-white/[0.05] to-transparent p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">

                  <div className="absolute -top-20 -right-20 opacity-5 pointer-events-none">
                    <PieChart size={300} />
                  </div>

                  <div className="relative z-10 space-y-10">

                    {/* Bloque Principal: Calorías */}
                    <div className="text-center">
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Presupuesto Diario</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-7xl md:text-8xl font-black italic tracking-tighter text-white">{targetCals}</span>
                        <span className="text-xl font-bold text-slate-500">kcal</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-4">
                        Tasa Basal (BMR): <span className="text-white">{bmr}</span> | Mantenimiento (TDEE): <span className="text-white">{tdee}</span>
                      </p>
                    </div>

                    {/* Distribución de Macros */}
                    <div className="grid md:grid-cols-3 gap-4 pt-8 border-t border-white/10">

                      <div className="bg-[#050505]/50 p-6 rounded-3xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Proteína</p>
                        <p className="text-3xl font-black italic text-white">{macros.protein}<span className="text-sm text-slate-500 not-italic">g</span></p>
                        <p className="text-[9px] text-slate-500 mt-2 font-medium">Constructor muscular</p>
                      </div>

                      <div className="bg-[#050505]/50 p-6 rounded-3xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Carbos</p>
                        <p className="text-3xl font-black italic text-white">{macros.carbs}<span className="text-sm text-slate-500 not-italic">g</span></p>
                        <p className="text-[9px] text-slate-500 mt-2 font-medium">Energía explosiva</p>
                      </div>

                      <div className="bg-[#050505]/50 p-6 rounded-3xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Grasas</p>
                        <p className="text-3xl font-black italic text-white">{macros.fat}<span className="text-sm text-slate-500 not-italic">g</span></p>
                        <p className="text-[9px] text-slate-500 mt-2 font-medium">Hormonas & Salud</p>
                      </div>

                    </div>

                    <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                      <Info className="text-blue-400 shrink-0" size={16} />
                      <p className="text-[10px] text-blue-200/70 font-medium leading-relaxed">
                        Esta es la dieta matemática óptima generada por Fitmo Engine. Recuerda que 1g de Proteína = 4 kcal, 1g de Carbohidrato = 4 kcal y 1g de Grasa = 9 kcal. Ajusta los carbohidratos y grasas a tu gusto, pero <strong>nunca bajes la proteína</strong>.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveDiet}
                      disabled={isSaving}
                      className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-cyan-600 p-4 rounded-full font-black text-[12px] tracking-widest uppercase hover:opacity-90 transition-all text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar mi Plan Nutricional'}
                    </button>

                  </div>
                </section>
              </div>

            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}