import { defineConfig } from 'vitepress'

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
    items: [
      { text: '总体架构', link: '/architecture/' }
    ]
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
      { text: '客户端架构', link: '/architecture/applications/clients' }
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
    items: [
      { text: 'PostgreSQL 架构规范', link: '/architecture/data/postgresql' }
    ]
  }
]

const developmentSidebar = [
  {
    text: '开发总览',
    items: [
      { text: '开发入口', link: '/development/' },
      { text: '开发流程控制中心', link: '/development/DEVELOPMENT_CONTROL_CENTER' },
      { text: '领域生命周期矩阵', link: '/development/DOMAIN_LIFECYCLE_MATRIX' },
      { text: '当前下一动作', link: '/development/workflow/NEXT_ACTIONS' },
      { text: '开发进度', link: '/development/DEVELOPMENT_PROGRESS' }
    ]
  },
  {
    text: '开发规范',
    items: [
      { text: '可执行规格系统', link: '/development/SPEC_SYSTEM' },
      { text: '实现蓝图模板', link: '/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE' },
      { text: 'AI 多会话工作流', link: '/development/workflow/' },
      { text: '工作流启动简报', link: '/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF' }
    ]
  },
  {
    text: '客户端基础',
    collapsed: true,
    items: [
      { text: '后台基础计划', link: '/development/ADMIN_FOUNDATION_PLAN' },
      { text: '移动端基础计划', link: '/development/MOBILE_FOUNDATION_PLAN' }
    ]
  },
  {
    text: '领域开发',
    collapsed: true,
    items: [
      { text: '身份', link: '/development/02-identity/IDENTITY_IMPLEMENTATION_PLAN' },
      { text: '平台', link: '/development/03-platform/PLATFORM_IMPLEMENTATION_PLAN' },
      { text: '运营', link: '/development/04-operations/OPERATIONS_IMPLEMENTATION_PLAN' },
      { text: '内容', link: '/development/05-content/CONTENT_DESIGN_BRIEF' },
      { text: '学习', link: '/development/06-learning/LEARNING_DESIGN_BRIEF' },
      { text: '音频生产', link: '/development/07-audio/AUDIO_DESIGN_BRIEF' }
    ]
  }
]

const domainsSidebar = [
  {
    text: '领域设计',
    items: [
      { text: '领域总览', link: '/domains/' },
      { text: '领域文档规范', link: '/governance/DOMAIN_DOCUMENT_STANDARD' }
    ]
  },
  {
    text: '身份（Identity）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/identity/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '业务流程', link: '/domains/identity/flows' }
        ]
      },
      { text: '领域模型', link: '/domains/identity/model' },
      { text: '数据设计', link: '/domains/identity/database' }
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
      { text: '数据设计', link: '/domains/content/database' }
    ]
  },
  {
    text: '学习（Learning）',
    collapsed: true,
    items: [
      { text: '领域概览', link: '/domains/learning/' },
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '学习进度', link: '/domains/learning/progress' }
        ]
      },
      { text: '领域模型', link: '/domains/learning/model' },
      { text: '数据设计', link: '/domains/learning/database' }
    ]
  },
  {
    text: '音频生产（Audio Production）',
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
      { text: '数据设计', link: '/domains/audio/database' }
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
      {
        text: '业务设计',
        collapsed: true,
        items: [
          { text: '治理流程', link: '/domains/trust/moderation' }
        ]
      },
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
      { text: '数据设计', link: '/domains/operations/database' }
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
      { text: '领域文档规范', link: '/governance/DOMAIN_DOCUMENT_STANDARD' },
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
      { text: '架构', link: '/architecture/' },
      { text: '开发', link: '/development/' },
      { text: '领域', link: '/domains/' },
      { text: '治理', link: '/governance/design-register' },
      { text: 'ADR', link: '/adr/' }
    ],
    sidebar: {
      '/guide/': guideSidebar,
      '/product/': productSidebar,
      '/architecture/': architectureSidebar,
      '/development/': developmentSidebar,
      '/domains/': domainsSidebar,
      '/governance/': governanceSidebar,
      '/adr/': adrSidebar
    },
    outline: { level: [2, 3], label: '页面导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    search: { provider: 'local' }
  }
})