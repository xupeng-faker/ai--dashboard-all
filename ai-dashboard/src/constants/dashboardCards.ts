import type { DashboardTabName } from '@/stores/modules/app'

export interface DashboardCardMeta {
  description: string
  accent: string
  gradient: string
  badge?: string
}

export const DASHBOARD_CARD_META: Record<DashboardTabName, DashboardCardMeta> = {
  maturity: {
    description: '聚焦组织与岗位AI成熟度的核心指标，洞察转型成效与优化方向。',
    accent: '#3a7afe',
    gradient: 'linear-gradient(180deg, rgba(58, 122, 254, 0.16), rgba(58, 122, 254, 0.04))',
    // badge: '总览主看板',
  },
  training: {
    description: '追踪训练任务执行态势，掌握进度、资源与关键节点。',
    accent: '#5c6cff',
    gradient: 'linear-gradient(180deg, rgba(92, 108, 255, 0.14), rgba(92, 108, 255, 0.04))',
  },
  school: {
    description: '对接课程学习进展，及时把握AI人才培养成效。',
    accent: '#9b5cff',
    gradient: 'linear-gradient(180deg, rgba(155, 92, 255, 0.14), rgba(155, 92, 255, 0.04))',
  },
  certification: {
    description: '集中展示任职认证覆盖率与合规风险，守护关键岗位稳定。',
    accent: '#f18b60',
    gradient: 'linear-gradient(180deg, rgba(241, 139, 96, 0.14), rgba(241, 139, 96, 0.04))',
  },
}

export const DEVELOPING_DASHBOARD_TABS = new Set<DashboardTabName>(['maturity'])


