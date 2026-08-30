import './global.css';

import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { useAppBootstrap } from './src/bootstrap/useAppBootstrap';
import { AppProviders } from './src/providers/AppProviders';
import { AppText } from './src/components/common/AppText';
import { ConfigErrorScreen } from './src/components/feedback/ConfigErrorScreen';

// Keep the splash visible until the bootstrap flow releases it. Any error path
// must still release it, otherwise the app deadlocks on the splash screen.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden */
});

export default function App() {
  const { isReady, configIssues } = useAppBootstrap();

  // A missing API base URL on a native platform is a hard configuration error:
  // failing clearly is required, silently guessing a host is forbidden.
  const fatalConfigError =
    configIssues.length > 0 && !process.env.EXPO_PUBLIC_API_URL
      ? configIssues.map((issue) => issue.message).join('; ')
      : null;

  if (fatalConfigError) {
    return <ConfigErrorScreen detail={fatalConfigError} />;
  }

  if (!isReady) {
    return (
      <View style={styles.loading} testID="app-bootstrapping">
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppProviders />
      <ConfigIssueBanner issues={configIssues} />
    </>
  );
}

function ConfigIssueBanner({ issues }: { readonly issues: readonly { message: string }[] }) {
  if (issues.length === 0) {
    return null;
  }
  return (
    <View style={styles.banner} testID="config-issue-banner" pointerEvents="none">
      <AppText variant="micro" colorVariant="error" center>
        {issues[0]?.message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,59,48,0.08)',
  },
});
