// Files uploaded: auth.ts, supabaseClient.ts, route.ts

// Error summary:
// The NextAuth integration with Supabase is throwing the error:
// "The schema must be one of the following: public, graphql_public, realtime, storage"
// This error occurs when calling `getUserByAccount` through Supabase's PostgREST API.

// Cause:
// The `schema` provided in the NextAuth Supabase adapter config is invalid.
// Supabase allows only a few schemas for access via its API by default:
//   - public
//   - graphql_public
//   - realtime
//   - storage

// ✅ Final Fix:
// 1. Removed the invalid `schema` parameter from `SupabaseAdapter` options.
// 2. Avoided redefining `createClient` and `supabase`.

// ---------- FILE: auth.ts (final version) ----------

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
  }),
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

// ---------- FILE: supabaseClient.ts ----------

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabase;

// ---------- FILE: route.ts (unchanged or handles other logic) ----------

// Ensure any auth imports in route.ts point correctly to this updated auth.ts
