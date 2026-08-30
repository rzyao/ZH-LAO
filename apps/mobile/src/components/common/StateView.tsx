import { StyleSheet, View } from 'react-native';
import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react-native';

import { toUserMessage } from '../../api/errors/errors';
import { useTheme } from '../../theme/ThemeProvider';

import { AppText } from './AppText';

export interface StateViewProps {
  readonly kind: 'loading' | 'empty' | 'error';
  readonly title?: string;
  readonly description?: string;
  /** Original error; only its safe user message is rendered. */
  readonly error?: unknown;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly testID?: string;
}

/**
 * Unified loading / empty / error states.
 *
 * Error rendering always goes through `toUserMessage()`: backend stack traces
 * and internal diagnostics are never shown.
 */
export function StateView({
  kind,
  title,
  description,
  error,
  onRetry,
  retryLabel = '重试',
  testID,
}: StateViewProps) {
  const { colors } = useTheme();

  const resolved = {
    loading: {
      icon: LoaderCircle,
      title: title ?? '加载中…',
      description: description ?? '',
      color: colors.textSecondary,
    },
    empty: {
      icon: Inbox,
      title: title ?? '暂无内容',
      description: description ?? '',
      color: colors.textHint,
    },
    error: {
      icon: CircleAlert,
      title: title ?? '加载失败',
      description: description ?? (error !== undefined ? toUserMessage(error) : ''),
      color: colors.error,
    },
  }[kind];

  const Icon = resolved.icon;

  return (
    <View style={styles.container} testID={testID ?? `state-view-${kind}`}>
      <Icon size={28} color={resolved.color} />
      <AppText variant="h4" colorVariant="primary" bold center>
        {resolved.title}
      </AppText>
      {resolved.description ? (
        <AppText variant="bodySmall" colorVariant="secondary" center>
          {resolved.description}
        </AppText>
      ) : null}
      {kind === 'error' && onRetry ? (
        <View style={styles.retryWrap}>
          <AppText variant="body" colorVariant="accent" medium onPress={onRetry} testID="state-view-retry">
            {retryLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 8,
  },
  retryWrap: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
