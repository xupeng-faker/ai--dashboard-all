import type {
  CadreMaturityJobCategoryCertStatisticsResponse,
  CadreMaturityCertStatistics,
  CadreJobCategoryCertStatistics,
} from '../types'

// 基础职位类数据
const baseJobCategories: CadreJobCategoryCertStatistics[] = [
  {
    jobCategory: '软件类',
    baselineCount: 50,
    certifiedCount: 35,
    certRate: 70.0,
    subject2PassCount: 30,
    subject2PassRate: 60.0,
  },
  {
    jobCategory: '系统类',
    baselineCount: 40,
    certifiedCount: 28,
    certRate: 70.0,
    subject2PassCount: 24,
    subject2PassRate: 60.0,
  },
  {
    jobCategory: '研究类',
    baselineCount: 30,
    certifiedCount: 21,
    certRate: 70.0,
    subject2PassCount: 18,
    subject2PassRate: 60.0,
  },
  {
    jobCategory: '管理类',
    baselineCount: 60,
    certifiedCount: 42,
    certRate: 70.0,
    subject2PassCount: 36,
    subject2PassRate: 60.0,
  },
]

// 基础成熟度数据
const baseMaturityData: Omit<CadreMaturityCertStatistics, 'jobCategoryStatistics'>[] = [
  {
    maturityLevel: 'L1',
    baselineCount: 80,
    certifiedCount: 56,
    certRate: 70.0,
    subject2PassCount: 48,
    subject2PassRate: 60.0,
  },
  {
    maturityLevel: 'L2',
    baselineCount: 60,
    certifiedCount: 42,
    certRate: 70.0,
    subject2PassCount: 36,
    subject2PassRate: 60.0,
  },
  {
    maturityLevel: 'L3',
    baselineCount: 40,
    certifiedCount: 28,
    certRate: 70.0,
    subject2PassCount: 24,
    subject2PassRate: 60.0,
  },
]

type MaturityStatisticsStore = Record<string, CadreMaturityCertStatistics[]>

const maturityStatisticsStore: MaturityStatisticsStore = {}

const calculateRate = (total: number, count: number) => {
  if (!total) return 0
  return Number(((count / total) * 100).toFixed(4))
}

const scaleJobCategoryStatistics = (
  categories: CadreJobCategoryCertStatistics[],
  multiplier: number
): CadreJobCategoryCertStatistics[] =>
  categories.map((item) => {
    const certRatio = item.baselineCount ? item.certifiedCount / item.baselineCount : 0
    const subject2Ratio = item.baselineCount ? item.subject2PassCount / item.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(item.baselineCount * multiplier))
    const certifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * certRatio)))
    const subject2PassCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * subject2Ratio)))
    return {
      ...item,
      baselineCount,
      certifiedCount,
      subject2PassCount,
      certRate: calculateRate(baselineCount, certifiedCount),
      subject2PassRate: calculateRate(baselineCount, subject2PassCount),
    }
  })

const scaleMaturityStatistics = (
  maturityData: Omit<CadreMaturityCertStatistics, 'jobCategoryStatistics'>[],
  jobCategories: CadreJobCategoryCertStatistics[],
  multiplier: number
): CadreMaturityCertStatistics[] => {
  const scaledJobCategories = scaleJobCategoryStatistics(jobCategories, multiplier)
  
  return maturityData.map((maturity) => {
    const certRatio = maturity.baselineCount ? maturity.certifiedCount / maturity.baselineCount : 0
    const subject2Ratio = maturity.baselineCount ? maturity.subject2PassCount / maturity.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(maturity.baselineCount * multiplier))
    const certifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * certRatio)))
    const subject2PassCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * subject2Ratio)))
    
    // 为每个成熟度分配职位类数据（按比例分配）
    const maturityJobCategories = scaledJobCategories.map((cat, index) => {
      const ratio = (index + 1) / scaledJobCategories.length
      const catBaseline = Math.max(1, Math.round(baselineCount * 0.3 * ratio))
      const catCertRatio = cat.baselineCount ? cat.certifiedCount / cat.baselineCount : 0
      const catSubject2Ratio = cat.baselineCount ? cat.subject2PassCount / cat.baselineCount : 0
      return {
        ...cat,
        baselineCount: catBaseline,
        certifiedCount: Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catCertRatio))),
        subject2PassCount: Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catSubject2Ratio))),
        certRate: calculateRate(catBaseline, Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catCertRatio)))),
        subject2PassRate: calculateRate(catBaseline, Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catSubject2Ratio)))),
      }
    })
    
    return {
      ...maturity,
      baselineCount,
      certifiedCount,
      subject2PassCount,
      certRate: calculateRate(baselineCount, certifiedCount),
      subject2PassRate: calculateRate(baselineCount, subject2PassCount),
      jobCategoryStatistics: maturityJobCategories,
    }
  })
}

// 初始化数据存储，支持不同 deptCode 的组合
const initMaturityStore = () => {
  const multipliers: Record<string, number> = {
    '0': 1, // 默认
    'dept-ict-core-ops': 0.9,
    'dept-ict-core-dev': 1.1,
    'dept-ict-core-solution': 0.95,
  }

  // 为不同的部门生成数据
  Object.entries(multipliers).forEach(([deptCode, multiplier]) => {
    maturityStatisticsStore[deptCode] = scaleMaturityStatistics(
      baseMaturityData,
      baseJobCategories,
      multiplier
    )
  })
}

initMaturityStore()

const cloneMaturityStats = (stats: CadreMaturityCertStatistics[]) =>
  stats.map((item) => ({
    ...item,
    jobCategoryStatistics: item.jobCategoryStatistics
      ? item.jobCategoryStatistics.map((cat) => ({ ...cat }))
      : [],
  }))

const buildTotalStatistics = (
  stats: CadreMaturityCertStatistics[]
): CadreMaturityCertStatistics => {
  const baselineCount = stats.reduce((sum, item) => sum + (item.baselineCount ?? 0), 0)
  const certifiedCount = stats.reduce((sum, item) => sum + (item.certifiedCount ?? 0), 0)
  const subject2PassCount = stats.reduce((sum, item) => sum + (item.subject2PassCount ?? 0), 0)
  
  return {
    maturityLevel: '总计',
    baselineCount,
    certifiedCount,
    subject2PassCount,
    certRate: calculateRate(baselineCount, certifiedCount),
    subject2PassRate: calculateRate(baselineCount, subject2PassCount),
    jobCategoryStatistics: [],
  }
}

// 根据部门代码获取部门名称
const getDeptName = (deptCode: string): string => {
  const deptNameMap: Record<string, string> = {
    '0': '所有四级部门',
    'dept-ict-core-ops': '云核心网运营部',
    'dept-ict-core-dev': '云核心网研发部',
    'dept-ict-core-solution': '云核心网解决方案部',
  }
  return deptNameMap[deptCode] || `部门-${deptCode}`
}

export const getCadreMaturityJobCategoryCertStatistics = (
  deptCode: string
): CadreMaturityJobCategoryCertStatisticsResponse => {
  const normalizedDeptCode = deptCode?.trim().length ? deptCode : '0'
  const fallbackDefault = '0'

  const maturityStats =
    maturityStatisticsStore[normalizedDeptCode] ??
    maturityStatisticsStore[fallbackDefault] ??
    scaleMaturityStatistics(baseMaturityData, baseJobCategories, 1)

  const maturityStatistics = cloneMaturityStats(maturityStats)
  const totalStatistics = buildTotalStatistics(maturityStatistics)

  return {
    deptCode: normalizedDeptCode,
    deptName: getDeptName(normalizedDeptCode),
    maturityStatistics,
    totalStatistics,
  }
}

