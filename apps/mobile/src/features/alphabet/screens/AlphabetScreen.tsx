import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { AppText } from '../../../components/common/AppText';
import { CharacterCard } from '../components/CharacterCard';
import { alphabetApi, type PublishedCharacter } from '../api/alphabetApi';
import { audioService } from '../../../audio/audioService';

export const AlphabetScreen: React.FC = () => {
  const [sections, setSections] = useState<{ title: string; data: PublishedCharacter[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlphabet();
  }, []);

  const loadAlphabet = async () => {
    try {
      setLoading(true);
      const items = await alphabetApi.getPublishedLetters();

      const consonants = items.filter((c) => c.classification === 'consonant');
      const vowels = items.filter((c) => c.classification === 'vowel');
      const toneMarks = items.filter((c) => c.classification === 'tone_mark');
      const others = items.filter((c) => c.classification === 'other');

      setSections([
        { title: `辅音 (Consonants) - ${consonants.length} 项`, data: consonants },
        { title: `元音 (Vowels) - ${vowels.length} 项`, data: vowels },
        { title: `声调符号 (Tone marks) - ${toneMarks.length} 项`, data: toneMarks },
        { title: `其他正字法标记 (Other) - ${others.length} 项`, data: others },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async (char: PublishedCharacter) => {
    if (char.audioUrl) {
      await audioService.play(char.audioUrl);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText style={styles.title}>老挝语字母表</AppText>
        <AppText style={styles.subtitle}>
          按分类与教学排序浏览辅音、元音、声调符号及其他正字法标记
        </AppText>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CharacterCard character={item} onPressAudio={handlePlayAudio} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>{title}</AppText>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  loader: {
    marginTop: 32,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
});
