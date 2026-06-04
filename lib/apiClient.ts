import { getSession, signOut } from "next-auth/react";

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  // 1. Obtenemos la sesión en tiempo real de NextAuth
  const session = await getSession();
  const accessToken = (session?.user as any)?.accessToken || (session as any)?.accessToken;

  // 2. Preparamos los headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // 3. Ejecutamos la petición hacia Django
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si recibimos un 401, el token de refresco expiró por completo (ej. pasaron los 7 días)
  if (response.status === 401) {
    console.error("Token de autenticación expirado definitivamente.");
    if (typeof window !== "undefined") {
      signOut({ callbackUrl: "/" }); // Redirigimos al usuario para proteger la UX
    }
  }

  return response;
}