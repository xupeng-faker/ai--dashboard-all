import { CreditOverviewVO, CreditStatisticsResponseVO } from '../types'

export const positionStatistics: CreditOverviewVO[] = [
  {
    categoryName: '软件类',
    baselineHeadcount: 120,
    maxScore: 95,
    minScore: 60,
    achievementRate: 85.5,
    timeProgress: 75.0,
    isWarning: false,
  },
  {
    categoryName: '测试类',
    baselineHeadcount: 80,
    maxScore: 92,
    minScore: 55,
    achievementRate: 70.0,
    timeProgress: 75.0,
    isWarning: true,
  },
  {
    categoryName: '算法类',
    baselineHeadcount: 50,
    maxScore: 98,
    minScore: 70,
    achievementRate: 90.0,
    timeProgress: 75.0,
    isWarning: false,
  },
  {
    categoryName: '产品类',
    baselineHeadcount: 60,
    maxScore: 88,
    minScore: 50,
    achievementRate: 65.0,
    timeProgress: 75.0,
    isWarning: true,
  },
]

export const departmentStatistics: CreditOverviewVO[] = [
  {
    categoryName: '云核心网产品线',
    baselineHeadcount: 300,
    maxScore: 98,
    minScore: 50,
    achievementRate: 82.0,
    timeProgress: 75.0,
    isWarning: false,
  },
  {
    categoryName: '无线网络产品线',
    baselineHeadcount: 450,
    maxScore: 96,
    minScore: 45,
    achievementRate: 72.0,
    timeProgress: 75.0,
    isWarning: true,
  },
  {
    categoryName: '数字能源产品线',
    baselineHeadcount: 200,
    maxScore: 94,
    minScore: 55,
    achievementRate: 78.0,
    timeProgress: 75.0,
    isWarning: false,
  },
]

// 辅助函数：生成带总计的响应对象
const createResponse = (list: CreditOverviewVO[], deptCode: string): CreditStatisticsResponseVO => {
  const total: CreditOverviewVO = {
    categoryName: '总计',
    baselineHeadcount: list.reduce((sum, item) => sum + item.baselineHeadcount, 0),
    maxScore: list.length ? Math.max(...list.map(item => item.maxScore)) : 0,
    minScore: list.length ? Math.min(...list.map(item => item.minScore)) : 0,
    achievementRate: list.length ? parseFloat((list.reduce((sum, item) => sum + item.achievementRate, 0) / list.length).toFixed(1)) : 0,
    timeProgress: 75.0,
    isWarning: false
  }
  
  // 更新总计预警状态
  total.isWarning = total.achievementRate < total.timeProgress

  return {
    deptCode: deptCode || '106828',
    deptName: deptCode ? `部门-${deptCode}` : '云核心网产品线',
    statistics: list,
    totalStatistics: total
  }
}

export const getPositionResponse = (deptCode: string = ''): CreditStatisticsResponseVO => {
  return createResponse(positionStatistics, deptCode)
}

export const getDepartmentResponse = (deptCode: string = ''): CreditStatisticsResponseVO => {
  return createResponse(departmentStatistics, deptCode)
}
