import { useCallback, useRef } from 'preact/hooks';

/**
 * Ensures a save callback is invoked at most once per "reading".
 * Call `reset()` when starting a new draw to allow saving again.
 */
export function useSaveOnce<T>(onSave: (value: T) => void): {
  save: (value: T) => void;
  reset: () => void;
} {
  const savedRef = useRef(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const save = useCallback((value: T) => {
    if (savedRef.current) return;
    savedRef.current = true;
    onSaveRef.current(value);
  }, []);

  const reset = useCallback(() => {
    savedRef.current = false;
  }, []);

  return { save, reset };
}
