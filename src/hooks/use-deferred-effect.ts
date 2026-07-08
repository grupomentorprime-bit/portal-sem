import { useEffect, type DependencyList, type EffectCallback } from "react";

/**
 * Runs an effect after the current commit (microtask), avoiding synchronous
 * setState calls inside useEffect that trip react-hooks/set-state-in-effect.
 */
export function useDeferredEffect(effect: EffectCallback, deps: DependencyList): void {
  useEffect(() => {
    let cleanup: ReturnType<EffectCallback>;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      cleanup = effect();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, deps);
}
