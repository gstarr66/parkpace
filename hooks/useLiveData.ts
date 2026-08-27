import { useCallback, useEffect, useState } from 'react';
import { Park } from '../lib/parks';
import { LiveDataEntry, fetchLiveData } from '../lib/themeparksApi';

export function useLiveData(park: Park) {
  const [data, setData] = useState<LiveDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh: boolean) => {
      try {
        setError(null);
        const liveData = await fetchLiveData(park.id);
        setData(liveData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong fetching park data.');
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [park.id]
  );

  useEffect(() => {
    setLoading(true);
    load(false);
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh };
}
