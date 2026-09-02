import { defineConfig } from 'vitepress'

const developerSidebar = [
  {
    text: '产品开发全景',
    items: [
      { text: '全景总入口', link: '/developer/' },
      { text: '产品画像', link: '/developer/product' },
      { text: '用户旅程', link: '/developer/journeys' },
      { text: '能力地图', link: '/developer/capabilities' },
      { text: '交付状态', link: '/developer/delivery-status' },
      { text: '系统地图', link: '/developer/system-map' },
      { text: '当前重点', link: '/developer/current-focus' }
    ]
  },
  {
    text: '参与开发',
    items: [
      { text: '开始参与开发', link: '/developer/getting-started' },
      { text: '开发者常见问题', link: '/developer/faq' },
      { text: '文档契约', link: '/developer/DOCUMENT_CONTRACT' }
    ]
  },
  {
    text: '功能目录',
    items: [
      { text: '全量功能目录', link: '/developer/features/' },
      { text: '用户登录与会话', link: '/developer/features/login' },
      { text: '老挝语字母管理', link: '/developer/features/lao-alphabet-management' }
    ]
  },
  {
    text: '开发方式',
    items: [
      { text: '当前开发方式', link: '/developer/development-workflow' },
      { text: '交付基线', link: '/developer/evidence/delivery-baseline' },
      { text: '阶段历史', link: '/developer/evidence/history' },
      { text: '功能交付', link: '/developer/features/' }
    ]
  },
  {
    text: 'Reference',
    items: [
      { text: '产品事实源', link: '/developer/reference/product/product-overview' },
      { text: '架构事实源', link: '/developer/reference/architecture/' },
      { text: '领域事实源', link: '/developer/reference/domains/' },
      { text: '治理与 ADR', link: '/developer/reference/governance/design-register' },
      { text: 'Admin 参考', link: '/developer/reference/admin/' },
      { text: 'Mobile 参考', link: '/developer/reference/mobile/' }
    ]
  }
]

const productSidebar = [
  {
    text: '产品',
    items: [
      { text: '产品定位与范围', link: '/developer/reference/product/product-overview' },
      { text: '业务与商业模型', link: '/developer/reference/product/business-model' },
      { text: '首发后 12 个月业务规划', link: '/developer/reference/product/business-plan' },
      { text: '功能开放与规则', link: '/developer/reference/product/feature-rollout' }
    ]
  }
]

const architectureSidebar = [
  {
    text: '架构总览',
    items: [{ text: '总体架构', link: '/developer/reference/architecture/' }]
  },
  {
    text: '领域架构',
    items: [
      { text: '领域边界', link: '/developer/reference/architecture/domains/' },
      { text: '领域依赖与协作', link: '/developer/reference/architecture/domains/dependencies' }
    ]
  },
  {
    text: '应用架构',
    items: [
      { text: '后端架构', link: '/developer/reference/architecture/applications/backend' },
      { text: '客户端架构', link: '/developer/reference/architecture/applications/clients' },
      { text: '全局 API 规范', link: '/developer/reference/architecture/applications/api-standard' }
    ]
  },
  {
    text: '基础设施',
    items: [
      { text: '基础设施与集成', link: '/developer/reference/architecture/infrastructure/' },
      { text: '安全与权限', link: '/developer/reference/architecture/infrastructure/security' }
    ]
  },
  {
    text: '数据架构',
    items: [{ text: 'PostgreSQL 架构规范', link: '/developer/reference/architecture/data/postgresql' }]
  }
]

const developerFeaturesSidebar = [
  {
    text: '功能目录',
    items: [
      { text: '全量功能目录', link: '/developer/features/' },
      { text: '用户登录与会话', link: '/developer/features/login' },
      { text: '老挝语字母管理', link: '/developer/features/lao-alphabet-management' },
      { text: '功能页契约', link: '/developer/DOCUMENT_CONTRACT' }
    ]
  }
]

const domainsSidebar = [
  {
    text: '领域设计',
    items: [
      { text: '领域总览', link: '/developer/reference/domains/' },
      { text: '领域与功能关系', link: '/developer/reference/domains/FEATURE_RELATIONSHIP_MODEL' },
      { text: '文档系统规范', link: '/developer/reference/governance/DOMAIN_DOCUMENT_STANDARD' }
    ]
  },
  {
    text: '身份（Identity）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/identity/' },
      { text: '业务流程', link: '/developer/reference/domains/identity/flows' },
      { text: '领域模型', link: '/developer/reference/domains/identity/model' },
      { text: '数据设计', link: '/developer/reference/domains/identity/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '登录与会话', link: '/developer/features/login' }]
      }
    ]
  },
  {
    text: '内容（Content）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/content/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '知识内容', link: '/developer/reference/domains/content/knowledge' },
          { text: '课程体系', link: '/developer/reference/domains/content/curriculum' },
          { text: '词典', link: '/developer/reference/domains/content/dictionary' },
          { text: '练习', link: '/developer/reference/domains/content/practice' }
        ]
      },
      { text: '数据设计', link: '/developer/reference/domains/content/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '音频生产', link: '/developer/features/audio-production' }]
      }
    ]
  },
  {
    text: '学习（Learning）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/learning/' },
      { text: '学习进度', link: '/developer/reference/domains/learning/progress' },
      { text: '领域模型', link: '/developer/reference/domains/learning/model' },
      { text: '数据设计', link: '/developer/reference/domains/learning/database' }
    ]
  },
  {
    text: '音频（Audio）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/audio/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '生产与审核', link: '/developer/reference/domains/audio/production' },
          { text: '工作流与状态机', link: '/developer/reference/domains/audio/lifecycle' }
        ]
      },
      { text: '契约与边界', link: '/developer/reference/domains/audio/contracts' },
      { text: '数据设计', link: '/developer/reference/domains/audio/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '音频生产', link: '/developer/features/audio-production' }]
      }
    ]
  },
  {
    text: '社交（Social）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/social/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '社交资料', link: '/developer/reference/domains/social/profile' },
          { text: '发现与关系', link: '/developer/reference/domains/social/discovery-and-relationships' },
          { text: '动态与举报入口', link: '/developer/reference/domains/social/community-content' }
        ]
      },
      { text: '数据设计', link: '/developer/reference/domains/social/database' }
    ]
  },
  {
    text: '聊天（Chat）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/chat/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '会话', link: '/developer/reference/domains/chat/conversation' },
          { text: '消息', link: '/developer/reference/domains/chat/message' }
        ]
      },
      { text: '契约与事件', link: '/developer/reference/domains/chat/application-and-events' },
      { text: '数据设计', link: '/developer/reference/domains/chat/database' }
    ]
  },
  {
    text: '商业（Commerce）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/commerce/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '购买、支付与退款', link: '/developer/reference/domains/commerce/purchase-and-payment' },
          { text: '钱包与账本', link: '/developer/reference/domains/commerce/wallet' },
          { text: '礼物', link: '/developer/reference/domains/commerce/gifting' },
          { text: '工作流与状态机', link: '/developer/reference/domains/commerce/lifecycle' }
        ]
      },
      { text: '契约与边界', link: '/developer/reference/domains/commerce/contracts' },
      { text: '数据设计', link: '/developer/reference/domains/commerce/database' }
    ]
  },
  {
    text: '奖励（Rewards）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/rewards/' },
      { text: '契约与事件', link: '/developer/reference/domains/rewards/application-and-events' },
      { text: '数据设计', link: '/developer/reference/domains/rewards/database' }
    ]
  },
  {
    text: '信任与安全（Trust & Safety）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/trust/' },
      { text: '治理流程', link: '/developer/reference/domains/trust/moderation' },
      { text: '契约与边界', link: '/developer/reference/domains/trust/contracts' },
      { text: '数据设计', link: '/developer/reference/domains/trust/database' }
    ]
  },
  {
    text: '运营（Operations）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/operations/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: 'RBAC 与授权', link: '/developer/reference/domains/operations/rbac' },
          { text: '操作审计与 Bootstrap', link: '/developer/reference/domains/operations/audit' }
        ]
      },
      { text: '公共契约与集成', link: '/developer/reference/domains/operations/contracts' },
      { text: '数据设计', link: '/developer/reference/domains/operations/database' },
      {
        text: '相关功能',
        collapsed: true,
        items: [{ text: '音频生产', link: '/developer/features/audio-production' }]
      }
    ]
  },
  {
    text: '平台（Platform）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/developer/reference/domains/platform/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '运行时控制', link: '/developer/reference/domains/platform/runtime-control' },
          { text: '客户端治理', link: '/developer/reference/domains/platform/client-governance' }
        ]
      },
      { text: '边界与职责', link: '/developer/reference/domains/platform/boundaries' },
      { text: '数据设计', link: '/developer/reference/domains/platform/database' }
    ]
  }
]

const governanceSidebar = [
  {
    text: '设计治理',
    items: [
      { text: '文档系统规范', link: '/developer/reference/governance/DOMAIN_DOCUMENT_STANDARD' },
      { text: '设计决策台账', link: '/developer/reference/governance/design-register' },
      { text: '未决事项', link: '/developer/reference/governance/open-questions' },
      { text: '来源覆盖清单', link: '/developer/reference/governance/source-coverage' }
    ]
  }
]

const adrSidebar = [
  {
    text: '架构决策记录',
    items: [
      { text: 'ADR 索引', link: '/developer/reference/adr/' },
      { text: '设计决策台账', link: '/developer/reference/governance/design-register' }
    ]
  }
]

const contractsSidebar = [
  {
    text: '迁移契约快照',
    items: [
      { text: 'Identity API', link: '/developer/reference/contracts/identity/IDENTITY_API' },
      { text: 'Identity Use Cases', link: '/developer/reference/contracts/identity/IDENTITY_USE_CASES' },
      { text: 'Content API', link: '/developer/reference/contracts/content/CONTENT_API' },
      { text: 'Content Public Contracts', link: '/developer/reference/contracts/content/CONTENT_PUBLIC_CONTRACTS' },
      { text: 'Learning API', link: '/developer/reference/contracts/learning/LEARNING_API' },
      { text: 'Learning Product Semantics', link: '/developer/reference/contracts/learning/LEARNING_PRODUCT_SEMANTICS' },
      { text: 'Learning Use Cases', link: '/developer/reference/contracts/learning/LEARNING_USE_CASES' },
      { text: 'Operations API / RBAC', link: '/developer/reference/contracts/operations/OPERATIONS_API' },
      { text: 'Audio Public Contracts', link: '/developer/reference/contracts/audio/AUDIO_PUBLIC_CONTRACTS' }
    ]
  }
]

const evidenceSidebar = [
  {
    text: '迁移证据快照',
    items: [
      { text: 'Content Design Audit', link: '/developer/reference/evidence/content/CONTENT_DESIGN_AUDIT' },
      { text: 'Learning Design Audit', link: '/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT' },
      { text: 'Operations Implementation Report', link: '/developer/reference/evidence/operations/OPERATIONS_IMPLEMENTATION_REPORT' },
      { text: 'Platform Design Audit', link: '/developer/reference/evidence/platform/PLATFORM_DESIGN_AUDIT' },
      { text: 'Platform Implementation Report', link: '/developer/reference/evidence/platform/PLATFORM_IMPLEMENTATION_REPORT' },
      { text: 'Audio Design Audit', link: '/developer/reference/evidence/audio/AUDIO_DESIGN_AUDIT' },
      { text: 'Mobile Foundation', link: '/developer/reference/evidence/mobile/MOBILE_FOUNDATION' }
    ]
  }
]

const referenceSidebar = [
  {
    text: 'Reference 入口',
    items: [
      { text: '产品事实源', link: '/developer/reference/product/product-overview' },
      { text: '架构事实源', link: '/developer/reference/architecture/' },
      { text: '领域事实源', link: '/developer/reference/domains/' },
      { text: '治理与 ADR', link: '/developer/reference/governance/design-register' },
      { text: 'Admin 参考', link: '/developer/reference/admin/' },
      { text: 'Mobile 参考', link: '/developer/reference/mobile/' }
    ]
  },
  ...productSidebar,
  ...architectureSidebar,
  ...domainsSidebar,
  ...governanceSidebar,
  ...adrSidebar,
  ...contractsSidebar,
  ...evidenceSidebar,
  {
    text: 'Admin 参考',
    items: [
      { text: 'Admin 概览', link: '/developer/reference/admin/' },
      { text: '页面清单', link: '/developer/reference/admin/pages' },
      { text: '操作员与 RBAC', link: '/developer/reference/admin/operators' }
    ]
  },
  {
    text: 'Mobile 参考',
    items: [
      { text: 'Mobile 概览', link: '/developer/reference/mobile/' },
      { text: '页面清单', link: '/developer/reference/mobile/pages' },
      { text: '导航结构', link: '/developer/reference/mobile/navigation' }
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
      { text: '产品开发全景', link: '/developer/' }
    ],
    sidebar: {
      '/developer/': developerSidebar,
      '/developer/reference/': referenceSidebar,
      '/developer/reference/contracts/': contractsSidebar,
      '/developer/reference/evidence/': evidenceSidebar,
      '/developer/features/': developerFeaturesSidebar,
    },
    outline: { level: [2, 3], label: '页面导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    search: { provider: 'local' }
  }
})
