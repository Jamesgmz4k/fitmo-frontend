'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Activity, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Shield,
  Utensils,
  Moon, 
  Dumbbell,
  Menu, // <-- Nuevo ícono para hamburguesa
  X     // <-- Nuevo ícono para cerrar en móvil
} from 'lucide-react';

export default function Sidebar({ isPro, userName = "Atleta" }: { isPro?: boolean, userName?: string | null }) {
  const [expanded, setExpanded] = useState(false); // Para escritorio (ancho)
  const [mobileOpen, setMobileOpen] = useState(false); // Para celular (abierto/cerrado)
  const pathname = usePathname();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/" },
    { icon: <Dumbbell size={20} />, label: "Entrenar", href: "/entrenar" },
    { icon: <Utensils size={20} />, label: "Nutrición", href: "/nutricion" },
    { icon: <Moon size={20} />, label: "Sueño", href: "/sueno" },
    { icon: <Activity size={20} />, label: "Datos de Atleta", href: "/datos" },
    { icon: <User size={20} />, label: "Mi Perfil", href: "/perfil" },
  ];

  return (
    <>
      {/* 🚀 BOTÓN HAMBURGUESA (Solo visible en celular) */}
      <div className="md:hidden fixed top-0 left-0 z-40 p-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 🌑 OVERLAY OSCURO (Solo aparece en celular cuando la barra está abierta) */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 📱 LA BARRA LATERAL (Deslizable en móvil, estática en desktop) */}
      <aside 
        className={`h-screen fixed top-0 left-0 bg-[#050505] border-r border-white/5 z-50 transition-all duration-300 ease-in-out flex flex-col transform md:translate-x-0 ${
          expanded ? 'w-64' : 'w-20'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* HEADER / LOGO */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden transition-all ${expanded || mobileOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 md:opacity-100 md:w-auto'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <span className={`text-white font-black italic tracking-tighter text-xl uppercase ${!expanded && !mobileOpen ? 'md:hidden' : ''}`}>Fitmo</span>
          </div>
          
          {/* Botón de expandir (Solo Desktop) */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="hidden md:block p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          {/* Botón de cerrar (Solo Móvil) */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* LINKS DE NAVEGACIÓN */}
        <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-hidden">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={index} 
                href={item.href}
                onClick={() => setMobileOpen(false)} // 👈 Cierra la barra en celular al cambiar de página
                className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                title={!expanded && !mobileOpen ? item.label : ""}
              >
                <div className="shrink-0">{item.icon}</div>
                <span className={`font-bold text-sm tracking-wide whitespace-nowrap transition-all duration-300 ${
                  expanded || mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden md:hidden'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER / ESTATUS DE SUSCRIPCIÓN */}
        <div className="p-4 border-t border-white/5">
          <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
            isPro 
              ? 'bg-gradient-to-r from-violet-600/10 to-cyan-500/10 border border-violet-500/20' 
              : 'bg-white/5 border border-white/5'
          }`}>
            <div className="shrink-0">
              {isPro ? (
                <Zap size={20} className="text-violet-400" fill="currentColor" />
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </div>
            
            <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
              expanded || mobileOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden md:hidden'
            }`}>
              <p className="text-xs font-bold text-white truncate max-w-[120px]">{userName}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                isPro ? 'text-cyan-400' : 'text-slate-500'
              }`}>
                {isPro ? 'Plan Pro' : 'Plan Básico'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}