import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Download, Plus, Receipt } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/States';
import TransactionFilters from './TransactionFilters';
import TransactionForm from './TransactionForm';
import TransactionTable from './TransactionTable';
import { TRANSACTION_KINDS, useTransactionList, useTransactionMutations } from './useTransactions';
import useTaxonomy from '../../hooks/useTaxonomy';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_PAGE_SIZE, EMPTY_FILTERS } from '../../constants';
import { recentMonthKeys } from '../../utils/dates';
import { formatCurrency, formatMonthKey } from '../../utils/format';
import { downloadBlob } from '../../utils/download';
import { expensesApi } from '../../services/resources';

const FilterCard = styled(Card)`
  margin-bottom: var(--space-4);
`;

const Summary = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;

  strong {
    font-size: var(--text-xl);
    font-variant-numeric: tabular-nums;
  }

  span {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
`;

const TableCard = styled(Card)`
  padding: 0;

  > * {
    padding: 0 var(--space-5);
  }

  > div:first-child {
    padding: 0;
  }
`;

const PaginationWrapper = styled.div`
  padding: 0 var(--space-5) var(--space-4);
`;

/**
 * Shared page for the Expenses and Income screens. Both resources have the
 * same shape, so one page handles both rather than two near-identical copies.
 */
export function TransactionsPage({ kind, title, subtitle, allowExport = false }) {
  const config = TRANSACTION_KINDS[kind];
  const toast = useToast();
  const taxonomy = useTaxonomy();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('date:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [editing, setEditing] = useState(null); // null | 'new' | transaction
  const [pendingDelete, setPendingDelete] = useState(null);
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebouncedValue(filters.search);
  const [sortBy, sortDir] = sort.split(':');

  const categories = kind === 'expense' ? taxonomy.expenseCategories : taxonomy.incomeCategories;
  const categoryMap =
    kind === 'expense' ? taxonomy.expenseCategoryMap : taxonomy.incomeCategoryMap;

  const queryParams = useMemo(
    () => ({ ...filters, search: debouncedSearch, sortBy, sortDir, page, limit }),
    [filters, debouncedSearch, sortBy, sortDir, page, limit]
  );

  const { data, isPending, isError, error, refetch, isFetching } = useTransactionList(
    kind,
    queryParams
  );
  const { create, update, remove } = useTransactionMutations(kind);

  const months = useMemo(
    () => recentMonthKeys(12).map((value) => ({ value, label: formatMonthKey(value) })),
    []
  );

  // Any filter change invalidates the current page number.
  const applyFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  // Clears any error left over from a previous attempt, so reopening the form
  // does not show a stale message.
  const openForm = (target) => {
    create.reset();
    update.reset();
    setEditing(target);
  };

  const handleSubmit = async (values) => {
    const payload = { ...values };
    if (kind === 'income') delete payload.paymentMethod;

    if (editing === 'new') {
      await create.mutateAsync(payload).then(() => setEditing(null)).catch(() => {});
    } else {
      await update
        .mutateAsync({ id: editing._id, payload })
        .then(() => setEditing(null))
        .catch(() => {});
    }
  };

  const handleDelete = async () => {
    await remove.mutateAsync(pendingDelete._id).catch(() => {});
    setPendingDelete(null);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const blob = await expensesApi.export(
        { ...filters, search: debouncedSearch, sortBy, sortDir },
        format
      );
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `expenses-${stamp}.${format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (exportError) {
      toast.error(exportError.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items ?? [];
  const meta = data?.meta;
  const hasFilters = Object.values(filters).some(Boolean);
  const mutating = create.isPending || update.isPending;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        {allowExport ? (
          <>
            <Button
              variant="secondary"
              onClick={() => handleExport('csv')}
              loading={exporting}
              disabled={items.length === 0}
            >
              <Download size={16} aria-hidden="true" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('json')}
              disabled={exporting || items.length === 0}
            >
              JSON
            </Button>
          </>
        ) : null}
        <Button onClick={() => openForm('new')}>
          <Plus size={16} aria-hidden="true" />
          Add {config.label.toLowerCase()}
        </Button>
      </PageHeader>

      <FilterCard>
        <TransactionFilters
          filters={filters}
          onChange={applyFilters}
          onReset={() => applyFilters(EMPTY_FILTERS)}
          categories={categories}
          paymentMethods={taxonomy.paymentMethods}
          months={months}
          showPaymentMethod={kind === 'expense'}
          sort={sort}
          onSortChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
        />
      </FilterCard>

      <TableCard>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            {meta ? (
              <Summary>
                <span>
                  {meta.total} {meta.total === 1 ? 'transaction' : 'transactions'}
                  {hasFilters ? ' matching your filters' : ''}
                </span>
                <strong>{formatCurrency(meta.filteredTotalAmount, taxonomy.currency)}</strong>
              </Summary>
            ) : null}

            {!isPending && items.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={hasFilters ? 'No matching transactions' : `No ${kind}s yet`}
                description={
                  hasFilters
                    ? 'Try widening your filters or clearing them to see everything.'
                    : `Add your first ${kind} to start tracking.`
                }
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={() => applyFilters(EMPTY_FILTERS)}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={() => openForm('new')}>
                      <Plus size={16} aria-hidden="true" />
                      Add {config.label.toLowerCase()}
                    </Button>
                  )
                }
              />
            ) : (
              <TransactionTable
                items={items}
                loading={isPending || (isFetching && items.length === 0)}
                currency={taxonomy.currency}
                categoryMap={categoryMap}
                paymentMethodMap={taxonomy.paymentMethodMap}
                onEdit={openForm}
                onDelete={setPendingDelete}
                amountPrefix={kind === 'income' ? '+' : ''}
              />
            )}

            {items.length > 0 ? (
              <PaginationWrapper>
                <Pagination
                  meta={meta}
                  page={page}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={(next) => {
                    setLimit(next);
                    setPage(1);
                  }}
                />
              </PaginationWrapper>
            ) : null}
          </>
        )}
      </TableCard>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `Add ${config.label.toLowerCase()}` : `Edit ${config.label.toLowerCase()}`}
      >
        {editing ? (
          <TransactionForm
            key={editing === 'new' ? 'new' : editing._id}
            transaction={editing === 'new' ? null : editing}
            categories={categories}
            paymentMethods={taxonomy.paymentMethods}
            showPaymentMethod={kind === 'expense'}
            submitLabel={editing === 'new' ? `Add ${config.label.toLowerCase()}` : 'Save changes'}
            submitting={mutating}
            serverError={editing === 'new' ? create.error : update.error}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete this ${kind}?`}
        message={
          pendingDelete
            ? `"${pendingDelete.title}" (${formatCurrency(pendingDelete.amount, taxonomy.currency)}) will be permanently removed. This cannot be undone.`
            : ''
        }
        loading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

export default TransactionsPage;
