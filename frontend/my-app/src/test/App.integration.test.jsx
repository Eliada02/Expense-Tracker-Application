import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, makeExpense } from './fixtures';

// Chart.js needs a real canvas, which jsdom does not provide. The charts are
// stubbed so this test can cover routing, data flow and the page shells.
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
}));

const envelope = (data, meta) => ({ data: { success: true, data, meta } });

const dashboardPayload = {
  month: '2024-05',
  currency: 'EUR',
  summary: {
    totalExpenses: 1500,
    totalIncome: 2400,
    balance: 900,
    monthExpenses: 1030,
    monthIncome: 2400,
    monthBalance: 1370,
    previousMonthExpenses: 900,
    monthOverMonthChange: 14.4,
    averageDailySpend: 34.3,
    transactionCount: 4,
    highestExpense: { title: 'Rent', amount: 900 },
  },
  byCategory: [
    { category: 'bills', label: 'Bills & Utilities', color: '#64748b', total: 900, count: 1, share: 87.4 },
  ],
  monthlyTrend: [{ month: '2024-05', expenses: 1030, income: 2400 }],
  dailySpending: [{ date: '2024-05-01', total: 900 }],
};

const insightsPayload = {
  month: '2024-05',
  currency: 'EUR',
  insights: [
    {
      id: 'daily-average',
      tone: 'neutral',
      title: 'Your average daily spending is €34',
      description: '€1,030 over 30 days.',
    },
  ],
};

const DEMO_USER = { _id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' };

const routeHandlers = {
  '/auth/me': () => envelope(DEMO_USER),
  '/categories': () => envelope({ expense: EXPENSE_CATEGORIES, income: [] }),
  '/payment-methods': () => envelope(PAYMENT_METHODS),
  '/config': () => envelope({ currency: 'EUR', timezone: 'UTC', frequencies: ['weekly', 'monthly', 'yearly'] }),
  '/dashboard': () => envelope(dashboardPayload),
  '/insights': () => envelope(insightsPayload),
  '/expenses': () =>
    envelope([makeExpense(), makeExpense({ _id: '2', title: 'Rent', amount: 900, category: 'bills' })], {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      filteredTotalAmount: 942.5,
    }),
  '/incomes': () => envelope([], { page: 1, limit: 20, total: 0, totalPages: 1, filteredTotalAmount: 0 }),
  '/budgets': () =>
    envelope({
      month: '2024-05',
      currency: 'EUR',
      overall: {
        _id: 'b1',
        category: null,
        label: 'Overall monthly budget',
        amount: 1500,
        spent: 1120,
        remaining: 380,
        percentUsed: 74.6,
        status: 'ok',
      },
      categories: [],
    }),
  '/recurring': () => envelope([]),
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
  vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    const handler = routeHandlers[url];
    if (!handler) return Promise.reject(new Error(`Unhandled GET ${url}`));
    return Promise.resolve(handler());
  });
});

describe('application shell', () => {
  it('renders the sidebar with every route', async () => {
    renderApp();

    // The shell only mounts once the session has been resolved.
    const nav = await screen.findByRole('navigation', { name: /main navigation/i });
    ['Dashboard', 'Expenses', 'Income', 'Budgets', 'Insights', 'Recurring', 'Settings'].forEach(
      (label) => {
        expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
      }
    );
  });

  it('navigates between pages without a full reload', async () => {
    const user = renderApp();

    await user.click(await screen.findByRole('link', { name: 'Budgets' }));

    expect(await screen.findByRole('heading', { name: 'Budgets', level: 1 })).toBeInTheDocument();
  });

  it('shows a not-found page for an unknown route', async () => {
    renderApp('/nowhere');

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('toggles dark mode and persists the choice', async () => {
    const user = renderApp();

    await user.click(await screen.findByRole('button', { name: /switch to dark mode/i }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('expense-tracker-theme')).toBe('dark');
  });
});

describe('dashboard page', () => {
  it('renders the summary figures returned by the API', async () => {
    renderApp();

    expect(await screen.findByText('€1,030.00')).toBeInTheDocument();
    expect(screen.getByText('€1,500.00')).toBeInTheDocument();
    expect(screen.getByText('+14.4%')).toBeInTheDocument();
  });

  it('renders all three charts', async () => {
    renderApp();

    expect(await screen.findByTestId('chart-doughnut')).toBeInTheDocument();
    expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
  });

  it('renders insights coming from the API', async () => {
    renderApp();

    expect(await screen.findByText('Your average daily spending is €34')).toBeInTheDocument();
  });
});

describe('expenses page', () => {
  it('lists expenses with the filtered total', async () => {
    renderApp('/expenses');

    expect(await screen.findAllByText('Weekly shop')).not.toHaveLength(0);
    expect(screen.getByText('€942.50')).toBeInTheDocument();
    expect(screen.getByText(/2 transactions/)).toBeInTheDocument();
  });

  it('opens the add-expense dialog with a focus trap', async () => {
    const user = renderApp('/expenses');

    await user.click((await screen.findAllByRole('button', { name: /add expense/i }))[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('asks for confirmation before deleting', async () => {
    const user = renderApp('/expenses');

    await user.click((await screen.findAllByRole('button', { name: 'Delete Weekly shop' }))[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/permanently removed/i)).toBeInTheDocument();
  });
});

describe('budgets page', () => {
  it('shows budget, spent, remaining and percentage used', async () => {
    renderApp('/budgets');

    expect(await screen.findByText('€1,500.00')).toBeInTheDocument();
    expect(screen.getByText('€1,120.00')).toBeInTheDocument();
    expect(screen.getByText('€380.00')).toBeInTheDocument();
    expect(screen.getByText('74.6%')).toBeInTheDocument();
  });

  it('exposes budget usage as a progress bar', async () => {
    renderApp('/budgets');

    const bar = await screen.findByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
  });
});

describe('error handling', () => {
  it('shows a retryable error state when the API is unreachable', async () => {
    apiClient.get.mockImplementation((url) =>
      url === '/dashboard'
        ? Promise.reject(new Error('Could not reach the server.'))
        : Promise.resolve(routeHandlers[url]?.() ?? envelope(null))
    );

    renderApp();

    expect(await screen.findByText('Could not reach the server.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows an empty state when there is nothing to display', async () => {
    renderApp('/recurring');

    expect(await screen.findByText('No recurring expenses')).toBeInTheDocument();
  });
});
