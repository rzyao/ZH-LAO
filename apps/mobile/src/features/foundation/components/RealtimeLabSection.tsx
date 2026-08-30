import { StyleSheet, View } from 'react-native';
import { Radio, Wifi, WifiOff } from 'lucide-react-native';

import { AppButton } from '../../../components/common/AppButton';
import { AppText } from '../../../components/common/AppText';
import { useRealtimeConnection } from '../../../realtime';
import { useTheme } from '../../../theme/ThemeProvider';

/**
 * Realtime foundation lab — connection lifecycle only.
 *
 * No chat protocol, no presence, no typing, no delivery semantics.
 */
export function RealtimeLabSection() {
  const { colors } = useTheme();
  const { state, isConfigured, connect, disconnect } = useRealtimeConnection();
  const Icon = state === 'open' ? Wifi : WifiOff;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}
      testID="realtime-lab"
    >
      <AppText variant="h4" colorVariant="primary" bold>
        Realtime（Skeleton）
      </AppText>

      <View style={styles.statusRow}>
        <Icon size={14} color={state === 'open' ? colors.success : colors.textHint} />
        <AppText variant="bodySmall" colorVariant="primary" medium testID="realtime-state">
          {state}
        </AppText>
      </View>

      <AppText variant="caption" colorVariant="secondary">
        {isConfigured
          ? 'RealtimeClient 已注册，仅用于连接生命周期验证。'
          : 'RealtimeClient 未注册：Foundation 只提供接口，协议由 Chat Domain 定义。'}
      </AppText>

      <View style={styles.actions}>
        <AppButton title="connect" onPress={() => void connect()} testID="realtime-connect" style={styles.action} />
        <AppButton
          title="disconnect"
          variant="secondary"
          onPress={() => void disconnect()}
          testID="realtime-disconnect"
          style={styles.action}
        />
      </View>

      <View style={styles.noteRow}>
        <Radio size={12} color={colors.textHint} />
        <AppText variant="caption" colorVariant="hint">
          connect / disconnect / subscribe / unsubscribe / send / connectionState
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    paddingHorizontal: 12,
    minHeight: 40,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
