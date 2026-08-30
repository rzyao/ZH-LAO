import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import { parseRouteId } from '../api/contracts/uuid';
import { AppText } from '../components/common/AppText';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateView } from '../components/common/StateView';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';

export type ResourceDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ResourceDetail'>;

/**
 * Neutral route demonstrating the UUID navigation contract.
 *
 * Route params are untrusted input: an invalid UUID renders the error state
 * instead of a broken screen, and no internal BIGINT id is ever accepted.
 */
export function ResourceDetailScreen({ route, navigation }: ResourceDetailScreenProps) {
  const { colors } = useTheme();
  const resourceId = parseRouteId(route.params?.resourceId, 'resourceId');

  if (!resourceId) {
    return (
      <ScreenContainer muted testID="resource-detail-invalid">
        <StateView
          kind="error"
          title="无效的路由参数"
          description="Resource id 必须是 public UUID string；不接受内部 BIGINT 主键。"
          testID="resource-detail-error"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer muted testID="resource-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="返回"
          testID="resource-detail-back"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" colorVariant="primary" bold>
          UUID 路由示例
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText variant="bodySmall" colorVariant="secondary">
          Resolved public id
        </AppText>
        <AppText variant="h4" colorVariant="primary" bold testID="resource-detail-id">
          {resourceId}
        </AppText>
        <AppText variant="caption" colorVariant="hint">
          Route params are typed and validated with the UUID contract. Internal database keys are
          never part of the navigation contract.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    gap: 8,
  },
});
