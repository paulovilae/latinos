import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Use 127.0.0.1 primarily if local to avoid resolving issues
          // But NEXT_PUBLIC_API_URL is available
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          if (!res.ok) return null;
          
          const tokenData = await res.json();
          // Demo Admin bypass
          if (tokenData.access_token === "demo-admin-token") {
              return {
                  id: "1",
                  name: "Demo Admin",
                  email: "demo@latinos.dev",
                  role: "admin",
                  accessToken: tokenData.access_token
              } as any
          }
          
           // Fetch Me
           const meRes = await fetch(`${apiUrl}/users/me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          
          if(meRes.ok) {
              const user = await meRes.json();
              return { ...user, accessToken: tokenData.access_token };
          }
          
          return null;

        } catch (e) {
          console.error("Auth Error:", e)  
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider === "google" && user) {
           // Exchange for Backend Token
           try {
             const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
             const res = await fetch(`${apiUrl}/auth/google`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({
                     email: user.email,
                     name: user.name || "Google User",
                     provider: "google"
                 })
             });
             
             if(res.ok) {
                 const data = await res.json();
                 token.accessToken = data.access_token;
                 token.role = data.role; // Use role from backend (could be admin)
                 // Fetch me to get plan
                 const meRes = await fetch(`${apiUrl}/users/me`, {
                    headers: { Authorization: `Bearer ${data.access_token}` },
                 });
                 if (meRes.ok) {
                     const me = await meRes.json();
                     token.plan = me.subscription_tier;
                 }
             }
           } catch(e) {
               console.error("Social Login Error", e);
           }
      } else if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).subscription_tier; // From authorize()
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};
