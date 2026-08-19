import { useQuery } from '@tanstack/react-query';
import { metaApi } from '../services/resources';
import { queryKeys } from './queryKeys';

/**
 * Categories, payment methods and app config come from the backend so the list
 * is defined once. They never change at runtime, hence the infinite staleTime:
 * this is fetched once per session, not once per component.
 */
export function useTaxonomy() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.taxonomy,
    queryFn: async () => {
      const [categories, paymentMethods, config] = await Promise.all([
        metaApi.categories(),
        metaApi.paymentMethods(),
        metaApi.config(),
      ]);
      return { categories, paymentMethods, config };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const expenseCategories = data?.categories.expense ?? [];
  const incomeCategories = data?.categories.income ?? [];
  const paymentMethods = data?.paymentMethods ?? [];

  return {
    isPending,
    isError,
    error,
    expenseCategories,
    incomeCategories,
    paymentMethods,
    currency: data?.config.currency ?? 'EUR',
    frequencies: data?.config.frequencies ?? ['weekly', 'monthly', 'yearly'],
    /** id -> { label, color } lookups for tables, charts and badges. */
    expenseCategoryMap: new Map(expenseCategories.map((c) => [c.id, c])),
    incomeCategoryMap: new Map(incomeCategories.map((c) => [c.id, c])),
    paymentMethodMap: new Map(paymentMethods.map((p) => [p.id, p])),
  };
}

export default useTaxonomy;
