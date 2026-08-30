/**
 * i18n capability — REUSE from the legacy product.
 *
 * The Foundation keeps the internationalisation mechanism and the existing
 * copy. It does NOT extend the business copy set: Foundation screens use the
 * existing `common` / `settings` / `theme` / `languageSetting` sections plus
 * literal fallback strings for new neutral screens.
 */

import { createContext, useContext } from 'react';

import { PREFERENCE_KEYS, preferencesStorage } from '../storage';

import { lo } from './locales/lo';
import { zh } from './locales/zh';

export type LanguageCode = 'zh' | 'lo';

export type TranslationSchema = typeof zh;

export const translations: Record<LanguageCode, TranslationSchema> = {
  zh,
  lo,
};

export interface LanguageProfile {
  readonly nativeLanguage: LanguageCode;
  readonly learningLanguage: LanguageCode;
  readonly interfaceLanguage: LanguageCode;
}

export const DEFAULT_LANGUAGE_PROFILE: LanguageProfile = {
  nativeLanguage: 'zh',
  learningLanguage: 'lo',
  interfaceLanguage: 'zh',
};

/**
 * Learning and interface languages are mutually derived: a learner studying Lao
 * uses a Chinese interface, and vice versa.
 */
export function deriveProfile(learningLanguage: LanguageCode): LanguageProfile {
  const learning: LanguageCode = learningLanguage === 'lo' ? 'lo' : 'zh';
  return {
    learningLanguage: learning,
    interfaceLanguage: learning === 'lo' ? 'zh' : 'lo',
    nativeLanguage: learning === 'lo' ? 'zh' : 'lo',
  };
}

export function normalizeLanguageCode(value: unknown): LanguageCode | null {
  if (value === 'zh' || value === 'lo') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === 'zh' || lowered === 'zh-cn' || lowered === 'chinese') {
      return 'zh';
    }
    if (lowered === 'lo' || lowered === 'lao' || lowered === 'lo-la') {
      return 'lo';
    }
  }
  return null;
}

export interface I18nContextValue {
  readonly t: TranslationSchema;
  readonly lang: LanguageCode;
  readonly profile: LanguageProfile;
  readonly learningLanguage: LanguageCode;
  readonly interfaceLanguage: LanguageCode;
  readonly isHydrated: boolean;
  readonly setLearningLanguage: (language: LanguageCode) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside <I18nProvider>.');
  }
  return context;
}

/** Interpolates `{name}` placeholders in a translation template. */
export function fmt(
  template: string,
  params: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));
}

export { PREFERENCE_KEYS, preferencesStorage };
