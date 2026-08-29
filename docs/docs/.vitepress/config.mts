import { defineConfig } from 'vitepress'

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
      { text: '架构', link: '/architecture/overview' },
      { text: '领域设计', link: '/domains/' },
      { text: '设计治理', link: '/governance/design-register' },
      { text: 'ADR', link: '/adr/' }
    ],
    sidebar: [
      {
        text: '产品',
        items: [
          { text: '产品定位与范围', link: '/product/product-overview' },
          { text: '业务与商业模型', link: '/product/business-model' },
          { text: '功能开放与规则', link: '/product/feature-rollout' }
        ]
      },
      {
        text: '架构设计',
        items: [
          { text: '总体架构', link: '/architecture/overview' },
          { text: 'Domain Map', link: '/architecture/domain-map' },
          { text: 'PostgreSQL 总规范', link: '/architecture/database' },
          { text: '后端架构', link: '/architecture/backend' },
          { text: '前端架构', link: '/architecture/frontend' }
        ]
      },
      {
        text: '领域设计',
        items: [
          { text: '领域成熟度', link: '/domains/' },
          { text: 'Identity', link: '/domains/identity/' },
          { text: 'Identity 流程', link: '/domains/identity/flows' },
          { text: 'Identity 数据库', link: '/domains/identity/database' },
          { text: 'Learning', link: '/domains/learning/' },
          { text: 'Learning 表总览', link: '/domains/learning/database' },
          { text: 'Learning · Knowledge', link: '/domains/learning/knowledge' },
          { text: 'Learning · Curriculum', link: '/domains/learning/curriculum' },
          { text: 'Learning · Practice', link: '/domains/learning/practice' },
          { text: 'Learning · Progress', link: '/domains/learning/progress' },
          { text: 'Learning · Dictionary', link: '/domains/learning/dictionary' },
          { text: 'Learning · AI & Media', link: '/domains/learning/ai-media' },
          { text: 'Social', link: '/domains/social/' },
          { text: 'Social · 资料', link: '/domains/social/profile' },
          { text: 'Social · 发现与关系', link: '/domains/social/discovery-and-relationships' },
          { text: 'Social · 动态与举报', link: '/domains/social/community-content' },
          { text: 'Social · 数据库总览', link: '/domains/social/database' },
          { text: 'Community', link: '/domains/community/' },
          { text: 'Messaging', link: '/domains/messaging/' },
          { text: 'Messaging · 会话模型', link: '/domains/messaging/conversation' },
          { text: 'Messaging · 消息模型', link: '/domains/messaging/message' },
          { text: 'Messaging · 应用服务与事件', link: '/domains/messaging/application-and-events' },
          { text: 'Messaging · 数据库总览', link: '/domains/messaging/database' },
          { text: 'Commerce', link: '/domains/commerce/' },
          { text: 'Rewards', link: '/domains/rewards/' },
          { text: 'Trust & Safety', link: '/domains/trust/' },
          { text: 'Operations', link: '/domains/operations/' },
          { text: 'Platform', link: '/domains/platform/' }
        ]
      },
      {
        text: '设计治理',
        items: [
          { text: '设计决策台账', link: '/governance/design-register' },
          { text: '未决事项', link: '/governance/open-questions' },
          { text: '会话覆盖清单', link: '/governance/source-coverage' }
        ]
      },
      {
        text: 'ADR',
        items: [
          { text: 'ADR 索引', link: '/adr/' },
          { text: 'ADR-001 模块化单体', link: '/adr/ADR-001-modular-monolith-and-domain-schemas' },
          { text: 'ADR-002 Identity 拆分', link: '/adr/ADR-002-separate-user-identities-and-profiles' },
          { text: 'ADR-003 Follow 与 Match', link: '/adr/ADR-003-follow-mutual-follow-match' },
          { text: 'ADR-004 Content Registry', link: '/adr/ADR-004-learning-content-registry' },
          { text: 'ADR-005 Entitlement', link: '/adr/ADR-005-entitlement-centered-authorization' },
          { text: 'ADR-006 Learning Content 生命周期', link: '/adr/ADR-006-learning-content-lifecycle' },
          { text: 'ADR-007 统一课程分层', link: '/adr/ADR-007-unified-curriculum-hierarchy' },
          { text: 'ADR-008 Practice 答案数据', link: '/adr/ADR-008-practice-definition-and-answer-data' },
          { text: 'ADR-009 Learning 状态模型', link: '/adr/ADR-009-learning-history-and-current-state' },
          { text: 'ADR-010 Social 资料与发现模型', link: '/adr/ADR-010-social-profile-discovery-and-relationships' },
          { text: 'ADR-011 Chat 会话身份与 Direct 唯一', link: '/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness' },
          { text: 'ADR-012 消息 seq 与发送幂等', link: '/adr/ADR-012-message-seq-ordering-and-idempotency' },
          { text: 'ADR-013 已读游标而非 Receipt 表', link: '/adr/ADR-013-read-state-as-cursor-not-receipt-table' },
          { text: 'ADR-014 不新增 Notification 域', link: '/adr/ADR-014-no-notification-domain-events-outbox-infra' }
        ]
      }
    ],
    outline: { level: [2, 3], label: '页面导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    search: { provider: 'local' }
  }
})
