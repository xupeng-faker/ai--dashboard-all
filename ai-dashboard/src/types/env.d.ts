/// <reference types="vite/client" />

declare module 'vue-router' {
  interface RouteMeta {
    /** 顶部看板 Tab 高亮（与路径前缀不一致时使用，如 School 下的个人详情页） */
    dashboardTab?: 'maturity' | 'training' | 'school' | 'certification'
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

