// src/components/LoginButton.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-white">Carregando...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? 'Avatar'}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <span className="text-white">{session.user?.name}</span>
        <button
          onClick={() => signOut()}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
    >
      Login com Google
    </button>
  );
}
