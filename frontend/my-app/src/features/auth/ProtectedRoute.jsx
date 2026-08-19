import { Navigate, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Splash = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: var(--text-muted);

  svg {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Gate in front of every application route.
 *
 * While the session is still being resolved it renders a splash rather than
 * redirecting: without that, a signed-in user would be bounced to the login
 * page for a moment on every hard refresh.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isResolving } = useAuth();
  const location = useLocation();

  if (isResolving) {
    return (
      <Splash role="status" aria-live="polite">
        <Loader2 size={28} aria-hidden="true" />
        <span className="sr-only">Checking your session</span>
      </Splash>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
