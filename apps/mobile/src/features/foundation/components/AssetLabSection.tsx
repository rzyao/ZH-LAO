import { StyleSheet, View } from 'react-native';
import { FileUp, Upload } from 'lucide-react-native';

import { AppButton } from '../../../components/common/AppButton';
import { AppText } from '../../../components/common/AppText';
import { useAssetUpload } from '../../../assets';
import { formatDate } from '../../../api/contracts/time';
import { useTheme } from '../../../theme/ThemeProvider';

/**
 * Asset foundation lab.
 *
 * Demonstrates file selection, progress tracking and cancellation. The upload
 * transport is intentionally unregistered: the Foundation must not call an
 * endpoint that has not been frozen.
 */
export function AssetLabSection() {
  const { colors } = useTheme();
  const upload = useAssetUpload();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}
      testID="asset-lab"
    >
      <AppText variant="h4" colorVariant="primary" bold>
        Asset（expo-image + expo-file-system）
      </AppText>

      <AppText variant="caption" colorVariant="secondary">
        {`Upload transport configured: ${upload.isConfigured ? 'yes' : 'no (Foundation skeleton)'}`}
      </AppText>

      {upload.selectedFile ? (
        <View style={styles.fileBox} testID="asset-selected-file">
          <View style={styles.noteRow}>
            <FileUp size={12} color={colors.textHint} />
            <AppText variant="caption" colorVariant="primary">
              {upload.selectedFile.name ?? upload.selectedFile.uri.split('/').pop()}
            </AppText>
          </View>
          <AppText variant="caption" colorVariant="hint">
            {`${upload.selectedFile.mimeType ?? 'unknown'} · ${
              upload.selectedFile.sizeBytes ?? 0
            } bytes`}
          </AppText>
        </View>
      ) : null}

      <View style={styles.progressRow}>
        <AppText variant="caption" colorVariant="secondary">
          {`State: ${upload.state}`}
        </AppText>
        <AppText variant="caption" colorVariant="secondary" testID="asset-progress">
          {`${Math.round(upload.progress.ratio * 100)}%`}
        </AppText>
      </View>

      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: `${Math.round(upload.progress.ratio * 100)}%`, backgroundColor: colors.accent }]}
        />
      </View>

      {upload.error ? (
        <AppText variant="caption" colorVariant="error" testID="asset-error">
          {upload.error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="选择文件" onPress={() => void upload.selectFile()} testID="asset-select" style={styles.action} />
        <AppButton
          title="上传（骨架）"
          variant="secondary"
          onPress={() => void upload.start()}
          disabled={!upload.selectedFile}
          testID="asset-upload"
          style={styles.action}
        />
        <AppButton title="取消" variant="ghost" onPress={upload.cancel} testID="asset-cancel" style={styles.action} />
      </View>

      <View style={styles.noteRow}>
        <Upload size={12} color={colors.textHint} />
        <AppText variant="caption" colorVariant="hint">
          {`上传契约冻结前不会调用任何 Endpoint · ${formatDate(new Date().toISOString(), { timeZone: 'utc' })}`}
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
  fileBox: {
    gap: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
