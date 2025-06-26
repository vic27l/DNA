// next-auth.d.ts
import 'next-auth';

// Declara um módulo para estender os tipos existentes do next-auth
declare module 'next-auth' {
  /**
   * O objeto Session retornado pelos hooks como `useSession` ou `getSession`.
   */
  interface Session {
    // Adicionamos a nossa propriedade 'id' dentro do objeto user
    user: {
      id: string; // O ID do usuário vindo do banco de dados
    } & { // O '&' combina nossos tipos com os tipos originais
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  /**
   * O objeto User que vem do banco de dados através do Adapter.
   */
  interface User {
    // Também garantimos que o tipo User tenha um 'id'
    id: string;
  }
}
