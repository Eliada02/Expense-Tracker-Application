import styled from 'styled-components';
import { PiggyBank } from 'lucide-react';

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background: var(--bg);
`;

const Panel = styled.div`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);

  span {
    font-weight: 600;
    font-size: var(--text-lg);
    letter-spacing: -0.01em;
  }
`;

const Logo = styled.div`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--primary-contrast);
`;

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const Heading = styled.div`
  text-align: center;

  h1 {
    font-size: var(--text-xl);
  }

  p {
    color: var(--text-muted);
    font-size: var(--text-sm);
    margin-top: var(--space-1);
  }
`;

const Footer = styled.p`
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-muted);
`;

/** Shared frame for the sign-in and sign-up screens. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Page>
      <Panel>
        <Brand>
          <Logo>
            <PiggyBank size={20} aria-hidden="true" />
          </Logo>
          <span>Expense Tracker</span>
        </Brand>
        <Card>
          <Heading>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </Heading>
          {children}
        </Card>
        {footer ? <Footer>{footer}</Footer> : null}
      </Panel>
    </Page>
  );
}

export default AuthLayout;
