/**
 * Client-side form validation. This exists purely for fast feedback — the API
 * validates the same rules and is the authority. Both layers deliberately use
 * the same limits so a form that passes here is not rejected server-side.
 */

export const MAX_TITLE_LENGTH = 80;
export const MAX_NOTES_LENGTH = 500;

const isBlank = (value) => !value || String(value).trim() === '';

/** Accepts `12.50` and `12,50`, rejects anything else. */
export const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  const normalised = String(value ?? '').trim().replace(',', '.');
  if (normalised === '' || !/^\d*\.?\d*$/.test(normalised)) return NaN;
  return Number(normalised);
};

export function validateTransaction(values) {
  const errors = {};

  if (isBlank(values.title)) {
    errors.title = 'Title is required';
  } else if (values.title.trim().length > MAX_TITLE_LENGTH) {
    errors.title = `Title cannot exceed ${MAX_TITLE_LENGTH} characters`;
  }

  const amount = parseAmount(values.amount);
  if (isBlank(values.amount)) {
    errors.amount = 'Amount is required';
  } else if (Number.isNaN(amount)) {
    errors.amount = 'Amount must be a number';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (isBlank(values.date)) {
    errors.date = 'Date is required';
  } else if (Number.isNaN(Date.parse(values.date))) {
    errors.date = 'Enter a valid date';
  }

  if (isBlank(values.category)) {
    errors.category = 'Select a category';
  }

  if ((values.description ?? '').length > MAX_NOTES_LENGTH) {
    errors.description = `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`;
  }

  return errors;
}

export function validateRecurring(values) {
  const errors = validateTransaction({ ...values, date: values.startDate });
  delete errors.date;

  if (isBlank(values.startDate)) {
    errors.startDate = 'Start date is required';
  }
  if (isBlank(values.frequency)) {
    errors.frequency = 'Select a frequency';
  }
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'End date must be on or after the start date';
  }

  return errors;
}

export function validateBudget(values) {
  const errors = {};
  const amount = parseAmount(values.amount);

  if (isBlank(values.amount)) {
    errors.amount = 'Amount is required';
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Budget must be greater than 0';
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
