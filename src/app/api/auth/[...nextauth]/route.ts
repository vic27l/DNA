// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importa a configuração centralizada

// Este arquivo agora é muito simples. Ele apenas cria o handler
// usando as opções importadas. Nada mais é exportado além do handler.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
