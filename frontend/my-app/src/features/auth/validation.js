/**
 * Mirrors the backend rules in `validators/authValidators.js` for immediate
 * feedback. The server remains the authority: its field errors override
 * anything decided here.
 */

export const MIN_PASSWORD_LENGTH = 8;

// Deliberately permissive. Anything stricter rejects valid addresses; the
// real check is whether the account can be used.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (value) => !value || String(value).trim() === '';

export function validateLogin(values) {
  const errors = {};
  if (isBlank(values.email)) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address';

  if (isBlank(values.password)) errors.password = 'Password is required';

  return errors;
}

export function validateRegister(values) {
  const errors = validateLogin(values);

  if (isBlank(values.name)) errors.name = 'Name is required';
  else if (values.name.trim().length > 80) errors.name = 'Name cannot exceed 80 characters';

  if (!isBlank(values.password) && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (values.confirmPassword !== undefined && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
