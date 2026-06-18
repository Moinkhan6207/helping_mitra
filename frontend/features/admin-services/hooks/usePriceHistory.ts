import { useQuery } from '@tanstack/react-query';
import { adminServiceApi } from '../api/adminService.api';

export const usePriceHistory = (serviceId: string) => {
  return useQuery({
    queryKey: ['priceHistory', serviceId],
    queryFn: () => adminServiceApi.getPriceHistory(serviceId),
    enabled: !!serviceId,
  });
};
