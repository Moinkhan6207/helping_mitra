import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminServiceApi } from '../api/adminService.api';
import { AdminCategoryData } from '../types';

export const useAdminCategories = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => adminServiceApi.getCategories(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<AdminCategoryData>) => adminServiceApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminCategoryData> }) =>
      adminServiceApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => adminServiceApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
    },
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,
    createCategory: createCategoryMutation,
    updateCategory: updateCategoryMutation,
    deleteCategory: deleteCategoryMutation,
  };
};
