import { useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import styled from 'styled-components';
import ChartFrame from '../../components/charts/ChartFrame';
import { baseOptions, useChartTheme } from '../../components/charts/chartSetup';
import {
  formatCompactCurrency,
  formatCurrency,
  formatDay,
  formatMonthKey,
  formatPercent,
} from '../../utils/format';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
`;

const WideRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
`;

/**
 * Where the money went this month. A doughnut is the right shape here because
 * the categories are parts of a single whole.
 */
function CategoryChart({ byCategory, currency, loading }) {
  const palette = useChartTheme();

  const { data, options } = useMemo(() => {
    const chartData = {
      labels: byCategory.map((row) => row.label),
      datasets: [
        {
          data: byCategory.map((row) => row.total),
          backgroundColor: byCategory.map((row) => row.color),
          borderColor: palette.surface,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };

    const chartOptions = {
      ...baseOptions(palette),
      cutout: '62%',
      plugins: {
        ...baseOptions(palette).plugins,
        legend: { ...baseOptions(palette).plugins.legend, position: 'right' },
        tooltip: {
          ...baseOptions(palette).plugins.tooltip,
          callbacks: {
            label: (context) => {
              const row = byCategory[context.dataIndex];
              return ` ${formatCurrency(row.total, currency)} (${formatPercent(row.share)})`;
            },
          },
        },
      },
    };

    return { data: chartData, options: chartOptions };
  }, [byCategory, currency, palette]);

  return (
    <ChartFrame
      title="Spending by category"
      subtitle="Where this month's money went"
      loading={loading}
      isEmpty={byCategory.length === 0}
    >
      <Doughnut data={data} options={options} />
    </ChartFrame>
  );
}

/**
 * Expenses against income over recent months. Grouped bars make the two
 * directly comparable month by month.
 */
function MonthlyTrendChart({ monthlyTrend, currency, loading }) {
  const palette = useChartTheme();

  const { data, options } = useMemo(() => {
    const base = baseOptions(palette);
    return {
      data: {
        labels: monthlyTrend.map((row) => formatMonthKey(row.month)),
        datasets: [
          {
            label: 'Expenses',
            data: monthlyTrend.map((row) => row.expenses),
            backgroundColor: palette.danger,
            borderRadius: 4,
            maxBarThickness: 28,
          },
          {
            label: 'Income',
            data: monthlyTrend.map((row) => row.income),
            backgroundColor: palette.success,
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        ...base,
        plugins: {
          ...base.plugins,
          tooltip: {
            ...base.plugins.tooltip,
            callbacks: {
              label: (context) =>
                ` ${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: palette.text } },
          y: {
            beginAtZero: true,
            grid: { color: palette.grid },
            border: { display: false },
            ticks: {
              color: palette.text,
              callback: (value) => formatCompactCurrency(value, currency),
            },
          },
        },
      },
    };
  }, [monthlyTrend, currency, palette]);

  const isEmpty = monthlyTrend.every((row) => row.expenses === 0 && row.income === 0);

  return (
    <ChartFrame
      title="Monthly comparison"
      subtitle="Expenses against income"
      loading={loading}
      isEmpty={isEmpty}
    >
      <Bar data={data} options={options} />
    </ChartFrame>
  );
}

/**
 * Cumulative spend through the month. The running total answers "am I on track
 * for the month?", which a bar per day does not.
 */
function DailySpendingChart({ dailySpending, currency, loading }) {
  const palette = useChartTheme();

  const { data, options } = useMemo(() => {
    let runningTotal = 0;
    const cumulative = dailySpending.map((row) => {
      runningTotal += row.total;
      return runningTotal;
    });

    const base = baseOptions(palette);
    return {
      data: {
        labels: dailySpending.map((row) => formatDay(row.date)),
        datasets: [
          {
            label: 'Cumulative spend',
            data: cumulative,
            borderColor: palette.primary,
            backgroundColor: `${palette.primary}22`,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...base,
        plugins: {
          ...base.plugins,
          legend: { display: false },
          tooltip: {
            ...base.plugins.tooltip,
            callbacks: {
              label: (context) => ` Total so far: ${formatCurrency(context.parsed.y, currency)}`,
              afterLabel: (context) =>
                `That day: ${formatCurrency(dailySpending[context.dataIndex].total, currency)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: palette.text, maxTicksLimit: 10 } },
          y: {
            beginAtZero: true,
            grid: { color: palette.grid },
            border: { display: false },
            ticks: {
              color: palette.text,
              callback: (value) => formatCompactCurrency(value, currency),
            },
          },
        },
      },
    };
  }, [dailySpending, currency, palette]);

  return (
    <ChartFrame
      title="Spending over time"
      subtitle="Cumulative total through the month"
      height="280px"
      loading={loading}
      isEmpty={dailySpending.length === 0}
    >
      <Line data={data} options={options} />
    </ChartFrame>
  );
}

export function DashboardCharts({ dashboard, currency, loading }) {
  const byCategory = dashboard?.byCategory ?? [];
  const monthlyTrend = dashboard?.monthlyTrend ?? [];
  const dailySpending = dashboard?.dailySpending ?? [];

  return (
    <>
      <Grid>
        <CategoryChart byCategory={byCategory} currency={currency} loading={loading} />
        <MonthlyTrendChart monthlyTrend={monthlyTrend} currency={currency} loading={loading} />
      </Grid>
      <WideRow>
        <DailySpendingChart
          dailySpending={dailySpending}
          currency={currency}
          loading={loading}
        />
      </WideRow>
    </>
  );
}

export default DashboardCharts;
