import { Router } from 'express'
import { getEmployeeCertStatistics } from '../data/employeeCertStatistics'
import { getCompetenceCategoryCertStatistics } from '../data/competenceCategoryCertStatistics'
import { getCadreMaturityJobCategoryCertStatistics } from '../data/cadreMaturityJobCategoryCertStatistics'
import { getCadreMaturityJobCategoryQualifiedStatistics } from '../data/cadreMaturityJobCategoryQualifiedStatistics'
import { getCadreQualifiedDetails } from '../data/cadreQualifiedDetails'
import { getOverallCertificationTrends } from '../data/overallCertificationTrends'
import { getExpertAiCertStatistics } from '../data/expertAiCertStatistics'
import { getExpertAiQualifiedStatistics } from '../data/expertAiQualifiedStatistics'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

router.get('/employee-cert-statistics', (req, res) => {
  const deptCode = typeof req.query.deptCode === 'string' ? req.query.deptCode : '0'
  const personType = typeof req.query.personType === 'string' ? req.query.personType : '0'
  const data = getEmployeeCertStatistics(deptCode, personType)
  return res.json(successResponse(data, 'mock employee cert statistics'))
})

router.get('/competence-category-cert-statistics', (req, res) => {
  const deptCode = typeof req.query.deptCode === 'string' ? req.query.deptCode : '0'
  const personType = typeof req.query.personType === 'string' ? req.query.personType : '0'
  const data = getCompetenceCategoryCertStatistics(deptCode, personType)
  return res.json(successResponse(data, 'mock competence category cert statistics'))
})

router.get('/cadre-cert-statistics/by-maturity-and-job-category', (req, res) => {
  const deptCode = typeof req.query.deptCode === 'string' ? req.query.deptCode : '0'
  const data = getCadreMaturityJobCategoryCertStatistics(deptCode)
  return res.json(successResponse(data, 'mock cadre maturity job category cert statistics'))
})

router.get('/cadre-cert-statistics/by-maturity-and-job-category-qualified', (req, res) => {
  // 支持 deptCode 和 deptId 参数（Java接口使用deptId，前端使用deptCode）
  const deptCode = typeof req.query.deptCode === 'string' 
    ? req.query.deptCode 
    : typeof req.query.deptId === 'string' 
    ? req.query.deptId 
    : '0'
  const data = getCadreMaturityJobCategoryQualifiedStatistics(deptCode)
  return res.json(successResponse(data, 'mock cadre maturity job category qualified statistics'))
})

router.get('/cadre-qualified-details', (req, res) => {
  try {
    const deptCode = typeof req.query.deptCode === 'string' ? req.query.deptCode : ''
    const aiMaturity = typeof req.query.aiMaturity === 'string' ? req.query.aiMaturity : undefined
    const jobCategory = typeof req.query.jobCategory === 'string' ? req.query.jobCategory : undefined
    const personType = typeof req.query.personType === 'string' 
      ? parseInt(req.query.personType, 10) 
      : typeof req.query.personType === 'number'
      ? req.query.personType
      : 1
    const queryType = typeof req.query.queryType === 'string' 
      ? parseInt(req.query.queryType, 10) 
      : typeof req.query.queryType === 'number'
      ? req.query.queryType
      : 1

    // 参数验证
    if (!deptCode || deptCode.trim().length === 0) {
      return res.status(400).json(errorResponse('部门ID不能为空', 400))
    }

    if (!personType) {
      return res.status(400).json(errorResponse('人员类型不能为空', 400))
    }

    // 验证 queryType 参数
    if (queryType !== 1 && queryType !== 2) {
      return res.status(400).json(errorResponse('查询类型参数错误，只支持1（任职人数）或2（基线人数）', 400))
    }

    const data = getCadreQualifiedDetails(deptCode, aiMaturity, jobCategory, personType, queryType)
    return res.json(successResponse(data, '查询成功'))
  } catch (error) {
    console.error('[mock] 获取干部任职详情失败:', error)
    return res.status(500).json(errorResponse('系统异常，请稍后重试', 500))
  }
})

router.get('/overall-certification-trends', (req, res) => {
  const data = getOverallCertificationTrends()
  return res.json(successResponse(data, 'mock overall certification trends'))
})

router.get('/expert-ai-cert-statistics', (req, res) => {
  try {
    const deptCode = typeof req.query.deptCode === 'string' ? req.query.deptCode : '0'
    const data = getExpertAiCertStatistics(deptCode)
    return res.json(successResponse(data, '查询成功'))
  } catch (error) {
    console.error('[mock] 获取专家AI认证数据失败:', error)
    return res.status(500).json(errorResponse('系统异常，请稍后重试', 500))
  }
})

router.get('/expert-ai-qualified-statistics', (req, res) => {
  try {
    const deptCode = typeof req.query.deptCode === 'string' ? req.query.deptCode : '0'
    const data = getExpertAiQualifiedStatistics(deptCode)
    return res.json(successResponse(data, '查询成功'))
  } catch (error) {
    console.error('[mock] 获取专家AI任职数据失败:', error)
    return res.status(500).json(errorResponse('系统异常，请稍后重试', 500))
  }
})

export default router

