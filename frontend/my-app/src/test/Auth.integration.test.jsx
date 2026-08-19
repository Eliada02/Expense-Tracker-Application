import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from './fixtures';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
}));

const envelope = (data, meta) => ({ data: { success: true, data, meta } });

const USER = { _id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' };

const emptyDashboard = {
  month: '2024-05',
  currency: 'EUR',
  summary: {
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0,
    monthExpenses: 0,
    monthIncome: 0,
    monthBalance: 0,
    previousMonthExpenses: 0,
    monthOverMonthChange: null,
    averageDailySpend: 0,
    transactionCount: 0,
    highestExpense: null,
  },
  byCategory: [],
  monthlyTrend: [],
  dailySpending: [],
};

/** Signed-out unless a test says otherwise. */
let signedIn = false;

const getHandlers = {
  '/auth/me': () =>
    signedIn ? envelope(USER) : Promise.reject(new ApiError('Unauthorized', { status: 401 })),
  '/categories': () => envelope({ expense: EXPENSE_CATEGORIES, income: [] }),
  '/payment-methods': () => envelope(PAYMENT_METHODS),
  '/config': () => envelope({ currency: 'EUR', timezone: 'UTC', frequencies: ['monthly'] }),
  '/dashboard': () => envelope(emptyDashboard),
  '/insights': () => envelope({ month: '2024-05', currency: 'EUR', insights: [] }),
  '/expenses': () =>
    envelope([], { page: 1, limit: 20, total: 0, totalPages: 1, filteredTotalAmount: 0 }),
};

const renderApp = (route = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
  return userEvent.setup();
};

beforeEach(() => {
  // Spies must be torn down between tests, otherwise a rejection queued by one
  // test still applies in the next and call counts accumulate.
  vi.restoreAllMocks();
  signedIn = false;
  vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    const handler = getHandlers[url];
    return handler ? Promise.resolve(handler()) : Promise.resolve(envelope(null));
  });
  vi.spyOn(apiClient, 'post').mockImplementation(() => Promise.resolve(envelope(USER)));
});

describe('route protection', () => {
  it('sends a signed-out visitor to the login page', async () => {
    renderApp('/expenses');

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('shows a loading state while the session is being resolved', () => {
    renderApp('/');

    expect(screen.getByRole('status')).toHaveTextContent(/checking your session/i);
  });

  it('lets a signed-in user reach the application', async () => {
    signedIn = true;
    renderApp('/');

    expect(
      await screen.findByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
  });

  it('keeps a signed-in user away from the login page', async () => {
    signedIn = true;
    renderApp('/login');

    expect(
      await screen.findByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument();
  });
});

describe('login page', () => {
  it('validates the form before calling the API', async () => {
    const user = renderApp('/login');
    await screen.findByRole('heading', { name: /welcome back/i });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects a malformed email locally', async () => {
    const user = renderApp('/login');
    await screen.findByRole('heading', { name: /welcome back/i });

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('submits valid credentials and enters the app', async () => {
    const user = renderApp('/login');
    await screen.findByRole('heading', { name: /welcome back/i });

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'ada@example.com',
        password: 'password123',
      })
    );
    expect(
      await screen.findByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
  });

  it('surfaces the server message for bad credentials', async () => {
    apiClient.post.mockRejectedValue(
      new ApiError('Incorrect email or password', { status: 401 })
    );
    const user = renderApp('/login');
    await screen.findByRole('heading', { name: /welcome back/i });

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
  });

  it('uses a password input so the value is masked', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: /welcome back/i });

    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });
});

describe('registration page', () => {
  it('requires every field', async () => {
    const user = renderApp('/register');
    await screen.findByRole('heading', { name: /create your account/i });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('enforces the minimum password length', async () => {
    const user = renderApp('/register');
    await screen.findByRole('heading', { name: /create your account/i });

    await user.type(screen.getByLabelText('Name *'), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText('Password *'), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText('Password must be at least 8 characters')
    ).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('requires the two passwords to match', async () => {
    const user = renderApp('/register');
    await screen.findByRole('heading', { name: /create your account/i });

    await user.type(screen.getByLabelText('Name *'), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('registers and lands in the application', async () => {
    const user = renderApp('/register');
    await screen.findByRole('heading', { name: /create your account/i });

    await user.type(screen.getByLabelText('Name *'), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
      })
    );
    expect(
      await screen.findByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
  });

  it('shows a duplicate-email error from the server', async () => {
    apiClient.post.mockRejectedValue(
      new ApiError('That email address is already registered', { status: 409 })
    );
    const user = renderApp('/register');
    await screen.findByRole('heading', { name: /create your account/i });

    await user.type(screen.getByLabelText('Name *'), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('already registered');
  });
});

describe('signed-in shell', () => {
  it('shows who is signed in', async () => {
    signedIn = true;
    renderApp('/');

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('logs out and returns to the login page', async () => {
    signedIn = true;
    const user = renderApp('/');
    await screen.findByRole('navigation', { name: /main navigation/i });

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/auth/logout'));
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});
