import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type NetworkListener = (isOnline: boolean) => void;

/** Small abstraction over NetInfo so the sync coordinator is testable. */
export interface NetworkMonitor {
  isOnline(): boolean;
  /** Fires only on transitions; the first call reflects the current state. */
  subscribe(listener: NetworkListener): () => void;
  refresh(): Promise<boolean>;
}

function toOnline(state: NetInfoState): boolean {
  // isInternetReachable is null while undetermined — trust isConnected then.
  if (state.isConnected === false) return false;
  return state.isInternetReachable !== false;
}

export function createNetInfoMonitor(): NetworkMonitor {
  // Optimistic default: assume online until NetInfo tells us otherwise.
  let online = true;
  const listeners = new Set<NetworkListener>();

  NetInfo.addEventListener((state) => {
    const next = toOnline(state);
    if (next === online) return;
    online = next;
    for (const l of listeners) l(online);
  });

  return {
    isOnline: () => online,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async refresh() {
      const state = await NetInfo.fetch();
      const next = toOnline(state);
      if (next !== online) {
        online = next;
        for (const l of listeners) l(online);
      }
      return online;
    },
  };
}
