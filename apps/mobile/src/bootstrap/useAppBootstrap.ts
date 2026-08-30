import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { readAppConfig, validateAppConfig, type ConfigIssue } from '../config/env';
import { setLogLevel } from '../utils/logger';

export interface AppBootstrapState {
  readonly isReady: boolean;
  readonly fontsLoaded: boolean;
  readonly fontError: Error | null;
  readonly configIssues: readonly ConfigIssue[];
}

/**
 * Application bootstrap.
 *
 * - validates configuration before anything is rendered;
 * - loads the Lao fonts and fails OPEN on error (never blocks the splash);
 * - releases the splash screen regardless of outcome.
 */
export function useAppBootstrap(): AppBootstrapState {
  const [fontsLoaded, fontError] = useFonts({
    'NotoSansLao-Regular': require('../../assets/fonts/NotoSansLao-Regular.ttf'),
    'NotoSansLao-Bold': require('../../assets/fonts/NotoSansLao-Bold.ttf'),
  });

  const [splashReleased, setSplashReleased] = useState(false);
  const config = readAppConfig();
  const configIssues = validateAppConfig(config);

  useEffect(() => {
    setLogLevel(config.logLevel);
  }, [config.logLevel]);

  useEffect(() => {
    // Fonts must never deadlock the app: hide the splash on success or failure.
    if (fontsLoaded || fontError) {
      const timer = setTimeout(() => {
        void SplashScreen.hideAsync().catch(() => {
          /* splash already hidden */
        });
        setSplashReleased(true);
      }, 120);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [fontsLoaded, fontError]);

  return {
    isReady: (fontsLoaded || Boolean(fontError)) && splashReleased,
    fontsLoaded,
    fontError,
    configIssues,
  };
}
