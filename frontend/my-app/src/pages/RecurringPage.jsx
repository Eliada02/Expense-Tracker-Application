import { useState } from 'react';
import styled from 'styled-components';
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardHeader, CardSubtitle, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge, { CategoryBadge } from '../components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import RecurringForm from '../features/recurring/RecurringForm';
import { useRecurring, useRecurringMutations } from '../features/recurring/useRecurring';
import useTaxonomy from '../hooks/useTaxonomy';
import { FREQUENCY_LABELS } from '../constants';
import { formatCurrency, formatDate } from '../utils/format';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
`;

const RuleCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  opacity: ${(props) => (props.$inactive ? 0.62 : 1)};
`;

const Amount = styled.p`
  font-size: var(--text-xl);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const Meta = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  margin: 0;

  dt {
    color: var(--text-muted);
  }

  dd {
    margin: 0;
  }
`;

const Tags = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const Actions = styled.div`
  display: flex;
  gap: var(--space-1);
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border);
  justify-content: flex-end;
`;

export function RecurringPage() {
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const taxonomy = useTaxonomy();
  const { data: rules, isPending, isError, error, refetch } = useRecurring();
  const { create, update, remove } = useRecurringMutations();

  const handleSubmit = async (values) => {
    if (editing === 'new') {
      await create.mutateAsync(values).then(() => setEditing(null)).catch(() => {});
    } else {
      await update
        .mutateAsync({ id: editing._id, payload: values })
        .then(() => setEditing(null))
        .catch(() => {});
    }
  };

  const handleDelete = async () => {
    await remove.mutateAsync(pendingDelete._id).catch(() => {});
    setPendingDelete(null);
  };

  const monthlyCommitment = (rules ?? [])
    .filter((rule) => rule.active)
    .reduce((total, rule) => {
      const perMonth =
        rule.frequency === 'weekly' ? rule.amount * 4.345 : rule.frequency === 'yearly' ? rule.amount / 12 : rule.amount;
      return total + perMonth;
    }, 0);

  return (
    <>
      <PageHeader
        title="Recurring expenses"
        subtitle="Fixed costs are created automatically when they fall due"
      >
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden="true" />
          Add recurring expense
        </Button>
      </PageHeader>

      {isError ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : isPending ? (
        <Grid>
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <Skeleton $height="18px" $width="55%" />
              <div style={{ height: 12 }} />
              <Skeleton $height="26px" $width="40%" />
              <div style={{ height: 12 }} />
              <Skeleton $height="12px" />
            </Card>
          ))}
        </Grid>
      ) : rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Repeat}
            title="No recurring expenses"
            description="Add rent, subscriptions or utilities once and they will be recorded automatically each period."
            action={
              <Button onClick={() => setEditing('new')}>
                <Plus size={16} aria-hidden="true" />
                Add recurring expense
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 'var(--space-4)' }}>
            <CardHeader style={{ margin: 0 }}>
              <div>
                <CardTitle>Estimated monthly commitment</CardTitle>
                <CardSubtitle>
                  Weekly rules counted as 4.3 per month, yearly divided by 12
                </CardSubtitle>
              </div>
              <Amount>{formatCurrency(monthlyCommitment, taxonomy.currency)}</Amount>
            </CardHeader>
          </Card>

          <Grid>
            {rules.map((rule) => {
              const category = taxonomy.expenseCategoryMap.get(rule.category);
              return (
                <RuleCard key={rule._id} $inactive={!rule.active}>
                  <CardHeader style={{ margin: 0 }}>
                    <CardTitle style={{ fontSize: 'var(--text-base)' }}>{rule.title}</CardTitle>
                    <Amount>{formatCurrency(rule.amount, taxonomy.currency)}</Amount>
                  </CardHeader>

                  <Tags>
                    <Badge>{FREQUENCY_LABELS[rule.frequency] ?? rule.frequency}</Badge>
                    {category ? (
                      <CategoryBadge color={category.color} label={category.label} />
                    ) : null}
                    {!rule.active ? (
                      <Badge $color="var(--warning)" $bg="var(--warning-soft)">
                        Paused
                      </Badge>
                    ) : null}
                  </Tags>

                  <Meta>
                    <dt>Started</dt>
                    <dd>{formatDate(rule.startDate)}</dd>
                    <dt>{rule.active ? 'Next' : 'Would resume'}</dt>
                    <dd>{formatDate(rule.nextRunDate)}</dd>
                    {rule.endDate ? (
                      <>
                        <dt>Ends</dt>
                        <dd>{formatDate(rule.endDate)}</dd>
                      </>
                    ) : null}
                  </Meta>

                  <Actions>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={() => setEditing(rule)}
                      aria-label={`Edit ${rule.title}`}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={() => setPendingDelete(rule)}
                      aria-label={`Delete ${rule.title}`}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </Actions>
                </RuleCard>
              );
            })}
          </Grid>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add recurring expense' : 'Edit recurring expense'}
        width="620px"
      >
        {editing ? (
          <RecurringForm
            key={editing === 'new' ? 'new' : editing._id}
            rule={editing === 'new' ? null : editing}
            categories={taxonomy.expenseCategories}
            paymentMethods={taxonomy.paymentMethods}
            frequencies={taxonomy.frequencies}
            submitting={create.isPending || update.isPending}
            serverError={editing === 'new' ? create.error : update.error}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this recurring expense?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will stop generating new expenses. Expenses already recorded are kept.`
            : ''
        }
        loading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

export default RecurringPage;
