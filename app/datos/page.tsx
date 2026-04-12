'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Target, Ruler, User as UserIcon, Save, Activity, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { apiClient } from '../../lib/apiClient';

export default function DatosAtletaPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  // Estados para la biometría
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('masa_muscular');
  const [experience, setExperience] = useState('principiante');

  // Estados de la interfaz
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. OBTENEMOS LOS DATOS ACTUALES AL CARGAR LA PÁGINA
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        // Pedimos el Perfil
        const resProfile = await fetch(`http://127.0.0.1:8000/api/profile/?user_id=${userId}`);
        if (resProfile.ok) {
          const profileData = await resProfile.json();
          setAge(profileData.age?.toString() || '');
          setHeight(profileData.height?.toString() || '');
          setGoal(profileData.gym_goal || 'masa_muscular');
          setExperience(profileData.experience_level || 'principiante');
        }

        // Pedimos el último peso registrado
        const resWeight = await fetch(`http://127.0.0.1:8000/api/weight-logs/?user_id=${userId}`);
        if (resWeight.ok) {
          const weightLogs = await resWeight.json();
          if (weightLogs.length > 0) {
            // Tomamos el peso más reciente
            setWeight(weightLogs[weightLogs.length - 1].weight.toString());
          }
        }
      } catch (error) {
        console.error("Error cargando los datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session, userId]);

  // 2. ACTUALIZAMOS LOS DATOS CUANDO EL ATLETA DA CLIC EN GUARDAR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      // Guardamos cambios en el Perfil
      await apiClient('/api/profile/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          age: parseInt(age),
          height: parseFloat(height),
          gym_goal: goal,
          experience_level: experience
        }),
      });

      // Guardamos un nuevo registro de peso (esto actualizará tu gráfica de peso también)
      await apiClient('/api/weight-logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          weight: parseFloat(weight)
        }),
      });

      // Mostramos mensaje de éxito temporal
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error("Error actualizando datos:", error);
    }
  };

  return (
    <DashboardLayout userName={session?.user?.name}>
      <div className="p-4 md:p-10 font-sans text-slate-200">
        <div className="max-w-4xl mx-auto space-y-10">

          <DashboardHeader userName={session?.user?.name} onSignOut={() => signOut()} />

          <section className="bg-white/[0.02] p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">

            {/* Mensaje de Éxito Flotante */}
            <div className={`absolute top-0 left-0 w-full bg-emerald-500/10 border-b border-emerald-500/20 p-4 flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest transition-all duration-500 ${showSuccess ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
              <CheckCircle2 size={16} /> Datos de atleta actualizados con éxito
            </div>

            <div className="flex items-center gap-4 mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-cyan-500/20">
                <Activity className="text-cyan-400" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                  Datos de <span className="text-cyan-500">Atleta</span>
                </h1>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-10 font-medium max-w-lg">
              Mantén tus métricas actualizadas para que el algoritmo de Fitmo calcule tu progresión de manera precisa.
            </p>

            {isLoading ? (
              <div className="py-20 text-center text-slate-500 text-xs uppercase font-bold tracking-widest animate-pulse">
                Cargando métricas...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 bg-[#050505] p-8 rounded-3xl border border-white/5 max-w-2xl">

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                      <UserIcon size={12} /> Edad
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm focus:border-cyan-500/50 transition-colors"
                      placeholder="Ej. 25"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                      <Ruler size={12} /> Estatura (m)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm focus:border-cyan-500/50 transition-colors"
                      placeholder="Ej. 1.76"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                    <Activity size={12} /> Peso Actual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm text-cyan-400 font-bold focus:border-cyan-500/50 transition-colors"
                    required
                  />
                  <p className="text-[10px] text-slate-500 ml-2">Actualizar tu peso agregará un nuevo punto a tu gráfica histórica.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                    <Target size={12} /> Objetivo Principal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm focus:border-cyan-500/50 transition-colors cursor-pointer"
                  >
                    <option value="masa_muscular" className="bg-[#0a0a0a]">Aumento de Masa Muscular</option>
                    <option value="perdida_grasa" className="bg-[#0a0a0a]">Pérdida de Grasa</option>
                    <option value="fuerza" className="bg-[#0a0a0a]">Fuerza Pura</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-4 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}