import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ParkProvider } from './context/ParkContext';
import { RootTabParamList } from './navigation/types';
import HomeScreen from './screens/HomeScreen';
import AttractionsScreen from './screens/AttractionsScreen';
import ShowsScreen from './screens/ShowsScreen';
import HoursScreen from './screens/HoursScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Attractions: 'trail-sign-outline',
  Shows: 'musical-notes-outline',
  Hours: 'calendar-outline',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ParkProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#1F3A93', // Royal Blue
              tabBarInactiveTintColor: '#9A9AA8',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
              ),
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Attractions" component={AttractionsScreen} />
            <Tab.Screen name="Shows" component={ShowsScreen} />
            <Tab.Screen name="Hours" component={HoursScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ParkProvider>
    </SafeAreaProvider>
  );
}
