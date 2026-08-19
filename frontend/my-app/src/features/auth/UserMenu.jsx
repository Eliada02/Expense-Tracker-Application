import styled from 'styled-components';
import { LogOut } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
`;

const Identity = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  line-height: 1.2;

  .name {
    font-size: var(--text-sm);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 22ch;
  }

  .email {
    font-size: var(--text-xs);
    color: var(--text-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 22ch;
  }

  /* On a phone the avatar and sign-out control carry the meaning. */
  @media (max-width: 560px) {
    display: none;
  }
`;

const Avatar = styled.div`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--primary-soft);
  color: var(--primary);
  font-size: var(--text-xs);
  font-weight: 600;
`;

/** First letters of the first two words: "Ada Lovelace" -> "AL". */
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Wrapper>
      <Identity>
        <span className="name">{user.name}</span>
        <span className="email">{user.email}</span>
      </Identity>
      <Avatar aria-hidden="true">{initials(user.name)}</Avatar>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={() => logout.mutate()}
        loading={logout.isPending}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut size={18} />
      </Button>
    </Wrapper>
  );
}

export default UserMenu;
