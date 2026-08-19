import { useState } from 'react';
import styled from 'styled-components';
import Button from '../../components/ui/Button';
import { SelectField, TextField, TextareaField } from '../../components/ui/Field';
import { toDateInputValue } from '../../utils/dates';
import { FREQUENCY_LABELS } from '../../constants';
import { hasErrors, parseAmount, validateRecurring } from '../transactions/validation';

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
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-muted);
  cursor: pointer;
`;

const FormError = styled.p`
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: var(--text-sm);
`;

const toFormValues = (rule) => ({
  title: rule?.title ?? '',
  amount: rule ? String(rule.amount) : '',
  category: rule?.category ?? '',
  paymentMethod: rule?.paymentMethod ?? 'direct_debit',
  frequency: rule?.frequency ?? 'monthly',
  startDate: rule ? toDateInputValue(rule.startDate) : toDateInputValue(),
  endDate: rule?.endDate ? toDateInputValue(rule.endDate) : '',
  description: rule?.description ?? '',
  active: rule?.active ?? true,
});

export function RecurringForm({
  rule,
  categories,
  paymentMethods,
  frequencies,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => toFormValues(rule));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (name) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    const next = { ...values, [name]: value };
    setValues(next);
    if (submitted) setErrors(validateRecurring(next));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validateRecurring(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    onSubmit({
      ...values,
      title: values.title.trim(),
      amount: parseAmount(values.amount),
      description: values.description.trim(),
      endDate: values.endDate || null,
    });
  };

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
        placeholder="e.g. Rent"
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
        <SelectField
          label="Frequency"
          required
          value={values.frequency}
          onChange={setField('frequency')}
          error={fieldError('frequency')}
        >
          {frequencies.map((frequency) => (
            <option key={frequency} value={frequency}>
              {FREQUENCY_LABELS[frequency] ?? frequency}
            </option>
          ))}
        </SelectField>
      </Row>

      <Row>
        <TextField
          label="First occurrence"
          required
          type="date"
          value={values.startDate}
          onChange={setField('startDate')}
          error={fieldError('startDate')}
          hint="Past dates generate the missing expenses immediately."
        />
        <TextField
          label="Ends on"
          type="date"
          value={values.endDate}
          onChange={setField('endDate')}
          error={fieldError('endDate')}
          hint="Leave empty to repeat indefinitely."
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
        <SelectField
          label="Payment method"
          value={values.paymentMethod}
          onChange={setField('paymentMethod')}
        >
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label}
            </option>
          ))}
        </SelectField>
      </Row>

      <TextareaField
        label="Notes"
        value={values.description}
        onChange={setField('description')}
        error={fieldError('description')}
        placeholder="Optional reference"
      />

      <Toggle>
        <input type="checkbox" checked={values.active} onChange={setField('active')} />
        Active — keep generating expenses
      </Toggle>

      <Actions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {rule ? 'Save changes' : 'Create rule'}
        </Button>
      </Actions>
    </Form>
  );
}

export default RecurringForm;
