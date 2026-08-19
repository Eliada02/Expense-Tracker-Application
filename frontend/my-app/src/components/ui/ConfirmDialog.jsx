import styled from 'styled-components';
import Modal from './Modal';
import Button from './Button';

const Message = styled.p`
  color: var(--text-muted);
  margin-bottom: var(--space-5);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
`;

/**
 * Guard in front of destructive actions. Deleting anything in the app goes
 * through this rather than a bare `window.confirm`.
 */
export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="440px">
      <Message>{message}</Message>
      <Actions>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </Actions>
    </Modal>
  );
}

export default ConfirmDialog;
