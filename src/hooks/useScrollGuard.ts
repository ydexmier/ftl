import { useRef } from 'react';

export function useScrollGuard(threshold = 8) {
  const startY = useRef(0);
  const scrolled = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    scrolled.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (Math.abs(e.changedTouches[0].clientY - startY.current) > threshold) {
      scrolled.current = true;
    }
  };

  const guard = (action: () => void) => {
    if (scrolled.current) {
      scrolled.current = false;
      return;
    }
    action();
  };

  return { onTouchStart, onTouchEnd, guard };
}
