import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';
import { ServiceQueryOptions, ServicesResponse } from '../types';

export const useServices = (options: ServiceQueryOptions, queryOptions?: any) => {
  return useQuery<ServicesResponse>({
    queryKey: ['services', options],
    queryFn: () => serviceApi.getServices(options),
    ...queryOptions,
  });
};
