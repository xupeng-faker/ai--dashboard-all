import { Router } from 'express'
import { getDepartmentsByParent } from '../data/department'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

router.get('/children', (req, res) => {
  try {
    const { deptId } = req.query
    const normalizedDeptId = typeof deptId === 'string' && deptId.trim().length > 0 ? deptId.trim() : '0'
    const departments = getDepartmentsByParent(normalizedDeptId)
    return res.json(successResponse(departments, '查询成功'))
  } catch (error) {
    console.error('[mock] 获取部门数据失败:', error)
    return res.status(500).json(errorResponse('系统异常，请稍后重试'))
  }
})

export default router
