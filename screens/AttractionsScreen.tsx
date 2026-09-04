import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ScreenHeader from '../components/ScreenHeader';
import ParkPicker from '../components/ParkPicker';
import { useSelectedPark } from '../context/ParkContext';
import { useLiveData } from '../hooks/useLiveData';
import { useFreshness } from '../hooks/useFreshness';
import { LiveDataEntry } from '../lib/themeparksApi';

export default function AttractionsScreen() {
  const { selectedPark } = useSelectedPark();
  const { data, loading, refreshing, error, refresh } = useLiveData(selectedPark);
  const freshness = useFreshness(data);

  const attractions = data
    .filter((entry) => entry.entityType === 'ATTRACTION')
    .sort((a, b) => a.name.localeCompare(b.name));

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScreenHeader title={selectedPark.name} subtitle="Live wait times" />
      <ParkPicker />

      {freshness && !loading && !error && (
        <Text style={styles.freshness}>Updated {freshness}</Text>
      )}

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
          data={attractions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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
  freshness: {
    fontSize: 12,
    color: '#8A8A99',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 10,
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
