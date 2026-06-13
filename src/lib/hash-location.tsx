import { createContext, h } from 'preact';
import { useMemo, useReducer, useLayoutEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface LocationHook {
  url: string;
  path: string;
  query: Record<string, string>;
  route: (url: string, replace?: boolean) => void;
  back: () => void;
  forward: () => void;
}

export const HASH_LOCATION_CTX = createContext<LocationHook>({} as LocationHook);

function hashPath(): string {
  const raw = window.location.hash;
  if (!raw || raw === '#') return '/';
  const path = raw.startsWith('#') ? raw.slice(1) : raw;
  return path.startsWith('/') ? path : `/${path}`;
}

function toHash(url: string): string {
  const path = url.startsWith('/') ? url : `/${url}`;
  return `#${path === '/' ? '/' : path}`;
}

let push: boolean | undefined;

type NavAction = MouseEvent | { url: string; replace?: boolean } | { type: 'sync' };

function handleNav(state: string, action: NavAction): string {
  let url = '';
  push = undefined;

  if (action instanceof MouseEvent) {
    if (action.ctrlKey || action.metaKey || action.altKey || action.shiftKey || action.button !== 0) {
      return state;
    }

    const link = action.composedPath().find(
      (el) => (el as Element).nodeName === 'A' && (el as HTMLAnchorElement).href,
    ) as HTMLAnchorElement | undefined;
    const href = link?.getAttribute('href');
    if (
      !link ||
      link.origin !== location.origin ||
      !href ||
      !/^(_?self)?$/i.test(link.target) ||
      link.download
    ) {
      return state;
    }

    if (href.startsWith('#')) {
      action.preventDefault();
      push = true;
      const path = href.slice(1);
      url = path.startsWith('/') ? path : `/${path}`;
    } else if (!href.startsWith('http') && !href.startsWith('mailto:')) {
      action.preventDefault();
      push = true;
      url = href.startsWith('/') ? href : `/${href}`;
    } else {
      return state;
    }
  } else if ('url' in action) {
    push = !action.replace;
    url = action.url;
  } else {
    url = hashPath();
  }

  const hash = toHash(url);
  if (push === true) history.pushState(null, '', hash);
  else if (push === false) history.replaceState(null, '', hash);

  return url.split('?')[0] || '/';
}

export function HashLocationProvider({ children }: { children: ComponentChildren }) {
  const [url, dispatch] = useReducer(handleNav, hashPath());
  const wasPush = push === true;

  const value = useMemo(() => {
    const u = new URL(url, location.origin);
    const path = u.pathname.replace(/\/+$/g, '') || '/';
    return {
      url,
      path,
      query: Object.fromEntries(u.searchParams),
      route: (next: string, replace?: boolean) => dispatch({ url: next, replace }),
      back: () => history.back(),
      forward: () => history.forward(),
      wasPush,
    };
  }, [url, wasPush]);

  useLayoutEffect(() => {
    const onClick = (e: MouseEvent) => dispatch(e);
    const onHashChange = () => dispatch({ type: 'sync' });
    const onPopState = () => dispatch({ type: 'sync' });

    addEventListener('click', onClick);
    addEventListener('hashchange', onHashChange);
    addEventListener('popstate', onPopState);

    if (!window.location.hash) {
      dispatch({ url: '/', replace: true });
    }

    return () => {
      removeEventListener('click', onClick);
      removeEventListener('hashchange', onHashChange);
      removeEventListener('popstate', onPopState);
    };
  }, []);

  return h(HASH_LOCATION_CTX.Provider, { value }, children);
}
