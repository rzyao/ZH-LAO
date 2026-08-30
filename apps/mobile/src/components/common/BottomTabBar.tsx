import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlaskConical, House, Settings, Square } from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';

import { LaoText } from './LaoText';
import { AppText } from './AppText';

/**
 * Foundation tab icons.
 *
 * Only neutral Foundation tabs are declared here. Domain tabs (discover,
 * chats, translate, ...) are added by their owning Domain phase.
 */
const TAB_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  home: House,
  lab: FlaskConical,
  settings: Settings,
};

const FALLBACK_ICON = Square;

/** Neutral English fallbacks for tabs that have no translation entry yet. */
const TAB_LABEL_FALLBACK: Record<string, string> = {
  home: 'Home',
  lab: 'Lab',
  settings: 'Settings',
};

function resolveLabel(
  dictionary: Record<string, string> | undefined,
  routeName: string,
  optionsTitle: string | undefined,
): string {
  return dictionary?.[routeName] ?? optionsTitle ?? TAB_LABEL_FALLBACK[routeName] ?? routeName;
}

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, lang } = useI18n();

  const isInterfaceLao = lang === 'lo';

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}
      testID="bottom-tab-bar"
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.borderSoft },
        ]}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor?.options ?? {};
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[route.name] ?? FALLBACK_ICON;

          const label = resolveLabel(
            t.common?.tabs as unknown as Record<string, string> | undefined,
            route.name,
            options.title,
          );

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={`tab-${route.name}`}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tabItem, isFocused && { backgroundColor: colors.accent }]}
            >
              <Icon size={20} color={isFocused ? '#ffffff' : colors.textSecondary} />
              {isInterfaceLao ? (
                <LaoText
                  variant="micro"
                  bold={isFocused}
                  style={{ color: isFocused ? '#ffffff' : colors.textSecondary }}
                >
                  {label}
                </LaoText>
              ) : (
                <AppText variant="micro" colorVariant={isFocused ? 'white' : 'secondary'} bold={isFocused}>
                  {label}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 36,
    padding: 4,
    borderWidth: 1,
    elevation: 8,
    shadowColor: 'rgba(102, 51, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 26,
    gap: 4,
  },
});
