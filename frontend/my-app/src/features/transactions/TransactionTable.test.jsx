import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionTable from './TransactionTable';
import { CATEGORY_MAP, PAYMENT_METHOD_MAP, makeExpense } from '../../test/fixtures';

const items = [
  makeExpense(),
  makeExpense({
    _id: '2',
    title: 'Bus pass',
    amount: 55,
    category: 'transport',
    paymentMethod: 'cash',
    description: '',
    date: '2024-05-15T12:00:00.000Z',
  }),
];

const renderTable = (props = {}) => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <TransactionTable
      items={items}
      currency="EUR"
      categoryMap={CATEGORY_MAP}
      paymentMethodMap={PAYMENT_METHOD_MAP}
      onEdit={onEdit}
      onDelete={onDelete}
      {...props}
    />
  );
  return { onEdit, onDelete, user: userEvent.setup() };
};

describe('TransactionTable', () => {
  it('renders one row per transaction with all columns', () => {
    renderTable();

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(items.length + 1);

    ['Date', 'Description', 'Category', 'Payment', 'Amount'].forEach((heading) => {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument();
    });
  });

  it('shows the resolved category label rather than the raw id', () => {
    renderTable();

    expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0);
    expect(screen.queryByText('groceries')).not.toBeInTheDocument();
  });

  it('formats amounts as currency and dates in a readable form', () => {
    renderTable();

    expect(screen.getAllByText('€42.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10 May 2024').length).toBeGreaterThan(0);
  });

  it('resolves the payment method label', () => {
    renderTable();

    expect(screen.getAllByText('Cash').length).toBeGreaterThan(0);
  });

  it('shows notes under the title when present', () => {
    renderTable();

    expect(screen.getAllByText('Supermarket').length).toBeGreaterThan(0);
  });

  it('prefixes income amounts with a plus sign', () => {
    renderTable({ amountPrefix: '+' });

    expect(screen.getAllByText('+€42.50').length).toBeGreaterThan(0);
  });

  it('calls onEdit with the transaction that was clicked', async () => {
    const { onEdit, user } = renderTable();

    await user.click(screen.getAllByRole('button', { name: 'Edit Bus pass' })[0]);

    expect(onEdit).toHaveBeenCalledWith(items[1]);
  });

  it('calls onDelete with the transaction that was clicked', async () => {
    const { onDelete, user } = renderTable();

    await user.click(screen.getAllByRole('button', { name: 'Delete Weekly shop' })[0]);

    expect(onDelete).toHaveBeenCalledWith(items[0]);
  });

  it('renders skeleton rows instead of data while loading', () => {
    renderTable({ loading: true });

    expect(screen.queryByText('Weekly shop')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('falls back to an em dash when the payment method is unknown', () => {
    renderTable({
      items: [makeExpense({ _id: '3', paymentMethod: undefined, title: 'Legacy row' })],
    });

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
