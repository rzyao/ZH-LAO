import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { BottomTabBar } from '../components/common/BottomTabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { LabScreen } from '../screens/LabScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Foundation tab navigator.
 *
 * Only neutral tabs ship with the Foundation. Domain tabs (discover, chats,
 * learn, profile, ...) are added by their owning Domain phase.
 */
export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="home" component={HomeScreen} options={{ title: '概览' }} />
      <Tab.Screen name="lab" component={LabScreen} options={{ title: '能力实验室' }} />
      <Tab.Screen name="settings" component={SettingsScreen} options={{ title: '设置' }} />
    </Tab.Navigator>
  );
}
