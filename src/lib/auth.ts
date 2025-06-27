// src/lib/auth.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// IMPORTANTE: Importando o adapter correto que instalamos
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";
import type { Adapter } from "next-auth/adapters";

// Validação das variáveis de ambiente para evitar erros
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleClientId || !googleClientSecret || !supabaseUrl || !supabaseServiceRoleKey || !nextAuthSecret) {
  throw new Error("Variáveis de ambiente ausentes para autenticação.");
}

// Opções de configuração do NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],

  // Usando o adapter correto com a tipagem esperada
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }) as Adapter,

  // Definindo a estratégia de sessão para 'database', que é o recomendado para adapters
  session: {
    strategy: "database",
  },
  
  secret: nextAuthSecret,

  // Adicionando callbacks para incluir o ID do usuário na sessão
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  pages: {
    error: '/auth/error',
  },
};
