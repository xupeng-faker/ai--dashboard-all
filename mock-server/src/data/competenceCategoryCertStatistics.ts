import type {
  CompetenceCategoryCertStatistics,
  CompetenceCategoryCertStatisticsResponse,
} from '../types'

type CategoryStatisticsStore = Record<string, CompetenceCategoryCertStatistics[]>

// 基础职位类数据
const baseCategories: CompetenceCategoryCertStatistics[] = [
  {
    competenceCategory: 'AI架构师',
    totalCount: 120,
    certifiedCount: 84,
    qualifiedCount: 78,
    certRate: 70.0,
    qualifiedRate: 65.0,
  },
  {
    competenceCategory: '数据科学家',
    totalCount: 150,
    certifiedCount: 105,
    qualifiedCount: 98,
    certRate: 70.0,
    qualifiedRate: 65.33,
  },
  {
    competenceCategory: '算法专家',
    totalCount: 180,
    certifiedCount: 126,
    qualifiedCount: 117,
    certRate: 70.0,
    qualifiedRate: 65.0,
  },
  {
    competenceCategory: '产品经理',
    totalCount: 100,
    certifiedCount: 70,
    qualifiedCount: 65,
    certRate: 70.0,
    qualifiedRate: 65.0,
  },
  {
    competenceCategory: '运营干部',
    totalCount: 80,
    certifiedCount: 56,
    qualifiedCount: 52,
    certRate: 70.0,
    qualifiedRate: 65.0,
  },
  {
    competenceCategory: '营销干部',
    totalCount: 90,
    certifiedCount: 63,
    qualifiedCount: 59,
    certRate: 70.0,
    qualifiedRate: 65.56,
  },
  {
    competenceCategory: '技术专家',
    totalCount: 200,
    certifiedCount: 140,
    qualifiedCount: 130,
    certRate: 70.0,
    qualifiedRate: 65.0,
  },
  {
    competenceCategory: '系统架构师',
    totalCount: 110,
    certifiedCount: 77,
    qualifiedCount: 72,
    certRate: 70.0,
    qualifiedRate: 65.45,
  },
]

const categoryStatisticsStore: CategoryStatisticsStore = {}

const calculateRate = (total: number, count: number) => {
  if (!total) return 0
  return Number(((count / total) * 100).toFixed(2))
}

const scaleCategoryStatistics = (
  categories: CompetenceCategoryCertStatistics[],
  multiplier: number
): CompetenceCategoryCertStatistics[] =>
  categories.map((item) => {
    const certRatio = item.totalCount ? item.certifiedCount / item.totalCount : 0
    const qualifiedRatio = item.totalCount ? item.qualifiedCount / item.totalCount : 0
    const totalCount = Math.max(1, Math.round(item.totalCount * multiplier))
    const certifiedCount = Math.max(0, Math.min(totalCount, Math.round(totalCount * certRatio)))
    const qualifiedCount = Math.max(0, Math.min(totalCount, Math.round(totalCount * qualifiedRatio)))
    return {
      ...item,
      totalCount,
      certifiedCount,
      qualifiedCount,
      certRate: calculateRate(totalCount, certifiedCount),
      qualifiedRate: calculateRate(totalCount, qualifiedCount),
    }
  })

// 初始化数据存储，支持不同 personType 和 deptCode 的组合
const initCategoryStore = () => {
  const multipliers: Record<string, number> = {
    '0': 1, // 全员
    '1': 0.85, // 干部
  }

  // 为不同的 personType 和 deptCode 组合生成数据
  Object.entries(multipliers).forEach(([personType, multiplier]) => {
    // 为不同的部门生成数据（可以根据需要扩展）
    const deptCodes = ['0', 'dept-ict-core-ops', 'dept-ict-core-dev', 'dept-ict-core-solution']
    deptCodes.forEach((deptCode) => {
      const key = `${personType}:${deptCode}`
      categoryStatisticsStore[key] = scaleCategoryStatistics(baseCategories, multiplier)
    })
  })
}

initCategoryStore()

const cloneCategoryStats = (stats: CompetenceCategoryCertStatistics[]) =>
  stats.map((item) => ({ ...item }))

const buildTotalCategoryStatistics = (
  stats: CompetenceCategoryCertStatistics[]
): CompetenceCategoryCertStatistics => {
  const totalCount = stats.reduce((sum, item) => sum + (item.totalCount ?? 0), 0)
  const certifiedCount = stats.reduce((sum, item) => sum + (item.certifiedCount ?? 0), 0)
  const qualifiedCount = stats.reduce((sum, item) => sum + (item.qualifiedCount ?? 0), 0)
  return {
    competenceCategory: '总计',
    totalCount,
    certifiedCount,
    qualifiedCount,
    certRate: calculateRate(totalCount, certifiedCount),
    qualifiedRate: calculateRate(totalCount, qualifiedCount),
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

export const getCompetenceCategoryCertStatistics = (
  deptCode: string,
  personType: string
): CompetenceCategoryCertStatisticsResponse => {
  const normalizedDeptCode = deptCode?.trim().length ? deptCode : '0'
  const normalizedPersonType = personType?.trim().length ? personType : '0'
  const key = `${normalizedPersonType}:${normalizedDeptCode}`
  const fallbackByDept = `${normalizedPersonType}:0`
  const fallbackDefault = '0:0'

  const categoryStats =
    categoryStatisticsStore[key] ??
    categoryStatisticsStore[fallbackByDept] ??
    categoryStatisticsStore[fallbackDefault] ??
    scaleCategoryStatistics(baseCategories, normalizedPersonType === '1' ? 0.85 : 1)

  const categoryStatistics = cloneCategoryStats(categoryStats)
  const totalStatistics = buildTotalCategoryStatistics(categoryStatistics)

  return {
    deptCode: normalizedDeptCode,
    deptName: getDeptName(normalizedDeptCode),
    categoryStatistics,
    totalStatistics,
  }
}

