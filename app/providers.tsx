'use client';

import { SessionProvider } from "next-auth/react";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // Inicializamos PostHog solo en el lado del cliente
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // Para cuidar la cuota del plan gratuito
        capture_pageview: false // Desactivamos el automático para manejarlo con la librería de React
      });
    }
  }, []);

  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        {children}
      </PostHogProvider>
    </SessionProvider>
  );
}