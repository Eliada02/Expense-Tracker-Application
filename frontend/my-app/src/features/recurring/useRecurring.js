import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringApi } from '../../services/resources';
import { EXPENSE_DEPENDENT_KEYS, queryKeys } from '../../hooks/queryKeys';
import { useToast } from '../../context/ToastContext';

export function useRecurring() {
  return useQuery({
    queryKey: queryKeys.recurring,
    queryFn: recurringApi.list,
    staleTime: 30_000,
  });
}

export function useRecurringMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Creating or editing a rule can generate real expenses, so everything
  // derived from expenses is invalidated too.
  const invalidate = () =>
    Promise.all(
      [queryKeys.recurring, ...EXPENSE_DEPENDENT_KEYS].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    );

  const create = useMutation({
    mutationFn: (payload) => recurringApi.create(payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Recurring expense created');
    },
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => recurringApi.update(id, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Recurring expense updated');
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => recurringApi.remove(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Recurring expense removed');
    },
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
