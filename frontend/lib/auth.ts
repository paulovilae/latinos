import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

const PRIMARY_API = process.env.NEXT_PUBLIC_API_URL_PRIMARY || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SECONDARY_API = process.env.NEXT_PUBLIC_API_URL_SECONDARY || "";
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

const getHeaders = (extra: Record<string, string> = {}) => ({
  "Content-Type": "application/json",
  ...(CF_CLIENT_ID ? { "CF-Access-Client-Id": CF_CLIENT_ID } : {}),
  ...(CF_CLIENT_SECRET ? { "CF-Access-Client-Secret": CF_CLIENT_SECRET } : {}),
  ...extra,
});

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
          const tryLogin = async (baseUrl: string) => {
            const res = await fetch(`${baseUrl}/api/auth/login`, {
              method: "POST",
              headers: getHeaders(),
              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
            });

            if (!res.ok) return null;
            
            const tokenData = await res.json();
            
            // Fetch Me
            const meRes = await fetch(`${baseUrl}/api/users/me`, {
              headers: getHeaders({ Authorization: `Bearer ${tokenData.access_token}` }),
            });
            
            if(meRes.ok) {
                const user = await meRes.json();
                return { ...user, accessToken: tokenData.access_token };
            }
            return null;
          };

          try {
            return await tryLogin(PRIMARY_API);
          } catch (err) {
            if (SECONDARY_API) return await tryLogin(SECONDARY_API);
            throw err;
          }

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
             const trySocial = async (baseUrl: string) => {
               const res = await fetch(`${baseUrl}/api/auth/google`, {
                   method: "POST",
                   headers: getHeaders(),
                   body: JSON.stringify({
                       email: user.email,
                       name: user.name || "Google User",
                       provider: "google"
                   })
               });
               
               if(res.ok) {
                   const data = await res.json();
                   token.accessToken = data.access_token;
                   token.role = data.role;
                   
                   const meRes = await fetch(`${baseUrl}/api/users/me`, {
                      headers: getHeaders({ Authorization: `Bearer ${data.access_token}` }),
                   });
                   if (meRes.ok) {
                       const me = await meRes.json();
                       token.plan = me.subscription_tier;
                   }
                   return true;
               }
               return false;
             };

             try {
               await trySocial(PRIMARY_API);
             } catch (err) {
               if (SECONDARY_API) await trySocial(SECONDARY_API);
             }
           } catch(e) {
               console.error("Social Login Error", e);
           }
      } else if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).subscription_tier;
        token.accessToken = (user as any).accessToken;
      }
      
      // Self-healing: if accessToken is missing (stale session) and it's the demo admin, restore it.
      // This prevents 401 errors after server restarts or code changes.
      if (!token.accessToken && token.email === "demo@latinos.dev") {
          token.accessToken = "demo-admin-token";
          token.role = "admin";
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
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
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
