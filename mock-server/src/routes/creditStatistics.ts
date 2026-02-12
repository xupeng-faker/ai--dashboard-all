import { Router } from 'express'
import { successResponse } from '../utils/response'
import { getPositionResponse, getDepartmentResponse } from '../data/creditStatistics'

const router = Router()

// 获取职位学分统计
router.get('/position', (req, res) => {
  const deptCode = req.query.deptCode as string
  const role = req.query.role as string
  // 模拟网络延迟
  setTimeout(() => {
    res.json(successResponse(getPositionResponse(deptCode)))
  }, 300)
})

// 获取部门学分统计
router.get('/department', (req, res) => {
  const deptCode = req.query.deptCode as string
  const role = req.query.role as string
  // 模拟网络延迟
  setTimeout(() => {
    res.json(successResponse(getDepartmentResponse(deptCode)))
  }, 300)
})

export default router
