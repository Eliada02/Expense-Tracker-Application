import styled, { keyframes } from 'styled-components';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import Button from './Button';

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

/**
 * Skeleton block. Used instead of a spinner wherever the final layout is known
 * in advance, so the page does not jump when data arrives.
 */
export const Skeleton = styled.div`
  height: ${(props) => props.$height ?? '16px'};
  width: ${(props) => props.$width ?? '100%'};
  border-radius: ${(props) => props.$radius ?? 'var(--radius-sm)'};
  background: linear-gradient(
    90deg,
    var(--skeleton) 0%,
    var(--skeleton-shine) 50%,
    var(--skeleton) 100%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s linear infinite;
`;

const Centered = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-4);
  text-align: center;
`;

const IconCircle = styled.div`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
`;

const Title = styled.h3`
  font-size: var(--text-base);
`;

const Description = styled.p`
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 44ch;
`;

/** Shown when a request succeeded but there is nothing to display. */
export function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <Centered>
      <IconCircle $bg="var(--surface-2)" $color="var(--text-subtle)">
        <Icon size={22} aria-hidden="true" />
      </IconCircle>
      <Title>{title}</Title>
      {description ? <Description>{description}</Description> : null}
      {action}
    </Centered>
  );
}

/** Shown when a request failed. Always offers a way to retry. */
export function ErrorState({ error, onRetry, title = 'Could not load this data' }) {
  return (
    <Centered role="alert">
      <IconCircle $bg="var(--danger-soft)" $color="var(--danger)">
        <AlertCircle size={22} aria-hidden="true" />
      </IconCircle>
      <Title>{title}</Title>
      <Description>{error?.message ?? 'An unexpected error occurred.'}</Description>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </Centered>
  );
}

export default EmptyState;
