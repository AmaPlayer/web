import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationManager from '../../components/common/notifications/NotificationManager';
import ErrorBoundary from '../../components/common/safety/ErrorBoundary';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser } = useAuth();
  
  return currentUser ? (
    <>
      {children}
      <ErrorBoundary name="NotificationManager">
        <NotificationManager />
      </ErrorBoundary>
    </>
  ) : (
    <Navigate to="/login" />
  );
}
