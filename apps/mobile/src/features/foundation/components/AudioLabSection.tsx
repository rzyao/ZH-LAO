import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Mic, Pause, Play, Square, Volume2 } from 'lucide-react-native';

import { AppButton } from '../../../components/common/AppButton';
import { AppText } from '../../../components/common/AppText';
import { Waveform } from '../../../components/common/Waveform';
import { useAudioPlayback, useAudioRecording } from '../../../audio';
import { useTheme } from '../../../theme/ThemeProvider';

/**
 * Audio foundation lab.
 *
 * Validates load / play / pause / resume / seek / stop / release and the
 * permission -> prepare -> record -> stop -> cleanup recording path using
 * `expo-audio` only.
 */
export function AudioLabSection() {
  const { colors } = useTheme();
  const playback = useAudioPlayback();
  const recording = useAudioRecording();

  const hasRecording = Boolean(recording.uri);

  const handleStopRecording = async () => {
    const uri = await recording.stop();
    if (uri) {
      await playback.load(uri);
      playback.pause();
    }
  };

  return (
    <SectionCard title="Audio（expo-audio）" testID="audio-lab">
      <Row label="Permission" value={recording.permission} testID="audio-permission" />
      <Row label="Recording" value={recording.state} testID="audio-recording-state" />
      <Row
        label="Duration"
        value={`${Math.round(recording.durationMillis / 100) / 10}s`}
      />
      <Row label="Playback" value={playback.state} testID="audio-playback-state" />
      <Row label="Position" value={`${playback.currentTimeSeconds.toFixed(1)}s`} />
      <Row label="Duration" value={`${playback.durationSeconds.toFixed(1)}s`} />
      {playback.error || recording.error ? (
        <AppText variant="caption" colorVariant="error" testID="audio-error">
          {playback.error ?? recording.error}
        </AppText>
      ) : null}

      <Waveform isRecording={recording.state === 'recording'} metering={recording.metering} />

      <View style={styles.actions}>
        <AppButton
          title={recording.state === 'recording' ? '停止录音' : '开始录音'}
          onPress={() => {
            if (recording.state === 'recording') {
              void handleStopRecording();
            } else {
              void recording.record();
            }
          }}
          testID="audio-record"
          style={styles.actionButton}
        />
        {hasRecording ? (
          <AppButton
            title={playback.isPlaying ? '暂停' : '播放录音'}
            variant="secondary"
            onPress={() => (playback.isPlaying ? playback.pause() : playback.resume())}
            testID="audio-play"
            style={styles.actionButton}
          />
        ) : null}
        {hasRecording ? (
          <AppButton
            title="回到开头"
            variant="ghost"
            onPress={() => void playback.seek(0)}
            testID="audio-seek"
            style={styles.actionButton}
          />
        ) : null}
        {playback.state !== 'idle' ? (
          <AppButton
            title="释放播放器"
            variant="danger"
            onPress={playback.release}
            testID="audio-release"
            style={styles.actionButton}
          />
        ) : null}
      </View>

      <View style={styles.notes}>
        <Note icon={Mic} text="录音：permission → prepare → record → stop → cleanup" />
        <Note icon={Play} text="播放：load → play / pause / resume / seek / stop / release" />
        <Note icon={Pause} text="切后台自动暂停，卸载自动释放" />
        <Note icon={Square} text="统一由 src/audio 管理，禁止直接使用底层引擎" />
        <Note icon={Volume2} text={`录音支持：${recording.isSupported ? 'yes' : 'no'}（Web 为 graceful）`} />
      </View>
      <AppText variant="caption" colorVariant="hint">
        {`颜色来自当前主题 accent ${colors.accent}`}
      </AppText>
    </SectionCard>
  );
}

function SectionCard({
  title,
  children,
  testID,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}
      testID={testID}
    >
      <AppText variant="h4" colorVariant="primary" bold>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly testID?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" colorVariant="secondary">
        {label}
      </AppText>
      <AppText variant="caption" colorVariant="primary" medium testID={testID}>
        {value}
      </AppText>
    </View>
  );
}

function Note({
  icon: Icon,
  text,
}: {
  readonly icon: React.ComponentType<{ size?: number; color?: string }>;
  readonly text: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.note}>
      <Icon size={12} color={colors.textHint} />
      <AppText variant="caption" colorVariant="hint">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    minHeight: 40,
  },
  notes: {
    gap: 4,
    marginTop: 8,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
