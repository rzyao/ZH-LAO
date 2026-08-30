import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { PREFERENCE_KEYS, preferencesStorage } from '../storage';
import type { PreferencesStorage } from '../storage';

import {
  DEFAULT_LANGUAGE_PROFILE,
  I18nContext,
  deriveProfile,
  normalizeLanguageCode,
  translations,
} from './index';
import type {
  I18nContextValue,
  LanguageCode,
  LanguageProfile,
  TranslationSchema,
} from './index';
import { zh } from './locales/zh';

export interface I18nProviderProps {
  readonly children: React.ReactNode;
  /** Storage override used by tests. */
  readonly storage?: Pick<PreferencesStorage, 'getString' | 'setString'>;
  /** Pre-resolved profile; skips async hydration when provided. */
  readonly initialProfile?: LanguageProfile | null;
}

export function I18nProvider({
  children,
  storage = preferencesStorage,
  initialProfile,
}: I18nProviderProps) {
  const [profile, setProfile] = useState<LanguageProfile>(
    initialProfile ?? DEFAULT_LANGUAGE_PROFILE,
  );
  const [isHydrated, setIsHydrated] = useState<boolean>(initialProfile !== undefined);

  useEffect(() => {
    if (initialProfile !== undefined) {
      return;
    }
    let cancelled = false;
    void storage.getString(PREFERENCE_KEYS.learningLanguage).then((stored) => {
      if (cancelled) {
        return;
      }
      const normalized = normalizeLanguageCode(stored);
      if (normalized) {
        setProfile(deriveProfile(normalized));
      }
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initialProfile, storage]);

  const setLearningLanguage = useCallback(
    (language: LanguageCode) => {
      const next = deriveProfile(language);
      setProfile(next);
      void storage.setString(PREFERENCE_KEYS.learningLanguage, next.learningLanguage);
      void storage.setString(PREFERENCE_KEYS.interfaceLanguage, next.interfaceLanguage);
    },
    [storage],
  );

  const value = useMemo<I18nContextValue>(() => {
    const t: TranslationSchema = translations[profile.interfaceLanguage] ?? zh;
    return {
      t,
      lang: profile.interfaceLanguage,
      profile,
      learningLanguage: profile.learningLanguage,
      interfaceLanguage: profile.interfaceLanguage,
      isHydrated,
      setLearningLanguage,
    };
  }, [profile, isHydrated, setLearningLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { useI18n, fmt } from './index';
export type { LanguageCode, LanguageProfile, TranslationSchema } from './index';
