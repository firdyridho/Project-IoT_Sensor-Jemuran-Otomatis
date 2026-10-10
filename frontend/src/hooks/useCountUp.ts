import { useState, useEffect, useRef } from 'react';

/**
 * Hook to smoothly animate a number counting up from 0 to target
 * when the element scrolls into view via IntersectionObserver.
 */
export function useCountUp(
  target: number,
  durationMs: number = 1200
): [number, React.RefObject<HTMLDivElement | null>] {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;
          const startVal = 0;

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / durationMs, 1);
            // Ease-out cubic curve: 1 - (1 - t)^3
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (target - startVal) * easeOutProgress);
            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [target, durationMs]);

  // If target changes after already animated, animate from current to new target
  useEffect(() => {
    if (hasAnimated.current) {
      setCount(target);
    }
  }, [target]);

  return [count, ref];
}
