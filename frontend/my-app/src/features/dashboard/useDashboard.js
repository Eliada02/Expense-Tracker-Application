import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/resources';
import { queryKeys } from '../../hooks/queryKeys';

const shared = {
  staleTime: 60_000,
  placeholderData: (previous) => previous,
};

export function useDashboard(params) {
  return useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => analyticsApi.dashboard(params),
    ...shared,
  });
}

export function useInsights(params) {
  return useQuery({
    queryKey: queryKeys.insights(params),
    queryFn: () => analyticsApi.insights(params),
    ...shared,
  });
}
