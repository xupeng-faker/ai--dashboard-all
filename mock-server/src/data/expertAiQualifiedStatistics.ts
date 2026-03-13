import type {
  ExpertAiQualifiedStatisticsResponse,
  ExpertMaturityQualifiedStatistics,
  ExpertJobCategoryQualifiedStatistics,
} from '../types'

// 基础职位类数据
const baseJobCategories: ExpertJobCategoryQualifiedStatistics[] = [
  {
    jobCategory: '软件类',
    baselineCount: 45,
    qualifiedCount: 35,
    qualifiedRate: 77.78,
    qualifiedByRequirementCount: 30,
    qualifiedByRequirementRate: 66.67,
  },
  {
    jobCategory: '系统类',
    baselineCount: 35,
    qualifiedCount: 28,
    qualifiedRate: 80.0,
    qualifiedByRequirementCount: 24,
    qualifiedByRequirementRate: 68.57,
  },
  {
    jobCategory: '研究类',
    baselineCount: 28,
    qualifiedCount: 22,
    qualifiedRate: 78.57,
    qualifiedByRequirementCount: 19,
    qualifiedByRequirementRate: 67.86,
  },
  {
    jobCategory: '管理类',
    baselineCount: 25,
    qualifiedCount: 20,
    qualifiedRate: 80.0,
    qualifiedByRequirementCount: 17,
    qualifiedByRequirementRate: 68.0,
  },
]

// 基础成熟度数据（专家只有L2和L3）
const baseMaturityData: Omit<ExpertMaturityQualifiedStatistics, 'jobCategoryStatistics'>[] = [
  {
    maturityLevel: 'L2',
    baselineCount: 80,
    qualifiedCount: 63,
    qualifiedRate: 78.75,
    qualifiedByRequirementCount: 54,
    qualifiedByRequirementRate: 67.5,
  },
  {
    maturityLevel: 'L3',
    baselineCount: 53,
    qualifiedCount: 42,
    qualifiedRate: 79.25,
    qualifiedByRequirementCount: 36,
    qualifiedByRequirementRate: 67.92,
  },
]

type MaturityStatisticsStore = Record<string, ExpertMaturityQualifiedStatistics[]>

const maturityStatisticsStore: MaturityStatisticsStore = {}

const calculateRate = (total: number, count: number) => {
  if (!total) {
    return 0
  }
  return Number(((count / total) * 100).toFixed(2))
}

const scaleJobCategoryStatistics = (
  categories: ExpertJobCategoryQualifiedStatistics[],
  multiplier: number
): ExpertJobCategoryQualifiedStatistics[] =>
  categories.map((item) => {
    const qualifiedRatio = item.baselineCount ? item.qualifiedCount / item.baselineCount : 0
    const qualifiedByRequirementRatio = item.baselineCount ? (item.qualifiedByRequirementCount ?? 0) / item.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(item.baselineCount * multiplier))
    const qualifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * qualifiedRatio)))
    const qualifiedByRequirementCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * qualifiedByRequirementRatio)))
    return {
      ...item,
      baselineCount,
      qualifiedCount,
      qualifiedByRequirementCount,
      qualifiedRate: calculateRate(baselineCount, qualifiedCount),
      qualifiedByRequirementRate: calculateRate(baselineCount, qualifiedByRequirementCount),
    }
  })

const scaleMaturityStatistics = (
  maturityData: Omit<ExpertMaturityQualifiedStatistics, 'jobCategoryStatistics'>[],
  jobCategories: ExpertJobCategoryQualifiedStatistics[],
  multiplier: number
): ExpertMaturityQualifiedStatistics[] => {
  const scaledJobCategories = scaleJobCategoryStatistics(jobCategories, multiplier)
  
  return maturityData.map((maturity) => {
    const qualifiedRatio = maturity.baselineCount ? maturity.qualifiedCount / maturity.baselineCount : 0
    const qualifiedByRequirementRatio = maturity.baselineCount ? (maturity.qualifiedByRequirementCount ?? 0) / maturity.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(maturity.baselineCount * multiplier))
    const qualifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * qualifiedRatio)))
    const qualifiedByRequirementCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * qualifiedByRequirementRatio)))
    
    // 为每个成熟度分配职位类数据（按比例分配）
    const maturityJobCategories = scaledJobCategories.map((cat, index) => {
      const ratio = (index + 1) / scaledJobCategories.length
      const catBaseline = Math.max(1, Math.round(baselineCount * 0.35 * ratio))
      const catQualifiedRatio = cat.baselineCount ? cat.qualifiedCount / cat.baselineCount : 0
      const catQualifiedByRequirementRatio = cat.baselineCount ? (cat.qualifiedByRequirementCount ?? 0) / cat.baselineCount : 0
      return {
        ...cat,
        baselineCount: catBaseline,
        qualifiedCount: Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catQualifiedRatio))),
        qualifiedByRequirementCount: Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catQualifiedByRequirementRatio))),
        qualifiedRate: calculateRate(catBaseline, Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catQualifiedRatio)))),
        qualifiedByRequirementRate: calculateRate(catBaseline, Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catQualifiedByRequirementRatio)))),
      }
    })
    
    return {
      ...maturity,
      baselineCount,
      qualifiedCount,
      qualifiedByRequirementCount,
      qualifiedRate: calculateRate(baselineCount, qualifiedCount),
      qualifiedByRequirementRate: calculateRate(baselineCount, qualifiedByRequirementCount),
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

const cloneMaturityStats = (stats: ExpertMaturityQualifiedStatistics[]) =>
  stats.map((item) => ({
    ...item,
    jobCategoryStatistics: item.jobCategoryStatistics
      ? item.jobCategoryStatistics.map((cat) => ({ ...cat }))
      : [],
  }))

const buildTotalStatistics = (
  stats: ExpertMaturityQualifiedStatistics[]
): ExpertMaturityQualifiedStatistics => {
  const baselineCount = stats.reduce((sum, item) => sum + (item.baselineCount ?? 0), 0)
  const qualifiedCount = stats.reduce((sum, item) => sum + (item.qualifiedCount ?? 0), 0)
  const qualifiedByRequirementCount = stats.reduce((sum, item) => sum + (item.qualifiedByRequirementCount ?? 0), 0)
  
  return {
    maturityLevel: '总计',
    baselineCount,
    qualifiedCount,
    qualifiedByRequirementCount,
    qualifiedRate: calculateRate(baselineCount, qualifiedCount),
    qualifiedByRequirementRate: calculateRate(baselineCount, qualifiedByRequirementCount),
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

export const getExpertAiQualifiedStatistics = (
  deptCode: string
): ExpertAiQualifiedStatisticsResponse => {
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





