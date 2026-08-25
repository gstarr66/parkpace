import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// Entity IDs on themeparks.wiki — these are stable, permanent IDs
type Park = {
  id: string;
  name: string;
  shortName: string;
};

const PARKS: Park[] = [
  { id: '75ea578a-adc8-4116-a54d-dccb60765ef9', name: 'Magic Kingdom', shortName: 'MK' },
  { id: '47f90d2c-e191-4239-a466-5892ef59a88b', name: 'EPCOT', shortName: 'EPCOT' },
  { id: '288747d1-8b4f-4a64-867e-ea7c9b27bad8', name: 'Hollywood Studios', shortName: 'HS' },
  { id: '1c84a229-8862-4648-9c71-378ddd2c7693', name: 'Animal Kingdom', shortName: 'AK' },
];

// Minimal shape of what we actually use from the API response.
// The real payload has more fields — we'll expand this as we build more features.
type LiveDataEntry = {
  id: string;
  name: string;
  entityType: string;
  status?: string;
  queue?: {
    STANDBY?: {
      waitTime?: number | null;
    };
  };
};

type LiveDataResponse = {
  liveData: LiveDataEntry[];
};

export default function App() {
  const [selectedPark, setSelectedPark] = useState<Park>(PARKS[0]);
  const [rides, setRides] = useState<LiveDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitTimes = useCallback(async (park: Park) => {
    try {
      setError(null);
      const response = await fetch(`https://api.themeparks.wiki/v1/entity/${park.id}/live`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data: LiveDataResponse = await response.json();

      // Keep only attractions that actually have a standby queue,
      // and sort alphabetically for now.
      const attractions = (data.liveData ?? [])
        .filter((entry) => entry.entityType === 'ATTRACTION')
        .sort((a, b) => a.name.localeCompare(b.name));

      setRides(attractions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong fetching wait times.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchWaitTimes(selectedPark);
  }, [selectedPark, fetchWaitTimes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWaitTimes(selectedPark);
  };

  const renderItem = ({ item }: { item: LiveDataEntry }) => {
    const waitTime = item.queue?.STANDBY?.waitTime;
    const isOpen = item.status === 'OPERATING';

    return (
      <View style={styles.row}>
        <Text style={styles.rideName}>{item.name}</Text>
        <View style={styles.waitBadge}>
          <Text style={styles.waitText}>
            {!isOpen ? 'Closed' : waitTime != null ? `${waitTime} min` : '—'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>{selectedPark.name}</Text>
        <Text style={styles.subtitle}>Live wait times</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.parkPicker}
        contentContainerStyle={styles.parkPickerContent}
      >
        {PARKS.map((park, index) => {
          const isSelected = park.id === selectedPark.id;
          return (
            <TouchableOpacity
              key={park.id}
              style={[
                styles.parkTab,
                index < PARKS.length - 1 && styles.parkTabSpacing,
                isSelected && styles.parkTabSelected,
              ]}
              onPress={() => setSelectedPark(park)}
            >
              <View collapsable={false}>
                <Text style={[styles.parkTabText, isSelected && styles.parkTabTextSelected]}>
                  {park.shortName}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4B2E83" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
  header: {
    backgroundColor: '#1F3A93', // Royal Blue
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#E4C567', // Gold
    fontSize: 14,
    marginTop: 2,
  },
  parkPicker: {
    flexGrow: 0,
    height: 96,
    backgroundColor: '#F5F5F7',
  },
  parkPickerContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  parkTab: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1F3A93',
  },
  parkTabSpacing: {
    marginRight: 8,
  },
  parkTabSelected: {
    backgroundColor: '#1F3A93', // Royal Blue
  },
  parkTabText: {
    color: '#1F3A93',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  parkTabTextSelected: {
    color: '#E4C567', // Gold
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
  },
  rideName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  waitBadge: {
    backgroundColor: '#4B2E83', // Deep Purple
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  waitText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
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
