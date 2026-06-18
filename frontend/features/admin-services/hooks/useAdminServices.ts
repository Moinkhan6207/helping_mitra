import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminServiceApi } from '../api/adminService.api';
import { AdminServiceQueryOptions, AdminServiceDetailsData, AdminServiceFieldData, AdminServiceDocumentData } from '../types';

export const useAdminServices = (options?: AdminServiceQueryOptions) => {
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['adminServices', options],
    queryFn: () => adminServiceApi.getServices(options!),
    enabled: !!options,
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Partial<AdminServiceDetailsData>) => adminServiceApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminServiceDetailsData> }) =>
      adminServiceApi.updateService(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['serviceDetails'] });
      queryClient.invalidateQueries({ queryKey: ['priceHistory', variables.id] });
    },
  });

  /** FR-2.8: Dedicated MRP update mutation — uses strict validation endpoint */
  const updateMrpMutation = useMutation({
    mutationFn: ({ id, mrp }: { id: string; mrp: number }) =>
      adminServiceApi.updateMrp(id, mrp),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['priceHistory', variables.id] });
    },
  });

  /** FR-2.7: Dedicated status toggle mutation */
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminServiceApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.id] });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => adminServiceApi.deleteService(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['adminService', variables] });
    },
  });

  // Fields mutations
  const createFieldMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: Partial<AdminServiceFieldData> }) =>
      adminServiceApi.createField(serviceId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceFields'] });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ id, serviceId, data }: { id: string; serviceId: string; data: Partial<AdminServiceFieldData> }) =>
      adminServiceApi.updateField(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceFields'] });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ id, serviceId }: { id: string; serviceId: string }) => adminServiceApi.deleteField(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceFields'] });
    },
  });

  // Documents mutations
  const createDocumentMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: Partial<AdminServiceDocumentData> }) =>
      adminServiceApi.createDocument(serviceId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceDocuments'] });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, serviceId, data }: { id: string; serviceId: string; data: Partial<AdminServiceDocumentData> }) =>
      adminServiceApi.updateDocument(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceDocuments'] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: ({ id, serviceId }: { id: string; serviceId: string }) => adminServiceApi.deleteDocument(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminService', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['serviceDocuments'] });
    },
  });

  return {
    servicesData: servicesQuery.data,
    isLoading: servicesQuery.isLoading,
    isFetching: servicesQuery.isFetching,
    isError: servicesQuery.isError,
    error: servicesQuery.error,
    refetch: servicesQuery.refetch,
    createService: createServiceMutation,
    updateService: updateServiceMutation,
    updateMrp: updateMrpMutation,
    updateStatus: updateStatusMutation,
    deleteService: deleteServiceMutation,
    
    // Field mutations
    createField: createFieldMutation,
    updateField: updateFieldMutation,
    deleteField: deleteFieldMutation,

    // Document mutations
    createDocument: createDocumentMutation,
    updateDocument: updateDocumentMutation,
    deleteDocument: deleteDocumentMutation,
  };
};

export const useAdminServiceById = (id: string) => {
  return useQuery({
    queryKey: ['adminService', id],
    queryFn: () => adminServiceApi.getServiceById(id),
    enabled: !!id,
  });
};
