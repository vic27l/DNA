// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Pega a URL do projeto e a chave anônima pública das variáveis de ambiente.
// É importante que essas variáveis estejam no seu arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica se as variáveis foram definidas. Se não, lança um erro.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or anonymous key are not defined in environment variables.');
}

// Cria e exporta o cliente do Supabase.
// Este cliente será usado para interagir com o seu banco de dados Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
