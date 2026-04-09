import { get } from '../utils/request'
import type {
  Result,
  CreditStatisticsResponseVO,
  SchoolCreditDetailResponseVO,
  SchoolCreditDetailRequest,
  SchoolRoleSummaryResponseVO
} from '../types/dashboard'

/**
 * 获取职位学分总览
 * @param deptCode 部门编码
 * @param role 角色视图 (0:全员, 1:干部, 2:专家, 3:基层管理者)
 */
export const getPositionStatistics = async (deptCode?: string, role?: string): Promise<CreditStatisticsResponseVO | null> => {
  try {
    const query = new URLSearchParams()
    if (deptCode) query.append('deptCode', deptCode)
    if (role && role !== '0') query.append('role', role)
    
    const response = await get<Result<CreditStatisticsResponseVO>>(`/api/credit/statistics/position?${query.toString()}`)
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取职位学分总览失败：', response.message)
    return null
  } catch (error) {
    console.error('获取职位学分总览异常：', error)
    return null
  }
}

/**
 * 获取部门学分总览
 * @param deptCode 部门编码
 * @param role 角色视图 (0:全员, 1:干部, 2:专家, 3:基层管理者)
 */
export const getDepartmentStatistics = async (deptCode?: string, role?: string): Promise<CreditStatisticsResponseVO | null> => {
  try {
    const query = new URLSearchParams()
    if (deptCode) query.append('deptCode', deptCode)
    if (role && role !== '0') query.append('role', role)

    const response = await get<Result<CreditStatisticsResponseVO>>(`/api/credit/statistics/department?${query.toString()}`)
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取部门学分总览失败：', response.message)
    return null
  } catch (error) {
    console.error('获取部门学分总览异常：', error)
    return null
  }
}

/**
 * 获取AI School学分数据明细列表（基线人数下钻）
 */
export const getSchoolCreditDetailList = async (
    params: SchoolCreditDetailRequest
): Promise<SchoolCreditDetailResponseVO | null> => {
  try {
    const query = new URLSearchParams()
    query.append('deptCode', params.deptCode)
    if (params.deptLevel !== undefined) query.append('deptLevel', String(params.deptLevel))
    if (params.roleType !== undefined) query.append('roleType', String(params.roleType))
    if (params.jobFamily) query.append('jobFamily', params.jobFamily)
    if (params.jobCategory) query.append('jobCategory', params.jobCategory)
    if (params.jobSubCategory) query.append('jobSubCategory', params.jobSubCategory)
    if (params.organizationMaturity) query.append('organizationMaturity', params.organizationMaturity)
    if (params.positionMaturity) query.append('positionMaturity', params.positionMaturity)
    if (params.queryType) query.append('queryType', params.queryType)
    query.append('pageNum', String(params.pageNum ?? 1))
    query.append('pageSize', String(params.pageSize ?? 50))

    // ✅ 修正为后端实际路径
    const response = await get<Result<SchoolCreditDetailResponseVO>>(
        `/api/credit/statistics/detail?${query.toString()}`
    )
    if (response.code === 200) return response.data
    console.warn('获取AI School学分数据明细失败：', response.message)
    return null
  } catch (error) {
    console.error('获取AI School学分数据明细异常：', error)
    return null
  }
}

/**
 * 获取专家 & 干部学分总览
 * @param deptCode 部门编码，不传时查全量
 */
export const getRoleSummary = async (
    deptCode?: string
): Promise<SchoolRoleSummaryResponseVO | null> => {
  try {
    const query = new URLSearchParams()
    if (deptCode && deptCode !== '0') query.append('deptCode', deptCode)

    const response = await get<Result<SchoolRoleSummaryResponseVO>>(
        `/api/credit/statistics/role-summary?${query.toString()}`
    )
    if (response.code === 200) return response.data
    console.warn('获取角色学分总览失败：', response.message)
    return null
  } catch (error) {
    console.error('获取角色学分总览异常：', error)
    return null
  }
}