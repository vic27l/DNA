// src/lib/auth.ts
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Enhanced configuration with better error handling and deployment support
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Add logging for debugging
      console.log('SignIn attempt:', { user: user?.email, account: account?.provider });
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects work correctly in production
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error', // Error code passed in query string as ?error=
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
