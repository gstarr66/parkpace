import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { PARKS } from '../lib/parks';
import { useSelectedPark } from '../context/ParkContext';

export default function ParkPicker() {
  const { selectedPark, setSelectedPark } = useSelectedPark();

  return (
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
  );
}

const styles = StyleSheet.create({
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
});
