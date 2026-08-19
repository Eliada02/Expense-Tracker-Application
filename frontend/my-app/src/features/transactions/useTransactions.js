import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi, incomesApi } from '../../services/resources';
import {
  EXPENSE_DEPENDENT_KEYS,
  INCOME_DEPENDENT_KEYS,
  queryKeys,
} from '../../hooks/queryKeys';
import { useToast } from '../../context/ToastContext';

/**
 * Expenses and income are the same resource with a different collection, so
 * both pages share one set of hooks configured by this table.
 */
export const TRANSACTION_KINDS = {
  expense: {
    api: expensesApi,
    label: 'Expense',
    listKey: queryKeys.expenses,
    invalidates: EXPENSE_DEPENDENT_KEYS,
  },
  income: {
    api: incomesApi,
    label: 'Income',
    listKey: queryKeys.incomes,
    invalidates: INCOME_DEPENDENT_KEYS,
  },
};

/**
 * Server state lives in React Query rather than in a hand-rolled context:
 * it de-duplicates identical requests, keeps previous data visible while a
 * filter change is in flight, and gives every page real loading/error states.
 */
export function useTransactionList(kind, params) {
  const config = TRANSACTION_KINDS[kind];

  return useQuery({
    queryKey: config.listKey(params),
    queryFn: () => config.api.list(params),
    // Keeps the table on screen while paging or filtering instead of flashing
    // a skeleton on every keystroke.
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useTransactionMutations(kind) {
  const config = TRANSACTION_KINDS[kind];
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidate = () =>
    Promise.all(
      config.invalidates.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    );

  const create = useMutation({
    mutationFn: (payload) => config.api.create(payload),
    onSuccess: async () => {
      await invalidate();
      toast.success(`${config.label} created`);
    },
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => config.api.update(id, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success(`${config.label} updated`);
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => config.api.remove(id),
    onSuccess: async () => {
      await invalidate();
      toast.success(`${config.label} deleted`);
    },
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
