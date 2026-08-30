import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheckBig, CircleAlert, Info, TriangleAlert } from 'lucide-react-native';
import { AppText } from '../common/AppText';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export interface ToastOptions {
  duration?: number; // 默认 2500ms
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  visible: boolean;
}

type Listener = () => void;

let listeners: Listener[] = [];
let toasts: ToastItem[] = [];

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return toasts;
}

function show(message: string, type: ToastType = 'info', opts: ToastOptions = {}) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const duration = opts.duration ?? 2500;
  const item: ToastItem = { id, message, type, visible: true };

  toasts = [item];
  emit();

  setTimeout(() => {
    hide(id);
  }, duration);
}

function hide(id: string) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, visible: false } : t));
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 250);
}

export const toast = {
  success: (msg: string, opts?: ToastOptions) => show(msg, 'success', opts),
  error: (msg: string, opts?: ToastOptions) => show(msg, 'error', opts),
  info: (msg: string, opts?: ToastOptions) => show(msg, 'info', opts),
  warn: (msg: string, opts?: ToastOptions) => show(msg, 'warn', opts),
};

const ICONS: Record<ToastType, any> = {
  success: CircleCheckBig,
  error: CircleAlert,
  info: Info,
  warn: TriangleAlert,
};

const ICON_COLORS: Record<ToastType, string> = {
  success: '#34C759',
  error: '#FF3B30',
  info: '#0F6FFF',
  warn: '#FF9500',
};

const ANIM_MS = 200;

export function ToastHost() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const insets = useSafeAreaInsets();

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { top: Math.max(insets.top, 16) + 8 }]}
      testID="toast-host"
    >
      {items.map((it) => (
        <ToastCard key={it.id} item={it} />
      ))}
    </View>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  // Lazily initialised animation value. `useState` is used instead of `useRef`
  // because the value is read during render.
  const [anim] = useState(() => new Animated.Value(0));
  const Icon = ICONS[item.type] || Info;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: item.visible ? 1 : 0,
      duration: ANIM_MS,
      useNativeDriver: true,
    }).start();
  }, [item.visible, anim]);

  return (
    <Animated.View
      pointerEvents={item.visible ? 'auto' : 'none'}
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
          ],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={() => hide(item.id)} style={styles.press}>
        <Icon size={17} color={ICON_COLORS[item.type]} />
        <AppText variant="bodySmall" colorVariant="white" medium numberOfLines={3}>
          {item.message}
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    maxWidth: '86%',
    minWidth: 120,
    backgroundColor: 'rgba(26,26,46,0.92)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  press: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
