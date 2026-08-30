import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { AuthProvider } from '../src/auth/context/AuthProvider';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';
import { LanguageSettingScreen } from '../src/screens/settings/LanguageSettingScreen';
import { ThemeScreen } from '../src/screens/settings/ThemeScreen';
import { createInMemoryPreferencesStorage } from '../src/storage/preferencesStorage';
import { createTokenStore } from '../src/auth/storage/tokenStore';
import { createInMemorySecureStorage } from '../src/storage/secureStorage';
import { THEME_PRESETS } from '../src/theme/presets';

const prefs = createInMemoryPreferencesStorage();
const tokenStore = createTokenStore(createInMemorySecureStorage());

type NavKey = 'Settings' | 'Theme' | 'LanguageSetting';
function makeNavigation() {
  const calls: { screen: NavKey; params?: unknown }[] = [];
  const navigation = {
    navigate: (screen: NavKey, params?: unknown) => {
      calls.push({ screen, params });
    },
    goBack: () => {
      calls.push({ screen: 'Settings' });
    },
  } as unknown as import('@react-navigation/native-stack').NativeStackNavigationProp<
    import('../src/navigation/types').RootStackParamList
  >;
  return { calls, navigation };
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storage={prefs} initialThemeId={null}>
      <I18nProvider>
        <AuthProvider tokenStore={tokenStore}>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('MOB-F20 reuse migration chain (theme -> shared components -> settings screens)', () => {
  it('renders the reused SettingsScreen on the new Expo 57 runtime', async () => {
    const { navigation, calls } = makeNavigation();
    await render(
      <Providers>
        <SettingsScreen navigation={navigation} />
      </Providers>,
    );
    await act(async () => {});

    // Reused shared components (AppText / AppScrollView / ScreenContainer) render.
    expect(screen.getByTestId('settings-title')).toBeOnTheScreen();

    // Reused navigation contract: rows navigate via typed root params.
    fireEvent.press(screen.getByTestId('settings-theme'));
    expect(calls.some((c) => c.screen === 'Theme')).toBe(true);
  });

  it('renders the migrated language selection screen', async () => {
    const { navigation } = makeNavigation();
    await render(
      <Providers>
        <LanguageSettingScreen navigation={navigation} />
      </Providers>,
    );
    await act(async () => {});
    expect(screen.getByTestId('language-title')).toBeOnTheScreen();
  });

  it('renders the migrated theme screen and persists a palette choice', async () => {
    const { navigation } = makeNavigation();
    await render(
      <Providers>
        <ThemeScreen navigation={navigation} />
      </Providers>,
    );
    await act(async () => {});
    expect(screen.getByTestId('theme-screen')).toBeOnTheScreen();

    // Press the second theme option rendered by the migrated screen; the
    // choice must land in the preferences layer (theme persistence).
    const target = THEME_PRESETS[1]!.id;
    fireEvent.press(screen.getByTestId(`theme-option-${target}`));
    await act(async () => {});
    expect(await prefs.getString('zhlao.preferences.theme_id')).toBe(target);
  });
});
