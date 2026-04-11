'use client';

import Sidebar from './sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isPro?: boolean;
  userName?: string | null;
}

export default function DashboardLayout({ children, isPro, userName }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#050505]">
      
      {/* 1. SOLO LA BARRA LATERAL */}
      <Sidebar isPro={isPro} userName={userName} />

      {/* 2. EL CONTENEDOR (Solo hace el espacio ml-20 para que el sidebar no aplaste el contenido) */}
      <main className="flex-1 ml-20 transition-all duration-300"> 
        {children}
      </main>

    </div>
  );
}