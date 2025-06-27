'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// A component that uses useSearchParams needs to be a Client Component.
// We'll wrap it in Suspense in the main export.
function ErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: { title: string; description: string } } = {
    Callback: {
      title: 'Erro de Callback',
      description: 'Houve um problema ao processar sua autenticação. Isso pode ser um problema temporário. Por favor, tente novamente.',
    },
    OAuthAccountNotLinked: {
        title: 'Conta não vinculada',
        description: 'Esta conta de email já está em uso com outro provedor de login. Por favor, faça login com o método original.',
    },
    // Add other common NextAuth errors as needed
    default: {
      title: 'Erro de Autenticação',
      description: 'Ocorreu um erro inesperado durante o login. Por favor, tente novamente.',
    },
  };

  const errorMessage = error && errorMessages[error] ? errorMessages[error] : errorMessages.default;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">{errorMessage.title}</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 pt-2">
            {errorMessage.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/api/auth/signin" passHref>
            <Button className="w-full">
              Tentar Novamente
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export for the page, wrapping the client component in Suspense
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ErrorDisplay />
    </Suspense>
  );
}
