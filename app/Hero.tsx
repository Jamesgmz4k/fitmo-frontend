'use client';
import React from 'react';
import { Zap, Activity, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Hero({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* DECORACIÓN DE FONDO (Efecto de luces sutiles) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full"></div>

      <div className="max-w-4xl mx-auto px-6 text-center z-10">
        {/* BADGE SUPERIOR */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Sistema Fitmo v2.0 Activo</span>
        </div>

        {/* TÍTULO PRINCIPAL CON GRADIENTE */}
        <h1 className="text-7xl md:text-8xl font-black italic mb-6 tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
          FITMO
        </h1>

        <p className="text-slate-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
          La plataforma para atletas que eleva su rendimiento al siguiente nivel. <br className="hidden md:block" />
          <span className="text-slate-300">Registra. Visualiza. Supera.</span>
        </p>

        {/* BOTÓN PRINCIPAL (IDÉNTICO AL DEL CRUD) */}
        <button 
          onClick={() => {
            console.log("Accediendo al sistema...");
            onEnterApp();
          }}
          className="group relative bg-gradient-to-r from-cyan-500 to-violet-600 p-[2px] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-500/20"
        >
          <div className="bg-[#050505] group-hover:bg-transparent transition-colors rounded-[14px] px-10 py-5 flex items-center gap-3">
            <span className="text-white font-black tracking-[0.1em] text-sm uppercase">Comenzar Ahora</span>
            <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* SECCIÓN DE CARACTERÍSTICAS (Mini Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-24">
          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.05] transition-colors">
            <div className="text-cyan-400 mb-3 flex justify-center"><Zap size={20} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Registra</h3>
            <p className="text-slate-600 text-xs leading-tight">Cada serie y repetición con precisión milimétrica.</p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.05] transition-colors">
            <div className="text-violet-400 mb-3 flex justify-center"><Activity size={20} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Visualiza</h3>
            <p className="text-slate-600 text-xs leading-tight">Tu progreso histórico en una interfaz de alto nivel.</p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.05] transition-colors">
            <div className="text-amber-500 mb-3 flex justify-center"><ShieldCheck size={20} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Superación</h3>
            <p className="text-slate-600 text-xs leading-tight">Constancia respaldada por datos, no por suposiciones.</p>
          </div>
        </div>
      </div>

      {/* FOOTER SIMPLE */}
      <footer className="absolute bottom-8 text-[10px] text-slate-700 font-bold tracking-[0.3em] uppercase">
        Built for Performance
      </footer>
    </div>
  );
}