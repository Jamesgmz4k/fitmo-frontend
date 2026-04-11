import { LogOut, User as UserIcon } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string | null;
  onSignOut: () => void;
}

export default function DashboardHeader({ userName, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="flex justify-between items-center border-b border-white/5 pb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-white/5">
          <UserIcon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dashboard</p>
          <h1 className="text-2xl font-black italic text-white">
            HOLA, <span className="text-[#8b5cf6]">{userName?.toUpperCase() || 'ATLETA'}</span>
          </h1>
        </div>
      </div>
      <button 
        onClick={onSignOut} 
        className="bg-white/5 text-slate-400 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-all"
      >
        <LogOut size={14} /> SALIR
      </button>
    </header>
  );
}