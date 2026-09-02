import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../../components/common/AppText';
import { LaoText } from '../../../components/common/LaoText';
import type { PublishedCharacter } from '../api/alphabetApi';

interface Props {
  character: PublishedCharacter;
  onPressAudio?: (char: PublishedCharacter) => void;
}

export const CharacterCard: React.FC<Props> = ({ character, onPressAudio }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPressAudio?.(character)}
    >
      <View style={styles.charContainer}>
        <LaoText style={styles.character}>{character.unicodeChar}</LaoText>
      </View>
      <View style={styles.infoContainer}>
        <AppText style={styles.ipa}>{character.ipaPhonetic}</AppText>
        <AppText style={styles.name}>{character.name || character.subtype}</AppText>
      </View>
      {!character.noAudio && (
        <View style={styles.audioBadge}>
          <AppText style={styles.audioText}>🔊</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  charContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  character: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  ipa: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  name: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  audioBadge: {
    padding: 6,
  },
  audioText: {
    fontSize: 16,
  },
});
