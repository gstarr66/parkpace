import { useCallback, useEffect, useState } from 'react';
import { Park } from '../lib/parks';
import { ScheduleEntry, fetchSchedule } from '../lib/themeparksApi';

export function useSchedule(park: Park) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchSchedule(park.id);
      setSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong fetching park hours.');
    } finally {
      setLoading(false);
    }
  }, [park.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return { schedule, loading, error };
}
