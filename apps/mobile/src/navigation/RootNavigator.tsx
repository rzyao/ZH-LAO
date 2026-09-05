import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ResourceDetailScreen } from '../screens/ResourceDetailScreen';
import { NotFoundScreen } from '../screens/NotFoundScreen';
import { ThemeScreen } from '../screens/settings/ThemeScreen';
import { LanguageSettingScreen } from '../screens/settings/LanguageSettingScreen';
import { LanguageSelectScreen } from '../screens/settings/LanguageSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { CourseCatalogScreen } from '../features/courses/screens/CourseCatalogScreen';
import { CourseStructureScreen } from '../features/courses/screens/CourseStructureScreen';
import { LessonContentScreen } from '../features/courses/screens/LessonContentScreen';
import { useTheme } from '../theme/ThemeProvider';

import { linking } from './linking';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export interface RootNavigatorProps {
  /** Receives the initial navigation state; used by tests and error recovery. */
  readonly onReady?: () => void;
}

/**
 * Root navigator.
 *
 * React Navigation 7 only. Route params are typed (see `navigation/types`) and
 * carry public UUID strings, never internal database keys.
 */
export function RootNavigator({ onReady }: RootNavigatorProps) {
  const { colors } = useTheme();

  return (
    <NavigationContainer linking={linking} onReady={onReady}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Theme" component={ThemeScreen} />
        <Stack.Screen name="LanguageSetting" component={LanguageSettingScreen} />
        <Stack.Screen
          name="LanguageSelect"
          component={LanguageSelectScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
        <Stack.Screen name="CourseCatalog" component={CourseCatalogScreen} />
        <Stack.Screen name="CourseStructure" component={CourseStructureScreen} />
        <Stack.Screen name="LessonContent" component={LessonContentScreen} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
