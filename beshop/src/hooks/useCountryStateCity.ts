import {useEffect, useState} from 'react';

type GeoModule = typeof import('country-state-city');

/**
 * Lazy-loads `country-state-city` (large dataset) only when this hook mounts.
 */
export function useCountryStateCity(): {
  geo: GeoModule | null;
  loading: boolean;
} {
  const [geo, setGeo] = useState<GeoModule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void import('country-state-city').then((m) => {
      if (!cancelled) {
        setGeo(m);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {geo, loading};
}
