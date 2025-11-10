import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationManager from '../../components/common/notifications/NotificationManager';
import ErrorBoundary from '../../components/common/safety/ErrorBoundary';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser, loading } = useAuth();

  console.log('🔐 PrivateRoute check:', { loading, hasUser: !!currentUser, userEmail: currentUser?.email });

  // Show loading while auth state is initializing
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Auth has loaded, check if user is authenticated
  if (!currentUser) {
    console.log('❌ No user found, redirecting to /login');
    return <Navigate to="/login" />;
  }

  console.log('✅ User authenticated, allowing access');
  return (
    <>
      {children}
      <ErrorBoundary name="NotificationManager">
        <NotificationManager />
      </ErrorBoundary>
    </>
  );
}
