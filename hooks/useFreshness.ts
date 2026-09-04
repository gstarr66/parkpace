import { useEffect, useState } from 'react';
import { LiveDataEntry } from '../lib/themeparksApi';
import { formatRelativeTime } from '../lib/time';

const TICK_INTERVAL_MS = 60000;

// Label reflects when this dataset was last refreshed at the source, not when
// every individual entry updated — some attractions (closed/refurb rides)
// naturally go long stretches without a new reading.
export function useFreshness(entries: LiveDataEntry[]): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const timestamps = entries
    .map((entry) => entry.lastUpdated)
    .filter((value): value is string => !!value)
    .map((value) => new Date(value).getTime());

  if (timestamps.length === 0) return null;

  const freshest = new Date(Math.max(...timestamps)).toISOString();
  return formatRelativeTime(freshest, now);
}
