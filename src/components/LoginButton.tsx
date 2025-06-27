// src/components/LoginButton.tsx

'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import React from 'react';

/**
 * Componente de botão de Login/Logout
 * * Este componente gerencia a interface de autenticação do usuário.
 * - Se o usuário não estiver logado, mostra um botão "Login com Google".
 * - Se o usuário estiver logado, mostra sua foto de perfil, nome e um botão de "Logout".
 * - Mostra um estado de carregamento enquanto a sessão está sendo verificada.
 */
export default function LoginButton() {
  const { data: session, status } = useSession();

  // Estado de Carregamento: a sessão ainda está sendo verificada
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Estado Autenticado: mostra informações do usuário e botão de logout
  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'Avatar do usuário'}
            width={40}
            height={40}
            className="rounded-full border-2 border-primary-orange"
          />
        )}
        <div className="text-right">
          <p className="font-semibold text-white">{session.user?.name}</p>
          <p className="text-sm text-gray-300">{session.user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    );
  }

  // Estado Não Autenticado: mostra botão de login
  return (
    <button
      onClick={() => signIn('google')}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-3 transition-colors text-lg"
    >
      <LogIn size={20} />
      Login com Google
    </button>
  );
}
