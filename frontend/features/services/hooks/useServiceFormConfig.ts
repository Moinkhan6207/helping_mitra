import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

/**
 * useServiceFormConfig Hook.
 * Fetches and caches the dynamic form configurations for a given service slug.
 */
export const useServiceFormConfig = (slug: string) => {
  const formConfigQuery = useQuery({
    queryKey: ['serviceFormConfig', slug],
    queryFn: () => serviceApi.getFormConfig(slug),
    enabled: !!slug,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Form config doesn't change often
  });

  return {
    formConfig: formConfigQuery.data,
    isLoading: formConfigQuery.isLoading,
    isError: formConfigQuery.isError,
    error: formConfigQuery.error,
  };
};
