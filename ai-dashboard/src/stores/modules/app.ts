import { defineStore } from 'pinia'
import { ref } from 'vue'

export type DashboardTabName = 'maturity' | 'training' | 'school' | 'certification'

interface UserProfile {
  name: string
  role: string
  avatar?: string
}

export const useAppStore = defineStore('app', () => {
  const TOKEN_KEY = 'token'
  if (!localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, 'demo-token')
  }

  const user = ref<UserProfile>({
    name: '李思源',
    role: 'AI 赋能负责人',
  })

  const activeTab = ref<DashboardTabName>('maturity')

  const setActiveTab = (tab: DashboardTabName) => {
    activeTab.value = tab
  }

  return {
    user,
    activeTab,
    setActiveTab,
  }
})

