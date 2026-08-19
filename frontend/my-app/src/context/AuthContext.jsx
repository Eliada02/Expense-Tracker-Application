import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/resources';
import { SESSION_EXPIRED_EVENT } from '../services/apiClient';

const AuthContext = createContext(null);

export const AUTH_QUERY_KEY = ['auth', 'me'];

/**
 * Holds the signed-in user. The token itself is an httpOnly cookie the browser
 * manages, so there is nothing to store here - this only tracks *who* the
 * session belongs to, resolved by asking the server on boot.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const {
    data: user,
    isPending,
    isFetched,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        // 401 is the normal "not signed in" answer, not a failure worth
        // retrying or surfacing as an error state.
        if (error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  const setUser = useCallback(
    (nextUser) => queryClient.setQueryData(AUTH_QUERY_KEY, nextUser),
    [queryClient]
  );

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (nextUser) => setUser(nextUser),
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (nextUser) => setUser(nextUser),
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setUser(null);
      // Drop every cached query: the next person to sign in on this browser
      // must not see the previous user's expenses flash on screen.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    },
  });

  // If the cookie expires while the app is open, the next rejected request
  // drops the session so ProtectedRoute sends the user back to sign in.
  useEffect(() => {
    const handleExpiry = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
  }, [setUser]);

  const value = useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: Boolean(user),
      // `isFetched` guards the very first paint, before the session is known.
      isResolving: isPending && !isFetched,
      login,
      register,
      logout,
    }),
    [user, isPending, isFetched, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
