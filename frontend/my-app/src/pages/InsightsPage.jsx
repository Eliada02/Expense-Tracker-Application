import { useState } from 'react';
import styled from 'styled-components';
import PageHeader from '../components/layout/PageHeader';
import MonthPicker from '../components/ui/MonthPicker';
import Card, { CardHeader, CardSubtitle, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/States';
import InsightList from '../features/insights/InsightList';
import { useDashboard, useInsights } from '../features/dashboard/useDashboard';
import { currentMonthKey } from '../utils/dates';
import { formatCurrency, formatMonthKey, formatPercent } from '../utils/format';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--space-4);
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const BreakdownList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const BreakdownRow = styled.li`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  .top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-3);
    font-size: var(--text-sm);
  }

  .label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 500;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    background: ${(props) => props.$color};
  }

  .value {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }

  .share {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .track {
    height: 6px;
    background: var(--surface-2);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    width: ${(props) => props.$share}%;
    background: ${(props) => props.$color};
    border-radius: var(--radius-full);
  }
`;

export function InsightsPage() {
  const [month, setMonth] = useState(currentMonthKey);

  const insightsQuery = useInsights({ month });
  const dashboardQuery = useDashboard({ month, months: 6 });

  const currency = insightsQuery.data?.currency ?? 'EUR';
  const byCategory = dashboardQuery.data?.byCategory ?? [];

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle={`What your spending looks like in ${formatMonthKey(month, true)}`}
      >
        <MonthPicker value={month} onChange={setMonth} />
      </PageHeader>

      <Layout>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Observations</CardTitle>
              <CardSubtitle>Calculated from your recorded transactions</CardSubtitle>
            </div>
          </CardHeader>
          <InsightList
            insights={insightsQuery.data?.insights}
            loading={insightsQuery.isPending}
            error={insightsQuery.error}
            onRetry={insightsQuery.refetch}
          />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Category breakdown</CardTitle>
              <CardSubtitle>Share of this month's spending</CardSubtitle>
            </div>
          </CardHeader>

          {dashboardQuery.isPending ? (
            <BreakdownList>
              {Array.from({ length: 5 }, (_, index) => (
                <li key={index}>
                  <Skeleton $height="14px" $width="60%" />
                  <div style={{ height: 8 }} />
                  <Skeleton $height="6px" />
                </li>
              ))}
            </BreakdownList>
          ) : byCategory.length === 0 ? (
            <CardSubtitle>Nothing recorded for this month yet.</CardSubtitle>
          ) : (
            <BreakdownList>
              {byCategory.map((row) => (
                <BreakdownRow key={row.category} $color={row.color} $share={row.share}>
                  <div className="top">
                    <span className="label">
                      <span className="dot" aria-hidden="true" />
                      {row.label}
                    </span>
                    <span>
                      <span className="value">{formatCurrency(row.total, currency)}</span>{' '}
                      <span className="share">{formatPercent(row.share)}</span>
                    </span>
                  </div>
                  <div className="track">
                    <div className="fill" />
                  </div>
                </BreakdownRow>
              ))}
            </BreakdownList>
          )}
        </Card>
      </Layout>
    </>
  );
}

export default InsightsPage;
