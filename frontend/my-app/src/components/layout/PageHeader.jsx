import styled from 'styled-components';

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
`;

const Title = styled.h1`
  font-size: var(--text-2xl);
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

export function PageHeader({ title, subtitle, children }) {
  return (
    <Header>
      <div>
        <Title>{title}</Title>
        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      </div>
      {children ? <Actions>{children}</Actions> : null}
    </Header>
  );
}

export default PageHeader;
