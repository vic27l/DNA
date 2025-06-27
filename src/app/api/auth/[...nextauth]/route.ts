// Importações necessárias do NextAuth e do adapter do Supabase
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import type { Adapter } from "next-auth/adapters"

// Leitura das variáveis de ambiente para a configuração.
// É uma boa prática verificar se elas existem para evitar erros em runtime.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

// Validação para garantir que todas as variáveis de ambiente necessárias estão definidas.
// Se alguma estiver faltando, o servidor irá parar com um erro claro.
if (!googleClientId || !googleClientSecret || !supabaseUrl || !supabaseServiceRoleKey || !nextAuthSecret) {
  throw new Error("Missing required environment variables for authentication.");
}

// Configuração principal do Auth.js
const handler = NextAuth({
  // Lista de provedores de autenticação. No seu caso, apenas Google.
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],

  // Configuração do adapter para persistir os dados no Supabase.
  // O `Adapter` type assertion é necessário para garantir a tipagem correta.
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }) as Adapter,

  // Definir a estratégia de sessão como "database" é recomendado ao usar um adapter.
  // Isso garante que as sessões sejam salvas no banco de dados.
  session: {
    strategy: "database",
  },
  
  // O secret é usado para assinar e criptografar JWTs, cookies, etc.
  // É obrigatório em produção.
  secret: nextAuthSecret,

  // Páginas customizadas (opcional, mas bom para uma melhor experiência do usuário)
  pages: {
    error: '/auth/error', // Rota para exibir erros de autenticação
  },
});

// Exporta os handlers para as rotas GET e POST, conforme a convenção do App Router.
export { handler as GET, handler as POST }
