/**
 * Translation 能力 Port（WP-04）。
 *
 * 架构层：业务域 → TranslationPort → TranslationProvider（Adapter）→ 外部翻译服务。
 *
 * 设计裁决：Translation 是轻量云端能力，交互式翻译默认允许同步调用；
 * 批量翻译未来可以进入 Job，但禁止为了统一接口把 Translation 强制异步化。
 */
export type TranslationRequest = Readonly<{
  text: string;
  /** 目标语言（如 'zh' / 'lo'）。 */
  targetLanguage: string;
  /** 可选源语言；缺省由 Provider 自动检测（Provider 可能不支持检测）。 */
  sourceLanguage?: string;
}>;

export type TranslationResult = Readonly<{
  translatedText: string;
  /** Provider 返回的源语言检测结果（若支持）。 */
  detectedSourceLanguage?: string;
  /** 实际完成翻译的 Provider 名称（仅诊断/审计用，不用于业务分支）。 */
  provider: string;
}>;

/** 业务域依赖的最小契约：只暴露翻译能力，不暴露 Provider 身份。 */
export interface TranslationPort {
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

/** Provider Adapter 契约：在 Port 之上附加可诊断的 Provider 名称。 */
export interface TranslationProvider extends TranslationPort {
  readonly name: string;
}
