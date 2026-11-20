import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMyPermissions } from '../lib/api/me';

export const PERMISSIONS_KEY = ['me', 'permissions'] as const;

/** `/me/permissions`, refetched whenever the app comes back to the foreground (queue·8). */
export function useMyPermissions() {
  const query = useQuery({ queryKey: PERMISSIONS_KEY, queryFn: getMyPermissions });
  const { refetch } = query;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refetch();
      }
    });
    return () => sub.remove();
  }, [refetch]);

  const canUpdateStatus = query.data?.permissions.includes('orders:update_status') === true;
  return { ...query, canUpdateStatus };
}
