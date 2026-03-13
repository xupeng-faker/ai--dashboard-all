import { Router } from 'express'
import departmentRouter from './department'
import expertCertStatisticsRouter from './expertCertStatistics'
import entryLevelManagerRouter from './entryLevelManager'
import personalCourseCompletionRouter from './personalCourseCompletion'
import creditStatisticsRouter from './creditStatistics'
import { successResponse } from '../utils/response'

const router = Router()

router.get('/health', (_, res) => {
  return res.json(successResponse({ status: 'ok' }, 'mock server works'))
})

router.use('/ai_transform_webapi/department-info', departmentRouter)
router.use('/ai_transform_webapi/expert-cert-statistics', expertCertStatisticsRouter)
router.use('/ai_transform_webapi/entry-level-manager', entryLevelManagerRouter)
router.use('/ai_transform_webapi/personal-course', personalCourseCompletionRouter)
router.use('/ai_transform_webapi/api/credit/statistics', creditStatisticsRouter)

export default router
