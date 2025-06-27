// src/app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const errorMessages = {
  Callback: 'Erro na configuração OAuth. Verifique as configurações do Google Cloud Console.',
  OAuthSignin: 'Erro ao iniciar o processo de login com Google.',
  OAuthCallback: 'Erro no callback do OAuth. Verifique as URLs de redirecionamento.',
  OAuthCreateAccount: 'Erro ao criar conta. Tente novamente.',
  EmailCreateAccount: 'Erro ao criar conta com email.',
  Signin: 'Erro geral de login. Tente novamente.',
  OAuthAccountNotLinked: 'Esta conta já está vinculada a outro método de login.',
  SessionRequired: 'Você precisa estar logado para acessar esta página.',
  default: 'Ocorreu um erro inesperado durante a autenticação.'
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') as keyof typeof errorMessages;
  const errorMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Erro de Autenticação
        </h1>
        
        <p className="text-gray-300 mb-6">
          {errorMessage}
        </p>
        
        {error === 'Callback' && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-yellow-400 font-semibold mb-2">Solução:</h3>
            <ul className="text-sm text-yellow-200 space-y-1">
              <li>• Verifique as URLs de redirecionamento no Google Console</li>
              <li>• Confirme que o domínio está autorizado</li>
              <li>• Verifique as variáveis de ambiente</li>
            </ul>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </button>
          
          <Link
            href="/"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Voltar à Página Inicial
          </Link>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
          Código do erro: {error || 'Desconhecido'}
        </div>
      </div>
    </div>
  );
}
