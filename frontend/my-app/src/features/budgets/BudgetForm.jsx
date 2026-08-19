import { useState } from 'react';
import styled from 'styled-components';
import Button from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Field';
import { hasErrors, parseAmount, validateBudget } from '../transactions/validation';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
`;

const Hint = styled.p`
  font-size: var(--text-sm);
  color: var(--text-muted);
`;

/**
 * Sets the overall monthly budget or one category budget. Saving is an upsert,
 * so editing an existing line uses this same form with the values prefilled.
 */
export function BudgetForm({
  budget,
  categories,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(budget);
  const [values, setValues] = useState({
    category: budget?.category ?? '',
    amount: budget ? String(budget.amount) : '',
  });
  const [errors, setErrors] = useState({});

  const setField = (name) => (event) => {
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    if (hasErrors(errors)) setErrors(validateBudget(next));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateBudget(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    onSubmit({
      category: values.category === '' ? null : values.category,
      amount: parseAmount(values.amount),
    });
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Hint>
        Budgets repeat every month. Setting a budget for a category that already has one
        replaces it.
      </Hint>

      <SelectField
        label="Applies to"
        value={values.category}
        onChange={setField('category')}
        disabled={isEditing}
        error={serverError?.fieldErrors?.category}
      >
        <option value="">Overall monthly budget</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Monthly amount"
        required
        inputMode="decimal"
        value={values.amount}
        onChange={setField('amount')}
        error={serverError?.fieldErrors?.amount ?? errors.amount}
        placeholder="0.00"
        autoFocus
      />

      <Actions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save budget
        </Button>
      </Actions>
    </Form>
  );
}

export default BudgetForm;
