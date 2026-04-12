'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Mail, Zap, Shield, CreditCard, Fingerprint } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import Link from 'next/link';
import { apiClient } from '../../lib/apiClient';

export default function PerfilPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ESTADO AGREGADO AQUÍ ADENTRO
  const [isManaging, setIsManaging] = useState(false);

  // Verificamos si el usuario es Pro en la base de datos
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/profile/?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.is_pro);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session, userId]);

  // 2. FUNCIÓN AGREGADA AQUÍ (Adentro del componente, antes del return)
  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const res = await apiClient('/api/create-customer-portal/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Abrimos el portal de Stripe
      } else {
        alert("Error: No se encontró el ID de cliente de Stripe. ¿Hiciste este pago antes de actualizar la base de datos?");
      }
    } catch (error) {
      console.error("Error al abrir portal:", error);
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <DashboardLayout userName={session?.user?.name}>
      <div className="p-4 md:p-10 font-sans text-slate-200">
        <div className="max-w-4xl mx-auto space-y-10">

          <DashboardHeader userName={session?.user?.name} onSignOut={() => signOut()} />

          <section className="bg-white/[0.02] p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-xl">

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-violet-500/20">
                <Shield className="text-violet-400" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                  Mi <span className="text-violet-500">Perfil</span>
                </h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-10 font-medium max-w-lg">
              Gestiona los detalles de seguridad de tu cuenta, preferencias de inicio de sesión y tu suscripción a Fitmo.
            </p>

            <div className="grid md:grid-cols-2 gap-8">

              {/* COLUMNA IZQUIERDA: DATOS DE LA CUENTA */}
              <div className="space-y-6">
                <div className="bg-[#050505] p-6 rounded-3xl border border-white/5 space-y-6">
                  <h3 className="text-white font-black italic uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                    <User size={16} className="text-slate-400" /> Identidad Digital
                  </h3>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                      <User size={12} /> Nombre de Atleta
                    </label>
                    <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm font-bold text-white">
                      {session?.user?.name || 'Cargando...'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                      <Mail size={12} /> Correo Electrónico
                    </label>
                    <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm font-medium text-slate-300">
                      {session?.user?.email || 'correo@ejemplo.com'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                      <Fingerprint size={12} /> ID de Cuenta (Único)
                    </label>
                    <div className="w-full bg-transparent p-4 rounded-2xl border border-white/5 text-xs font-mono text-slate-600">
                      {userId ? `FITMO-USR-${userId}` : '...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: SUSCRIPCIÓN Y SEGURIDAD */}
              <div className="space-y-6">

                {/* TARJETA DE SUSCRIPCIÓN */}
                {isLoading ? (
                  <div className="bg-[#050505] h-40 rounded-3xl border border-white/5 animate-pulse"></div>
                ) : isPro ? (
                  <div className="bg-gradient-to-br from-violet-900/40 to-cyan-900/20 p-6 rounded-3xl border border-violet-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Zap size={100} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-white font-black italic uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-violet-400" /> Facturación
                      </h3>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-3xl font-black text-white italic tracking-tighter">PRO</span>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md mb-1">Activo</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mb-6">
                        Tienes acceso total a las analíticas avanzadas y al mapa de calor muscular.
                      </p>

                      {/* 3. BOTÓN CONECTADO CORRECTAMENTE */}
                      <button
                        onClick={handleManageSubscription}
                        disabled={isManaging}
                        className="inline-block text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isManaging ? 'Abriendo Portal...' : 'Cambiar o Gestionar Plan →'}
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="bg-[#050505] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-slate-400 font-black italic uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                        <CreditCard size={16} /> Facturación
                      </h3>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-2xl font-black text-slate-300 italic tracking-tighter">BÁSICO</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-6">
                        Estás en el plan gratuito. Desbloquea tu verdadero potencial con las métricas avanzadas.
                      </p>
                      <Link href="/pro" className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] flex items-center justify-center gap-2 w-full">
                        <Zap size={14} fill="currentColor" /> Mejorar a Pro
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}