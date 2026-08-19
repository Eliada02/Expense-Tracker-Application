import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import MonthPicker from '../components/ui/MonthPicker';
import Card, { CardHeader, CardSubtitle, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import BudgetForm from '../features/budgets/BudgetForm';
import { useBudgetMutations, useBudgets } from '../features/budgets/useBudgets';
import useTaxonomy from '../hooks/useTaxonomy';
import { useToast } from '../context/ToastContext';
import { currentMonthKey } from '../utils/dates';
import { formatCurrency, formatMonthKey, formatPercent } from '../utils/format';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
`;

const Overall = styled(Card)`
  margin-bottom: var(--space-4);
`;

const Line = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Figures = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: var(--space-3);

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  dt {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  dd {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .remaining {
    color: ${(props) => (props.$over ? 'var(--danger)' : 'var(--success)')};
  }
`;

const statusLabels = {
  ok: 'On track',
  warning: 'Close to the limit',
  exceeded: 'Over budget',
};

const statusColors = {
  ok: 'var(--success)',
  warning: 'var(--warning)',
  exceeded: 'var(--danger)',
};

const StatusText = styled.span`
  font-size: var(--text-xs);
  font-weight: 500;
  color: ${(props) => statusColors[props.$status]};
`;

const Actions = styled.div`
  display: flex;
  gap: var(--space-1);
`;

function BudgetLine({ line, currency, onEdit, onDelete }) {
  return (
    <Line>
      <Figures $over={line.remaining < 0}>
        <div>
          <dt>Budget</dt>
          <dd>{formatCurrency(line.amount, currency)}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd>{formatCurrency(line.spent, currency)}</dd>
        </div>
        <div>
          <dt>{line.remaining < 0 ? 'Over by' : 'Remaining'}</dt>
          <dd className="remaining">{formatCurrency(Math.abs(line.remaining), currency)}</dd>
        </div>
        <div>
          <dt>Used</dt>
          <dd>{formatPercent(line.percentUsed)}</dd>
        </div>
      </Figures>

      <ProgressBar
        percent={line.percentUsed}
        status={line.status}
        label={`${line.label} budget usage`}
      />

      <CardHeader style={{ margin: 0 }}>
        <StatusText $status={line.status}>{statusLabels[line.status]}</StatusText>
        <Actions>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => onEdit(line)}
            aria-label={`Edit ${line.label} budget`}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => onDelete(line)}
            aria-label={`Delete ${line.label} budget`}
          >
            <Trash2 size={15} />
          </Button>
        </Actions>
      </CardHeader>
    </Line>
  );
}

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonthKey);
  const [editing, setEditing] = useState(null); // null | 'new' | budget line
  const [pendingDelete, setPendingDelete] = useState(null);

  const taxonomy = useTaxonomy();
  const toast = useToast();
  const { data, isPending, isError, error, refetch } = useBudgets(month);
  const { save, remove } = useBudgetMutations();

  const currency = data?.currency ?? taxonomy.currency;
  const overall = data?.overall ?? null;
  const categories = data?.categories ?? [];

  // Warn once per month when the overall budget is blown, rather than on every
  // re-render or every navigation back to this page.
  const warnedFor = useRef(null);
  useEffect(() => {
    if (!overall || overall.status !== 'exceeded') return;
    if (warnedFor.current === month) return;
    warnedFor.current = month;
    toast.warning(
      `You are over your ${formatMonthKey(month)} budget by ${formatCurrency(
        Math.abs(overall.remaining),
        currency
      )}.`
    );
  }, [overall, month, currency, toast]);

  const handleSave = async (payload) => {
    await save.mutateAsync(payload).then(() => setEditing(null)).catch(() => {});
  };

  const handleDelete = async () => {
    await remove.mutateAsync(pendingDelete._id).catch(() => {});
    setPendingDelete(null);
  };

  if (isError) {
    return (
      <>
        <PageHeader title="Budgets" />
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle={`Spending against your limits for ${formatMonthKey(month, true)}`}
      >
        <MonthPicker value={month} onChange={setMonth} />
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden="true" />
          Set budget
        </Button>
      </PageHeader>

      <Overall>
        <CardHeader>
          <div>
            <CardTitle>Overall monthly budget</CardTitle>
            <CardSubtitle>Everything you spend, across all categories</CardSubtitle>
          </div>
        </CardHeader>

        {isPending ? (
          <>
            <Skeleton $height="24px" $width="45%" />
            <div style={{ height: 12 }} />
            <Skeleton $height="8px" />
          </>
        ) : overall ? (
          <BudgetLine
            line={overall}
            currency={currency}
            onEdit={setEditing}
            onDelete={setPendingDelete}
          />
        ) : (
          <EmptyState
            icon={Wallet}
            title="No overall budget set"
            description="Set a monthly limit to see how much of it you have used."
            action={<Button onClick={() => setEditing('new')}>Set monthly budget</Button>}
          />
        )}
      </Overall>

      {isPending ? (
        <Grid>
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <Skeleton $height="18px" $width="40%" />
              <div style={{ height: 12 }} />
              <Skeleton $height="8px" />
            </Card>
          ))}
        </Grid>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="No category budgets yet"
            description="Category budgets let you cap spending on things like groceries or takeaways."
            action={<Button onClick={() => setEditing('new')}>Add a category budget</Button>}
          />
        </Card>
      ) : (
        <Grid>
          {categories.map((line) => (
            <Card key={line._id}>
              <CardHeader>
                <CardTitle style={{ fontSize: 'var(--text-base)' }}>{line.label}</CardTitle>
              </CardHeader>
              <BudgetLine
                line={line}
                currency={currency}
                onEdit={setEditing}
                onDelete={setPendingDelete}
              />
            </Card>
          ))}
        </Grid>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Set a budget' : 'Edit budget'}
        width="460px"
      >
        {editing ? (
          <BudgetForm
            budget={editing === 'new' ? null : editing}
            categories={taxonomy.expenseCategories}
            submitting={save.isPending}
            serverError={save.error}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this budget?"
        message={
          pendingDelete
            ? `The ${pendingDelete.label.toLowerCase()} will no longer be tracked against a limit. Your expenses are not affected.`
            : ''
        }
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

export default BudgetsPage;
