'use client';

import { SessionProvider } from "next-auth/react";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// 🚀 INICIALIZACIÓN BLINDADA: Llave directa y túnel anti-adblockers activado
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  posthog.init('phc_uTEfxW72zA6RzRPcRfx938xyCCpeCEwod8MBwi9h5ZKp', {
    api_host: '/ingest', // Esto conecta directamente con tu next.config.ts
    ui_host: 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false 
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        {children}
      </PostHogProvider>
    </SessionProvider>
  );
}