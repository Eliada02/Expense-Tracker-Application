import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { GlobalStyle } from './styles/GlobalStyle';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data changes only when the user changes it, so re-fetching on every
      // window focus would just be noise.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // A 4xx is a real answer, not a blip: only retry once, and never for
      // client errors.
      retry: (failureCount, error) =>
        failureCount < 1 && !(error?.status >= 400 && error?.status < 500),
    },
    mutations: { retry: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalStyle />
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <BrowserRouter>
              {/* Inside the router so auth screens can navigate. */}
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
