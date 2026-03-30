/**
 * 本地开发：注入演示用登录态，避免「未获取到用户信息，请先登录」
 *
 * - localStorage token：与后端 UserConfigService 中 Bearer demo-token 分支一致
 * - Cookie account：门户约定「首字母 w + 工号」，后端解析为工号 E001234（与 init_mock_data / 种子数据对齐）
 */
const DEV_TOKEN = 'demo-token'
/** 对应员工工号 E001234（张三），库中需有 t_personal_credit / t_employee_sync 等数据 */
const DEV_ACCOUNT_COOKIE = 'wE001234'

export function setupDevMockAuth(): void {
  if (!import.meta.env.DEV) return

  if (!localStorage.getItem('token')) {
    localStorage.setItem('token', DEV_TOKEN)
  }

  const hasAccountCookie = document.cookie.split(';').some((c) => c.trim().toLowerCase().startsWith('account='))
  if (!hasAccountCookie) {
    document.cookie = `account=${DEV_ACCOUNT_COOKIE}; path=/; SameSite=Lax`
  }
}

export const DEV_MOCK_USER = {
  token: DEV_TOKEN,
  accountCookie: DEV_ACCOUNT_COOKIE,
  employeeId: 'E001234',
  displayName: '张三（本地演示）',
} as const
