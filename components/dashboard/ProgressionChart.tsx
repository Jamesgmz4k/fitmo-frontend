import { TrendingUp, Target, Lock, Zap } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

interface ChartDataItem {
  session: string;
  ip: number;
}

interface ProgressionChartProps {
  isPro: boolean;
  exercises: string[];
  selectedExercise: string;
  onExerciseChange: (exercise: string) => void;
  data: ChartDataItem[];
  sessionsCount: number;
  progressPercent: number;
}

export default function ProgressionChart({ 
  isPro,
  exercises, 
  selectedExercise, 
  onExerciseChange, 
  data, 
  sessionsCount, 
  progressPercent 
}: ProgressionChartProps) {

 // SEGURIDAD DE ARQUITECTURA: El componente muere aquí si no es Pro.
  if (!isPro) {
    return (
      <section className="relative bg-white/2 rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden h-95 flex flex-col items-center justify-center p-6">
        {/* Aquí está la magia: w-full h-full justify-center para igualar tamaños */}
        <div className="relative z-10 flex flex-col items-center text-center p-8 bg-[#050505]/90 rounded-[2.5rem] border border-violet-500/20 backdrop-blur-xl w-full h-full justify-center shadow-2xl">
          <div className="w-16 h-16 bg-linear-to-br from-violet-600/20 to-cyan-600/20 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shrink-0">
            <Lock size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-black text-white italic mb-3 tracking-tighter uppercase text-center shrink-0">Analítica Pro</h3>
          <p className="text-[11px] text-slate-400 mb-8 leading-relaxed font-medium shrink-0">
            Visualiza tu curva de fuerza (1RM Estimado) y descubre tu ritmo de progresión exacto a lo largo del tiempo.
          </p>
          <Link 
            href="/pro" 
            className="w-full bg-linear-to-r from-violet-600 to-cyan-600 p-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase hover:scale-[1.02] transition-transform text-white flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] shrink-0"
          >
            <Zap size={14} fill="currentColor" /> Convertirme en Pro
          </Link>
        </div>
      </section>
    );
  }

  // Si tiene permisos, procedemos con la UI de la gráfica
  return (
    <section className="bg-white/2 p-6 rounded-[2.5rem] border border-white/5 shadow-xl h-95 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
          <TrendingUp size={16} /> Índice de Progresión
        </h2>
        <select 
          className="bg-white/5 p-2 rounded-xl text-[10px] text-cyan-400 font-black border border-white/10 outline-none cursor-pointer" 
          value={selectedExercise} 
          onChange={(e) => onExerciseChange(e.target.value)}
        >
          {exercises.map(ex => <option key={ex} value={ex} className="bg-black">{ex}</option>) || <option>Sin datos</option>}
        </select>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {data.length >= 3 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="session" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: 'none', borderRadius: '10px', fontSize: '10px' }} formatter={(val) => [`${val}%`, 'IP']} />
              <Area type="monotone" dataKey="ip" stroke="#22d3ee" fill="url(#colorIp)" strokeWidth={3} dot={false} activeDot={{ r: 4, fill: '#22d3ee' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center px-6 w-full">
            <Target size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.15em] mb-4">
              Faltan <span className="text-cyan-400">{Math.max(3 - sessionsCount, 0)} sesiones</span> para el análisis
            </p>
            <div className="w-full max-w-50 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
              <div className="h-full bg-linear-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-[8px] text-slate-600 font-bold mt-2 uppercase tracking-tighter">
              Baseline: {sessionsCount}/3 logs
            </p>
          </div>
        )}
      </div>
    </section>
  );
}