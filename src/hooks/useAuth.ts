import { useContext } from 'react';
import { AuthContext, type AuthState } from '../contexts/AuthContext';

// Lit la session partagée fournie par <AuthProvider> (voir src/contexts/AuthContext.tsx)
export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth doit être utilisé sous <AuthProvider>');
  return auth;
}
