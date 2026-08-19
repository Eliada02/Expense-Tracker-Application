import styled from 'styled-components';

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
  color: ${(props) => props.$color ?? 'var(--text-muted)'};
  background: ${(props) => props.$bg ?? 'var(--surface-2)'};
  border: 1px solid transparent;
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: ${(props) => props.$color};
  flex-shrink: 0;
`;

/** Category pill: a coloured dot plus the label, used in tables and legends. */
export function CategoryBadge({ color, label }) {
  return (
    <Badge>
      <Dot $color={color || 'var(--text-subtle)'} aria-hidden="true" />
      {label}
    </Badge>
  );
}

export default Badge;
