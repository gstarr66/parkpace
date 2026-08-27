import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import ParkPicker from '../components/ParkPicker';
import { useSelectedPark } from '../context/ParkContext';
import { useSchedule } from '../hooks/useSchedule';
import { getCurrentOrNextOperatingHours } from '../lib/themeparksApi';
import { RootTabParamList } from '../navigation/types';

const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

type QuickLink = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tab: keyof RootTabParamList;
};

const QUICK_LINKS: QuickLink[] = [
  {
    key: 'attractions',
    label: 'Attractions',
    description: 'Live standby wait times',
    icon: 'trail-sign-outline',
    tab: 'Attractions',
  },
  {
    key: 'shows',
    label: 'Shows & Parades',
    description: 'Today’s stage shows, parades & fireworks',
    icon: 'musical-notes-outline',
    tab: 'Shows',
  },
  {
    key: 'special-events',
    label: 'Special Events',
    description: 'Ticketed parties & seasonal events',
    icon: 'sparkles-outline',
    tab: 'Shows',
  },
  {
    key: 'hours',
    label: 'Future Park Hours',
    description: 'Hours for every park, day by day',
    icon: 'calendar-outline',
    tab: 'Hours',
  },
];

export default function HomeScreen() {
  const { selectedPark } = useSelectedPark();
  const { schedule, loading, error } = useSchedule(selectedPark);
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  const hoursToday = getCurrentOrNextOperatingHours(schedule);
  const earlyEntryToday =
    hoursToday &&
    schedule.find(
      (entry) =>
        entry.date === hoursToday.date &&
        entry.type === 'TICKETED_EVENT' &&
        entry.description?.toLowerCase().includes('early entry')
    );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScreenHeader title="ParkPace" subtitle="Plan your day at Walt Disney World" />
      <ParkPicker />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.todayCard}>
          <Text style={styles.todayParkName}>{selectedPark.name}</Text>
          {loading ? (
            <ActivityIndicator color="#4B2E83" style={styles.todayLoading} />
          ) : error ? (
            <Text style={styles.todayError}>{error}</Text>
          ) : hoursToday ? (
            <>
              <Text style={styles.todayHours}>
                Open {new Date(hoursToday.openingTime).toLocaleTimeString([], timeFormat)} –{' '}
                {new Date(hoursToday.closingTime).toLocaleTimeString([], timeFormat)}
              </Text>
              {earlyEntryToday && (
                <Text style={styles.todayEarlyEntry}>
                  Early Entry {new Date(earlyEntryToday.openingTime).toLocaleTimeString([], timeFormat)}{' '}
                  – {new Date(earlyEntryToday.closingTime).toLocaleTimeString([], timeFormat)}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.todayHours}>No hours found for today</Text>
          )}
        </View>

        {QUICK_LINKS.map((link) => (
          <TouchableOpacity
            key={link.key}
            style={styles.linkCard}
            onPress={() => navigation.navigate(link.tab)}
          >
            <View style={styles.linkIcon}>
              <Ionicons name={link.icon} size={24} color="#1F3A93" />
            </View>
            <View style={styles.linkTextContainer}>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Text style={styles.linkDescription}>{link.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B5B5C3" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Royal Blue, Gold, Deep Purple — per ParkPace's color scheme in Claude.md
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  todayCard: {
    backgroundColor: '#1F3A93', // Royal Blue
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  todayParkName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  todayHours: {
    color: '#E4C567', // Gold
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  todayEarlyEntry: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
  },
  todayLoading: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  todayError: {
    color: '#FFB4B4',
    fontSize: 13,
    marginTop: 6,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDEBFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  linkDescription: {
    fontSize: 12,
    color: '#6B6B7B',
    marginTop: 2,
  },
});
