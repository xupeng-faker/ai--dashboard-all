import type { DepartmentCertStatistic, EmployeeCertStatisticsResponse } from '../types'

type StatisticsStore = Record<string, DepartmentCertStatistic[]>

const baseStatsByDept: Record<string, DepartmentCertStatistic[]> = {
  '0': [
    {
      deptCode: 'dept-ict-core-ops',
      deptName: '云核心网运营部云核心网运营部云核心网运营',
      totalCount: 320,
      certifiedCount: 208,
      certRate: 65,
      qualifiedCount: 208,
      qualifiedRate: 65,
    },
    {
      deptCode: 'dept-ict-core-dev',
      deptName: '云核心网研发部',
      totalCount: 280,
      certifiedCount: 190,
      certRate: 67.86,
      qualifiedCount: 190,
      qualifiedRate: 67.86,
    },
    {
      deptCode: 'dept-ict-core-solution',
      deptName: '云核心网解决方案部',
      totalCount: 240,
      certifiedCount: 168,
      certRate: 70,
      qualifiedCount: 168,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-wireless-network',
      deptName: '无线网络产品部',
      totalCount: 350,
      certifiedCount: 245,
      certRate: 70,
      qualifiedCount: 245,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-transmission-access',
      deptName: '传送与接入产品部',
      totalCount: 290,
      certifiedCount: 203,
      certRate: 70,
      qualifiedCount: 203,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-data-communication',
      deptName: '数据通信产品部',
      totalCount: 310,
      certifiedCount: 217,
      certRate: 70,
      qualifiedCount: 217,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-cloud-computing',
      deptName: '云计算产品部',
      totalCount: 330,
      certifiedCount: 231,
      certRate: 70,
      qualifiedCount: 231,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-ai-intelligence',
      deptName: 'AI与智能计算产品部',
      totalCount: 270,
      certifiedCount: 189,
      certRate: 70,
      qualifiedCount: 189,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-software-dev',
      deptName: '软件开发部',
      totalCount: 380,
      certifiedCount: 266,
      certRate: 70,
      qualifiedCount: 266,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-system-integration',
      deptName: '系统集成部',
      totalCount: 260,
      certifiedCount: 182,
      certRate: 70,
      qualifiedCount: 182,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-network-security',
      deptName: '网络安全产品部',
      totalCount: 300,
      certifiedCount: 210,
      certRate: 70,
      qualifiedCount: 210,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-storage-backup',
      deptName: '存储与备份产品部',
      totalCount: 250,
      certifiedCount: 175,
      certRate: 70,
      qualifiedCount: 175,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-big-data',
      deptName: '大数据产品部',
      totalCount: 340,
      certifiedCount: 238,
      certRate: 70,
      qualifiedCount: 238,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-iot-platform',
      deptName: '物联网平台产品部',
      totalCount: 220,
      certifiedCount: 154,
      certRate: 70,
      qualifiedCount: 154,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-edge-computing',
      deptName: '边缘计算产品部',
      totalCount: 280,
      certifiedCount: 196,
      certRate: 70,
      qualifiedCount: 196,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-digital-transformation',
      deptName: '数字化转型产品部',
      totalCount: 360,
      certifiedCount: 252,
      certRate: 70,
      qualifiedCount: 252,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-enterprise-service',
      deptName: '企业服务产品部',
      totalCount: 320,
      certifiedCount: 224,
      certRate: 70,
      qualifiedCount: 224,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-mobile-app',
      deptName: '移动应用产品部',
      totalCount: 300,
      certifiedCount: 210,
      certRate: 70,
      qualifiedCount: 210,
      qualifiedRate: 70,
    },
    {
      deptCode: 'dept-platform-architecture',
      deptName: '平台架构产品部',
      totalCount: 290,
      certifiedCount: 203,
      certRate: 70,
      qualifiedCount: 203,
      qualifiedRate: 70,
    },
  ],
  'dept-ict-core-ops': [
    {
      deptCode: 'dept-ict-core-ops-asia',
      deptName: '亚太运营支撑处',
      totalCount: 140,
      certifiedCount: 96,
      certRate: 68.57,
      qualifiedCount: 96,
      qualifiedRate: 68.57,
    },
    {
      deptCode: 'dept-ict-core-ops-emea',
      deptName: '欧洲中东非运营支撑处',
      totalCount: 110,
      certifiedCount: 70,
      certRate: 63.64,
      qualifiedCount: 70,
      qualifiedRate: 63.64,
    },
  ],
  'dept-ict-core-dev': [
    {
      deptCode: 'dept-ict-core-dev-platform',
      deptName: '网络云平台研发室',
      totalCount: 150,
      certifiedCount: 108,
      certRate: 72,
      qualifiedCount: 108,
      qualifiedRate: 72,
    },
    {
      deptCode: 'dept-ict-core-dev-ai',
      deptName: 'AI 网络创新室',
      totalCount: 120,
      certifiedCount: 84,
      certRate: 70,
      qualifiedCount: 84,
      qualifiedRate: 70,
    },
  ],
  'dept-ict-core-solution': [
    {
      deptCode: 'dept-ict-core-solution-5g',
      deptName: '5G 解决方案办',
      totalCount: 130,
      certifiedCount: 86,
      certRate: 66.15,
      qualifiedCount: 86,
      qualifiedRate: 66.15,
    },
    {
      deptCode: 'dept-ict-core-solution-cloud',
      deptName: '云化核心网方案办',
      totalCount: 110,
      certifiedCount: 78,
      certRate: 70.91,
      qualifiedCount: 78,
      qualifiedRate: 70.91,
    },
  ],
}

const statisticsStore: StatisticsStore = {}

const calculateCertRate = (total: number, certified: number) => {
  if (!total) return 0
  return Number(((certified / total) * 100).toFixed(2))
}

const scaleStatistics = (stats: DepartmentCertStatistic[], multiplier: number) =>
  stats.map((item) => {
    const ratio = item.totalCount ? item.certifiedCount / item.totalCount : 0
    const qualifiedRatio = item.totalCount
      ? (item.qualifiedCount ?? item.certifiedCount ?? 0) / item.totalCount
      : 0
    const totalCount = Math.max(1, Math.round(item.totalCount * multiplier))
    const certifiedCount = Math.max(0, Math.min(totalCount, Math.round(totalCount * ratio)))
    const qualifiedCount = Math.max(0, Math.min(totalCount, Math.round(totalCount * qualifiedRatio)))
    return {
      ...item,
      totalCount,
      certifiedCount,
      certRate: calculateCertRate(totalCount, certifiedCount),
      qualifiedCount,
      qualifiedRate: calculateCertRate(totalCount, qualifiedCount),
    }
  })

const initStore = () => {
  const multipliers: Record<string, number> = {
    '0': 1,
    '1': 0.85,
    '2': 0.65,
    '3': 0.5,
  }

  Object.entries(multipliers).forEach(([personType, multiplier]) => {
    Object.entries(baseStatsByDept).forEach(([deptCode, stats]) => {
      statisticsStore[`${personType}:${deptCode}`] = scaleStatistics(stats, multiplier)
    })
  })
}

initStore()

const cloneStats = (stats: DepartmentCertStatistic[]) => stats.map((item) => ({ ...item }))

const buildTotalStatistics = (stats: DepartmentCertStatistic[]): DepartmentCertStatistic => {
  const totalCount = stats.reduce((sum, item) => sum + (item.totalCount ?? 0), 0)
  const certifiedCount = stats.reduce(
    (sum, item) => sum + (item.certifiedCount ?? item.qualifiedCount ?? 0),
    0
  )
  const qualifiedCount = stats.reduce(
    (sum, item) => sum + (item.qualifiedCount ?? item.certifiedCount ?? 0),
    0
  )
  return {
    deptCode: 'total',
    deptName: '总计',
    totalCount,
    certifiedCount,
    certRate: calculateCertRate(totalCount, certifiedCount),
    qualifiedCount,
    qualifiedRate: calculateCertRate(totalCount, qualifiedCount),
  }
}

export const getEmployeeCertStatistics = (
  deptCode: string,
  personType: string
): EmployeeCertStatisticsResponse => {
  const normalizedDeptCode = deptCode?.trim().length ? deptCode : '0'
  const normalizedPersonType = personType?.trim().length ? personType : '0'
  const key = `${normalizedPersonType}:${normalizedDeptCode}`
  const fallbackByDept = `${normalizedPersonType}:0`
  const fallbackDefault = '0:0'
  const stats =
    statisticsStore[key] ?? statisticsStore[fallbackByDept] ?? statisticsStore[fallbackDefault] ?? []

  const departmentStatistics = cloneStats(stats)
  const totalStatistics = buildTotalStatistics(departmentStatistics)

  return {
    departmentStatistics,
    totalStatistics,
  }
}

