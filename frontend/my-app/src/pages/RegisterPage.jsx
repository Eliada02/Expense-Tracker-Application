import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AuthLayout from '../features/auth/AuthLayout';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { MIN_PASSWORD_LENGTH, hasErrors, validateRegister } from '../features/auth/validation';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const FormError = styled.p`
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: var(--text-sm);
`;

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const setField = (name) => (event) => {
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    if (submitted) setErrors(validateRegister(next));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    register.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      // Registration signs the user straight in, so send them to the app.
      { onSuccess: () => navigate('/', { replace: true }) }
    );
  };

  const serverError = register.error;
  const fieldError = (name) => serverError?.fieldErrors?.[name] ?? errors[name];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking your spending in a minute"
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <Form onSubmit={handleSubmit} noValidate>
        {serverError && Object.keys(serverError.fieldErrors ?? {}).length === 0 ? (
          <FormError role="alert">{serverError.message}</FormError>
        ) : null}

        <TextField
          label="Name"
          autoComplete="name"
          required
          value={values.name}
          onChange={setField('name')}
          error={fieldError('name')}
          placeholder="Your name"
          autoFocus
        />

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={setField('email')}
          error={fieldError('email')}
          placeholder="you@example.com"
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={setField('password')}
          error={fieldError('password')}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
          placeholder="••••••••"
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={values.confirmPassword}
          onChange={setField('confirmPassword')}
          error={fieldError('confirmPassword')}
          placeholder="••••••••"
        />

        <Button type="submit" fullWidth loading={register.isPending}>
          Create account
        </Button>
      </Form>
    </AuthLayout>
  );
}

export default RegisterPage;
