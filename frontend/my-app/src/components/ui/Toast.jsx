import styled, { keyframes } from 'styled-components';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Viewport = styled.div`
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 200;
  max-width: min(380px, calc(100vw - var(--space-6)));

  @media (max-width: 600px) {
    left: var(--space-4);
    right: var(--space-4);
    bottom: var(--space-4);
    max-width: none;
  }
`;

const tones = {
  success: { color: 'var(--success)', Icon: CheckCircle2 },
  error: { color: 'var(--danger)', Icon: XCircle },
  warning: { color: 'var(--warning)', Icon: AlertTriangle },
  info: { color: 'var(--primary)', Icon: Info },
};

const Item = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid ${(props) => props.$color};
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  animation: ${slideIn} 0.18s ease-out;

  svg:first-child {
    color: ${(props) => props.$color};
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const Message = styled.p`
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-subtle);
  display: flex;

  &:hover {
    color: var(--text);
  }
`;

/** Rendered once by ToastProvider; components never use this directly. */
export function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <Viewport role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const { color, Icon } = tones[toast.tone] ?? tones.info;
        return (
          <Item
            key={toast.id}
            $color={color}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <Icon size={18} aria-hidden="true" />
            <Message>{toast.message}</Message>
            <CloseButton onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
              <X size={16} />
            </CloseButton>
          </Item>
        );
      })}
    </Viewport>
  );
}

export default ToastViewport;
