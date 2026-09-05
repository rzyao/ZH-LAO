import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppScrollView, AppText, ScreenContainer, StateView } from '../../../components/common';
import type { RootStackParamList } from '../../../navigation/types';
import { courseApi, type PublishedCourseCatalogItem } from '../api/courseApi';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseCatalog'>;

export function CourseCatalogScreen({ navigation }: Props) {
  const [items, setItems] = useState<PublishedCourseCatalogItem[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await courseApi.getCatalog());
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  return (
    <ScreenContainer testID="course-catalog-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" bold colorVariant="primary">课程</AppText>
        <AppText variant="bodySmall" colorVariant="secondary">仅显示已发布的稳定课程版本。</AppText>
        {loading ? <StateView kind="loading" /> : error ? <StateView kind="error" error={error} onRetry={() => void load()} /> : items.length === 0 ? <StateView kind="empty" title="暂无已发布课程" /> : (
          items.map((course) => (
            <View key={course.id} style={styles.card} testID={`course-card-${course.id}`}>
              <AppText variant="h4" bold colorVariant="primary">{course.title}</AppText>
              {course.subtitle ? <AppText variant="bodySmall" colorVariant="secondary">{course.subtitle}</AppText> : null}
              <AppButton title="查看课程" variant="secondary" onPress={() => navigation.navigate('CourseStructure', { courseId: course.id })} />
            </View>
          ))
        )}
      </AppScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { padding: 20, gap: 12 }, card: { padding: 16, gap: 8, borderRadius: 14, backgroundColor: '#FFFFFF' } });
