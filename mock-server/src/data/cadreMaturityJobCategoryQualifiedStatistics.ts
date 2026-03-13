import type {
  CadreMaturityJobCategoryQualifiedStatisticsResponse,
  CadreMaturityQualifiedStatistics,
  CadreJobCategoryQualifiedStatistics,
} from '../types'

// 基础职位类任职数据
const baseJobCategories: CadreJobCategoryQualifiedStatistics[] = [
  {
    jobCategory: '软件类',
    baselineCount: 50,
    qualifiedCount: 35,
    qualifiedRate: 70.0,
  },
  {
    jobCategory: '系统类',
    baselineCount: 40,
    qualifiedCount: 28,
    qualifiedRate: 70.0,
  },
  {
    jobCategory: '研究类',
    baselineCount: 30,
    qualifiedCount: 21,
    qualifiedRate: 70.0,
  },
  {
    jobCategory: '管理类',
    baselineCount: 60,
    qualifiedCount: 42,
    qualifiedRate: 70.0,
  },
]

// 基础成熟度任职数据（仅L2和L3，不包含L1）
const baseMaturityData: Omit<CadreMaturityQualifiedStatistics, 'jobCategoryStatistics'>[] = [
  {
    maturityLevel: 'L2',
    baselineCount: 60,
    qualifiedCount: 42,
    qualifiedRate: 70.0,
  },
  {
    maturityLevel: 'L3',
    baselineCount: 40,
    qualifiedCount: 32,
    qualifiedRate: 80.0,
  },
]

type MaturityQualifiedStatisticsStore = Record<string, CadreMaturityQualifiedStatistics[]>

const maturityQualifiedStatisticsStore: MaturityQualifiedStatisticsStore = {}

const calculateRate = (total: number, count: number) => {
  if (!total) return 0
  return Number(((count / total) * 100).toFixed(4))
}

const scaleJobCategoryQualifiedStatistics = (
  categories: CadreJobCategoryQualifiedStatistics[],
  multiplier: number
): CadreJobCategoryQualifiedStatistics[] =>
  categories.map((item) => {
    const qualifiedRatio = item.baselineCount ? item.qualifiedCount / item.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(item.baselineCount * multiplier))
    const qualifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * qualifiedRatio)))
    return {
      ...item,
      baselineCount,
      qualifiedCount,
      qualifiedRate: calculateRate(baselineCount, qualifiedCount),
    }
  })

const scaleMaturityQualifiedStatistics = (
  maturityData: Omit<CadreMaturityQualifiedStatistics, 'jobCategoryStatistics'>[],
  jobCategories: CadreJobCategoryQualifiedStatistics[],
  multiplier: number
): CadreMaturityQualifiedStatistics[] => {
  const scaledJobCategories = scaleJobCategoryQualifiedStatistics(jobCategories, multiplier)
  
  return maturityData.map((maturity) => {
    const qualifiedRatio = maturity.baselineCount ? maturity.qualifiedCount / maturity.baselineCount : 0
    const baselineCount = Math.max(1, Math.round(maturity.baselineCount * multiplier))
    const qualifiedCount = Math.max(0, Math.min(baselineCount, Math.round(baselineCount * qualifiedRatio)))
    
    // 为每个成熟度分配职位类数据（按比例分配）
    const maturityJobCategories = scaledJobCategories.map((cat, index) => {
      const ratio = (index + 1) / scaledJobCategories.length
      const catBaseline = Math.max(1, Math.round(baselineCount * 0.3 * ratio))
      const catQualifiedRatio = cat.baselineCount ? cat.qualifiedCount / cat.baselineCount : 0
      return {
        ...cat,
        baselineCount: catBaseline,
        qualifiedCount: Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catQualifiedRatio))),
        qualifiedRate: calculateRate(catBaseline, Math.max(0, Math.min(catBaseline, Math.round(catBaseline * catQualifiedRatio)))),
      }
    })
    
    return {
      ...maturity,
      baselineCount,
      qualifiedCount,
      qualifiedRate: calculateRate(baselineCount, qualifiedCount),
      jobCategoryStatistics: maturityJobCategories,
    }
  })
}

// 初始化数据存储，支持不同 deptCode 的组合
const initMaturityQualifiedStore = () => {
  const multipliers: Record<string, number> = {
    '0': 1, // 默认
    'dept-ict-core-ops': 0.9,
    'dept-ict-core-dev': 1.1,
    'dept-ict-core-solution': 0.95,
  }

  // 为不同的部门生成数据
  Object.entries(multipliers).forEach(([deptCode, multiplier]) => {
    maturityQualifiedStatisticsStore[deptCode] = scaleMaturityQualifiedStatistics(
      baseMaturityData,
      baseJobCategories,
      multiplier
    )
  })
}

initMaturityQualifiedStore()

const cloneMaturityQualifiedStats = (stats: CadreMaturityQualifiedStatistics[]) =>
  stats.map((item) => ({
    ...item,
    jobCategoryStatistics: item.jobCategoryStatistics
      ? item.jobCategoryStatistics.map((cat) => ({ ...cat }))
      : [],
  }))

const buildTotalQualifiedStatistics = (
  stats: CadreMaturityQualifiedStatistics[]
): CadreMaturityQualifiedStatistics => {
  const baselineCount = stats.reduce((sum, item) => sum + (item.baselineCount ?? 0), 0)
  const qualifiedCount = stats.reduce((sum, item) => sum + (item.qualifiedCount ?? 0), 0)
  
  return {
    maturityLevel: '总计',
    baselineCount,
    qualifiedCount,
    qualifiedRate: calculateRate(baselineCount, qualifiedCount),
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

export const getCadreMaturityJobCategoryQualifiedStatistics = (
  deptCode: string
): CadreMaturityJobCategoryQualifiedStatisticsResponse => {
  const normalizedDeptCode = deptCode?.trim().length ? deptCode : '0'
  const fallbackDefault = '0'

  const maturityStats =
    maturityQualifiedStatisticsStore[normalizedDeptCode] ??
    maturityQualifiedStatisticsStore[fallbackDefault] ??
    scaleMaturityQualifiedStatistics(baseMaturityData, baseJobCategories, 1)

  const maturityStatistics = cloneMaturityQualifiedStats(maturityStats)
  const totalStatistics = buildTotalQualifiedStatistics(maturityStatistics)

  return {
    deptCode: normalizedDeptCode,
    deptName: getDeptName(normalizedDeptCode),
    maturityStatistics,
    totalStatistics,
  }
}

