import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; 

const handler = NextAuth({
  providers: [
    // 1. TU PROVEEDOR DE GOOGLE (NUEVO)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    // 2. TU PROVEEDOR DE DJANGO (INTACTO)
    CredentialsProvider({
      name: "Django Auth",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch("http://127.0.0.1:8000/api/login/", {
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

            return { 
              id: payload.user_id.toString(), 
              name: credentials.email.split('@')[0], 
              email: credentials.email,
              accessToken: data.access
            };
          }
          
          return null; 
        } catch (error) {
          console.error("Error conectando con el cadenero de Django:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // 3. INTERCEPTOR DE GOOGLE (NUEVO)
    async signIn({ user, account, profile }) {
      // Si el usuario entra con Google, le avisamos a Django para que lo guarde
      if (account?.provider === "google") {
        try {
          const res = await fetch("http://127.0.0.1:8000/api/google-login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });
          
          if (res.ok) {
            const djangoData = await res.json();
            // Sobreescribimos el ID temporal de Google con el ID real definitivo de tu base de datos
            user.id = djangoData.id.toString();
            
            // Si tu endpoint de Django también devuelve un token para sesiones de Google, lo guardamos
            if (djangoData.access) {
               (user as any).accessToken = djangoData.access;
            }
            return true;
          }
          return false; // Si Django falla (ej. base de datos caída), no lo dejamos entrar
        } catch (error) {
          console.error("Error conectando Google con Django:", error);
          return false;
        }
      }
      
      // Si entra por Credentials (correo/contraseña), lo dejamos pasar directo
      return true; 
    },

    // 4. TUS CALLBACKS INTACTOS
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
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