import styled from 'styled-components';

const Track = styled.div`
  height: 8px;
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
`;

const statusColors = {
  ok: 'var(--success)',
  warning: 'var(--warning)',
  exceeded: 'var(--danger)',
};

const Fill = styled.div`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: ${(props) => statusColors[props.$status] ?? 'var(--primary)'};
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
`;

/**
 * Budget usage bar. The fill is capped at 100% visually while the real
 * percentage is still announced, so an overspend is obvious without the bar
 * overflowing its track.
 */
export function ProgressBar({ percent, status = 'ok', label }) {
  const safePercent = Math.min(100, Math.max(0, percent ?? 0));

  return (
    <Track
      role="progressbar"
      aria-valuenow={Math.round(percent ?? 0)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <Fill $percent={safePercent} $status={status} />
    </Track>
  );
}

export default ProgressBar;
