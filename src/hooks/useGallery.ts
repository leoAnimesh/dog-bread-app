import { useCallback, useEffect, useMemo, useState } from 'react';

import type { BreedImage } from '@/domain';
import { useServices } from '@/services/ServicesProvider';

export function useGallery(images: readonly BreedImage[]) {
  const { images: cache } = useServices();
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[Math.min(index, Math.max(0, count - 1))] ?? null;

  useEffect(() => {
    // Gallery opened: thumbs for the strip, large for the current image only.
    cache.prefetch(images.map((i) => i.thumb), 'thumb');
  }, [images, cache]);

  const goTo = useCallback((next: number) => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  }, [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const dots = useMemo(() => images.map((img, i) => ({ id: img.id, active: i === index })), [images, index]);

  return { index, current, count, next, prev, goTo, dots };
}
