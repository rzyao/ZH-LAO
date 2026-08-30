/**
 * Navigation route contract.
 *
 * Rules:
 * - React Navigation 7 only; no Expo Router.
 * - Every route param is explicitly typed.
 * - Any identifier carried by a route is a public UUID string. Internal BIGINT
 *   database keys are never part of the navigation contract.
 */

export type TabParamList = {
  home: undefined;
  lab: undefined;
  settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Theme: undefined;
  LanguageSetting: undefined;
  LanguageSelect: { returnTo?: 'settings' | 'home' };

  /**
   * Neutral Foundation route demonstrating the UUID route contract.
   * The param is validated with `parseRouteId` and unknown ids fall back to
   * `NotFound` instead of rendering a broken screen.
   */
  ResourceDetail: { resourceId: string };

  NotFound: { path?: string };
};

declare global {
  namespace ReactNavigation {
    // React Navigation requires this global augmentation for typed navigation.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

export const TAB_ROUTE_NAMES = ['home', 'lab', 'settings'] as const;

export type TabRouteName = (typeof TAB_ROUTE_NAMES)[number];
