'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Validación de correo real con Expresión Regular
  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); // Limpiamos errores previos

    // 1. Validar que el correo tenga formato real (ej. nombre@dominio.com)
    if (!isValidEmail(email)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    // 2. Validar contraseña segura
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    if (isRegistering) {
      // LÓGICA DE REGISTRO EN DJANGO
      try {
        const res = await fetch('http://127.0.0.1:8000/api/users/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: email, first_name: name, email: email, password: password 
          }),
        });

        if (res.ok) {
          // Si se registra bien, lo logueamos automáticamente
          const loginRes = await signIn("credentials", { email, password, redirect: false });
          if (loginRes?.error) setErrorMsg('Error al iniciar sesión tras el registro.');
        } else {
          setErrorMsg('Error: Este correo ya está registrado o los datos son inválidos.');
        }
      } catch (error) {
        setErrorMsg('Error de conexión con el servidor.');
      }
    } else {
      // LÓGICA DE INICIO DE SESIÓN
      const res = await signIn("credentials", { email, password, redirect: false });
      
      if (res?.error) {
        // AQUÍ ESTÁ EL ERROR EN ROJO QUE PEDÍAS
        setErrorMsg('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
      // Si no hay error, NextAuth cambiará el estado de la sesión automáticamente
    }
    
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-md bg-[#0a0a0a] p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
        
        <div className="text-center mb-8">
          <ShieldCheck size={40} className="mx-auto text-cyan-400 mb-4" />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            {isRegistering ? 'Únete a Fitmo' : 'Iniciar Sesión'}
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">
            Al continuar, aceptas nuestro <span className="text-blue-400 cursor-pointer">Acuerdo de usuario</span> y <span className="text-blue-400 cursor-pointer">Política de privacidad</span>.
          </p>
        </div>

        {/* MENSAJE DE ERROR EN ROJO */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* BOTONES SOCIALES (Estilo Apple/Google) */}
        <div className="space-y-3 mb-8">
          <button 
            onClick={() => signIn('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-black p-4 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors"
          >
            {/* Ícono de Google (SVG) */}
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
          </button>
          
          <button 
            disabled
            className="w-full flex items-center justify-center gap-3 bg-white text-black p-4 rounded-full font-bold text-sm opacity-50 cursor-not-allowed"
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.83 1.54-.05 2.76.66 3.53 1.83-3.1 1.76-2.58 5.73.53 6.94-.75 1.83-1.63 3.42-2.73 4.23zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continuar con Apple (Próximamente)
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">O usa tu email</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="relative">
              <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                className="w-full bg-white/5 py-4 pl-12 pr-4 rounded-2xl border border-white/10 outline-none text-white text-sm focus:border-cyan-500/50 transition-colors" 
                placeholder="Nombre de Atleta" 
                value={name} 
                onChange={(e)=>setName(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="email" 
              className="w-full bg-white/5 py-4 pl-12 pr-4 rounded-2xl border border-white/10 outline-none text-white text-sm focus:border-cyan-500/50 transition-colors" 
              placeholder="Correo electrónico" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="password" 
              className="w-full bg-white/5 py-4 pl-12 pr-4 rounded-2xl border border-white/10 outline-none text-white text-sm focus:border-cyan-500/50 transition-colors" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 p-4 rounded-full font-black text-[12px] tracking-widest uppercase hover:opacity-90 transition-all text-white mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }} 
            className="text-[11px] font-bold text-slate-400 hover:text-white transition-all"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>

      </div>
    </main>
  );
}