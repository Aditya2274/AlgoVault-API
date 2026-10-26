import { useState, useEffect } from 'react';

export type Route =
  | { name: 'list' }
  | { name: 'problem'; id: string };

function parseHash(hash: string): Route {
  // Remove leading '#' or '#/'
  const path = hash.replace(/^#\/?/, '');
  const match = path.match(/^problem\/(.+)$/);
  if (match && match[1]) {
    return { name: 'problem', id: decodeURIComponent(match[1]) };
  }
  return { name: 'list' };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
