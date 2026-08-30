import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * Deep-link mapping.
 *
 * Only neutral Foundation routes are declared. Domain routes are added by
 * their owning Domain phase together with their frozen contracts.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['zhlao://', 'https://zhlao.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          home: 'home',
          lab: 'lab',
          settings: 'settings',
        },
      },
      Theme: 'settings/theme',
      LanguageSetting: 'settings/language',
      LanguageSelect: 'settings/language/select',
      // UUID-compatible path segment.
      ResourceDetail: 'resource/:resourceId',
      NotFound: '*',
    },
  },
};
