import { Router } from 'express'
import { getPlTmCertStatistics } from '../data/plTmCertStatistics'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

/**
 * 查询PL、TM任职与认证数据
 * GET /entry-level-manager/pl-tm-cert-statistics
 */
router.get('/pl-tm-cert-statistics', (req, res) => {
  try {
    const data = getPlTmCertStatistics()
    return res.json(successResponse(data, '查询成功'))
  } catch (error) {
    console.error('[mock] 获取PL/TM任职与认证数据失败:', error)
    return res.status(500).json(errorResponse('系统异常，请稍后重试', 500))
  }
})

export default router

