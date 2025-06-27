// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Importa a configuração do novo arquivo

// Inicializa o manipulador do NextAuth com as opções importadas
const handler = NextAuth(authOptions);

// Exporta os métodos GET e POST para a rota
export { handler as GET, handler as POST };
