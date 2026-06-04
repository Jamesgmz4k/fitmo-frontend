'use client';

import { SessionProvider, useSession, signOut } from "next-auth/react";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import React, { useEffect } from "react";

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  posthog.init('phc_uTEfxW72zA6RzRPcRfx938xyCCpeCEwod8MBwi9h5ZKp', {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false 
  });
}

// 🛡️ Guardia que expulsa al usuario si el token muere por completo
function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/" });
    }
  }, [session]);

  return <div>{children}</div>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard>
        <PostHogProvider client={posthog}>
          {children}
        </PostHogProvider>
      </SessionGuard>
    </SessionProvider>
  );
}