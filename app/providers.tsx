'use client';

import { SessionProvider } from "next-auth/react";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// 🚀 EL ARREGLO: Inicializamos PostHog en el entorno global (fuera de React)
// Así garantizamos que arranque antes de que cualquier botón o página intente llamarlo.
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
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