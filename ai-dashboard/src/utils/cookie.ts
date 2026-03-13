/**
 * Cookie工具函数
 */

/**
 * 获取指定名称的cookie值
 * @param name cookie名称
 * @returns cookie值，如果不存在则返回null
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

/**
 * 从account cookie中提取工号（8位阿拉伯数字）
 * account格式：首字母 + 8位阿拉伯数字
 * @returns 工号（8位数字），如果格式不正确则返回null
 */
export function getUserIdFromAccount(): string | null {
  const account = getCookie('account')
  if (!account) {
    return null
  }

  // 校验格式：首字母 + 8位阿拉伯数字
  const accountPattern = /^[A-Za-z]\d{8}$/
  if (!accountPattern.test(account)) {
    console.warn('account cookie格式不正确，应为：首字母+8位数字，当前值：', account)
    return null
  }

  // 提取8位阿拉伯数字
  const digits = account.match(/\d{8}$/)
  if (digits && digits[0]) {
    return digits[0]
  }

  return null
}

/**
 * 获取用户头像URL
 * @returns 头像URL，如果无法获取工号则返回null
 */
export function getUserAvatarUrl(): string | null {
  const userId = getUserIdFromAccount()
  if (!userId) {
    return null
  }
  return `https://w3.huawei.com/w3lab/rest/yellowpage/face/${userId}/120`
}





