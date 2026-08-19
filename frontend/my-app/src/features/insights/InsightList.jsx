import styled from 'styled-components';
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

const tones = {
  positive: { color: 'var(--success)', bg: 'var(--success-soft)', Icon: TrendingDown },
  negative: { color: 'var(--danger)', bg: 'var(--danger-soft)', Icon: TrendingUp },
  warning: { color: 'var(--warning)', bg: 'var(--warning-soft)', Icon: AlertTriangle },
  neutral: { color: 'var(--primary)', bg: 'var(--primary-soft)', Icon: Info },
};

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Item = styled.li`
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
`;

const IconBox = styled.div`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
`;

const Text = styled.div`
  min-width: 0;

  h3 {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  p {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-top: 2px;
  }
`;

/**
 * Renders observations produced by the backend from real aggregations. The
 * component only picks an icon and colour; it never derives a number itself.
 */
export function InsightList({ insights, loading, error, onRetry, limit }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  if (loading) {
    return (
      <List>
        {Array.from({ length: limit ?? 4 }, (_, index) => (
          <Item key={index}>
            <Skeleton $height="34px" $width="34px" $radius="var(--radius-md)" />
            <Text style={{ flex: 1 }}>
              <Skeleton $height="14px" $width="70%" />
              <div style={{ height: 6 }} />
              <Skeleton $height="12px" $width="45%" />
            </Text>
          </Item>
        ))}
      </List>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="No insights yet"
        description="Add a few expenses and observations about your spending will appear here."
      />
    );
  }

  const visible = limit ? insights.slice(0, limit) : insights;

  return (
    <List>
      {visible.map((insight) => {
        const tone = tones[insight.tone] ?? tones.neutral;
        const { Icon } = tone;
        return (
          <Item key={insight.id}>
            <IconBox $bg={tone.bg} $color={tone.color}>
              <Icon size={17} aria-hidden="true" />
            </IconBox>
            <Text>
              <h3>{insight.title}</h3>
              {insight.description ? <p>{insight.description}</p> : null}
            </Text>
          </Item>
        );
      })}
    </List>
  );
}

export default InsightList;
