import { get } from '../utils/request'
import type { Result, CreditStatisticsResponseVO } from '../types/dashboard'

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
