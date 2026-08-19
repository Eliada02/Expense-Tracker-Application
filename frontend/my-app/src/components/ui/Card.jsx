import styled from 'styled-components';

export const Card = styled.section`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
`;

export const CardHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
`;

export const CardTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: 600;
`;

export const CardSubtitle = styled.p`
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: var(--space-1);
`;

export default Card;
