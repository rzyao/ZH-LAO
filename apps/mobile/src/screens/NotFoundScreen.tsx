import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateView } from '../components/common/StateView';
import type { RootStackParamList } from '../navigation/types';

export type NotFoundScreenProps = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

/** Invalid navigation / deep-link fallback. */
export function NotFoundScreen({ route, navigation }: NotFoundScreenProps) {
  return (
    <ScreenContainer muted testID="not-found-screen">
      <StateView
        kind="error"
        title="页面不存在"
        description={route.params?.path ? `无法解析路由：${route.params.path}` : '无法解析该路由。'}
        retryLabel="返回概览"
        onRetry={() => navigation.replace('MainTabs')}
        testID="not-found-state"
      />
    </ScreenContainer>
  );
}
