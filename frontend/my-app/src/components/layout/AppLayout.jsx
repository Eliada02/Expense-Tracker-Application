import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { Menu, Moon, Sun } from 'lucide-react';
import Sidebar from './Sidebar';
import Button from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const Topbar = styled.header`
  height: var(--topbar-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-5);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
`;

const MenuButton = styled(Button)`
  display: none;

  @media (max-width: 900px) {
    display: inline-flex;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: var(--space-6) var(--space-5);
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: var(--space-4);
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <Shell>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Main>
        <Topbar>
          <MenuButton
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </MenuButton>
          <Spacer />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </Topbar>
        <Content>
          <Outlet />
        </Content>
      </Main>
    </Shell>
  );
}

export default AppLayout;
