'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Ainda carregando

    if (session) {
      // Se estiver logado, redirecionar baseado no role
      if (session.user.role === 'PACIENTE') {
        router.push('/portal/dashboard');
      } else if (session.user.role === 'PARCEIRO') {
        router.push('/partner/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Se não estiver logado, ir para login
      router.push('/login');
    }
  }, [session, status, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando FisioFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}


