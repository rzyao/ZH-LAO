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
      const symbols = items.filter((c) => c.classification === 'symbol');

      setSections([
        { title: '辅音 (Consonants) - 27 项', data: consonants },
        { title: '元音 (Vowels) - 30 项', data: vowels },
        { title: '符号与声调 (Symbols)', data: symbols },
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
          官方标准字典序，掌握 27 个辅音、30 个元音及正字法符号
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
