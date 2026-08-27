import { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ScreenHeader from '../components/ScreenHeader';
import { PARKS, Park } from '../lib/parks';
import { ScheduleEntry, fetchSchedule } from '../lib/themeparksApi';

const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
const DAYS_AHEAD = 30;

export default function HoursScreen() {
  const [schedulesByPark, setSchedulesByPark] = useState<Record<string, ScheduleEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setError(null);
        const results = await Promise.all(PARKS.map((park) => fetchSchedule(park.id)));
        if (cancelled) return;

        const map: Record<string, ScheduleEntry[]> = {};
        PARKS.forEach((park, index) => {
          map[park.id] = results[index];
        });
        setSchedulesByPark(map);

        const firstOperatingDate = results[0]?.find((entry) => entry.type === 'OPERATING')?.date;
        setSelectedDate(firstOperatingDate ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong fetching park hours.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const dates = useMemo(() => {
    const referenceSchedule = schedulesByPark[PARKS[0].id] ?? [];
    const uniqueDates = Array.from(
      new Set(
        referenceSchedule.filter((entry) => entry.type === 'OPERATING').map((entry) => entry.date)
      )
    ).sort();
    return uniqueDates.slice(0, DAYS_AHEAD);
  }, [schedulesByPark]);

  const hoursForPark = (park: Park, date: string | null) => {
    const schedule = schedulesByPark[park.id] ?? [];
    const operating = schedule.find((entry) => entry.date === date && entry.type === 'OPERATING');
    const earlyEntry = schedule.find(
      (entry) =>
        entry.date === date &&
        entry.type === 'TICKETED_EVENT' &&
        entry.description?.toLowerCase().includes('early entry')
    );
    return { operating, earlyEntry };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScreenHeader title="Park Hours" subtitle="Every park, day by day" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4B2E83" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={dates}
            keyExtractor={(date) => date}
            style={styles.dateStrip}
            contentContainerStyle={styles.dateStripContent}
            renderItem={({ item: date }) => {
              const isSelected = date === selectedDate;
              const dateObj = new Date(`${date}T12:00:00`);
              return (
                <TouchableOpacity
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.dateWeekday, isSelected && styles.dateTextSelected]}>
                    {dateObj.toLocaleDateString([], { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                    {dateObj.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {selectedDate && (
            <Text style={styles.selectedDateLabel}>
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}

          <FlatList
            data={PARKS}
            keyExtractor={(park) => park.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: park }) => {
              const { operating, earlyEntry } = hoursForPark(park, selectedDate);
              return (
                <View style={styles.parkRow}>
                  <View style={styles.parkBadge}>
                    <Text style={styles.parkBadgeText}>{park.shortName}</Text>
                  </View>
                  <View style={styles.parkInfo}>
                    <Text style={styles.parkName}>{park.name}</Text>
                    {operating ? (
                      <Text style={styles.parkHours}>
                        {new Date(operating.openingTime).toLocaleTimeString([], timeFormat)} –{' '}
                        {new Date(operating.closingTime).toLocaleTimeString([], timeFormat)}
                      </Text>
                    ) : (
                      <Text style={styles.parkClosed}>Closed</Text>
                    )}
                    {earlyEntry && (
                      <Text style={styles.parkEarlyEntry}>
                        Early Entry {new Date(earlyEntry.openingTime).toLocaleTimeString([], timeFormat)}{' '}
                        – {new Date(earlyEntry.closingTime).toLocaleTimeString([], timeFormat)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// Royal Blue, Gold, Deep Purple — per ParkPace's color scheme in Claude.md
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dateStrip: {
    flexGrow: 0,
    backgroundColor: '#F5F5F7',
  },
  dateStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateChip: {
    width: 56,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1F3A93',
  },
  dateChipSelected: {
    backgroundColor: '#1F3A93', // Royal Blue
  },
  dateWeekday: {
    fontSize: 12,
    color: '#1F3A93',
    fontWeight: '600',
  },
  dateDay: {
    fontSize: 18,
    color: '#1F3A93',
    fontWeight: '700',
    marginTop: 2,
  },
  dateTextSelected: {
    color: '#E4C567', // Gold
  },
  selectedDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  list: {
    padding: 16,
  },
  parkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
  },
  parkBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4B2E83', // Deep Purple
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parkBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  parkInfo: {
    flex: 1,
  },
  parkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  parkHours: {
    fontSize: 14,
    color: '#1F3A93',
    marginTop: 2,
  },
  parkClosed: {
    fontSize: 14,
    color: '#B00020',
    marginTop: 2,
  },
  parkEarlyEntry: {
    fontSize: 12,
    color: '#6B6B7B',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
