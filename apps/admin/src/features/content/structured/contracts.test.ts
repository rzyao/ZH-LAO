import { describe, expect, it } from 'vitest'
import { CONTENT_CATEGORY_CONFIGS } from './contracts'

describe('中老内容页面配置', () => {
  it('登记五个中文类别和四个老挝语类别，并使用不同接口路径', () => {
    const configs = Object.values(CONTENT_CATEGORY_CONFIGS)
    expect(configs.filter((item) => item.languageCode === 'zh')).toHaveLength(5)
    expect(configs.filter((item) => item.languageCode === 'lo')).toHaveLength(4)
    expect(new Set(configs.map((item) => item.apiPath)).size).toBe(9)
    expect(new Set(configs.map((item) => item.testId)).size).toBe(9)
  })

  it('页面组成链路与中文、老挝语权威层级一致', () => {
    expect(CONTENT_CATEGORY_CONFIGS.zh_syllable.dependencyType).toBe('zh_pinyin_element')
    expect(CONTENT_CATEGORY_CONFIGS.zh_hanzi.dependencyType).toBe('zh_syllable')
    expect(CONTENT_CATEGORY_CONFIGS.zh_word.dependencyType).toBe('zh_hanzi')
    expect(CONTENT_CATEGORY_CONFIGS.zh_sentence.dependencyType).toBe('zh_word')
    expect(CONTENT_CATEGORY_CONFIGS.lo_syllable.dependencyType).toBe('lo_letter')
    expect(CONTENT_CATEGORY_CONFIGS.lo_word.dependencyType).toBe('lo_syllable')
    expect(CONTENT_CATEGORY_CONFIGS.lo_sentence.dependencyType).toBe('lo_word')
  })
})
