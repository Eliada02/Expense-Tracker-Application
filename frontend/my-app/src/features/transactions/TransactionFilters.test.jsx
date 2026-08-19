import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionFilters from './TransactionFilters';
import { EMPTY_FILTERS } from '../../constants';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../test/fixtures';

const MONTHS = [
  { value: '2024-05', label: 'May 2024' },
  { value: '2024-04', label: 'Apr 2024' },
];

const renderFilters = (filters = EMPTY_FILTERS) => {
  const onChange = vi.fn();
  const onReset = vi.fn();
  const onSortChange = vi.fn();
  render(
    <TransactionFilters
      filters={filters}
      onChange={onChange}
      onReset={onReset}
      categories={EXPENSE_CATEGORIES}
      paymentMethods={PAYMENT_METHODS}
      months={MONTHS}
      sort="date:desc"
      onSortChange={onSortChange}
    />
  );
  return { onChange, onReset, onSortChange, user: userEvent.setup() };
};

describe('TransactionFilters', () => {
  it('reports search input back to the page', async () => {
    const { onChange, user } = renderFilters();

    await user.type(screen.getByLabelText('Search transactions'), 'c');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, search: 'c' });
  });

  it('reports a category selection', async () => {
    const { onChange, user } = renderFilters();

    await user.selectOptions(screen.getByLabelText('Filter by category'), 'transport');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, category: 'transport' });
  });

  it('reports a month selection', async () => {
    const { onChange, user } = renderFilters();

    await user.selectOptions(screen.getByLabelText('Filter by month'), '2024-05');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, month: '2024-05' });
  });

  it('reports a payment method selection', async () => {
    const { onChange, user } = renderFilters();

    await user.selectOptions(screen.getByLabelText('Filter by payment method'), 'cash');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, paymentMethod: 'cash' });
  });

  it('reports a sort change', async () => {
    const { onSortChange, user } = renderFilters();

    await user.selectOptions(screen.getByLabelText('Sort transactions'), 'amount:desc');

    expect(onSortChange).toHaveBeenCalled();
  });

  it('offers a reset only once a filter is active', async () => {
    const { onReset, user } = renderFilters();
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();

    render(
      <TransactionFilters
        filters={{ ...EMPTY_FILTERS, category: 'bills' }}
        onChange={vi.fn()}
        onReset={onReset}
        categories={EXPENSE_CATEGORIES}
        paymentMethods={PAYMENT_METHODS}
        months={MONTHS}
        sort="date:desc"
        onSortChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it('hides the payment method filter for income', () => {
    const onChange = vi.fn();
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        onReset={vi.fn()}
        categories={EXPENSE_CATEGORIES}
        paymentMethods={PAYMENT_METHODS}
        months={MONTHS}
        showPaymentMethod={false}
        sort="date:desc"
        onSortChange={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Filter by payment method')).not.toBeInTheDocument();
  });
});
