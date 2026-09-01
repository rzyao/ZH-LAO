import { defineConfig } from 'vitepress'
import featurePageIndex from '../development/workflow/FEATURE_PAGE_INDEX.json'

const domainTitleMap: Record<string, string> = {
  foundation: '应用与基础（Foundation）',
  identity: '身份（Identity）',
  content: '内容（Content）',
  learning: '学习（Learning）',
  audio: '音频（Audio）',
  social: '社交（Social）',
  chat: '聊天（Chat）',
  commerce: '商业（Commerce）',
  rewards: '奖励（Rewards）',
  trust: '信任与安全（Trust & Safety）',
  operations: '运营（Operations）',
  platform: '平台（Platform）'
}

const featureGroups = [...new Set(featurePageIndex.features.map((feature) => feature.domain[0] ?? 'foundation'))]

const guideSidebar = [
  {
    text: '使用指南',
    items: [
      { text: '阅读与维护文档', link: '/guide/getting-started' },
      { text: '常见问题', link: '/guide/faq' }
    ]
  }
]

const productSidebar = [
  {
    text: '产品',
    items: [
      { text: '产品定位与范围', link: '/product/product-overview' },
      { text: '业务与商业模型', link: '/product/business-model' },
      { text: '功能开放与规则', link: '/product/feature-rollout' }
    ]
  }
]

const architectureSidebar = [
  {
    text: '架构总览',
    items: [{ text: '总体架构', link: '/architecture/' }]
  },
  {
    text: '领域架构',
    items: [
      { text: '领域边界', link: '/architecture/domains/' },
      { text: '领域依赖与协作', link: '/architecture/domains/dependencies' }
    ]
  },
  {
    text: '应用架构',
    items: [
      { text: '后端架构', link: '/architecture/applications/backend' },
      { text: '客户端架构', link: '/architecture/applications/clients' },
      { text: '全局 API 规范', link: '/architecture/applications/api-standard' }
    ]
  },
  {
    text: '基础设施',
    items: [
      { text: '基础设施与集成', link: '/architecture/infrastructure/' },
      { text: '安全与权限', link: '/architecture/infrastructure/security' }
    ]
  },
  {
    text: '数据架构',
    items: [{ text: 'PostgreSQL 架构规范', link: '/architecture/data/postgresql' }]
  }
]

const featuresSidebar = [
  {
    text: '功能交付',
    items: [
      { text: '功能总览', link: '/features/' },
      { text: '功能文档规范', link: '/features/FEATURE_DOCUMENT_STANDARD' },
      { text: 'Feature Page 模板', link: '/features/_template' },
      { text: '领域与功能关系', link: '/domains/FEATURE_RELATIONSHIP_MODEL' }
    ]
  },
  {
    text: '功能目录',
    items: featureGroups.map((domain) => ({
      text: domainTitleMap[domain] ?? domain,
      collapsed: true,
      items: featurePageIndex.features
        .filter((feature) => (feature.domain[0] ?? 'foundation') === domain)
        .map((feature) => ({ text: feature.title, link: `/features/${feature.id}/` }))
    }))
  }
]

const developmentSidebar = [
  {
    text: '开发总览',
    items: [
      { text: '开发入口', link: '/development/' },
      { text: '开发流程控制中心', link: '/development/DEVELOPMENT_CONTROL_CENTER' },
      { text: '开发进度', link: '/development/DEVELOPMENT_PROGRESS' }
    ]
  },
  {
    text: '开发规范',
    collapsed: true,
    items: [
      { text: '可执行规格系统', link: '/development/SPEC_SYSTEM' },
      { text: '实现蓝图模板', link: '/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE' },
      { text: 'AI 多会话工作流', link: '/development/workflow/' },
      { text: '任务清单规范', link: '/development/workflow/TASK_MANIFEST_SCHEMA' },
      { text: '文档系统规范', link: '/governance/DOMAIN_DOCUMENT_STANDARD' }
    ]
  },
  {
    text: '后端开发',
    collapsed: true,
    items: [
      { text: '后端入口', link: '/development/backend/' },
      { text: '应用基础', link: '/development/backend/foundation/' },
      { text: '身份', link: '/development/backend/identity/' },
      { text: '平台', link: '/development/backend/platform/' },
      { text: '运营', link: '/development/backend/operations/' },
      { text: '内容', link: '/development/backend/content/' },
      { text: '学习', link: '/development/backend/learning/' },
      { text: '音频', link: '/development/backend/audio/' }
    ]
  },
  {
    text: '后台开发',
    collapsed: true,
    items: [
      { text: '后台入口', link: '/development/admin/' },
      { text: '后台基础', link: '/development/admin/foundation/' },
      { text: '权限与操作员', link: '/development/admin/access-control/' },
      { text: '平台控制', link: '/development/admin/platform-control/' },
      { text: '内容管理', link: '/development/admin/content-management/' },
      { text: '音频生产工作台', link: '/development/admin/audio-production/' }
    ]
  },
  {
    text: '移动端开发',
    collapsed: true,
    items: [
      { text: '移动端入口', link: '/development/mobile/' },
      { text: '移动端基础', link: '/development/mobile/foundation/' },
      { text: '登录与认证', link: '/development/mobile/auth/' }
    ]
  }
]

const domainsSidebar = [
  {
    text: '领域设计',
    items: [
      { text: '领域总览', link: '/domains/' },
      { text: '领域与功能关系', link: '/domains/FEATURE_RELATIONSHIP_MODEL' },
      { text: '文档系统规范', link: '/governance/DOMAIN_DOCUMENT_STANDARD' }
    ]
  },
  {
    text: '身份（Identity）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/identity/' },
      { text: '业务流程', link: '/domains/identity/flows' },
      { text: '领域模型', link: '/domains/identity/model' },
      { text: '数据设计', link: '/domains/identity/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '登录与会话', link: '/features/login/' }]
      }
    ]
  },
  {
    text: '内容（Content）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/content/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '知识内容', link: '/domains/content/knowledge' },
          { text: '课程体系', link: '/domains/content/curriculum' },
          { text: '词典', link: '/domains/content/dictionary' },
          { text: '练习', link: '/domains/content/practice' }
        ]
      },
      { text: '数据设计', link: '/domains/content/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '音频生产', link: '/features/audio-production/' }]
      }
    ]
  },
  {
    text: '学习（Learning）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/learning/' },
      { text: '学习进度', link: '/domains/learning/progress' },
      { text: '领域模型', link: '/domains/learning/model' },
      { text: '数据设计', link: '/domains/learning/database' }
    ]
  },
  {
    text: '音频（Audio）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/audio/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '生产与审核', link: '/domains/audio/production' },
          { text: '工作流与状态机', link: '/domains/audio/lifecycle' }
        ]
      },
      { text: '契约与边界', link: '/domains/audio/contracts' },
      { text: '数据设计', link: '/domains/audio/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '音频生产', link: '/features/audio-production/' }]
      }
    ]
  },
  {
    text: '社交（Social）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/social/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '社交资料', link: '/domains/social/profile' },
          { text: '发现与关系', link: '/domains/social/discovery-and-relationships' },
          { text: '动态与举报入口', link: '/domains/social/community-content' }
        ]
      },
      { text: '数据设计', link: '/domains/social/database' }
    ]
  },
  {
    text: '聊天（Chat）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/chat/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '会话', link: '/domains/chat/conversation' },
          { text: '消息', link: '/domains/chat/message' }
        ]
      },
      { text: '契约与事件', link: '/domains/chat/application-and-events' },
      { text: '数据设计', link: '/domains/chat/database' }
    ]
  },
  {
    text: '商业（Commerce）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/commerce/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '购买、支付与退款', link: '/domains/commerce/purchase-and-payment' },
          { text: '钱包与账本', link: '/domains/commerce/wallet' },
          { text: '礼物', link: '/domains/commerce/gifting' },
          { text: '工作流与状态机', link: '/domains/commerce/lifecycle' }
        ]
      },
      { text: '契约与边界', link: '/domains/commerce/contracts' },
      { text: '数据设计', link: '/domains/commerce/database' }
    ]
  },
  {
    text: '奖励（Rewards）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/rewards/' },
      { text: '契约与事件', link: '/domains/rewards/application-and-events' },
      { text: '数据设计', link: '/domains/rewards/database' }
    ]
  },
  {
    text: '信任与安全（Trust & Safety）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/trust/' },
      { text: '治理流程', link: '/domains/trust/moderation' },
      { text: '契约与边界', link: '/domains/trust/contracts' },
      { text: '数据设计', link: '/domains/trust/database' }
    ]
  },
  {
    text: '运营（Operations）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/operations/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: 'RBAC 与授权', link: '/domains/operations/rbac' },
          { text: '操作审计与 Bootstrap', link: '/domains/operations/audit' }
        ]
      },
      { text: '公共契约与集成', link: '/domains/operations/contracts' },
      { text: '数据设计', link: '/domains/operations/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '音频生产', link: '/features/audio-production/' }]
      }
    ]
  },
  {
    text: '平台（Platform）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/platform/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '运行时控制', link: '/domains/platform/runtime-control' },
          { text: '客户端治理', link: '/domains/platform/client-governance' }
        ]
      },
      { text: '边界与职责', link: '/domains/platform/boundaries' },
      { text: '数据设计', link: '/domains/platform/database' }
    ]
  }
]

const governanceSidebar = [
  {
    text: '设计治理',
    items: [
      { text: '文档系统规范', link: '/governance/DOMAIN_DOCUMENT_STANDARD' },
      { text: '设计决策台账', link: '/governance/design-register' },
      { text: '未决事项', link: '/governance/open-questions' },
      { text: '来源覆盖清单', link: '/governance/source-coverage' }
    ]
  }
]

const adrSidebar = [
  {
    text: '架构决策记录',
    items: [
      { text: 'ADR 索引', link: '/adr/' },
      { text: '设计决策台账', link: '/governance/design-register' }
    ]
  }
]

export default defineConfig({
  title: 'ZH-LAO 设计文档',
  description: '中老双语学习与跨语言社交应用设计文档系统',
  lang: 'zh-CN',
  base: '/',
  ignoreDeadLinks: false,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '产品', link: '/product/product-overview' },
      { text: '功能', link: '/features/' },
      { text: 'Mobile', link: '/mobile/' },
      { text: 'Admin', link: '/admin/' },
      { text: '领域', link: '/domains/' },
      { text: '架构', link: '/architecture/' },
      { text: '开发', link: '/development/' },
      { text: '治理', link: '/governance/design-register' },
      { text: 'ADR', link: '/adr/' }
    ],
    sidebar: {
      '/guide/': guideSidebar,
      '/product/': productSidebar,
      '/architecture/': architectureSidebar,
      '/domains/': domainsSidebar,
      '/features/': featuresSidebar,
      '/mobile/': [
        { text: 'Mobile', items: [{ text: '概览', link: '/mobile/' }, { text: '导航结构', link: '/mobile/navigation' }, { text: '页面清单', link: '/mobile/pages' }, { text: '页面文档规范', link: '/mobile/PAGE_STANDARD' }] },
        { text: '认证', items: [{ text: '登录页', link: '/mobile/login' }, { text: 'OTP 验证页', link: '/mobile/otp' }] }
      ],
      '/admin/': [
        { text: 'Admin', items: [{ text: '概览', link: '/admin/' }, { text: '设计系统与 UI 规范', link: '/admin/DESIGN_SYSTEM' }, { text: '导航结构', link: '/admin/navigation' }, { text: '页面清单', link: '/admin/pages' }, { text: '页面文档规范', link: '/admin/PAGE_STANDARD' }] },
        { text: '账号权限', items: [{ text: '操作员管理', link: '/admin/operators' }] },
        { text: '音频', items: [{ text: '音频生产工作台', link: '/admin/audio-production' }] }
      ],
      '/development/': developmentSidebar,
      '/governance/': governanceSidebar,
      '/adr/': adrSidebar
    },
    outline: { level: [2, 3], label: '页面导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    search: { provider: 'local' }
  }
})
