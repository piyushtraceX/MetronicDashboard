import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      setLocation('/login');
    }
    
    // If user and trial expired, could redirect to subscription page
    if (user?.subscriptionStatus === 'expired') {
      // For now we'll let them continue but in a real app we might
      // redirect to a subscription page or show a modal
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, render the children
  return user ? <>{children}</> : null;
}