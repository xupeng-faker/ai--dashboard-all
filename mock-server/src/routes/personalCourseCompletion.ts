import { Router } from 'express'
import { getPersonalCourseCompletion } from '../data/personalCourseCompletion'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

/**
 * 查询个人课程完成情况
 * GET /ai_transform_webapi/personal-course/completion
 * 从cookie中获取account参数，返回个人课程完成情况数据
 */
router.get('/completion', (req, res) => {
  try {
    // 从cookie中获取account（模拟从cookie获取用户信息）
    let account = req.headers.cookie
      ?.split(';')
      .find((c) => c.trim().startsWith('account='))
      ?.split('=')[1]

    // 如果未获取到用户信息，使用默认值（方便测试）
    if (!account || account.trim().length === 0) {
      account = '123456' // 默认测试工号
      console.log('[mock] 未获取到cookie中的account，使用默认测试工号:', account)
    }

    const data = getPersonalCourseCompletion()
    // 根据account设置empNum
    if (account) {
      data.empNum = account.trim()
    }

    return res.json(successResponse(data, '查询成功'))
  } catch (error) {
    console.error('[mock] 获取个人课程完成情况失败:', error)
    return res.status(500).json(errorResponse('系统异常，请稍后重试', 500))
  }
})

export default router

