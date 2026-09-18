import { Navigate } from 'react-router-dom';
import { useOwnerAuth } from '../lib/hooks.js';
import { Loader } from '../components.jsx';

export function OwnerRoute({ children }) {
  const { owner, loading } = useOwnerAuth();

  if (loading) {
    return <Loader scuro />;
  }

  if (!owner) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
