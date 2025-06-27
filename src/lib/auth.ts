import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { SupabaseAdapter } from "@next-auth/supabase-adapter";

// Ensure environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey || !googleClientId || !googleClientSecret) {
  throw new Error("Missing required environment variables for Supabase or Google Auth.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
    // Explicitly set the schema to 'public' which is the default and allowed schema
    schema: 'public'
  }),
  session: {
    strategy: "database",
    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Seconds - Throttle how frequently to write to the database to extend a session.
    // Use `updateAge` to control how often the session is updated in the database.
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // Add debug logging for development
  debug: process.env.NODE_ENV === 'development',
  // Add other NextAuth options here as needed
};
