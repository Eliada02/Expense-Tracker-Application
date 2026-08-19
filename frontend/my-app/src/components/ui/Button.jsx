import styled, { css } from 'styled-components';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: css`
    background: var(--primary);
    color: var(--primary-contrast);
    border-color: var(--primary);
    &:hover:not(:disabled) {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }
  `,
  secondary: css`
    background: var(--surface);
    color: var(--text);
    border-color: var(--border-strong);
    &:hover:not(:disabled) {
      background: var(--surface-hover);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--text-muted);
    border-color: transparent;
    &:hover:not(:disabled) {
      background: var(--surface-hover);
      color: var(--text);
    }
  `,
  danger: css`
    background: var(--danger);
    color: #fff;
    border-color: var(--danger);
    &:hover:not(:disabled) {
      filter: brightness(0.93);
    }
  `,
};

const sizes = {
  sm: css`
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    height: 32px;
  `,
  md: css`
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    height: 40px;
  `,
  lg: css`
    padding: var(--space-3) var(--space-5);
    font-size: var(--text-base);
    height: 46px;
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
  ${(props) => sizes[props.$size]}
  ${(props) => variants[props.$variant]}

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${(props) =>
    props.$fullWidth &&
    css`
      width: 100%;
    `}

  ${(props) =>
    props.$iconOnly &&
    css`
      padding: 0;
      width: ${props.$size === 'sm' ? '32px' : '40px'};
    `}
`;

const Spinner = styled(Loader2)`
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * The single button in the app. Anything that looks like a button uses this so
 * sizing, focus rings and disabled states stay consistent. Pass `as={Link}` to
 * render a router link that still looks like a button.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconOnly = false,
  type = 'button',
  disabled,
  ...rest
}) {
  return (
    <StyledButton
      type={rest.as ? undefined : type}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $iconOnly={iconOnly}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={16} aria-hidden="true" /> : null}
      {children}
    </StyledButton>
  );
}

export default Button;
