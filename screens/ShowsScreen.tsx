import { StyleSheet, Text, View, SectionList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ScreenHeader from '../components/ScreenHeader';
import ParkPicker from '../components/ParkPicker';
import { useSelectedPark } from '../context/ParkContext';
import { useLiveData } from '../hooks/useLiveData';
import { LiveDataEntry } from '../lib/themeparksApi';

const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

type Category = 'Parades' | 'Special Events' | 'Shows';

// themeparks.wiki doesn't give us an explicit category, so this infers one from
// the entity name. Ticketed hard-ticket events (Halloween/Christmas parties, etc.)
// consistently append " at <Party Name>" to the entity name.
function categorize(name: string): Category {
  const lower = name.toLowerCase();
  if (lower.includes('parade') || lower.includes('cavalcade')) return 'Parades';
  if (lower.includes('party') || lower.includes('not-so-scary') || lower.includes('very merr')) {
    return 'Special Events';
  }
  return 'Shows';
}

export default function ShowsScreen() {
  const { selectedPark } = useSelectedPark();
  const { data, loading, refreshing, error, refresh } = useLiveData(selectedPark);

  const shows = data.filter(
    (entry) => entry.entityType === 'SHOW' && (entry.showtimes?.length ?? 0) > 0
  );

  const categoryOrder: Category[] = ['Parades', 'Shows', 'Special Events'];
  const sections = categoryOrder
    .map((title) => ({
      title,
      data: shows
        .filter((entry) => categorize(entry.name) === title)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((section) => section.data.length > 0);

  const renderItem = ({ item }: { item: LiveDataEntry }) => {
    const times = (item.showtimes ?? [])
      .map((showtime) => new Date(showtime.startTime).toLocaleTimeString([], timeFormat))
      .join('  •  ');

    return (
      <View style={styles.showRow}>
        <Text style={styles.showName}>{item.name}</Text>
        <Text style={styles.showtimesText}>{times || 'Times TBD'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScreenHeader title={selectedPark.name} subtitle="Shows, parades & special events" />
      <ParkPicker />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4B2E83" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nothing scheduled right now.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
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
  list: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F3A93',
    marginBottom: 8,
    marginTop: 8,
  },
  showRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
  },
  showName: {
    fontSize: 16,
    fontWeight: '500',
  },
  showtimesText: {
    color: '#4B2E83', // Deep Purple
    fontWeight: '600',
    fontSize: 13,
    marginTop: 6,
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
  emptyText: {
    color: '#6B6B7B',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
