import { useEffect, useState } from 'react';

import type { ImageVariant } from '@/data/db/repositories/ImageCacheRepository';
import { useServices } from '@/services/ServicesProvider';

export interface CachedImageState {
  /** Local file URI when cached, remote URL otherwise */
  uri: string | null;
  cached: boolean;
}

/**
 * Resolves an image through the size-bounded disk cache. Renders the remote
 * URL immediately on a miss so nothing waits on the download, then swaps to
 * the local file once written.
 */
export function useCachedImage(url: string | null, variant: ImageVariant): CachedImageState {
  const { images } = useServices();
  // Synchronous index lookup — derived during render, never mirrored into state.
  const local = url ? images.getLocalUri(url) : null;
  const [downloaded, setDownloaded] = useState<{ url: string; uri: string } | null>(null);

  useEffect(() => {
    if (!url || local) return;
    let cancelled = false;
    void images.ensure(url, variant).then((resolved) => {
      if (!cancelled && resolved !== url) setDownloaded({ url, uri: resolved });
    });
    return () => {
      cancelled = true;
    };
  }, [url, local, variant, images]);

  if (!url) return { uri: null, cached: false };
  if (local) return { uri: local, cached: true };
  if (downloaded?.url === url) return { uri: downloaded.uri, cached: true };
  return { uri: url, cached: false };
}
