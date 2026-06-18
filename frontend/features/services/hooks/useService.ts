import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

export const useService = (slug: string) => {
  const detailsQuery = useQuery({
    queryKey: ['serviceDetails', slug],
    queryFn: () => serviceApi.getServiceDetails(slug),
    enabled: !!slug,
  });

  const fieldsQuery = useQuery({
    queryKey: ['serviceFields', slug],
    queryFn: () => serviceApi.getServiceFields(slug),
    enabled: !!slug,
  });

  const documentsQuery = useQuery({
    queryKey: ['serviceDocuments', slug],
    queryFn: () => serviceApi.getServiceDocuments(slug),
    enabled: !!slug,
  });

  return {
    details: detailsQuery.data,
    fields: fieldsQuery.data,
    documents: documentsQuery.data,
    isLoading: detailsQuery.isLoading || fieldsQuery.isLoading || documentsQuery.isLoading,
    isError: detailsQuery.isError || fieldsQuery.isError || documentsQuery.isError,
    error: detailsQuery.error || fieldsQuery.error || documentsQuery.error,
  };
};
