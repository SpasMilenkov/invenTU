import { useCallback, useEffect, useState } from 'react';

type SerializableValue = string | number | boolean | undefined;
type ParamsShape = Record<string, SerializableValue>;

interface Options {
  historyMode?: 'push' | 'replace';
}

function parseValue<T>(raw: string | null, defaultValue: T): T {
  if (raw === null) return defaultValue;
  if (typeof defaultValue === 'number') {
    const n = Number(raw);
    return (Number.isFinite(n) ? n : defaultValue) as T;
  }
  if (typeof defaultValue === 'boolean') {
    if (raw === 'true') return true as T;
    if (raw === 'false') return false as T;
    return defaultValue;
  }
  return raw as T;
}

function readParams<T extends ParamsShape>(defaults: T): T {
  if (typeof window === 'undefined') return defaults;
  const search = new URLSearchParams(window.location.search);
  const next = { ...defaults } as T;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const raw = search.get(String(key));
    if (raw === null) continue;
    next[key] = parseValue(raw, defaults[key]) as T[typeof key];
  }
  return next;
}

function writeParams<T extends ParamsShape>(
  state: T,
  defaults: T,
  mode: 'push' | 'replace',
) {
  if (typeof window === 'undefined') return;
  const search = new URLSearchParams(window.location.search);
  for (const key of Object.keys(state)) {
    const value = state[key];
    const isDefault = defaults[key] === value;
    if (value === undefined || value === '' || isDefault) {
      search.delete(key);
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  if (mode === 'push') window.history.pushState({}, '', url);
  else window.history.replaceState({}, '', url);
}

export function useUrlSearchParams<T extends ParamsShape>(
  defaults: T,
): [T, (patch: Partial<T>, opts?: Options) => void] {
  const [state, setState] = useState<T>(() => readParams(defaults));

  useEffect(() => {
    function handlePopState() {
      setState(readParams(defaults));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(
    (patch: Partial<T>, opts: Options = {}) => {
      const mode = opts.historyMode ?? 'replace';
      setState((prev) => {
        const next = { ...prev, ...patch } as T;
        writeParams(next, defaults, mode);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return [state, update];
}
