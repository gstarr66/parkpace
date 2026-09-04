// Minimal shapes of what we actually use from the themeparks.wiki API.
// The real payloads have more fields — expand these as we build more features.

export type LiveDataEntry = {
  id: string;
  name: string;
  entityType: string;
  status?: string;
  queue?: {
    STANDBY?: {
      waitTime?: number | null;
    };
  };
  showtimes?: {
    startTime: string;
    endTime: string;
  }[];
  lastUpdated?: string;
};

type LiveDataResponse = {
  liveData: LiveDataEntry[];
};

export type ScheduleEntry = {
  date: string;
  type: string;
  openingTime: string;
  closingTime: string;
  description?: string;
};

type ScheduleResponse = {
  schedule: ScheduleEntry[];
};

export async function fetchLiveData(parkId: string): Promise<LiveDataEntry[]> {
  const response = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data: LiveDataResponse = await response.json();
  return data.liveData ?? [];
}

export async function fetchSchedule(parkId: string): Promise<ScheduleEntry[]> {
  const response = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data: ScheduleResponse = await response.json();
  return data.schedule ?? [];
}

// Finds the soonest OPERATING entry that hasn't closed yet — avoids matching
// "today" by calendar date, which can be wrong near midnight in the park's
// own timezone vs. the device's.
export function getCurrentOrNextOperatingHours(schedule: ScheduleEntry[]): ScheduleEntry | null {
  const now = Date.now();
  const upcoming = schedule
    .filter((entry) => entry.type === 'OPERATING' && new Date(entry.closingTime).getTime() > now)
    .sort((a, b) => new Date(a.openingTime).getTime() - new Date(b.openingTime).getTime());
  return upcoming[0] ?? null;
}
