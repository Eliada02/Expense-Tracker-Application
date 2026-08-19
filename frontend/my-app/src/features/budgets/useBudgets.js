import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '../../services/resources';
import { queryKeys } from '../../hooks/queryKeys';
import { useToast } from '../../context/ToastContext';

export function useBudgets(month) {
  return useQuery({
    queryKey: queryKeys.budgets(month),
    queryFn: () => budgetsApi.list(month),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useBudgetMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetsAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.insightsAll }),
    ]);

  const save = useMutation({
    mutationFn: (payload) => budgetsApi.save(payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Budget saved');
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => budgetsApi.remove(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Budget removed');
    },
    onError: (error) => toast.error(error.message),
  });

  return { save, remove };
}
