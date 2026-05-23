"use client";

import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";
import { RollingNumber, type RollingNumberProps } from "./rolling-number";

type AnimatedNumberProps = Omit<RollingNumberProps, "value" | "animated"> & {
  /** Valeur cible à atteindre */
  target: number;
  /** Durée de l'animation en ms (défaut 1400ms) */
  duration?: number;
};

/**
 * Variante de RollingNumber pour les chiffres statiques (hero stats, compteurs).
 * S'anime de 0 → target quand l'élément entre dans le viewport.
 * Utilise animated=false : c'est le RAF (useCountUp) qui pilote les frames,
 * pas la transition CSS — ce qui donne l'effet "rouleaux qui tournent".
 */
export function AnimatedNumber({
  target,
  duration,
  ...rest
}: AnimatedNumberProps) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const value = useCountUp({ target, duration, enabled: inView });

  return (
    <span ref={ref}>
      <RollingNumber value={value} animated={false} {...rest} />
    </span>
  );
}
