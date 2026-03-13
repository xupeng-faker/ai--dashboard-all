import type { Component } from 'vue'
import { Cpu, DataAnalysis, Medal, Reading } from '@element-plus/icons-vue'
import type { DashboardTabName } from '@/stores/modules/app'

export interface DashboardTabItem {
  name: DashboardTabName
  label: string
  route: string
  icon: Component
}

export const DASHBOARD_TABS: readonly DashboardTabItem[] = [
  {
    name: 'certification',
    label: 'AI任职认证看板',
    route: '/dashboard/certification',
    icon: Medal,
  },
  {
    name: 'training',
    label: 'AI训战看板',
    route: '/dashboard/training',
    icon: Cpu,
  },
  {
    name: 'school',
    label: 'AI School看板',
    route: '/dashboard/school',
    icon: Reading,
  },
  {
    name: 'maturity',
    label: '组织/岗位AI成熟度看板',
    route: '/dashboard/maturity',
    icon: DataAnalysis,
  },
] as const

