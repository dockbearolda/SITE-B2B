"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  target: number;
  duration?: number;
  enabled?: boolean;
}

/**
 * Anime un nombre de 0 vers sa valeur cible via requestAnimationFrame.
 * Déclenché uniquement quand `enabled` passe à true (ex. après IntersectionObserver).
 * Utilise un easing easeOutQuart pour l'effet "rouleau qui ralentit".
 */
export function useCountUp({
  target,
  duration = 1400,
  enabled = true,
}: Options): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!enabled || doneRef.current) return;
    doneRef.current = true;
    startRef.current = 0;

    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // easeOutQuart — démarre vite (effet casino spinning) puis ralentit
      const eased = 1 - (1 - t) ** 4;
      setValue(Math.round(eased * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return value;
}
