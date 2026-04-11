'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Trophy, Target, Ruler, User as UserIcon, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Estados para capturar la biometría
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('73'); // Tu peso base de ejemplo
  const [goal, setGoal] = useState('masa_muscular');
  const [experience, setExperience] = useState('principiante');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = (session?.user as any)?.id;

    try {
      // 1. Guardamos el Perfil en Django
      const resProfile = await fetch('http://127.0.0.1:8000/api/profile/', {
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

      // 2. Guardamos el primer registro de peso para la gráfica
      await fetch('http://127.0.0.1:8000/api/weight-logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          weight: parseFloat(weight)
        }),
      });

      if (resProfile.ok) {
        window.location.href = '/'; // Regresamos al Dashboard ya con datos
      }
    } catch (error) {
      console.error("Error en onboarding:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5">
        <div className="text-center">
          <Trophy className="mx-auto text-cyan-400 mb-4" size={40} />
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Configura tu Perfil</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Paso vital para medir tu progreso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Edad</label>
              <input type="number" value={age} onChange={(e)=>setAge(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm" placeholder="25" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Estatura (m)</label>
              <input type="number" step="0.01" value={height} onChange={(e)=>setHeight(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm" placeholder="1.76" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Peso Actual (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e)=>setWeight(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm text-cyan-400 font-bold" required />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Objetivo Principal</label>
            <select value={goal} onChange={(e)=>setGoal(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-sm">
              <option value="masa_muscular" className="bg-black">Aumento de Masa Muscular</option>
              <option value="perdida_grasa" className="bg-black">Pérdida de Grasa</option>
              <option value="fuerza" className="bg-black">Fuerza Pura</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-cyan-600 p-4 rounded-2xl font-black text-[11px] tracking-widest uppercase hover:bg-cyan-500 transition-all flex items-center justify-center gap-2">
            Comenzar mi Transformación <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </main>
  );
}