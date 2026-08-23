import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore.js';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <p className="text-sm font-medium tracking-wide text-slate-400">Authenticating Operator Console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950 text-slate-200">
        <div className="glass-panel max-w-md rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-400">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-400">Your account ({user?.role}) does not have administrative permissions.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
