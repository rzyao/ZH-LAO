import { Link } from '@tanstack/react-router'
import { BookA, FileText, Library, Languages } from 'lucide-react'
import { Card } from '@/components/common/card'
import { PageHeader } from '@/components/common/page-header'

const modules = [
  {
    href: '/content/letters',
    title: '老挝语字母管理 (Alphabet / LaoCharacter)',
    description: '管理 68 个老挝语基础字母、辅音、元音及符号分类、IPA 音标、发音槽位及审核发布。',
    icon: BookA,
  },
  {
    href: '/content/syllables',
    title: '音节管理 (Syllable / LaoSyllable)',
    description: '音节拼读结构、切分规则、字母组成链及 Rule 4404 严格保序校验。',
    icon: Languages,
  },
  {
    href: '/content/vocabulary',
    title: '词汇管理 (Vocabulary / VocabularyEntry)',
    description: '词汇条目、音节链组成、参考词典候选晋升及 SRS 生词管理。',
    icon: Library,
  },
  {
    href: '/content/sentences',
    title: '句子与例句管理 (Sentence / SentenceExample)',
    description: '空格分词、单词组成链、情景对话角色分配及每日推荐池。',
    icon: FileText,
  },
] as const

export function ContentLandingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="内容管理"
        description="老挝语与中文教学内容体系核心控制台。"
        breadcrumb={[{ label: '学习与内容' }, { label: '内容管理' }]}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link
              key={module.href}
              to={module.href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:bg-muted/40 p-4">
                <div className="flex gap-3">
                  <Icon aria-hidden className="mt-0.5 size-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-semibold">{module.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
