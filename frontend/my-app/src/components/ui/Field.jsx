import { useId } from 'react';
import styled, { css } from 'styled-components';

const controlStyles = css`
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: var(--text-subtle);
  }

  &:hover:not(:disabled) {
    border-color: var(--text-subtle);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }

  &:disabled {
    background: var(--surface-2);
    cursor: not-allowed;
  }

  &[aria-invalid='true'] {
    border-color: var(--danger);
  }
`;

const StyledInput = styled.input`
  ${controlStyles}
`;

const StyledSelect = styled.select`
  ${controlStyles}
  appearance: none;
  padding-right: var(--space-6);
  /* Chevron drawn with a gradient trick so no extra asset or icon is needed. */
  background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
    linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) 17px, calc(100% - 13px) 17px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  cursor: pointer;
`;

const StyledTextarea = styled.textarea`
  ${controlStyles}
  height: auto;
  min-height: 88px;
  padding: var(--space-2) var(--space-3);
  resize: vertical;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;

const Label = styled.label`
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
`;

const ErrorText = styled.p`
  font-size: var(--text-xs);
  color: var(--danger);
`;

const HintText = styled.p`
  font-size: var(--text-xs);
  color: var(--text-subtle);
`;

/**
 * Wraps a control with its label, error and hint, and wires up the aria
 * attributes. Every form in the app is built from this so validation feedback
 * is announced consistently by screen readers.
 */
export function Field({ label, error, hint, required, children, id: providedId }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <Wrapper>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </Label>
      ) : null}
      {children({
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': describedBy || undefined,
        required,
      })}
      {hint ? <HintText id={hintId}>{hint}</HintText> : null}
      {error ? (
        <ErrorText id={errorId} role="alert">
          {error}
        </ErrorText>
      ) : null}
    </Wrapper>
  );
}

export function TextField({ label, error, hint, required, ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(props) => <StyledInput {...props} {...rest} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, required, children, ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(props) => (
        <StyledSelect {...props} {...rest}>
          {children}
        </StyledSelect>
      )}
    </Field>
  );
}

export function TextareaField({ label, error, hint, required, ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(props) => <StyledTextarea {...props} {...rest} />}
    </Field>
  );
}

export { StyledInput as Input, StyledSelect as Select, StyledTextarea as Textarea };
