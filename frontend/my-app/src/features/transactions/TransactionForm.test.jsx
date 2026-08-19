import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from './TransactionForm';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, makeExpense } from '../../test/fixtures';

const renderForm = (props = {}) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <TransactionForm
      categories={EXPENSE_CATEGORIES}
      paymentMethods={PAYMENT_METHODS}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onSubmit, onCancel, user: userEvent.setup() };
};

const submit = (user) => user.click(screen.getByRole('button', { name: /save/i }));

describe('TransactionForm', () => {
  it('renders every field a transaction needs', () => {
    renderForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('blocks submission and reports every missing required field', async () => {
    const { onSubmit, user } = renderForm();

    await submit(user);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Select a category')).toBeInTheDocument();
  });

  it('rejects a non-positive amount', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Coffee');
    await user.type(screen.getByLabelText(/amount/i), '0');
    await user.selectOptions(screen.getByLabelText(/category/i), 'groceries');
    await submit(user);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Amount must be greater than 0')).toBeInTheDocument();
  });

  it('rejects an amount that is not a number', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Coffee');
    await user.type(screen.getByLabelText(/amount/i), 'abc');
    await user.selectOptions(screen.getByLabelText(/category/i), 'groceries');
    await submit(user);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Amount must be a number')).toBeInTheDocument();
  });

  it('marks invalid fields for assistive technology', async () => {
    const { user } = renderForm();

    await submit(user);

    expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears an error once the field is corrected', async () => {
    const { user } = renderForm();

    await submit(user);
    expect(await screen.findByText('Title is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/title/i), 'Coffee');

    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('submits a normalised payload', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(/title/i), '  Coffee  ');
    await user.type(screen.getByLabelText(/amount/i), '3.50');
    await user.selectOptions(screen.getByLabelText(/category/i), 'groceries');
    await submit(user);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Coffee',
      amount: 3.5,
      category: 'groceries',
    });
  });

  it('accepts a comma as the decimal separator', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Coffee');
    await user.type(screen.getByLabelText(/amount/i), '3,50');
    await user.selectOptions(screen.getByLabelText(/category/i), 'groceries');
    await submit(user);

    expect(onSubmit.mock.calls[0][0].amount).toBe(3.5);
  });

  it('prefills the form when editing an existing transaction', () => {
    renderForm({ transaction: makeExpense() });

    expect(screen.getByLabelText(/title/i)).toHaveValue('Weekly shop');
    expect(screen.getByLabelText(/amount/i)).toHaveValue('42.5');
    expect(screen.getByLabelText(/date/i)).toHaveValue('2024-05-10');
    expect(screen.getByLabelText(/category/i)).toHaveValue('groceries');
  });

  it('hides the payment method for income', () => {
    renderForm({ showPaymentMethod: false });

    expect(screen.queryByLabelText(/payment method/i)).not.toBeInTheDocument();
  });

  it('shows server-side field errors returned by the API', () => {
    renderForm({
      serverError: {
        message: 'Validation failed',
        fieldErrors: { category: 'Select a valid category' },
      },
    });

    expect(screen.getByText('Select a valid category')).toBeInTheDocument();
  });

  it('shows a general server error when it is not tied to a field', () => {
    renderForm({ serverError: { message: 'Could not reach the server.', fieldErrors: {} } });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server.');
  });

  it('calls onCancel without submitting', async () => {
    const { onCancel, onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the actions while a submission is in flight', () => {
    renderForm({ submitting: true });

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
