import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScrollView, AppText, ScreenContainer, StateView } from '../../../components/common';
import type { RootStackParamList } from '../../../navigation/types';
import { courseApi, type PublishedLessonContent } from '../api/courseApi';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonContent'>;

export function LessonContentScreen({ route }: Props) {
  const [lesson, setLesson] = useState<PublishedLessonContent | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); setError(null); setLesson(await courseApi.getLessonContent(route.params.lessonId)); } catch (cause) { setError(cause); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [route.params.lessonId]);
  return <ScreenContainer testID="lesson-content-screen"><AppScrollView contentContainerStyle={styles.content}>
    {loading ? <StateView kind="loading" /> : error ? <StateView kind="error" error={error} onRetry={() => void load()} /> : !lesson ? <StateView kind="empty" /> : lesson.sections.map((section) => <View key={`${section.position}-${section.type}`} style={styles.section}>
      <AppText variant="h4" bold colorVariant="primary">{section.title ?? section.type}</AppText>
      {section.description ? <AppText variant="body" colorVariant="secondary">{section.description}</AppText> : null}
      {section.items.map((item) => <AppText key={`${item.position}-${item.revisionId}`} variant="bodySmall" colorVariant="secondary">{item.position}. {item.type}</AppText>)}
    </View>)}
  </AppScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { padding: 20, gap: 14 }, section: { padding: 14, gap: 8, borderRadius: 14, backgroundColor: '#FFFFFF' } });
