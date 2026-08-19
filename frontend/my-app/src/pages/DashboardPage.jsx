import { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import MonthPicker from '../components/ui/MonthPicker';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { CategoryBadge } from '../components/ui/Badge';
import SummaryCards from '../features/dashboard/SummaryCards';
import DashboardCharts from '../features/dashboard/DashboardCharts';
import InsightList from '../features/insights/InsightList';
import { useDashboard, useInsights } from '../features/dashboard/useDashboard';
import { useTransactionList } from '../features/transactions/useTransactions';
import useTaxonomy from '../hooks/useTaxonomy';
import { currentMonthKey } from '../utils/dates';
import { formatCurrency, formatDate, formatMonthKey } from '../utils/format';

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--space-4);

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const RecentList = styled.ul`
  display: flex;
  flex-direction: column;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--border);
  }

  li:last-child {
    border-bottom: none;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .title {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .amount {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .date {
    font-size: var(--text-xs);
    color: var(--text-subtle);
  }
`;

const RECENT_PARAMS = { page: 1, limit: 6, sortBy: 'date', sortDir: 'desc' };

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonthKey);
  const taxonomy = useTaxonomy();

  const dashboardQuery = useDashboard({ month, months: 6 });
  const insightsQuery = useInsights({ month });
  const recentQuery = useTransactionList('expense', RECENT_PARAMS);

  const dashboard = dashboardQuery.data;
  const currency = dashboard?.currency ?? taxonomy.currency;

  if (dashboardQuery.isError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Card>
          <ErrorState error={dashboardQuery.error} onRetry={dashboardQuery.refetch} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Your finances for ${formatMonthKey(month, true)}`}
      >
        <MonthPicker value={month} onChange={setMonth} />
      </PageHeader>

      <SummaryCards
        summary={dashboard?.summary}
        currency={currency}
        month={month}
        loading={dashboardQuery.isPending}
      />

      <DashboardCharts
        dashboard={dashboard}
        currency={currency}
        loading={dashboardQuery.isPending}
      />

      <TwoColumn>
        <Card>
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <Button as={Link} to="/expenses" variant="ghost" size="sm">
              View all <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </CardHeader>

          {recentQuery.isPending ? (
            <RecentList>
              {Array.from({ length: 5 }, (_, index) => (
                <li key={index}>
                  <Skeleton $height="16px" $width="50%" />
                  <Skeleton $height="16px" $width="20%" />
                </li>
              ))}
            </RecentList>
          ) : recentQuery.data?.items.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              description="Once you add expenses they will show up here."
              action={
                <Button as={Link} to="/expenses" variant="secondary">
                  Add an expense
                </Button>
              }
            />
          ) : (
            <RecentList>
              {recentQuery.data.items.map((expense) => {
                const category = taxonomy.expenseCategoryMap.get(expense.category);
                return (
                  <li key={expense._id}>
                    <div className="meta">
                      <span className="title">{expense.title}</span>
                      <span className="date">
                        {formatDate(expense.date)}
                        {category ? ' · ' : ''}
                        {category ? (
                          <CategoryBadge color={category.color} label={category.label} />
                        ) : null}
                      </span>
                    </div>
                    <span className="amount">{formatCurrency(expense.amount, currency)}</span>
                  </li>
                );
              })}
            </RecentList>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <Button as={Link} to="/insights" variant="ghost" size="sm">
              See all <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </CardHeader>
          <InsightList
            insights={insightsQuery.data?.insights}
            loading={insightsQuery.isPending}
            error={insightsQuery.error}
            onRetry={insightsQuery.refetch}
            limit={4}
          />
        </Card>
      </TwoColumn>
    </>
  );
}

export default DashboardPage;
