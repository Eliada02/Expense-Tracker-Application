import styled from 'styled-components';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Flame,
  ListOrdered,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/States';
import { formatCurrency, formatMonthKey, formatSignedPercent } from '../../utils/format';
import { shiftMonthKey } from '../../utils/dates';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
`;

const Tile = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
`;

const TileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  h3 {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-muted);
  }

  svg {
    color: var(--text-subtle);
    flex-shrink: 0;
  }
`;

const Value = styled.p`
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
`;

const Meta = styled.p`
  font-size: var(--text-xs);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-1);

  strong {
    color: ${(props) => props.$tone ?? 'var(--text-muted)'};
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
`;

function Tiles({ summary, currency, month }) {
  const change = summary.monthOverMonthChange;
  const spendingUp = change !== null && change > 0;

  const tiles = [
    {
      label: 'Total expenses',
      icon: Wallet,
      value: formatCurrency(summary.totalExpenses, currency),
      meta: `All time · balance ${formatCurrency(summary.balance, currency)}`,
    },
    {
      label: `${formatMonthKey(month)} expenses`,
      icon: CalendarDays,
      value: formatCurrency(summary.monthExpenses, currency),
      meta:
        change === null ? (
          'No comparable data for last month'
        ) : (
          <>
            <strong>
              {spendingUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {formatSignedPercent(change)}
            </strong>{' '}
            vs last month
          </>
        ),
      // Spending more than last month is the unwelcome direction.
      tone: change === null ? undefined : spendingUp ? 'var(--danger)' : 'var(--success)',
    },
    {
      label: 'Previous month',
      icon: TrendingDown,
      value: formatCurrency(summary.previousMonthExpenses, currency),
      meta: `Spent in ${formatMonthKey(shiftMonthKey(month, -1))}`,
    },
    {
      label: 'Average per day',
      icon: CreditCard,
      value: formatCurrency(summary.averageDailySpend, currency),
      meta: 'Based on days elapsed this month',
    },
    {
      label: 'Highest expense',
      icon: Flame,
      value: summary.highestExpense
        ? formatCurrency(summary.highestExpense.amount, currency)
        : '—',
      meta: summary.highestExpense?.title ?? 'Nothing recorded this month',
    },
    {
      label: 'Transactions',
      icon: ListOrdered,
      value: String(summary.transactionCount),
      meta: `Recorded in ${formatMonthKey(month)}`,
    },
  ];

  return tiles.map((tile) => {
    const Icon = tile.icon;
    return (
      <Tile key={tile.label}>
        <TileHeader>
          <h3>{tile.label}</h3>
          <Icon size={17} aria-hidden="true" />
        </TileHeader>
        <Value>{tile.value}</Value>
        <Meta $tone={tile.tone}>{tile.meta}</Meta>
      </Tile>
    );
  });
}

/** Six headline figures for the selected month. */
export function SummaryCards({ summary, currency, month, loading }) {
  return (
    <Grid>
      {loading || !summary
        ? Array.from({ length: 6 }, (_, index) => (
            <Tile key={index}>
              <Skeleton $height="14px" $width="55%" />
              <Skeleton $height="28px" $width="70%" />
              <Skeleton $height="12px" $width="80%" />
            </Tile>
          ))
        : Tiles({ summary, currency, month })}
    </Grid>
  );
}

export default SummaryCards;
