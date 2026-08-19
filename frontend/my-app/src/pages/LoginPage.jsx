import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AuthLayout from '../features/auth/AuthLayout';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { hasErrors, validateLogin } from '../features/auth/validation';

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

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Someone already signed in has no business on this page.
  if (isAuthenticated) return <Navigate to="/" replace />;

  const setField = (name) => (event) => {
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    if (submitted) setErrors(validateLogin(next));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: () => {
          // Return them to whatever they were trying to reach.
          const target = location.state?.from ?? '/';
          navigate(target, { replace: true });
        },
      }
    );
  };

  const serverError = login.error;
  const fieldError = (name) => serverError?.fieldErrors?.[name] ?? errors[name];

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your expenses"
      footer={
        <>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      <Form onSubmit={handleSubmit} noValidate>
        {serverError && Object.keys(serverError.fieldErrors ?? {}).length === 0 ? (
          <FormError role="alert">{serverError.message}</FormError>
        ) : null}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={setField('email')}
          error={fieldError('email')}
          placeholder="you@example.com"
          autoFocus
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={setField('password')}
          error={fieldError('password')}
          placeholder="••••••••"
        />

        <Button type="submit" fullWidth loading={login.isPending}>
          Sign in
        </Button>
      </Form>
    </AuthLayout>
  );
}

export default LoginPage;
