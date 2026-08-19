import { useState } from 'react';
import styled from 'styled-components';
import Button from '../../components/ui/Button';
import { SelectField, TextField, TextareaField } from '../../components/ui/Field';
import { toDateInputValue } from '../../utils/dates';
import { hasErrors, parseAmount, validateTransaction } from './validation';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
`;

const FormError = styled.p`
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: var(--text-sm);
`;

const emptyValues = () => ({
  title: '',
  amount: '',
  date: toDateInputValue(),
  category: '',
  paymentMethod: 'card',
  description: '',
});

/** Maps an API record onto form values (dates become `YYYY-MM-DD`). */
const toFormValues = (transaction) =>
  transaction
    ? {
        title: transaction.title ?? '',
        amount: String(transaction.amount ?? ''),
        date: toDateInputValue(transaction.date),
        category: transaction.category ?? '',
        paymentMethod: transaction.paymentMethod ?? 'card',
        description: transaction.description ?? '',
      }
    : emptyValues();

/**
 * One form for creating and editing both expenses and income. Validation runs
 * on submit and then live per field, which avoids shouting at the user while
 * they are still typing the first character.
 */
export function TransactionForm({
  transaction,
  categories,
  paymentMethods,
  showPaymentMethod = true,
  submitLabel = 'Save',
  submitting = false,
  serverError,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => toFormValues(transaction));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (name) => (event) => {
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    if (submitted) setErrors(validateTransaction(next));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validateTransaction(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    onSubmit({
      ...values,
      title: values.title.trim(),
      amount: parseAmount(values.amount),
      description: values.description.trim(),
    });
  };

  // Field errors returned by the API win over local ones — they are the truth.
  const fieldError = (name) => serverError?.fieldErrors?.[name] ?? errors[name];

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {serverError && Object.keys(serverError.fieldErrors ?? {}).length === 0 ? (
        <FormError role="alert">{serverError.message}</FormError>
      ) : null}

      <TextField
        label="Title"
        required
        value={values.title}
        onChange={setField('title')}
        error={fieldError('title')}
        placeholder="e.g. Weekly grocery shop"
        autoFocus
      />

      <Row>
        <TextField
          label="Amount"
          required
          inputMode="decimal"
          value={values.amount}
          onChange={setField('amount')}
          error={fieldError('amount')}
          placeholder="0.00"
        />
        <TextField
          label="Date"
          required
          type="date"
          value={values.date}
          onChange={setField('date')}
          error={fieldError('date')}
        />
      </Row>

      <Row>
        <SelectField
          label="Category"
          required
          value={values.category}
          onChange={setField('category')}
          error={fieldError('category')}
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </SelectField>

        {showPaymentMethod ? (
          <SelectField
            label="Payment method"
            value={values.paymentMethod}
            onChange={setField('paymentMethod')}
            error={fieldError('paymentMethod')}
          >
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </SelectField>
        ) : null}
      </Row>

      <TextareaField
        label="Notes"
        value={values.description}
        onChange={setField('description')}
        error={fieldError('description')}
        placeholder="Optional reference"
      />

      <Actions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </Actions>
    </Form>
  );
}

export default TransactionForm;
