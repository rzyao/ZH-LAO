import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppScrollView, AppText, ScreenContainer, StateView } from '../../../components/common';
import type { RootStackParamList } from '../../../navigation/types';
import { courseApi, type PublishedCourseStructure } from '../api/courseApi';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseStructure'>;

export function CourseStructureScreen({ route, navigation }: Props) {
  const [structure, setStructure] = useState<PublishedCourseStructure | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); setError(null); setStructure(await courseApi.getStructure(route.params.courseId)); } catch (cause) { setError(cause); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [route.params.courseId]);
  return <ScreenContainer testID="course-structure-screen"><AppScrollView contentContainerStyle={styles.content}>
    {loading ? <StateView kind="loading" /> : error ? <StateView kind="error" error={error} onRetry={() => void load()} /> : !structure ? <StateView kind="empty" /> : <>
      <AppText variant="h2" bold colorVariant="primary">{structure.course.title}</AppText>
      {structure.units.map((unit) => <View key={`${unit.position}-${unit.title}`} style={styles.unit}>
        <AppText variant="h4" bold colorVariant="primary">{unit.position}. {unit.title}</AppText>
        {unit.description ? <AppText variant="bodySmall" colorVariant="secondary">{unit.description}</AppText> : null}
        {unit.lessons.map((lesson) => <AppButton key={lesson.id} title={`${lesson.position}. ${lesson.title}`} variant="secondary" onPress={() => navigation.navigate('LessonContent', { lessonId: lesson.id })} />)}
      </View>)}
    </>}
  </AppScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { padding: 20, gap: 14 }, unit: { padding: 14, gap: 8, borderRadius: 14, backgroundColor: '#FFFFFF' } });
