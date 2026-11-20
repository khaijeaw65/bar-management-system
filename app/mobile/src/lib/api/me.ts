import { MyPermissionsSchema, type MyPermissions } from '@bar/contracts';
import { apiClient } from './client';
import { fetchMockPermissions } from '../../mocks/permissions';

export async function getMyPermissions(): Promise<MyPermissions> {
  if (process.env.EXPO_PUBLIC_USE_MOCKS === '1') {
    return fetchMockPermissions();
  }
  const data = await apiClient.get('/me/permissions');
  return MyPermissionsSchema.parse(data);
}
