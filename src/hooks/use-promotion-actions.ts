import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

/**
 * Hook for deleting a promotion
 */
export function useDeletePromotion() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dashboard.Promotions');

  return useMutation({
    mutationFn: async (promotionId: string) => {
      const response = await axios.delete(`/api/promotions/${promotionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success(t('deletedSuccess'));
    },
    onError: (error) => {
      console.error('Error deleting promotion:', error);
      toast.error(t('deletedError'));
    },
  });
}

/**
 * Hook for toggling promotion active status
 */
export function useTogglePromotionActive() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dashboard.Promotions');

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await axios.patch(`/api/promotions/${id}/toggle`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success(
        variables.isActive
          ? t('activatedSuccess')
          : t('deactivatedSuccess')
      );
    },
    onError: (error) => {
      console.error('Error toggling promotion status:', error);
      toast.error(t('toggleError'));
    },
  });
}

/**
 * Hook for creating a new promotion
 */
export function useCreatePromotion() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dashboard.Promotions');

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/promotions', data);
      return response.data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['activePromotions'] });
      
      // Send promotional emails to opted-in users
      try {
        if (data.promotion && data.promotion.isActive) {
          await axios.post('/api/promotions/email', { 
            promotionId: data.promotion.id 
          });
        }
      } catch (emailError) {
        console.error('Error sending promotional emails:', emailError);
        // We don't show this error to the user since the promotion was created successfully
      }
      
      toast.success(t('createdSuccess'));
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast.error(t('createdError'));
    },
  });
}

/**
 * Hook for updating an existing promotion
 */
export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dashboard.Promotions');

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/api/promotions/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion', data.id] });
      toast.success(t('updatedSuccess'));
    },
    onError: (error) => {
      console.error('Error updating promotion:', error);
      toast.error(t('updatedError'));
    },
  });
}
