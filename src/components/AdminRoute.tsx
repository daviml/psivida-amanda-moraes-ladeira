import { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.email !== adminEmail) {
    console.warn("Acesso bloqueado. Email não é admin:", user?.email);
    // Redirect non-admins back to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
