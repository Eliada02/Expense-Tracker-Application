import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Lightbulb,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants';

// Named imports rather than `import * as icons`: the barrel import pulls the
// entire icon set into the bundle even though only these eight are used.
const NAV_ICONS = {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Wallet,
  Lightbulb,
  Repeat,
  Settings,
};

const Nav = styled.nav`
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: var(--space-5) var(--space-3);
  gap: var(--space-6);

  @media (max-width: 900px) {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 90;
    box-shadow: var(--shadow-lg);
    transform: translateX(${(props) => (props.$open ? '0' : '-100%')});
    transition: transform 0.2s ease;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-3);

  span {
    font-weight: 600;
    font-size: var(--text-lg);
    letter-spacing: -0.01em;
  }
`;

const Logo = styled.div`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--primary-contrast);
`;

const Items = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  &.active {
    background: var(--primary-soft);
    color: var(--primary);
  }
`;

const Backdrop = styled.div`
  display: none;

  @media (max-width: 900px) {
    display: ${(props) => (props.$open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 80;
  }
`;

export function Sidebar({ open, onClose }) {
  return (
    <>
      <Backdrop $open={open} onClick={onClose} aria-hidden="true" />
      <Nav $open={open} aria-label="Main navigation">
        <Brand>
          <Logo>
            <PiggyBank size={20} aria-hidden="true" />
          </Logo>
          <span>Expense Tracker</span>
        </Brand>
        <Items>
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <li key={item.to}>
                <Item to={item.to} end={item.end} onClick={onClose}>
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </Item>
              </li>
            );
          })}
        </Items>
      </Nav>
    </>
  );
}

export default Sidebar;
