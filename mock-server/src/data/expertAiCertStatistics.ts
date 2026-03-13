import type {
  ExpertAiCertStatisticsResponse,
  ExpertMaturityCertStatistics,
  ExpertJobCategoryCertStatistics,
} from '../types'

// 基础职位类数据
const baseJobCategories: ExpertJobCategoryCertStatistics[] = [
  {
    jobCategory: '软件类',
    baselineCount: 45,
    certifiedCount: 32,
    certRate: 71.11,
  },
  {
    jobCategory: '系统类',
    baselineCount: 35,
    certifiedCount: 25,
    certRate: 71.43,
  },
  {
    jobCategory: '研究类',
    baselineCount: 28,
    certifiedCount: 20,
    certRate: 71.43,
  },
  {
    jobCategory: '管理类',
    baselineCount: 25,
    certifiedCount: 18,
    certRate: 72.0,
  },
]

// 基础成熟度数据（专家只有L2和L3）
const baseMaturityData: Omit<ExpertMaturityCertStatistics, 'jobCategoryStatistics'>[] = [
  {
    maturityLevel: 'L2',
    baselineCount: 80,
    certifiedCount: 58,
    certRate: 72.5,
  },
  {
    maturityLevel: 'L3',
    baselineCount: 53,
    certifiedCount: 37,
    certRate: 69.81,
  },
]

type MaturityStatisticsStore = Record<string, ExpertMaturityCertStatistics[]>

const maturityStatisticsStore: MaturityStatisticsStore = {}

const calculateRate = (total: number, count: number) => {
  if (!total) {
    return 0
  }
  return Number(((count / total) * 100).toFixed(2))
}

const scaleJobCategoryStatistics = (
  categories: ExpertJobCategoryCertStatistics[],
  multiplier: number
): ExpertJobCategoryCertStatistics[] =>
  categories.map((item) => {
    const certRatio = item.baselineCount ? item.certifiedCount / item.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(item.baselineCount * multiplier))
    const certifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * certRatio)))
    return {
      ...item,
      baselineCount,
      certifiedCount,
      certRate: calculateRate(baselineCount, certifiedCount),
    }
  })

const scaleMaturityStatistics = (
  maturityData: Omit<ExpertMaturityCertStatistics, 'jobCategoryStatistics'>[],
  jobCategories: ExpertJobCategoryCertStatistics[],
  multiplier: number
): ExpertMaturityCertStatistics[] => {
  const scaledJobCategories = scaleJobCategoryStatistics(jobCategories, multiplier)
  
  return maturityData.map((maturity) => {
    const certRatio = maturity.baselineCount ? maturity.certifiedCount / maturity.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(maturity.baselineCount * multiplier))
    const certifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * certRatio)))
    
    // 为每个成熟度分配职位类数据（按比例分配）
    const maturityJobCategories = scaledJobCategories.map((cat, index) => {
      const ratio = (index + 1) / scaledJobCategories.length
      const catBaseline = Math.max(1, Math.round(baselineCount * 0.35 * ratio))
      const catCertRatio = cat.baselineCount ? cat.certifiedCount / cat.baselineCount : 0
      return {
        ...cat,
        baselineCount: catBaseline,
        certifiedCount: Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catCertRatio))),
        certRate: calculateRate(catBaseline, Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catCertRatio)))),
      }
    })
    
    return {
      ...maturity,
      baselineCount,
      certifiedCount,
      certRate: calculateRate(baselineCount, certifiedCount),
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

const cloneMaturityStats = (stats: ExpertMaturityCertStatistics[]) =>
  stats.map((item) => ({
    ...item,
    jobCategoryStatistics: item.jobCategoryStatistics
      ? item.jobCategoryStatistics.map((cat) => ({ ...cat }))
      : [],
  }))

const buildTotalStatistics = (
  stats: ExpertMaturityCertStatistics[]
): ExpertMaturityCertStatistics => {
  const baselineCount = stats.reduce((sum, item) => sum + (item.baselineCount ?? 0), 0)
  const certifiedCount = stats.reduce((sum, item) => sum + (item.certifiedCount ?? 0), 0)
  
  return {
    maturityLevel: '总计',
    baselineCount,
    certifiedCount,
    certRate: calculateRate(baselineCount, certifiedCount),
    jobCategoryStatistics: [],
  }
}

// 根据部门代码获取部门名称
const getDeptName = (deptCode: string): string => {
  const deptNameMap: Record<string, string> = {
    '0': '云核心网产品线',
    'dept-ict-core-ops': '云核心网运营部',
    'dept-ict-core-dev': '云核心网研发部',
    'dept-ict-core-solution': '云核心网解决方案部',
  }
  return deptNameMap[deptCode] || `部门-${deptCode}`
}

export const getExpertAiCertStatistics = (
  deptCode: string
): ExpertAiCertStatisticsResponse => {
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





