import styled from 'styled-components';
import Card, { CardHeader, CardSubtitle, CardTitle } from '../ui/Card';
import { EmptyState, Skeleton } from '../ui/States';

const Canvas = styled.div`
  position: relative;
  height: ${(props) => props.$height};
`;

/**
 * Wraps a chart with its title, and with the loading and empty states that
 * every chart needs. Without this each chart would re-implement all three.
 */
export function ChartFrame({
  title,
  subtitle,
  height = '300px',
  loading,
  isEmpty,
  emptyMessage = 'No data for this period yet.',
  children,
  action,
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle ? <CardSubtitle>{subtitle}</CardSubtitle> : null}
        </div>
        {action}
      </CardHeader>
      {loading ? (
        <Skeleton $height={height} $radius="var(--radius-md)" />
      ) : isEmpty ? (
        <EmptyState title="Nothing to chart" description={emptyMessage} />
      ) : (
        <Canvas $height={height}>{children}</Canvas>
      )}
    </Card>
  );
}

export default ChartFrame;
