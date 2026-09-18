import { useCallback } from 'react';

import { useServices } from '@/services/ServicesProvider';

export function useSyncActions() {
  const { coordinator, sync } = useServices();

  const syncNow = useCallback(() => coordinator.requestSync('manual'), [coordinator]);
  const retryFailed = useCallback(async () => {
    await sync.retryFailedPages();
  }, [sync]);

  return { syncNow, retryFailed };
}
