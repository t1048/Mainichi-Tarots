import { useEffect, useRef } from 'preact/hooks';
import { loadTodayDaily, type DailyFortuneKind } from './daily-fortune';

interface Options<TStored, TResolved> {
  enabled: boolean;
  resolve: (stored: TStored) => TResolved | null;
  apply: (resolved: TResolved) => void;
  /**
   * Additional dependencies that should trigger a re-check (e.g. `[mode]`).
   * Defaults to `[]` so the restore is checked only on mount.
   */
  deps?: unknown[];
}

/**
 * Loads today's daily fortune for `kind` and, if it exists and `enabled` is true,
 * resolves + applies it. `resolve` and `apply` do not need to be memoized.
 */
export function useDailyRestore<TStored, TResolved>(
  kind: DailyFortuneKind,
  { enabled, resolve, apply, deps = [] }: Options<TStored, TResolved>,
): void {
  const resolveRef = useRef(resolve);
  const applyRef = useRef(apply);
  resolveRef.current = resolve;
  applyRef.current = apply;

  useEffect(() => {
    if (!enabled) return;
    const stored = loadTodayDaily<TStored>(kind);
    if (!stored) return;
    const resolved = resolveRef.current(stored);
    if (!resolved) return;
    applyRef.current(resolved);
  }, [kind, enabled, ...deps]);
}
