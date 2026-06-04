import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; 

// 1. FUNCIÓN AUXILIAR: Pide un Access Token nuevo a Django usando el Refresh Token
async function refreshAccessToken(token: any) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    const response = await fetch(`${API_URL}/api/login/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token.refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) throw data;

    // Decodificamos el nuevo token para saber su nueva fecha exacta de expiración
    const tokenParts = data.access.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

    return {
      ...token,
      accessToken: data.access,
      accessTokenExpires: payload.exp * 1000, // Django da 'exp' en segundos; convertimos a milisegundos
      // Si tu backend rota los refresh tokens guardamos el nuevo, si no, mantenemos el previo
      refreshToken: data.refresh ?? token.refreshToken, 
    };
  } catch (error) {
    console.error("Error al refrescar el access token en Django:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError", // Mandamos este error para que el frontend sepa que debe desloguear si todo falla
    };
  }
}

const handler = NextAuth({
  providers: [
    // TU PROVEEDOR DE GOOGLE (INTACTO)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    // TU PROVEEDOR DE DJANGO (CORREGIDO PARA TRAER EL REFRESH TOKEN)
    CredentialsProvider({
      name: "Django Auth",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
          const res = await fetch(`${API_URL}/api/login/`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.email, 
              password: credentials?.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.access) {
            const tokenParts = data.access.split('.');
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

            // CORRECCIÓN: Retornamos también el 'refresh' que envía Django SimpleJWT
            return {
              id: payload.user_id || data.id,
              name: data.name || credentials.email,
              email: credentials.email,
              accessToken: data.access,
              refreshToken: data.refresh, // <-- Importante guardar este pase maestro
            };
          }
          return null;
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
          const res = await fetch(`${API_URL}/api/google-login/`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });
          
          if (res.ok) {
            const djangoData = await res.json();
            user.id = djangoData.id.toString();
            
            if (djangoData.access) {
               (user as any).accessToken = djangoData.access;
               // CORRECCIÓN: Si tu endpoint de Google en Django también genera refresh token, lo capturamos aquí
               (user as any).refreshToken = djangoData.refresh; 
            }
            return true;
          }
          return false; 
        } catch (error) {
          console.error("Error conectando Google con Django:", error);
          return false;
        }
      }
      return true; 
    },

    // 2. CALLBACK JWT (TOTALMENTE CONFIGURADO PARA ROTACIÓN AUTOMÁTICA)
    async jwt({ token, user }) {
      // Esto solo se ejecuta la PRIMERA VEZ que el usuario inicia sesión
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;

        // Leemos la expiración del JWT de Django para saber exactamente cuándo caduca
        try {
          const tokenParts = (user as any).accessToken.split('.');
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          token.accessTokenExpires = payload.exp * 1000; // Pasamos los segundos de Django a milisegundos de JS
        } catch {
          // Si por alguna razón el token no se puede mapear, ponemos un tiempo estimado (ej: 1 hora)
          token.accessTokenExpires = Date.now() + 60 * 60 * 1000;
        }
        return token;
      }

      // En las siguientes peticiones, si el token NO ha expirado todavía, lo devolvemos intacto
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // ¡ALERTA! El token expiró. Ejecutamos la función mágica para renovarlo en segundo plano
      return await refreshAccessToken(token);
    },

    // 3. CALLBACK SESSION: Pasa los datos del JWT al Frontend de Next.js
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).error = token.error; // Enviamos el error por si necesitas manejar un logout forzado en el frontend
      }
      return session;
    }
  },
  pages: {
    signIn: '/', 
  },
  session: {
    strategy: "jwt", 
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };