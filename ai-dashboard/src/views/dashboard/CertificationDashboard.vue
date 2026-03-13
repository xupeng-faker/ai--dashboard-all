<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { Medal, QuestionFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  fetchCertificationDashboard,
  fetchExpertData,
  fetchCadreData,
  fetchAllStaffTrends,
  fetchDepartmentStats,
  fetchJobCategoryStats,
  fetchDashboardFilters,
  fetchPlTmCertStatistics,
  fetchCadrePositionOverview,
  fetchCadreAiCertificationOverview,
} from '@/api/dashboard'
import { normalizeRoleOptions } from '@/constants/roles'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'
import StatCard from '@/components/common/StatCard.vue'
import CertificationSummaryTable from '@/components/dashboard/CertificationSummaryTable.vue'
import BarLineChart from '@/components/dashboard/BarLineChart.vue'
import type {
  CertificationDashboardData,
  CertificationDashboardFilters,
  CompetenceCategoryCertStatistics,
  DepartmentCertStatistic,
  StaffChartPoint,
  ExpertCertificationSummaryRow,
  ExpertAppointmentSummaryRow,
  CadreCertificationSummaryRow,
  CadreAppointmentSummaryRow,
  EmployeeCertStatisticsResponse,
  CompetenceCategoryCertStatisticsResponse,
  DepartmentNode,
  SelectOption,
  CertificationRole,
  EntryLevelManagerPmCertRow,
  CadrePositionOverviewRow,
  CadreAiAppointmentCertRow,
  CadreAiOverviewStatisticsVO,
} from '@/types/dashboard'

const router = useRouter()

// 各个数据块的独立loading状态
const loadingExpert = ref(false)
const loadingCadre = ref(false)
const loadingEntryLevelManagerPm = ref(false)
const loadingAllStaffTrends = ref(false)
const loadingDepartmentStats = ref(false)
const loadingJobCategoryStats = ref(false)
const loadingFilters = ref(false)

// 图表/表格切换状态 - 统一管理所有图表
const allChartsViewMode = ref<'chart' | 'table'>('chart')

// 切换所有图表显示模式
const toggleAllChartsView = () => {
  allChartsViewMode.value = allChartsViewMode.value === 'chart' ? 'table' : 'chart'
}

// 获取切换按钮文本
const getToggleButtonText = () => {
  return allChartsViewMode.value === 'chart' ? '切换为表格' : '切换为图例'
}

// 各个数据块的数据
const expertData = ref<{
  certification: (ExpertCertificationSummaryRow & { isMaturityRow?: boolean })[]
  appointment: ExpertAppointmentSummaryRow[]
} | null>(null)
const cadreData = ref<{
  certification: (CadreCertificationSummaryRow & { isMaturityRow?: boolean })[]
  appointment: (CadreAppointmentSummaryRow & { isMaturityRow?: boolean })[]
} | null>(null)
const allStaffTrends = ref<{
  departmentAppointment: StaffChartPoint[]
  organizationAppointment: StaffChartPoint[]
  jobCategoryAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  organizationCertification: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
} | null>(null)
const departmentStats = ref<{
  departmentAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  employeeCertStatistics: EmployeeCertStatisticsResponse | null
} | null>(null)
const jobCategoryStats = ref<{
  jobCategoryAppointment: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
  competenceCategoryCertStatistics: CompetenceCategoryCertStatisticsResponse | null
} | null>(null)
const dashboardFilters = ref<{
  departmentTree: DepartmentNode[]
  roles: SelectOption<CertificationRole>[]
} | null>(null)
const entryLevelManagerPmData = ref<EntryLevelManagerPmCertRow[] | null>(null)
const cadrePositionOverviewData = ref<CadrePositionOverviewRow[] | null>(null)
const cadreAiAppointmentCertData = ref<CadreAiAppointmentCertRow[] | null>(null)

// 为了兼容现有代码，保留dashboardData的computed属性
const dashboardData = computed<CertificationDashboardData | null>(() => {
  if (!expertData.value || !cadreData.value || !allStaffTrends.value || !dashboardFilters.value) {
    return null
  }

  return {
    metrics: [],
    expertCertification: expertData.value.certification,
    expertAppointment: expertData.value.appointment,
    cadreCertification: cadreData.value.certification,
    cadreAppointment: cadreData.value.appointment,
    allStaff: {
      departmentAppointment: departmentStats.value?.departmentAppointment ?? allStaffTrends.value.departmentAppointment,
      organizationAppointment: allStaffTrends.value.organizationAppointment,
      jobCategoryAppointment: jobCategoryStats.value?.jobCategoryAppointment ?? allStaffTrends.value.jobCategoryAppointment,
      departmentCertification: departmentStats.value?.departmentCertification ?? allStaffTrends.value.departmentCertification,
      organizationCertification: allStaffTrends.value.organizationCertification,
      jobCategoryCertification: jobCategoryStats.value?.jobCategoryCertification ?? allStaffTrends.value.jobCategoryCertification,
    },
    employeeCertStatistics: departmentStats.value?.employeeCertStatistics ?? null,
    competenceCategoryCertStatistics: jobCategoryStats.value?.competenceCategoryCertStatistics ?? null,
    filters: dashboardFilters.value,
  }
})

const filters = ref<CertificationDashboardFilters>({
  role: '0',
  departmentPath: ['ICT_BG', 'CLOUD_CORE_NETWORK'],
})

const {
  departmentTree: departmentOptions,
  cascaderProps,
  initDepartmentTree,
  refreshDepartmentTree,
} = useDepartmentFilter()

const roleOptions = computed(() => normalizeRoleOptions(dashboardFilters.value?.roles ?? []))

// 职位类排序顺序
const jobCategoryOrder = ['软件类', '研究类', '测试类', '系统类', '产品开发项目管理类', '其他类']

// 获取职位类的排序索引
const getJobCategoryOrder = (jobCategory: string): number => {
  const index = jobCategoryOrder.indexOf(jobCategory)
  return index >= 0 ? index : jobCategoryOrder.length // 未定义的职位类排在最后
}

// 对专家数据进行排序（按成熟度级别分组，然后对职位类排序）
const sortExpertDataByJobCategory = <T extends { maturityLevel?: string; jobCategory?: string; isMaturityRow?: boolean }>(
  data: T[]
): T[] => {
  if (!data || data.length === 0) {
    return data
  }

  const sortedData: T[] = []
  let currentMaturityGroup: T[] = []

  for (const row of data) {
    // 判断是否是成熟度行：isMaturityRow 为 true，或者 maturityLevel 有值且 jobCategory 为空
    const isMaturityRow = row.isMaturityRow === true || 
      (!!row.maturityLevel && (!row.jobCategory || row.jobCategory.trim() === ''))
    
    if (isMaturityRow) {
      // 如果之前有未处理的组，先排序并添加到结果中
      if (currentMaturityGroup.length > 0) {
        // 对职位类行进行排序
        currentMaturityGroup.sort((a, b) => {
          const orderA = getJobCategoryOrder(a.jobCategory || '')
          const orderB = getJobCategoryOrder(b.jobCategory || '')
          return orderA - orderB
        })
        sortedData.push(...currentMaturityGroup)
        currentMaturityGroup = []
      }
      // 添加成熟度行
      sortedData.push(row)
    } else if (row.jobCategory) {
      // 职位类行，添加到当前组
      currentMaturityGroup.push(row)
    } else {
      // 其他情况，直接添加
      sortedData.push(row)
    }
  }

  // 处理最后一组
  if (currentMaturityGroup.length > 0) {
    currentMaturityGroup.sort((a, b) => {
      const orderA = getJobCategoryOrder(a.jobCategory || '')
      const orderB = getJobCategoryOrder(b.jobCategory || '')
      return orderA - orderB
    })
    sortedData.push(...currentMaturityGroup)
  }

  return sortedData
}

// 排序后的专家任职数据
const sortedExpertAppointmentData = computed(() => {
  if (!expertData.value?.appointment) {
    return []
  }
  return sortExpertDataByJobCategory(expertData.value.appointment)
})

// 排序后的专家认证数据
const sortedExpertCertificationData = computed(() => {
  if (!expertData.value?.certification) {
    return []
  }
  return sortExpertDataByJobCategory(expertData.value.certification)
})

const departmentStatistics = computed(
  () => departmentStats.value?.employeeCertStatistics?.departmentStatistics ?? []
)
const resolveQualifiedCount = (item?: DepartmentCertStatistic | null) =>
  item?.qualifiedCount ?? 0
const resolveCertificationCount = (item?: DepartmentCertStatistic | null) =>
  item?.certifiedCount ?? 0
const resolveCertificationRate = (item?: DepartmentCertStatistic | null) =>
  Number(item?.certRate ?? 0)
const resolveQualifiedRate = (item?: DepartmentCertStatistic | null) =>
  Number(item?.qualifiedRate ?? 0)
// 部门ID顺序定义（从左到右）
const departmentOrder = ['047375', '047374', '043539', '041852', '033039', '038460', '030699', '038462', '038461', '047376']
// 获取部门在顺序数组中的索引
const getDepartmentOrder = (deptCode?: string): number => {
  if (!deptCode) {
    return departmentOrder.length
  }
  const index = departmentOrder.indexOf(deptCode)
  return index >= 0 ? index : departmentOrder.length // 未定义的部门排在最后
}

// 获取当前选择的部门代码
const currentDeptCode = computed(() => resolveDepartmentCode(filters.value.departmentPath))

// 判断是否需要过滤部门数据：当选择的部门ID是"0"或"031562"时，需要过滤
const shouldFilterDepartments = computed(() => {
  const deptCode = currentDeptCode.value
  return deptCode === '0' || deptCode === '031562'
})

const departmentStatsPoints = computed<StaffChartPoint[]>(() => {
  const mappedData = departmentStatistics.value
    .map((item) => ({
      label: item.deptName?.trim().length ? item.deptName : item.deptCode,
      count: resolveQualifiedCount(item),
      rate: resolveQualifiedRate(item),
      deptCode: item.deptCode,
    }))
  
  // 根据当前选择的部门ID决定是否过滤
  const filteredData = shouldFilterDepartments.value
    ? mappedData.filter((item) => {
        // 当选择的部门ID是"0"或"031562"时，只保留指定顺序中的部门
        return item.deptCode && departmentOrder.includes(item.deptCode)
      })
    : mappedData // 否则直接显示后端返回的所有数据
  
  // 如果需要过滤，按照指定的部门顺序排序；否则保持后端返回的顺序
  if (shouldFilterDepartments.value) {
    return filteredData.sort((a, b) => {
      const orderA = getDepartmentOrder(a.deptCode)
      const orderB = getDepartmentOrder(b.deptCode)
      return orderA - orderB
    })
  }
  
  return filteredData
})
const departmentCertificationStatsPoints = computed<StaffChartPoint[]>(() => {
  const mappedData = departmentStatistics.value
    .map((item) => ({
      label: item.deptName?.trim().length ? item.deptName : item.deptCode,
      count: resolveCertificationCount(item),
      rate: resolveCertificationRate(item),
      deptCode: item.deptCode,
    }))
  
  // 根据当前选择的部门ID决定是否过滤
  const filteredData = shouldFilterDepartments.value
    ? mappedData.filter((item) => {
        // 当选择的部门ID是"0"或"031562"时，只保留指定顺序中的部门
        return item.deptCode && departmentOrder.includes(item.deptCode)
      })
    : mappedData // 否则直接显示后端返回的所有数据
  
  // 如果需要过滤，按照指定的部门顺序排序；否则保持后端返回的顺序
  if (shouldFilterDepartments.value) {
    return filteredData.sort((a, b) => {
      const orderA = getDepartmentOrder(a.deptCode)
      const orderB = getDepartmentOrder(b.deptCode)
      return orderA - orderB
    })
  }
  
  return filteredData
})
const hasDepartmentStats = computed(() => departmentStatsPoints.value.length > 0)
const fallbackDepartmentPoints = computed<StaffChartPoint[]>(
  () => allStaffTrends.value?.departmentAppointment ?? []
)
const departmentChartPoints = computed<StaffChartPoint[]>(() =>
  hasDepartmentStats.value ? departmentStatsPoints.value : fallbackDepartmentPoints.value
)
const fallbackDepartmentCertificationPoints = computed<StaffChartPoint[]>(
  () => allStaffTrends.value?.departmentCertification ?? []
)
const departmentCertificationChartPoints = computed<StaffChartPoint[]>(() =>
  hasDepartmentStats.value
    ? departmentCertificationStatsPoints.value
    : fallbackDepartmentCertificationPoints.value
)
const departmentCountLabel = computed(() => 'AI任职总人数')
const departmentLegendTotals = computed<Record<string, string> | undefined>(() => {
  if (!hasDepartmentStats.value) return undefined
  const total = departmentStats.value?.employeeCertStatistics?.totalStatistics
  if (!total) return undefined
  return {
    [departmentCountLabel.value]: `${resolveQualifiedCount(total)}人`,
    占比: `${resolveQualifiedRate(total)}%`,
  }
})
const departmentCertificationLegendTotals = computed<Record<string, string> | undefined>(() => {
  if (!hasDepartmentStats.value) return undefined
  const total = departmentStats.value?.employeeCertStatistics?.totalStatistics
  if (!total) return undefined
  return {
    认证总人数: `${resolveCertificationCount(total)}人`,
    占比: `${resolveCertificationRate(total)}%`,
  }
})

// 职位类统计数据
const competenceCategoryStatistics = computed(
  () => jobCategoryStats.value?.competenceCategoryCertStatistics?.categoryStatistics ?? []
)
const hasJobCategoryStats = computed(() => competenceCategoryStatistics.value.length > 0)
const resolveJobCategoryQualifiedCount = (item?: CompetenceCategoryCertStatistics | null) =>
  item?.qualifiedCount ?? 0
const resolveJobCategoryCertificationCount = (item?: CompetenceCategoryCertStatistics | null) =>
  item?.certifiedCount ?? 0
const resolveJobCategoryQualifiedRate = (item?: CompetenceCategoryCertStatistics | null) =>
  Number(item?.qualifiedRate ?? 0)
const resolveJobCategoryCertificationRate = (item?: CompetenceCategoryCertStatistics | null) =>
  Number(item?.certRate ?? 0)

// 职位类任职数据图例总计
const jobCategoryAppointmentLegendTotals = computed<Record<string, string> | undefined>(() => {
  if (!hasJobCategoryStats.value) return undefined
  const total = jobCategoryStats.value?.competenceCategoryCertStatistics?.totalStatistics
  if (!total) return undefined
  return {
    任职总人数: `${resolveJobCategoryQualifiedCount(total)}人`,
    占比: `${resolveJobCategoryQualifiedRate(total)}%`,
  }
})

// 职位类认证数据图例总计
const jobCategoryCertificationLegendTotals = computed<Record<string, string> | undefined>(() => {
  if (!hasJobCategoryStats.value) return undefined
  const total = jobCategoryStats.value?.competenceCategoryCertStatistics?.totalStatistics
  if (!total) return undefined
  return {
    认证总人数: `${resolveJobCategoryCertificationCount(total)}人`,
    占比: `${resolveJobCategoryCertificationRate(total)}%`,
  }
})

// 职位类任职数据（过滤和排序）
const jobCategoryAppointmentPoints = computed<StaffChartPoint[]>(() => {
  const points = dashboardData.value?.allStaff.jobCategoryAppointment ?? []
  return points
    .filter((item) => item.rate > 0)
    .sort((a, b) => {
      // 按照指定的职位类顺序排序
      const orderA = getJobCategoryOrder(a.label)
      const orderB = getJobCategoryOrder(b.label)
      return orderA - orderB
    })
})

// 职位类认证数据（过滤和排序）
const jobCategoryCertificationPoints = computed<StaffChartPoint[]>(() => {
  const points = dashboardData.value?.allStaff.jobCategoryCertification ?? []
  return points
    .filter((item) => item.rate > 0)
    .sort((a, b) => {
      // 按照指定的职位类顺序排序
      const orderA = getJobCategoryOrder(a.label)
      const orderB = getJobCategoryOrder(b.label)
      return orderA - orderB
    })
})

// 组织AI成熟度任职数据（过滤和排序）
const organizationAppointmentPoints = computed<StaffChartPoint[]>(() => {
  const points = dashboardData.value?.allStaff.organizationAppointment ?? []
  return points
    .filter((item) => item.rate > 0)
    .sort((a, b) => {
      // 首先按占比从高到低排序
      if (b.rate !== a.rate) {
        return b.rate - a.rate
      }
      // 占比一致时，按人数从高到低排序
      return b.count - a.count
    })
})

// 组织AI成熟度认证数据（过滤和排序）
const organizationCertificationPoints = computed<StaffChartPoint[]>(() => {
  const points = dashboardData.value?.allStaff.organizationCertification ?? []
  return points
    .filter((item) => item.rate > 0)
    .sort((a, b) => {
      // 首先按占比从高到低排序
      if (b.rate !== a.rate) {
        return b.rate - a.rate
      }
      // 占比一致时，按人数从高到低排序
      return b.count - a.count
    })
})

// 组织AI成熟度任职数据图例总计
const organizationAppointmentLegendTotals = computed<Record<string, string> | undefined>(() => {
  const points = dashboardData.value?.allStaff.organizationAppointment ?? []
  if (points.length === 0) {
    return undefined
  }
  // 计算总人数和总任职人数
  let totalBaseline = 0
  let totalAppointed = 0
  points.forEach((point) => {
    // 从占比反推总人数：总人数 = 任职人数 / (占比 / 100) = 任职人数 * 100 / 占比
    if (point.rate > 0) {
      const baseline = Math.round((point.count * 100) / point.rate)
      totalBaseline += baseline
      totalAppointed += point.count
    } else {
      // 如果占比为0，无法反推，直接累加人数（这种情况较少）
      totalAppointed += point.count
    }
  })
  // 计算总占比
  const totalRate = totalBaseline > 0 ? ((totalAppointed / totalBaseline) * 100).toFixed(2) : '0.00'
  return {
    任职总人数: `${totalAppointed}人`,
    占比: `${totalRate}%`,
  }
})

// 组织AI成熟度认证数据图例总计
const organizationCertificationLegendTotals = computed<Record<string, string> | undefined>(() => {
  const points = dashboardData.value?.allStaff.organizationCertification ?? []
  if (points.length === 0) {
    return undefined
  }
  // 计算总人数和总认证人数
  let totalBaseline = 0
  let totalCertified = 0
  points.forEach((point) => {
    // 从占比反推总人数：总人数 = 认证人数 / (占比 / 100) = 认证人数 * 100 / 占比
    if (point.rate > 0) {
      const baseline = Math.round((point.count * 100) / point.rate)
      totalBaseline += baseline
      totalCertified += point.count
    } else {
      // 如果占比为0，无法反推，直接累加人数（这种情况较少）
      totalCertified += point.count
    }
  })
  // 计算总占比
  const totalRate = totalBaseline > 0 ? ((totalCertified / totalBaseline) * 100).toFixed(2) : '0.00'
  return {
    认证总人数: `${totalCertified}人`,
    占比: `${totalRate}%`,
  }
})

// 合并后的表格数据（用于表格视图）
const mergedDepartmentTableData = computed<MergedTableRow[]>(() => {
  return mergeAppointmentAndCertification(departmentChartPoints.value, departmentCertificationChartPoints.value)
})

const mergedJobCategoryTableData = computed<MergedTableRow[]>(() => {
  return mergeAppointmentAndCertification(jobCategoryAppointmentPoints.value, jobCategoryCertificationPoints.value)
})

const mergedOrganizationTableData = computed<MergedTableRow[]>(() => {
  return mergeAppointmentAndCertification(organizationAppointmentPoints.value, organizationCertificationPoints.value)
})

// 渐进式加载各个数据块
const loadExpertData = async () => {
  loadingExpert.value = true
  try {
    const deptCode = resolveDepartmentCode(filters.value.departmentPath)
    expertData.value = await fetchExpertData(deptCode)
  } catch (error) {
    console.error('加载专家数据失败:', error)
  } finally {
    loadingExpert.value = false
  }
}

const loadCadrePositionOverview = async () => {
  try {
    const res = await fetchCadrePositionOverview()
    if (res) {
      const rows: CadrePositionOverviewRow[] = []

      // 递归处理部门列表
      const processDept = (dept: any) => {
        // 创建当前部门的行数据
        const row: CadrePositionOverviewRow = {
          department: dept.deptName,
          totalPositionCount: dept.totalPositionCount,
          l2L3TotalCount: dept.l2L3PositionCount,
          l2L3Rate: dept.l2L3PositionRatio,
          l2SoftwareCount: dept.l2Statistics?.softwareCount || 0,
          l2NonSoftwareCount: dept.l2Statistics?.nonSoftwareCount || 0,
          l3SoftwareCount: dept.l3Statistics?.softwareCount || 0,
          l3NonSoftwareCount: dept.l3Statistics?.nonSoftwareCount || 0,
          isLevel3: dept.deptLevel === 'L3',
          isLevel4: dept.deptLevel === 'L4',
          deptCode: dept.deptCode,
        }
        rows.push(row)

        // 如果有子部门，递归处理
        if (dept.children && dept.children.length > 0) {
          dept.children.forEach((child: any) => processDept(child))
        }
      }

      if (res.departmentList) {
        res.departmentList.forEach((dept) => processDept(dept))
      }

      // 添加总计行
      if (res.summary) {
        rows.push({
          department: '云核总计',
          totalPositionCount: res.summary.totalPositionCount,
          l2L3TotalCount: res.summary.l2L3PositionCount,
          l2L3Rate: res.summary.l2L3PositionRatio,
          l2SoftwareCount: res.summary.l2Statistics?.softwareCount || 0,
          l2NonSoftwareCount: res.summary.l2Statistics?.nonSoftwareCount || 0,
          l3SoftwareCount: res.summary.l3Statistics?.softwareCount || 0,
          l3NonSoftwareCount: res.summary.l3Statistics?.nonSoftwareCount || 0,
          isLevel3: true, // 使用相同样式
          isLevel4: false,
        })
      }

      cadrePositionOverviewData.value = rows
    }
  } catch (error) {
    console.error('获取AI干部岗位概述数据失败:', error)
  }
}

const cadrePositionOverviewRowStyle = ({ row }: { row: CadrePositionOverviewRow }) => {
  if (row.isLevel3) {
    return { fontWeight: 'bold', fontSize: '15px', backgroundColor: '#fafafa' }
  }
  return {}
}

const cadreAiAppointmentCertRowStyle = ({ row }: { row: CadreAiAppointmentCertRow }) => {
  if (row.isLevel3) {
    return { fontWeight: 'bold', fontSize: '15px', backgroundColor: '#fafafa' }
  }
  return {}
}

const loadCadreAiAppointmentCertData = async () => {
  try {
    const res = await fetchCadreAiCertificationOverview()
    if (res) {
      const rows: CadreAiAppointmentCertRow[] = []

      // 递归处理部门列表
      const processDept = (dept: CadreAiOverviewStatisticsVO) => {
        const row: CadreAiAppointmentCertRow = {
          department: dept.deptName,
          totalCadreCount: dept.totalCadreCount,
          l2L3Count: dept.l2L3Count,
          softwareL2Count: dept.softwareL2Count,
          softwareL3Count: dept.softwareL3Count,
          nonSoftwareL2L3Count: dept.nonSoftwareL2L3Count,
          qualifiedL2L3Count: dept.qualifiedL2L3Count,
          qualifiedL2L3Ratio: dept.qualifiedL2L3Ratio,
          isLevel3: dept.deptLevel === 'L3',
          isLevel4: dept.deptLevel === 'L4',
          deptCode: dept.deptCode,
        }
        rows.push(row)

        if (dept.children && dept.children.length > 0) {
          dept.children.forEach((child) => processDept(child))
        }
      }

      if (res.departmentList) {
        res.departmentList.forEach((dept) => processDept(dept))
      }

      // 添加总计行
      if (res.summary) {
        rows.push({
          department: '云核总计',
          totalCadreCount: res.summary.totalCadreCount,
          l2L3Count: res.summary.l2L3Count,
          softwareL2Count: res.summary.softwareL2Count,
          softwareL3Count: res.summary.softwareL3Count,
          nonSoftwareL2L3Count: res.summary.nonSoftwareL2L3Count,
          qualifiedL2L3Count: res.summary.qualifiedL2L3Count,
          qualifiedL2L3Ratio: res.summary.qualifiedL2L3Ratio,
          isLevel3: true,
          isLevel4: false,
        })
      }

      cadreAiAppointmentCertData.value = rows
    }
  } catch (error) {
    console.error('获取干部AI任职认证表数据失败:', error)
  }
}

const loadCadreData = async () => {
  loadingCadre.value = true
  try {
    const deptCode = resolveDepartmentCode(filters.value.departmentPath)
    await Promise.all([
      fetchCadreData(deptCode).then((res) => {
        cadreData.value = res
      }),
      loadCadrePositionOverview(),
      loadCadreAiAppointmentCertData(),
    ])
  } catch (error) {
    console.error('加载干部数据失败:', error)
  } finally {
    loadingCadre.value = false
  }
}

const loadEntryLevelManagerPmData = async () => {
  loadingEntryLevelManagerPm.value = true
  try {
    const response = await fetchPlTmCertStatistics()
    if (response) {
      // 将接口返回的数据转换为前端需要的格式
      const rows: EntryLevelManagerPmCertRow[] = []
      
      // 添加汇总数据（研发管理部整体）
      if (response.summary) {
        rows.push({
          department: response.summary.deptName || '研发管理部',
          // TM/PL队伍数据（从 plTm 对象中获取）
          tmPlTotalCount: response.summary.plTm?.totalCount || 0,
          tmPlAi3PlusCount: response.summary.plTm?.qualifiedCount || 0,
          tmPlAi3PlusRate: (response.summary.plTm?.qualifiedRatio || 0) * 100, // 转换为百分比
          tmPlProfessionalCertCount: response.summary.plTm?.certCount || 0,
          tmPlProfessionalCertRate: (response.summary.plTm?.certRatio || 0) * 100, // 转换为百分比
          // PM队伍数据（从 pm 对象中获取）
          pmTotalCount: response.summary.pm?.totalCount || 0,
          pmAi3PlusCount: response.summary.pm?.qualifiedCount || 0,
          pmAi3PlusRate: (response.summary.pm?.qualifiedRatio || 0) * 100, // 转换为百分比
          pmProfessionalCertCount: response.summary.pm?.certCount || 0,
          pmProfessionalCertRate: (response.summary.pm?.certRatio || 0) * 100, // 转换为百分比
        })
      }
      
      // 添加各四级部门数据
      if (response.departmentList && response.departmentList.length > 0) {
        response.departmentList.forEach((dept) => {
          rows.push({
            department: dept.deptName || dept.deptCode || '未知部门',
            // TM/PL队伍数据（从 plTm 对象中获取）
            tmPlTotalCount: dept.plTm?.totalCount || 0,
            tmPlAi3PlusCount: dept.plTm?.qualifiedCount || 0,
            tmPlAi3PlusRate: (dept.plTm?.qualifiedRatio || 0) * 100, // 转换为百分比
            tmPlProfessionalCertCount: dept.plTm?.certCount || 0,
            tmPlProfessionalCertRate: (dept.plTm?.certRatio || 0) * 100, // 转换为百分比
            // PM队伍数据（从 pm 对象中获取）
            pmTotalCount: dept.pm?.totalCount || 0,
            pmAi3PlusCount: dept.pm?.qualifiedCount || 0,
            pmAi3PlusRate: (dept.pm?.qualifiedRatio || 0) * 100, // 转换为百分比
            pmProfessionalCertCount: dept.pm?.certCount || 0,
            pmProfessionalCertRate: (dept.pm?.certRatio || 0) * 100, // 转换为百分比
          })
        })
      }
      
      // 在最后添加"云核总计"行，数据与云核心网研发管理部完全一致
      const cloudCoreDept = rows.find((row) => row.department === '云核心网研发管理部')
      if (cloudCoreDept) {
        rows.push({
          department: '云核总计',
          // 复制云核心网研发管理部的所有数据
          tmPlTotalCount: cloudCoreDept.tmPlTotalCount,
          tmPlAi3PlusCount: cloudCoreDept.tmPlAi3PlusCount,
          tmPlAi3PlusRate: cloudCoreDept.tmPlAi3PlusRate,
          tmPlProfessionalCertCount: cloudCoreDept.tmPlProfessionalCertCount,
          tmPlProfessionalCertRate: cloudCoreDept.tmPlProfessionalCertRate,
          pmTotalCount: cloudCoreDept.pmTotalCount,
          pmAi3PlusCount: cloudCoreDept.pmAi3PlusCount,
          pmAi3PlusRate: cloudCoreDept.pmAi3PlusRate,
          pmProfessionalCertCount: cloudCoreDept.pmProfessionalCertCount,
          pmProfessionalCertRate: cloudCoreDept.pmProfessionalCertRate,
        })
      }
      
      entryLevelManagerPmData.value = rows
    } else {
      entryLevelManagerPmData.value = []
    }
  } catch (error) {
    console.error('加载基层主管和PM数据失败:', error)
    entryLevelManagerPmData.value = []
  } finally {
    loadingEntryLevelManagerPm.value = false
  }
}

const loadAllStaffTrends = async () => {
  loadingAllStaffTrends.value = true
  try {
    allStaffTrends.value = await fetchAllStaffTrends()
  } catch (error) {
    console.error('加载全员趋势数据失败:', error)
  } finally {
    loadingAllStaffTrends.value = false
  }
}

const loadDepartmentStats = async () => {
  loadingDepartmentStats.value = true
  try {
    const deptCode = resolveDepartmentCode(filters.value.departmentPath)
    const personType = filters.value.role ?? '0'
    departmentStats.value = await fetchDepartmentStats(deptCode, personType)
  } catch (error) {
    console.error('加载部门统计数据失败:', error)
  } finally {
    loadingDepartmentStats.value = false
  }
}

const loadJobCategoryStats = async () => {
  loadingJobCategoryStats.value = true
  try {
    const deptCode = resolveDepartmentCode(filters.value.departmentPath)
    const personType = filters.value.role ?? '0'
    jobCategoryStats.value = await fetchJobCategoryStats(deptCode, personType)
  } catch (error) {
    console.error('加载职位类统计数据失败:', error)
  } finally {
    loadingJobCategoryStats.value = false
  }
}

const loadFilters = async () => {
  loadingFilters.value = true
  try {
    dashboardFilters.value = await fetchDashboardFilters()
  } catch (error) {
    console.error('加载筛选器数据失败:', error)
  } finally {
    loadingFilters.value = false
  }
}

// 加载所有数据（并行加载，不阻塞页面渲染）
const fetchData = async () => {
  // 先加载筛选器数据（用于显示筛选组件）
  await loadFilters()
  
  // 然后并行加载其他数据块
  Promise.all([
    loadExpertData(),
    loadCadreData(),
    loadEntryLevelManagerPmData(),
    loadAllStaffTrends(),
    loadDepartmentStats(),
    loadJobCategoryStats(),
  ]).catch((error) => {
    console.error('加载数据失败:', error)
  })
}

const resolveDepartmentCode = (deptPath?: string[]) => {
  if (!deptPath || deptPath.length === 0) {
    return '0'
  }
  const last = deptPath[deptPath.length - 1]
  // 特殊处理：如果选中了 ICT_BG 或 云核心网产品线，视为一级部门，传0
  if (last === 'ICT_BG' || last === 'CLOUD_CORE_NETWORK') {
    return '0'
  }
  return last && last.trim().length ? last : '0'
}

const handleCellClick = (row: Record<string, unknown>, column: string) => {
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取成熟度级别和职位类
  let maturityLevel = (row.maturityLevel as string) || ''
  const jobCategory = (row.jobCategory as string) || ''
  
  // 如果是总计行，将成熟度置为L5（代表查询L2和L3的数据）
  if (maturityLevel && (maturityLevel === '总计' || maturityLevel === '全部' || maturityLevel === 'Total' || maturityLevel === 'total')) {
    maturityLevel = 'L5'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    column,
    maturity: maturityLevel || undefined,
    jobCategory: jobCategory || undefined,
    role: filters.value.role,
    deptCode: deptCode,
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 判断是否是L2非软件类
const isL2NonSoftware = (row: Record<string, unknown>): boolean => {
  // 如果是成熟度行，直接返回false
  if (row.isMaturityRow || (row.maturityLevel && !row.jobCategory)) {
    return false
  }
  
  const jobCategory = (row.jobCategory as string) || ''
  let maturityLevel = (row.maturityLevel as string) || ''
  
  // 如果是职位类行（maturityLevel 为空），需要从表格数据中查找父级的成熟度级别
  if (!maturityLevel && jobCategory && sortedExpertAppointmentData.value.length > 0) {
    const currentIndex = sortedExpertAppointmentData.value.findIndex(
      (r) => r === row
    )
    // 向上查找最近的成熟度行
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevRow = sortedExpertAppointmentData.value[i]
      if (prevRow && (prevRow.isMaturityRow || prevRow.maturityLevel)) {
        maturityLevel = (prevRow.maturityLevel as string) || ''
        break
      }
    }
  }
  
  // 判断是否是L2非软件类：成熟度是L2，职位类不是软件类，且职位类不为空
  return maturityLevel === 'L2' && jobCategory !== '软件类' && jobCategory !== ''
}

// 计算成熟度行的按岗位要求AI任职基线人数（排除L2非软件类，不处理总计行）
const calculateMaturityRowBaseline = (row: Record<string, unknown>): number => {
  const maturityLevel = (row.maturityLevel as string) || ''
  if (!maturityLevel || !sortedExpertAppointmentData.value.length) {
    return row.baseline as number || 0
  }
  
  // 找到该成熟度下的所有职位类行，排除L2非软件类
  let totalBaseline = 0
  const currentIndex = sortedExpertAppointmentData.value.findIndex(
    (r) => r === row
  )
  
  if (currentIndex < 0) {
    return row.baseline as number || 0
  }
  
  // 向下查找该成熟度下的所有职位类行
  for (let i = currentIndex + 1; i < sortedExpertAppointmentData.value.length; i++) {
    const nextRow = sortedExpertAppointmentData.value[i]
    // 如果遇到下一个成熟度行、总计行或其他汇总行，停止
    if (nextRow.isMaturityRow || (nextRow.maturityLevel && !nextRow.jobCategory)) {
      break
    }
    // 如果是职位类行，且不是L2非软件类，则累加基线人数
    if (nextRow.jobCategory && !isL2NonSoftware(nextRow)) {
      totalBaseline += (nextRow.baseline as number) || 0
    }
  }
  
  return totalBaseline
}

// 计算成熟度行的按岗位要求已获取AI任职人数（排除L2非软件类，不处理总计行）
const calculateMaturityRowAppointedByRequirement = (row: Record<string, unknown>): number => {
  const maturityLevel = (row.maturityLevel as string) || ''
  if (!maturityLevel || !sortedExpertAppointmentData.value.length) {
    return row.appointedByRequirement as number || 0
  }
  
  // 找到该成熟度下的所有职位类行，排除L2非软件类
  let totalAppointed = 0
  const currentIndex = sortedExpertAppointmentData.value.findIndex(
    (r) => r === row
  )
  
  if (currentIndex < 0) {
    return row.appointedByRequirement as number || 0
  }
  
  // 向下查找该成熟度下的所有职位类行
  for (let i = currentIndex + 1; i < sortedExpertAppointmentData.value.length; i++) {
    const nextRow = sortedExpertAppointmentData.value[i]
    // 如果遇到下一个成熟度行、总计行或其他汇总行，停止
    if (nextRow.isMaturityRow || (nextRow.maturityLevel && !nextRow.jobCategory)) {
      break
    }
    // 如果是职位类行，且不是L2非软件类，则累加按岗位要求已获取AI任职人数
    if (nextRow.jobCategory && !isL2NonSoftware(nextRow)) {
      totalAppointed += (nextRow.appointedByRequirement as number) || 0
    }
  }
  
  return totalAppointed
}

// 计算按岗位要求AI任职基线人数（排除L2非软件类）
const getBaselineByRequirement = (row: Record<string, unknown>): number | string => {
  // 如果是L2非软件类，返回"/"
  if (isL2NonSoftware(row)) {
    return '/'
  }
  
  const maturityLevel = (row.maturityLevel as string) || ''
  
  // 如果是总计行，计算所有成熟度行的和
  if (maturityLevel === '总计' || maturityLevel === '全部' || maturityLevel === 'Total' || maturityLevel === 'total') {
    if (!sortedExpertAppointmentData.value.length) {
      return 0
    }
    
    // 找到所有成熟度行（L2、L3），累加它们的"按岗位要求AI任职基线人数"
    let totalBaseline = 0
    for (const dataRow of sortedExpertAppointmentData.value) {
      const rowMaturityLevel = (dataRow.maturityLevel as string) || ''
      // 如果是成熟度行（L2或L3），计算它的"按岗位要求AI任职基线人数"
      if ((dataRow.isMaturityRow || (rowMaturityLevel && !dataRow.jobCategory)) && 
          (rowMaturityLevel === 'L2' || rowMaturityLevel === 'L3')) {
        const baselineValue = calculateMaturityRowBaseline(dataRow)
        totalBaseline += baselineValue
      }
    }
    
    return totalBaseline
  }
  
  // 如果是成熟度行，需要重新计算，排除L2非软件类的基线人数
  if (row.isMaturityRow || (maturityLevel && !row.jobCategory)) {
    return calculateMaturityRowBaseline(row)
  }
  
  // 普通职位类行，直接返回基线人数
  return row.baseline as number || 0
}

// 获取按岗位要求已获取AI任职人数（L2非软件类返回"/"，直接使用后端返回的qualifiedByRequirementCount字段）
const getAppointedByRequirement = (row: Record<string, unknown>): number | string => {
  // 如果是L2非软件类，返回"/"
  if (isL2NonSoftware(row)) {
    return '/'
  }
  
  // 直接使用后端返回的qualifiedByRequirementCount字段（已映射到appointedByRequirement）
  // 该字段已经在API映射函数中正确设置
  return row.appointedByRequirement as number || 0
}

// 处理专家任职数据表格的点击事件
const handleExpertQualifiedCellClick = (row: Record<string, unknown>, column: string) => {
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取成熟度级别和职位类
  let maturityLevel = (row.maturityLevel as string) || ''
  const jobCategory = (row.jobCategory as string) || ''
  
  // 如果是职位类行（maturityLevel 为空），需要从表格数据中查找父级的成熟度级别
  if (!maturityLevel && jobCategory && sortedExpertAppointmentData.value.length > 0) {
    const currentIndex = sortedExpertAppointmentData.value.findIndex(
      (r) => r === row
    )
    // 向上查找最近的成熟度行
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevRow = sortedExpertAppointmentData.value[i]
      if (prevRow && (prevRow.isMaturityRow || prevRow.maturityLevel)) {
        maturityLevel = (prevRow.maturityLevel as string) || ''
        break
      }
    }
  }
  
  // 如果是总计行，将成熟度置为L5（代表查询L2和L3的数据）
  if (maturityLevel && (maturityLevel === '总计' || maturityLevel === '全部' || maturityLevel === 'Total' || maturityLevel === 'total')) {
    maturityLevel = 'L5'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    column,
    maturity: maturityLevel || undefined,
    jobCategory: jobCategory || undefined,
    role: '2', // 强制设置为专家角色
    deptCode: deptCode,
    source: 'appointment', // 标识来自专家任职数据表格
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理专家认证数据表格的点击事件
const handleExpertCertCellClick = (row: Record<string, unknown>, column: string) => {
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取成熟度级别和职位类
  let maturityLevel = (row.maturityLevel as string) || ''
  const jobCategory = (row.jobCategory as string) || ''
  
  // 如果是职位类行（maturityLevel 为空），需要从表格数据中查找父级的成熟度级别
  if (!maturityLevel && jobCategory && sortedExpertCertificationData.value.length > 0) {
    const currentIndex = sortedExpertCertificationData.value.findIndex(
      (r) => r === row
    )
    // 向上查找最近的成熟度行
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevRow = sortedExpertCertificationData.value[i]
      if (prevRow && (prevRow.isMaturityRow || prevRow.maturityLevel)) {
        maturityLevel = (prevRow.maturityLevel as string) || ''
        break
      }
    }
  }
  
  // 如果是总计行，将成熟度置为L5（代表查询L2和L3的数据）
  if (maturityLevel && (maturityLevel === '总计' || maturityLevel === '全部' || maturityLevel === 'Total' || maturityLevel === 'total')) {
    maturityLevel = 'L5'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    column,
    maturity: maturityLevel || undefined,
    jobCategory: jobCategory || undefined,
    role: '2', // 强制设置为专家角色，后端会根据此参数设置personType=2
    deptCode: deptCode,
    source: 'certification', // 标识来自专家认证数据表格
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理干部认证数据表格的点击事件
const handleCadreCertCellClick = (row: Record<string, unknown>, column: string) => {
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取成熟度级别和职位类
  let maturityLevel = (row.maturityLevel as string) || ''
  const jobCategory = (row.jobCategory as string) || ''
  
  // 如果是职位类行（maturityLevel 为空），需要从表格数据中查找父级的成熟度级别
  if (!maturityLevel && jobCategory && cadreData.value?.certification) {
    const currentIndex = cadreData.value.certification.findIndex(
      (r) => r === row
    )
    // 向上查找最近的成熟度行
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevRow = cadreData.value.certification[i]
      if (prevRow && prevRow.isMaturityRow && prevRow.maturityLevel) {
        maturityLevel = prevRow.maturityLevel as string
        break
      }
    }
  }
  
  // 如果是总计行，将成熟度置为L5（代表查询L2和L3的数据）
  if (maturityLevel && (maturityLevel === '总计' || maturityLevel === '全部' || maturityLevel === 'Total' || maturityLevel === 'total')) {
    maturityLevel = 'L5'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    column,
    maturity: maturityLevel || undefined,
    jobCategory: jobCategory || undefined,
    role: '1', // 强制设置为干部角色
    deptCode: deptCode,
    source: 'certification', // 标识来自干部认证数据表格
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理干部任职数据表格的点击事件
const handleCadreQualifiedCellClick = (row: Record<string, unknown>, column: string) => {
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取成熟度级别和职位类
  let maturityLevel = (row.maturityLevel as string) || ''
  const jobCategory = (row.jobCategory as string) || ''
  
  // 如果是职位类行（maturityLevel 为空），需要从表格数据中查找父级的成熟度级别
  if (!maturityLevel && jobCategory && cadreData.value?.appointment) {
    const currentIndex = cadreData.value.appointment.findIndex(
      (r) => r === row
    )
    // 向上查找最近的成熟度行
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevRow = cadreData.value.appointment[i]
      if (prevRow && prevRow.isMaturityRow && prevRow.maturityLevel) {
        maturityLevel = prevRow.maturityLevel as string
        break
      }
    }
  }
  
  // 如果是总计行，将成熟度置为L5（代表查询L2和L3的数据）
  if (maturityLevel && (maturityLevel === '总计' || maturityLevel === '全部' || maturityLevel === 'Total' || maturityLevel === 'total')) {
    maturityLevel = 'L5'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    column, // 'baseline', 'appointed', 'appointedByRequirement'
    maturity: maturityLevel || undefined,
    jobCategory: jobCategory || undefined, // 如果为空则不传递
    role: '1', // 强制设置为干部角色
    deptCode: deptCode,
    source: 'appointment', // 标识来自干部任职数据表格
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理部门任职柱状图点击事件
const handleDepartmentAppointmentBarClick = (data: { label: string; deptCode?: string; count: number; rate: number }) => {
  console.log('handleDepartmentAppointmentBarClick called:', data)
  
  if (!data.deptCode) {
    console.warn('Department bar click: deptCode is missing', data)
    return
  }
  
  // 获取当前的人员类型（personType）
  // personType: 0-全员，1-干部，2-专家
  const role = filters.value.role ?? '0'
  let personType = '0' // 默认值：全员
  if (role === '1') {
    personType = '1' // 干部
  } else if (role === '2') {
    personType = '2' // 专家
  } else {
    // 全员或其他情况，默认为0（全员）
    personType = '0'
  }
  
  // 构建部门路径：如果deptCode是'0'，则使用当前筛选的部门路径；否则需要构建包含该deptCode的路径
  let departmentPath: string[] = []
  if (data.deptCode === '0') {
    // 如果是'0'，使用当前筛选的部门路径
    departmentPath = filters.value.departmentPath || []
  } else {
    // 否则，构建包含该deptCode的路径
    // 如果当前有部门筛选，则在该路径基础上添加deptCode；否则直接使用deptCode
    const currentPath = filters.value.departmentPath || []
    if (currentPath.length > 0) {
      // 检查deptCode是否已经在路径中
      if (currentPath.includes(data.deptCode)) {
        departmentPath = currentPath
      } else {
        // 添加新的部门代码到路径
        departmentPath = [...currentPath, data.deptCode]
      }
    } else {
      // 如果没有当前路径，构建基本路径
      // 如果deptCode是三级部门，路径应该是 ['ICT_BG', 'CLOUD_CORE_NETWORK', deptCode]
      // 由于部门树的结构，三级部门默认在 ['ICT_BG', 'CLOUD_CORE_NETWORK'] 下
      departmentPath = ['ICT_BG', 'CLOUD_CORE_NETWORK', data.deptCode]
    }
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    deptCode: data.deptCode,
    personType: personType,
    queryType: '2', // 默认为2（基线人数）
    role: role, // 传递角色视图
    column: 'appointed', // 任职数据
    // 岗位成熟度与职位类数据传空，不传递这些参数
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (departmentPath.length > 0) {
    queryParams.departmentPath = departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理部门认证柱状图点击事件
const handleDepartmentCertificationBarClick = (data: { label: string; deptCode?: string; count: number; rate: number }) => {
  console.log('handleDepartmentCertificationBarClick called:', data)
  
  if (!data.deptCode) {
    console.warn('Department certification bar click: deptCode is missing', data)
    return
  }
  
  // 获取当前的人员类型（personType）
  // personType: 0-全员，1-干部，2-专家
  const role = filters.value.role ?? '0'
  let personType = '0' // 默认值：全员
  if (role === '1') {
    personType = '1' // 干部
  } else if (role === '2') {
    personType = '2' // 专家
  } else {
    // 全员或其他情况，默认为0（全员）
    personType = '0'
  }
  
  // 构建部门路径：如果deptCode是'0'，则使用当前筛选的部门路径；否则需要构建包含该deptCode的路径
  let departmentPath: string[] = []
  if (data.deptCode === '0') {
    // 如果是'0'，使用当前筛选的部门路径
    departmentPath = filters.value.departmentPath || []
  } else {
    // 否则，构建包含该deptCode的路径
    // 如果当前有部门筛选，则在该路径基础上添加deptCode；否则构建完整路径
    const currentPath = filters.value.departmentPath || []
    if (currentPath.length > 0) {
      // 检查deptCode是否已经在路径中
      if (currentPath.includes(data.deptCode)) {
        departmentPath = currentPath
      } else {
        // 添加新的部门代码到路径
        departmentPath = [...currentPath, data.deptCode]
      }
    } else {
      // 如果没有当前路径，构建完整路径
      // 三级部门默认在 ['ICT_BG', 'CLOUD_CORE_NETWORK'] 下
      departmentPath = ['ICT_BG', 'CLOUD_CORE_NETWORK', data.deptCode]
    }
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    deptCode: data.deptCode,
    personType: personType,
    queryType: '2', // 默认为2（基线人数）
    role: role, // 传递角色视图
    column: 'certification', // 认证数据
    // 岗位成熟度与职位类数据传空，不传递这些参数
  }
  
  // 如果部门路径存在，添加到查询参数中（确保路径不为空）
  if (departmentPath.length > 0) {
    queryParams.departmentPath = departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理部门表格点击事件（任职人数或认证人数）
const handleDepartmentTableCellClick = (row: MergedTableRow, column: 'appointment' | 'certification') => {
  // 获取当前的人员类型（personType）
  // personType: 0-全员，1-干部，2-专家
  const role = filters.value.role ?? '0'
  let personType = '0' // 默认值：全员
  if (role === '1') {
    personType = '1' // 干部
  } else if (role === '2') {
    personType = '2' // 专家
  } else {
    // 全员或其他情况，默认为0（全员）
    personType = '0'
  }
  
  // 如果是总计行，使用当前筛选的部门或根部门
  let deptCode: string
  let departmentPath: string[] = []
  
  if (row.label === '总计') {
    // 总计行：使用当前筛选的部门路径，如果没有则使用根部门 '0'
    deptCode = resolveDepartmentCode(filters.value.departmentPath) || '0'
    departmentPath = filters.value.departmentPath || []
  } else {
    // 非总计行：使用行数据中的 deptCode
    if (!row.deptCode) {
      return
    }
    deptCode = row.deptCode
    
    // 构建部门路径：如果deptCode是'0'，则使用当前筛选的部门路径；否则需要构建包含该deptCode的路径
    if (row.deptCode === '0') {
      // 如果是'0'，使用当前筛选的部门路径
      departmentPath = filters.value.departmentPath || []
    } else {
      // 否则，构建包含该deptCode的路径
      const currentPath = filters.value.departmentPath || []
      if (currentPath.length > 0) {
        // 检查deptCode是否已经在路径中
        if (currentPath.includes(row.deptCode)) {
          departmentPath = currentPath
        } else {
          // 添加新的部门代码到路径
          departmentPath = [...currentPath, row.deptCode]
        }
      } else {
        // 如果没有当前路径，构建完整路径
        // 三级部门默认在 ['ICT_BG', 'CLOUD_CORE_NETWORK'] 下
        departmentPath = ['ICT_BG', 'CLOUD_CORE_NETWORK', row.deptCode]
      }
    }
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    deptCode: deptCode,
    personType: personType,
    queryType: '2', // 默认为2（基线人数）
    role: role, // 传递角色视图
    // 岗位成熟度与职位类数据传空，不传递这些参数
  }
  
  // 根据点击的列类型，添加column参数以区分任职和认证数据
  if (column === 'appointment') {
    queryParams.column = 'appointed' // 任职数据
  } else if (column === 'certification') {
    queryParams.column = 'certification' // 认证数据
  }
  
  // 如果部门路径存在，添加到查询参数中（确保路径不为空）
  if (departmentPath.length > 0) {
    queryParams.departmentPath = departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理职位类任职柱状图点击事件
const handleJobCategoryAppointmentBarClick = (data: { label: string; deptCode?: string; count: number; rate: number }) => {
  // 获取当前筛选的部门ID
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取当前的人员类型（personType）
  // personType: 0-全员，1-干部，2-专家
  const role = filters.value.role ?? '0'
  let personType = '0' // 默认值：全员
  if (role === '1') {
    personType = '1' // 干部
  } else if (role === '2') {
    personType = '2' // 专家
  } else {
    // 全员或其他情况，默认为0（全员）
    personType = '0'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    deptCode: deptCode,
    personType: personType,
    queryType: '2', // 默认为2（基数人数）
    jobCategory: data.label, // 职位类信息
    role: role, // 传递角色视图
    column: 'appointed', // 任职数据
    // 岗位成熟度传空，不传递此参数
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理职位类认证柱状图点击事件
const handleJobCategoryCertificationBarClick = (data: { label: string; deptCode?: string; count: number; rate: number }) => {
  // 获取当前筛选的部门ID
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取当前的人员类型（personType）
  // personType: 0-全员，1-干部，2-专家
  const role = filters.value.role ?? '0'
  let personType = '0' // 默认值：全员
  if (role === '1') {
    personType = '1' // 干部
  } else if (role === '2') {
    personType = '2' // 专家
  } else {
    // 全员或其他情况，默认为0（全员）
    personType = '0'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    deptCode: deptCode,
    personType: personType,
    queryType: '2', // 默认为2（基线人数）
    jobCategory: data.label, // 职位类信息
    role: role, // 传递角色视图
    column: 'certification', // 认证数据
    // 岗位成熟度传空，不传递此参数
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

// 处理职位类表格点击事件（任职人数或认证人数）
const handleJobCategoryTableCellClick = (row: MergedTableRow, column: 'appointment' | 'certification') => {
  // 获取当前筛选的部门ID
  const deptCode = resolveDepartmentCode(filters.value.departmentPath)
  
  // 获取当前的人员类型（personType）
  // personType: 0-全员，1-干部，2-专家
  const role = filters.value.role ?? '0'
  let personType = '0' // 默认值：全员
  if (role === '1') {
    personType = '1' // 干部
  } else if (role === '2') {
    personType = '2' // 专家
  } else {
    // 全员或其他情况，默认为0（全员）
    personType = '0'
  }
  
  // 构建查询参数
  const queryParams: Record<string, string | undefined> = {
    deptCode: deptCode,
    personType: personType,
    queryType: '2', // 默认为2（基数人数）
    role: role, // 传递角色视图
    // 岗位成熟度传空，不传递此参数
  }
  
  // 根据点击的列类型，添加column参数以区分任职和认证数据
  if (column === 'appointment') {
    queryParams.column = 'appointed' // 任职数据
  } else if (column === 'certification') {
    queryParams.column = 'certification' // 认证数据
  }
  
  // 如果是总计行，不传递 jobCategory 参数（表示查询所有职位类）
  // 如果不是总计行，传递职位类信息
  if (row.label !== '总计') {
    queryParams.jobCategory = row.label
  }
  
  // 如果部门路径存在，添加到查询参数中
  if (filters.value.departmentPath && Array.isArray(filters.value.departmentPath) && filters.value.departmentPath.length > 0) {
    queryParams.departmentPath = filters.value.departmentPath.join(',')
  }
  
  router.push({
    path: '/dashboard/certification/detail/detail',
    query: queryParams,
  })
}

const formatNumber = (value: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  return new Intl.NumberFormat('zh-CN').format(value)
}

const formatPercent = (value: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  if (value > 1) {
    return `${value.toFixed(2)}%`
  }
  return `${(value * 100).toFixed(2)}%`
}

// 计算表格总计行数据
// totalRate: 可选的正确总计占比（从totalStatistics获取）
// totalCount: 可选的正确总计人数（从totalStatistics获取）
const calculateTableTotal = (points: StaffChartPoint[], totalRate?: number, totalCount?: number) => {
  if (!points || points.length === 0) {
    return { label: '总计', count: totalCount ?? 0, rate: totalRate ?? 0 }
  }
  // 如果提供了正确的总计人数，使用它；否则从图表数据累加
  const finalCount = totalCount !== undefined ? totalCount : points.reduce((sum, point) => sum + (point.count || 0), 0)
  // 如果提供了正确的总计占比，使用它；否则使用平均值作为后备
  const finalRate = totalRate !== undefined ? totalRate : (
    points.length > 0 
      ? points.reduce((sum, point) => sum + (point.rate || 0), 0) / points.length 
      : 0
  )
  return {
    label: '总计',
    count: finalCount,
    rate: finalRate,
  }
}

// 合并任职和认证数据为表格数据
interface MergedTableRow {
  label: string
  appointmentCount: number
  appointmentRate: number
  certificationCount: number
  certificationRate: number
  deptCode?: string // 部门编码，用于点击跳转
}

const mergeAppointmentAndCertification = (
  appointmentPoints: StaffChartPoint[],
  certificationPoints: StaffChartPoint[]
): MergedTableRow[] => {
  // 获取所有唯一的标签
  const allLabels = new Set<string>()
  appointmentPoints.forEach((point) => allLabels.add(point.label))
  certificationPoints.forEach((point) => allLabels.add(point.label))

  // 创建映射以便快速查找
  const appointmentMap = new Map<string, StaffChartPoint>()
  appointmentPoints.forEach((point) => appointmentMap.set(point.label, point))
  const certificationMap = new Map<string, StaffChartPoint>()
  certificationPoints.forEach((point) => certificationMap.set(point.label, point))

  // 合并数据
  const mergedData: MergedTableRow[] = Array.from(allLabels).map((label) => {
    const appointment = appointmentMap.get(label)
    const certification = certificationMap.get(label)
    // 优先使用任职数据的 deptCode，如果没有则使用认证数据的 deptCode
    const deptCode = appointment?.deptCode || certification?.deptCode
    return {
      label,
      appointmentCount: appointment?.count ?? 0,
      appointmentRate: appointment?.rate ?? 0,
      certificationCount: certification?.count ?? 0,
      certificationRate: certification?.rate ?? 0,
      deptCode,
    }
  })

  return mergedData
}

// 计算合并表格的总计行
const calculateMergedTableTotal = (
  appointmentPoints: StaffChartPoint[],
  certificationPoints: StaffChartPoint[],
  appointmentTotalRate?: number,
  certificationTotalRate?: number,
  appointmentTotalCount?: number,
  certificationTotalCount?: number
): MergedTableRow => {
  const appointmentTotal = calculateTableTotal(appointmentPoints, appointmentTotalRate, appointmentTotalCount)
  const certificationTotal = calculateTableTotal(certificationPoints, certificationTotalRate, certificationTotalCount)
  return {
    label: '总计',
    appointmentCount: appointmentTotal.count,
    appointmentRate: appointmentTotal.rate,
    certificationCount: certificationTotal.count,
    certificationRate: certificationTotal.rate,
  }
}

const getRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
  const classes: string[] = []
  
  // 判断是否是偶数行
  if (rowIndex % 2 === 0) {
    classes.push('row-even')
  } else {
    classes.push('row-odd')
  }
  
  // 判断是否是成熟度行（L2、L3）或总计行
  if (row.isMaturityRow || (row.maturityLevel && ['L2', 'L3', '总计', '全部', 'Total', 'total'].includes(row.maturityLevel))) {
    classes.push('maturity-row')
  }
  
  return classes.join(' ')
}

const getRowStyle = ({ row }: { row: any }) => {
  // 判断是否是成熟度行（L2、L3）或总计行
  if (row.isMaturityRow || (row.maturityLevel && ['L2', 'L3', '总计', '全部', 'Total', 'total'].includes(row.maturityLevel))) {
    return {
      fontWeight: 'bold',
      fontSize: '15px',
      color: '#000',
    }
  }
  return {}
}

const getCellStyle = ({ row }: { row: any }) => {
  // 判断是否是成熟度行（L2、L3）或总计行
  if (row.isMaturityRow || (row.maturityLevel && ['L2', 'L3', '总计', '全部', 'Total', 'total'].includes(row.maturityLevel))) {
    return {
      fontWeight: 'bold',
      fontSize: '15px',
      color: '#000',
    }
  }
  return {}
}

const getCellClassName = ({ row, column }: { row: any; column: any }) => {
  if (column.property === 'complianceRate') {
    if (row.complianceRate == null || row.complianceRate === undefined || isNaN(row.complianceRate)) {
      return 'cell-placeholder-bg'
    }
  }
  if (column.property === 'certificationCompliance') {
    if (row.certificationCompliance == null || row.certificationCompliance === undefined || isNaN(row.certificationCompliance)) {
      return 'cell-placeholder-bg'
    }
  }
  return ''
}

// 基层主管和PM表格的单元格样式
const getEntryLevelManagerPmCellStyle = ({ row, column }: { row: any; column: any }) => {
  // 如果是云核心网研发管理部或云核总计所在行，整行应用加粗、字号增大一号的样式
  if (row.department === '云核心网研发管理部' || row.department === '云核总计') {
    return {
      fontWeight: 'bold',
      fontSize: '15px',
      color: '#000',
    }
  }
  return {}
}


const resetFilters = () => {
  filters.value = {
    role: '0',
    departmentPath: ['ICT_BG', 'CLOUD_CORE_NETWORK'],
  }
}

// 部门筛选组件的 Ref
const departmentCascaderRef = ref()

// 处理部门筛选变化
const handleDepartmentChange = () => {
  // 选中后自动关闭下拉框
  if (departmentCascaderRef.value) {
    departmentCascaderRef.value.togglePopperVisible(false)
  }
}

// 监听部门路径变化：影响专家、干部、部门和职位类数据
watch(
  () => filters.value.departmentPath,
  () => {
    // 部门筛选条件改变时，重新加载依赖部门的数据块
    loadExpertData()
    loadCadreData()
    loadEntryLevelManagerPmData()
    loadDepartmentStats()
    loadJobCategoryStats()
  },
  { deep: true }
)

// 监听角色视图变化：只影响全员相关的部门和职位类数据
watch(
  () => filters.value.role,
  () => {
    // 角色视图切换时，只刷新全员相关的统计数据（部门和职位类）
    // 专家和干部数据不受角色视图影响，不需要刷新
    loadDepartmentStats()
    loadJobCategoryStats()
  }
)

onMounted(() => {
  initDepartmentTree()
  fetchData()
})

onActivated(() => {
  refreshDepartmentTree()
  fetchData()
})
</script>

<template>
  <section class="dashboard certification-dashboard">
    <header class="dashboard__header glass-card">
      <div class="header-info">
        <h2>AI 任职认证看板</h2>
        <p>
          覆盖专家、干部与全员多维度的任职与认证进度，支持六级部门级联筛选，帮助快速识别薄弱环节与提升方向。
        </p>
      </div>
    </header>

    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters" label-width="92">
        <el-form-item label="部门筛选">
          <el-cascader
            ref="departmentCascaderRef"
            v-model="filters.departmentPath"
            :options="departmentOptions"
            :props="cascaderProps"
            placeholder="可选择至六级部门"
            clearable
            separator=" / "
            style="width: 260px"
            @change="handleDepartmentChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button text type="primary" @click="resetFilters">重置筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 指标卡片区域 -->
    <el-row :gutter="16" class="metric-row" v-if="dashboardData">
      <el-col v-for="metric in dashboardData.metrics" :key="metric.id" :xs="24" :sm="12" :md="6">
        <StatCard
          :title="metric.title"
          :value="metric.value"
          :unit="metric.unit"
          :delta="metric.delta"
          :trend="metric.trend"
          subtitle="较上期"
        />
      </el-col>
    </el-row>

    <!-- 干部数据区块 -->
    <el-card shadow="hover" class="data-section cadre-data-section">
      <template #header>
        <div class="section-header">
          <h3>干部 AI 人才数据</h3>
        </div>
      </template>
      <el-row :gutter="16" class="summary-table-grid">
        <!-- 3. 干部任职数据 -->
        <el-col :xs="24" :lg="24">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>
                干部AI任职数据
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">岗位AI成熟度等级定义：</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L3，即AI生产者，优化算法框架与AI基础设施，驱动基础模型及生态创新，打造产业原生智能技术底座；</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L2，即AI产品者，AI融入研发全流程，实现AI能力与产品整合，提升产品解决方案竞争力；</div>
                      <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">干部AI任职能力要求：</div>
                      <div>软件类L3岗位干部牵引26年H2之前获得4+AI任职资格；</div>
                      <div>软件类L2岗位干部牵引获得3+AI任职资格；</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingCadre" />
              <el-table
                v-else-if="cadreData"
                :data="cadreData.appointment"
                border
                stripe
                size="small"
                :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
                :row-class-name="getRowClassName"
                :row-style="getRowStyle"
                :cell-style="getCellStyle"
                :cell-class-name="getCellClassName"
              >
                <!-- 合并的成熟度/职位类列 -->
                <el-table-column prop="maturityLevel" label="岗位AI成熟度/职位类" width="180" align="left" header-align="center">
                  <template #default="{ row }">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span v-if="row.isMaturityRow">{{ row.maturityLevel }}</span>
                      <span v-else style="flex: 1;"></span>
                      <span v-if="!row.isMaturityRow">{{ row.jobCategory }}</span>
                      <span v-else style="flex: 1;"></span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="baseline" label="基线人数" min-width="80" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click="handleCadreQualifiedCellClick(row, 'baseline')"
                    >
                      {{ formatNumber(row.baseline) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="appointedByRequirement" min-width="130" align="center" header-align="center">
                  <template #header>
                    <span>按岗位要求已获取AI任职人数</span>
                    <el-tooltip
                      placement="top"
                      effect="dark"
                    >
                      <template #content>
                        <div style="line-height: 1.8;">
                          <div style="font-weight: 500; margin-bottom: 4px;">干部AI任职能力要求：</div>
                          <div>软件类L3岗位干部牵引26年H2之前获得4+AI任职资格；</div>
                          <div>软件类L2岗位干部牵引获得3+AI任职资格；</div>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ row }">
                    {{ formatNumber(row.appointedByRequirement) }}
                  </template>
                </el-table-column>
                <el-table-column prop="certificationCompliance" min-width="140" align="center" header-align="center">
                  <template #header>
                    <span>按岗位要求已获取AI任职人数占比</span>
                    <el-tooltip
                      placement="top"
                      effect="dark"
                    >
                      <template #content>
                        <div style="line-height: 1.8;">
                          <div style="font-weight: 500; margin-bottom: 4px;">干部AI任职能力要求：</div>
                          <div>软件类L3岗位干部牵引26年H2之前获得4+AI任职资格；</div>
                          <div>软件类L2岗位干部牵引获得3+AI任职资格；</div>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ row }">
                    {{ formatPercent(row.certificationCompliance) }}
                  </template>
                </el-table-column>
                <el-table-column prop="appointed" label="AI任职人数" min-width="100" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click="handleCadreQualifiedCellClick(row, 'appointed')"
                    >
                      {{ formatNumber(row.appointed) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="appointmentRate" label="AI任职率" min-width="90" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.appointmentRate) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="待提供数据" :image-size="80" />
            </div>
          </div>
        </el-col>
        <!-- 4. 干部认证数据 -->
        <el-col :xs="24" :lg="24">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>
                干部AI认证数据
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">岗位AI成熟度等级定义：</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L3，即AI生产者，优化算法框架与AI基础设施，驱动基础模型及生态创新，打造产业原生智能技术底座；</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L2，即AI产品者，AI融入研发全流程，实现AI能力与产品整合，提升产品解决方案竞争力；</div>
                      <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">干部AI认证能力要求：</div>
                      <div>软件类L2/L3干部要求在26年H1之前完成"AI算法技术"专业级认证；</div>
                      <div>其他L2/L3岗位干部要求26年H2之前完成"AI算法技术"工作级认证科目2（算法理论），牵引26H1之前完成；</div>
                      <div>产品线管理团队成员按L2标准要求。</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingCadre" />
              <el-table
                v-else-if="cadreData"
            :data="cadreData.certification"
            border
            stripe
            size="small"
            :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
            :row-class-name="getRowClassName"
            :row-style="getRowStyle"
            :cell-style="getCellStyle"
            :cell-class-name="getCellClassName"
          >
                <!-- 合并的成熟度/职位类列 -->
                <el-table-column prop="maturityLevel" label="岗位AI成熟度/职位类" width="180" align="left" header-align="center">
                  <template #default="{ row }">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span v-if="row.isMaturityRow">{{ row.maturityLevel }}</span>
                      <span v-else style="flex: 1;"></span>
                      <span v-if="!row.isMaturityRow">{{ row.jobCategory }}</span>
                      <span v-else style="flex: 1;"></span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="baseline" label="基线人数" min-width="110" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click="handleCadreCertCellClick(row, 'baseline')"
                    >
                      {{ formatNumber(row.baseline) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="aiCertificateHolders" label="AI专业级持证人数" min-width="180" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click="handleCadreCertCellClick(row, 'aiCertificateHolders')"
                    >
                      {{ formatNumber(row.aiCertificateHolders) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="certificateRate" label="AI专业级持证率" min-width="150" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.certificateRate) }}
                  </template>
                </el-table-column>
                <el-table-column prop="subjectTwoPassed" label="科目二通过人数" min-width="160" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click="handleCadreCertCellClick(row, 'subjectTwoPassed')"
                    >
                      {{ formatNumber(row.subjectTwoPassed) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="subjectTwoRate" label="科目二通过率" min-width="140" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.subjectTwoRate) }}
                  </template>
                </el-table-column>
                <el-table-column prop="certStandardCount" label="按要求持证人数" min-width="140" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatNumber(row.certStandardCount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="complianceRate" min-width="130" align="center" header-align="center">
                  <template #header>
                    <span>按要求持证率</span>
                    <el-tooltip
                      placement="top"
                      effect="dark"
                    >
                      <template #content>
                        <div style="line-height: 1.8;">
                          <div style="font-weight: 500; margin-bottom: 4px;">干部AI认证能力要求：</div>
                          <div>软件类L2/L3干部要求在26年H1之前完成"AI算法技术"专业级认证；</div>
                          <div>其他L2/L3岗位干部要求26年H2之前完成"AI算法技术"工作级认证科目2（算法理论），牵引26H1之前完成；</div>
                          <div>产品线管理团队成员按L2标准要求。</div>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ row }">
                    <span v-if="row.complianceRate != null && row.complianceRate !== undefined && !isNaN(row.complianceRate)">
                      {{ formatPercent(row.complianceRate) }}
                    </span>
                    <span v-else class="pending-data">待提供数据</span>
                  </template>
                </el-table-column>
              </el-table>
            <el-empty v-else description="待提供数据" :image-size="80" />
          </div>
        </div>
        </el-col>
        <!-- 4.1 AI干部岗位概述表 -->
        <el-col :xs="24" :lg="24" v-if="false">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>AI干部岗位概述表</h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingCadre" />
              <el-table
                v-else
                :data="cadrePositionOverviewData || []"
                border
                stripe
                size="small"
                style="width: 100%"
                :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4', padding: '8px 4px' }"
                :row-style="cadrePositionOverviewRowStyle"
              >
                <el-table-column prop="department" label="部门" width="201" align="center" header-align="center" />
                <el-table-column prop="totalPositionCount" label="干部岗位总数" min-width="120" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatNumber(row.totalPositionCount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="l2L3TotalCount" label="L2/L3干部岗位总数" min-width="180" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatNumber(row.l2L3TotalCount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="l2L3Rate" label="L2/L3干部岗位占比" min-width="160" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.l2L3Rate) }}
                  </template>
                </el-table-column>
                <!-- L2干部岗位数量（大列） -->
                <el-table-column label="L2干部岗位数量" align="center" header-align="center">
                  <el-table-column prop="l2SoftwareCount" label="软件类" min-width="100" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.l2SoftwareCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="l2NonSoftwareCount" label="非软件类" min-width="110" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.l2NonSoftwareCount) }}
                    </template>
                  </el-table-column>
                </el-table-column>
                <!-- L3干部岗位数量（大列） -->
                <el-table-column label="L3干部岗位数量" align="center" header-align="center">
                  <el-table-column prop="l3SoftwareCount" label="软件类" min-width="100" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.l3SoftwareCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="l3NonSoftwareCount" label="非软件类" min-width="110" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.l3NonSoftwareCount) }}
                    </template>
                  </el-table-column>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
        <!-- 4.2 干部AI任职认证表 -->
        <el-col :xs="24" :lg="24" v-if="false">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>干部AI任职认证表</h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingCadre" />
              <el-table
                v-else
                :data="cadreAiAppointmentCertData || []"
                border
                stripe
                size="small"
                style="width: 100%"
                :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4', padding: '8px 4px' }"
                :row-style="cadreAiAppointmentCertRowStyle"
              >
                <el-table-column prop="department" label="部门" width="201" align="center" header-align="center" />
                <el-table-column prop="totalCadreCount" label="干部总人数" min-width="120" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatNumber(row.totalCadreCount) }}
                  </template>
                </el-table-column>
                <!-- L2/L3干部情况（大列） -->
                <el-table-column label="L2/L3干部情况" align="center" header-align="center">
                  <el-table-column prop="l2L3Count" label="L2/L3人数" min-width="110" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.l2L3Count) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="softwareL2Count" label="软件L2人数" min-width="120" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.softwareL2Count) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="softwareL3Count" label="软件L3人数" min-width="120" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.softwareL3Count) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="nonSoftwareL2L3Count" label="非软件L2/L3人数" min-width="150" align="center" header-align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.nonSoftwareL2L3Count) }}
                    </template>
                  </el-table-column>
                </el-table-column>
                <el-table-column prop="qualifiedL2L3Count" label="满足岗位AI要求L2/L3干部人数" min-width="240" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatNumber(row.qualifiedL2L3Count) }}
                  </template>
                </el-table-column>
                <el-table-column prop="qualifiedL2L3Ratio" label="满足岗位AI要求L2/L3干部占比" min-width="240" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.qualifiedL2L3Ratio) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
        <!-- 5. 基层主管和PM AI任职认证数据 -->
        <el-col :xs="24" :lg="24" v-if="false">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>基层主管和PM AI任职认证</h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingEntryLevelManagerPm" />
              <el-table
                v-else-if="entryLevelManagerPmData"
                :data="entryLevelManagerPmData"
                border
                stripe
                size="small"
                style="width: 100%"
                :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4', padding: '8px 4px' }"
                :cell-style="getEntryLevelManagerPmCellStyle"
              >
                <el-table-column prop="department" label="部门" width="201" align="center" header-align="center" />
                <!-- TM/PL队伍列组 -->
                <el-table-column label="TM/PL队伍" align="center" header-align="center">
                  <el-table-column prop="tmPlTotalCount" min-width="70" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">TM/PL<br/>总人数</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatNumber(row.tmPlTotalCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="tmPlAi3PlusCount" min-width="103" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">TM/PL具备<br/>AI 3+任职人数</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatNumber(row.tmPlAi3PlusCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="tmPlAi3PlusRate" min-width="103" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">TM/PL具备<br/>AI 3+任职占比</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatPercent(row.tmPlAi3PlusRate) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="tmPlProfessionalCertCount" min-width="113" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">TM/PL具备<br/>专业级认证人数</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatNumber(row.tmPlProfessionalCertCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="tmPlProfessionalCertRate" min-width="113" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">TM/PL具备<br/>专业级认证占比</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatPercent(row.tmPlProfessionalCertRate) }}
                    </template>
                  </el-table-column>
                </el-table-column>
                <!-- PM队伍列组 -->
                <el-table-column label="PM队伍" align="center" header-align="center">
                  <el-table-column prop="pmTotalCount" min-width="70" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">PM<br/>总人数</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatNumber(row.pmTotalCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="pmAi3PlusCount" min-width="103" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">PM具备<br/>AI 3+任职人数</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatNumber(row.pmAi3PlusCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="pmAi3PlusRate" min-width="103" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">PM具备<br/>AI 3+任职占比</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatPercent(row.pmAi3PlusRate) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="pmProfessionalCertCount" min-width="113" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">PM具备<br/>专业级认证人数</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatNumber(row.pmProfessionalCertCount) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="pmProfessionalCertRate" min-width="113" align="center" header-align="center">
                    <template #header>
                      <div style="line-height: 1.4; white-space: normal;">PM具备<br/>专业级认证占比</div>
                    </template>
                    <template #default="{ row }">
                      {{ formatPercent(row.pmProfessionalCertRate) }}
                    </template>
                  </el-table-column>
                </el-table-column>
              </el-table>
              <el-empty v-else description="待提供数据" :image-size="80" />
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 专家数据区块 -->
    <el-card shadow="hover" class="data-section">
      <template #header>
        <div class="section-header">
          <h3>专家 AI 人才数据</h3>
        </div>
      </template>
    <el-row :gutter="16" class="summary-table-grid">
      <!-- 1. 专家任职数据 -->
        <el-col :xs="24" :lg="24">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>
                专家AI任职数据
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">岗位AI成熟度等级定义：</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L3，即AI生产者，优化算法框架与AI基础设施，驱动基础模型及生态创新，打造产业原生智能技术底座；</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L2，即AI产品者，AI融入研发全流程，实现AI能力与产品整合，提升产品解决方案竞争力；</div>
                      <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">专家AI任职能力要求：</div>
                      <div>软件类L3岗位专家牵引26年H2之前获得4+AI任职资格；</div>
                      <div>软件类L2岗位专家牵引获得3+AI任职资格；</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingExpert" />
              <el-table
                v-else-if="expertData"
                :data="sortedExpertAppointmentData"
                border
                stripe
                size="small"
                :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
                :row-class-name="getRowClassName"
                :row-style="getRowStyle"
                :cell-style="getCellStyle"
              >
                <!-- 合并的成熟度/职位类列 -->
                <el-table-column prop="maturityLevel" label="岗位AI成熟度/职位类" width="180" align="left" header-align="center">
                  <template #default="{ row }">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span v-if="row.isMaturityRow">{{ row.maturityLevel || '' }}</span>
                      <span v-else style="flex: 1;"></span>
                      <span v-if="!row.isMaturityRow">{{ row.jobCategory || '' }}</span>
                      <span v-else style="flex: 1;"></span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="baseline" label="基线人数" min-width="110" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click.stop="handleExpertQualifiedCellClick(row, 'baseline')"
                    >
                      {{ formatNumber(row.baseline) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="baseline" min-width="180" align="center" header-align="center">
                  <template #header>
                    <span>按岗位要求AI任职基线人数</span>
                    <el-tooltip
                      placement="top"
                      effect="dark"
                    >
                      <template #content>
                        <div style="line-height: 1.8;">
                          <div style="font-weight: 500; margin-bottom: 4px;">专家AI任职能力要求：</div>
                          <div>软件类L3岗位专家牵引26年H2之前获得4+AI任职资格；</div>
                          <div>软件类L2岗位专家牵引获得3+AI任职资格；</div>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ row }">
                    <template v-if="getBaselineByRequirement(row) === '/'">
                      /
                    </template>
                    <template v-else>
                      {{ formatNumber(getBaselineByRequirement(row) as number) }}
                    </template>
                  </template>
                </el-table-column>
                <el-table-column prop="appointedByRequirement" min-width="180" align="center" header-align="center">
                  <template #header>
                    <span>按岗位要求已获取AI任职人数</span>
                    <el-tooltip
                      placement="top"
                      effect="dark"
                    >
                      <template #content>
                        <div style="line-height: 1.8;">
                          <div style="font-weight: 500; margin-bottom: 4px;">专家AI任职能力要求：</div>
                          <div>软件类L3岗位专家牵引26年H2之前获得4+AI任职资格；</div>
                          <div>软件类L2岗位专家牵引获得3+AI任职资格；</div>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ row }">
                    <template v-if="getAppointedByRequirement(row) === '/'">
                      /
                    </template>
                    <template v-else>
                      {{ formatNumber(getAppointedByRequirement(row) as number) }}
                    </template>
                  </template>
                </el-table-column>
                <el-table-column prop="certificationCompliance" min-width="190" align="center" header-align="center">
                  <template #header>
                    <span>按岗位要求已获取AI任职人数占比</span>
                    <el-tooltip
                      placement="top"
                      effect="dark"
                    >
                      <template #content>
                        <div style="line-height: 1.8;">
                          <div style="font-weight: 500; margin-bottom: 4px;">专家AI任职能力要求：</div>
                          <div>软件类L3岗位专家牵引26年H2之前获得4+AI任职资格；</div>
                          <div>软件类L2岗位专家牵引获得3+AI任职资格；</div>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </template>
                  <template #default="{ row }">
                    <template v-if="isL2NonSoftware(row)">
                      /
                    </template>
                    <template v-else>
                      {{ formatPercent(row.certificationCompliance) }}
                    </template>
                  </template>
                </el-table-column>
                <el-table-column prop="appointed" label="AI任职人数" min-width="130" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click.stop="handleExpertQualifiedCellClick(row, 'appointed')"
                    >
                      {{ formatNumber(row.appointed) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="appointmentRate" label="AI任职率" min-width="130" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.appointmentRate) }}
                  </template>
                </el-table-column>
                <template #empty>
                  <el-empty description="待提供数据" :image-size="80" />
                </template>
              </el-table>
              <el-empty v-else description="待提供数据" :image-size="80" />
            </div>
          </div>
        </el-col>
        <!-- 2. 专家认证数据 -->
        <el-col :xs="24" :lg="24">
          <div class="summary-table-container">
            <div class="summary-table-header">
              <h3>
                专家AI认证数据
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">岗位AI成熟度等级定义：</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L3，即AI生产者，优化算法框架与AI基础设施，驱动基础模型及生态创新，打造产业原生智能技术底座；</div>
                      <div style="font-weight: 500; margin-bottom: 4px;">L2，即AI产品者，AI融入研发全流程，实现AI能力与产品整合，提升产品解决方案竞争力；</div>
                      <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">专家AI认证能力要求：</div>
                      <div>软件类L2/L3专家要求在26年H1之前完成"AI算法技术"专业级认证；</div>
                      <div>其他L2/L3岗位专家要求26年H2之前完成"AI算法技术"工作级认证科目2（算法理论），牵引26H1之前完成；</div>
                      <div>产品线管理团队成员按L2标准要求。</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </h3>
            </div>
            <div class="summary-table-body">
              <el-skeleton :rows="4" animated v-if="loadingExpert" />
              <el-table
                v-else-if="expertData"
                :data="sortedExpertCertificationData"
                border
                stripe
                size="small"
                :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
                :row-class-name="getRowClassName"
                :row-style="getRowStyle"
                :cell-style="getCellStyle"
                :cell-class-name="getCellClassName"
              >
                <!-- 合并的成熟度/职位类列 -->
                <el-table-column prop="maturityLevel" label="岗位AI成熟度/职位类" width="180" align="left" header-align="center">
                  <template #default="{ row }">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span v-if="row.isMaturityRow">{{ row.maturityLevel || '' }}</span>
                      <span v-else style="flex: 1;"></span>
                      <span v-if="!row.isMaturityRow">{{ row.jobCategory || '' }}</span>
                      <span v-else style="flex: 1;"></span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="baseline" label="基线人数" min-width="110" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click.stop="handleExpertCertCellClick(row, 'baseline')"
                    >
                      {{ formatNumber(row.baseline) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="certified" label="已完成AI认证人数" min-width="170" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-link
                      type="primary"
                      :underline="false"
                      class="clickable-cell"
                      @click.stop="handleExpertCertCellClick(row, 'certified')"
                    >
                      {{ formatNumber(row.certified) }}
                    </el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="certificationRate" label="AI认证人数占比" min-width="150" align="center" header-align="center">
                  <template #default="{ row }">
                    {{ formatPercent(row.certificationRate) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="待提供数据" :image-size="80" />
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="charts-section">
      <template #header>
        <div class="charts-header">
          <div class="charts-title">
            <el-icon><Medal /></el-icon>
            <div>
              <h3>全员任职/认证趋势</h3>
              <p>任职、认证人数使用柱状图展示，同时叠加占比折线辅助判读效率</p>
            </div>
          </div>
          <div class="charts-filter">
            <el-form :inline="true" :model="filters" label-width="80">
              <el-form-item label="角色视图">
                <el-select v-model="filters.role" placeholder="全员" style="width: 200px">
                  <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="toggleAllChartsView">
                  {{ getToggleButtonText() }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>
      <el-row :gutter="16">
        <!-- 部门数据：图表视图显示两个图表，表格视图显示一个合并表格 -->
        <template v-if="allChartsViewMode === 'chart'">
          <el-col :xs="24" :sm="24" :md="24" :lg="24">
            <el-skeleton :rows="3" animated v-if="loadingDepartmentStats || loadingAllStaffTrends" />
            <BarLineChart
              v-else-if="dashboardData"
              title="部门任职数据"
              :points="departmentChartPoints"
              :count-label="departmentCountLabel"
              rate-label="占比"
              :legend-totals="departmentLegendTotals"
              :height="320"
              @bar-click="handleDepartmentAppointmentBarClick"
            >
              <template #title-suffix>
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">AI任职方向包括：</div>
                      <div>数据科学与AI工程（ICT）</div>
                      <div>AI算法及应用（ICT）</div>
                      <div>AI软件工程与工具（ICT）</div>
                      <div>AI系统测试（ICT）</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
            </BarLineChart>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="24">
            <el-skeleton :rows="3" animated v-if="loadingDepartmentStats || loadingAllStaffTrends" />
            <BarLineChart
              v-else-if="dashboardData"
              title="部门认证数据"
              :points="departmentCertificationChartPoints"
              count-label="认证总人数"
              rate-label="占比"
              :legend-totals="departmentCertificationLegendTotals"
              :height="320"
              @bar-click="handleDepartmentCertificationBarClick"
            >
              <template #title-suffix>
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">AI认证方向包括：</div>
                      <div>AI算法技术</div>
                      <div>AI决策推理</div>
                      <div>AI图像语言语义</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
            </BarLineChart>
          </el-col>
        </template>
        <!-- 表格视图：合并的部门任职/认证数据表格 -->
        <el-col v-else-if="dashboardData && allChartsViewMode === 'table'" :xs="24" :sm="24" :md="24" :lg="24">
          <el-skeleton :rows="3" animated v-if="loadingDepartmentStats || loadingAllStaffTrends" />
          <el-card v-else shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>
                  部门任职/认证数据
                  <el-tooltip
                    placement="top"
                    effect="dark"
                  >
                    <template #content>
                      <div style="line-height: 1.8;">
                        <div style="font-weight: 500; margin-bottom: 4px;">AI任职方向包括：</div>
                        <div>数据科学与AI工程（ICT）</div>
                        <div>AI算法及应用（ICT）</div>
                        <div>AI软件工程与工具（ICT）</div>
                        <div>AI系统测试（ICT）</div>
                        <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">AI认证方向包括：</div>
                        <div>AI算法技术</div>
                        <div>AI决策推理</div>
                        <div>AI图像语言语义</div>
                      </div>
                    </template>
                    <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </h3>
              </div>
            </template>
            <el-table
              v-if="mergedDepartmentTableData.length > 0"
              :data="[...mergedDepartmentTableData, calculateMergedTableTotal(
                departmentChartPoints,
                departmentCertificationChartPoints,
                hasDepartmentStats ? resolveQualifiedRate(departmentStats?.employeeCertStatistics?.totalStatistics) : undefined,
                hasDepartmentStats ? resolveCertificationRate(departmentStats?.employeeCertStatistics?.totalStatistics) : undefined,
                hasDepartmentStats ? resolveQualifiedCount(departmentStats?.employeeCertStatistics?.totalStatistics) : undefined,
                hasDepartmentStats ? resolveCertificationCount(departmentStats?.employeeCertStatistics?.totalStatistics) : undefined
              )]"
              border
              stripe
              size="small"
              :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
              :row-class-name="({ rowIndex }) => rowIndex === mergedDepartmentTableData.length ? 'summary-row' : ''"
              style="width: 100%"
            >
              <el-table-column prop="label" label="部门" min-width="180" align="center" header-align="center" />
              <el-table-column prop="appointmentCount" :label="departmentCountLabel" min-width="140" align="center" header-align="center">
                <template #default="{ row }">
                  <el-link
                    type="primary"
                    :underline="false"
                    class="clickable-cell"
                    @click="handleDepartmentTableCellClick(row, 'appointment')"
                  >
                    {{ formatNumber(row.appointmentCount) }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="appointmentRate" label="AI任职占比" min-width="120" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.appointmentRate) }}
                </template>
              </el-table-column>
              <el-table-column prop="certificationCount" label="AI认证总人数" min-width="140" align="center" header-align="center">
                <template #default="{ row }">
                  <el-link
                    type="primary"
                    :underline="false"
                    class="clickable-cell"
                    @click="handleDepartmentTableCellClick(row, 'certification')"
                  >
                    {{ formatNumber(row.certificationCount) }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="certificationRate" label="AI认证占比" min-width="120" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.certificationRate) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="待提供数据" :image-size="80" />
          </el-card>
        </el-col>
        <!-- 职位类数据：图表视图显示两个图表，表格视图显示一个合并表格 -->
        <template v-if="allChartsViewMode === 'chart'">
          <el-col :xs="24" :sm="24" :md="24" :lg="24">
            <el-skeleton :rows="3" animated v-if="loadingJobCategoryStats || loadingAllStaffTrends" />
            <BarLineChart
              v-else-if="dashboardData"
              title="职位类任职数据"
              :points="jobCategoryAppointmentPoints"
              count-label="任职总人数"
              rate-label="占比"
              :legend-totals="jobCategoryAppointmentLegendTotals"
              :height="320"
              @bar-click="handleJobCategoryAppointmentBarClick"
            >
              <template #title-suffix>
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">AI任职方向包括：</div>
                      <div>数据科学与AI工程（ICT）</div>
                      <div>AI算法及应用（ICT）</div>
                      <div>AI软件工程与工具（ICT）</div>
                      <div>AI系统测试（ICT）</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
            </BarLineChart>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="24">
            <el-skeleton :rows="3" animated v-if="loadingJobCategoryStats || loadingAllStaffTrends" />
            <BarLineChart
              v-else-if="dashboardData"
              title="职位类认证数据"
              :points="jobCategoryCertificationPoints"
              count-label="认证总人数"
              rate-label="占比"
              :legend-totals="jobCategoryCertificationLegendTotals"
              :height="320"
              @bar-click="handleJobCategoryCertificationBarClick"
            >
              <template #title-suffix>
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">AI认证方向包括：</div>
                      <div>AI算法技术</div>
                      <div>AI决策推理</div>
                      <div>AI图像语言语义</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
            </BarLineChart>
          </el-col>
        </template>
        <!-- 表格视图：合并的职位类任职/认证数据表格 -->
        <el-col v-else-if="dashboardData && allChartsViewMode === 'table'" :xs="24" :sm="24" :md="24" :lg="24">
          <el-skeleton :rows="3" animated v-if="loadingJobCategoryStats || loadingAllStaffTrends" />
          <el-card v-else shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>
                  职位类任职/认证数据
                  <el-tooltip
                    placement="top"
                    effect="dark"
                  >
                    <template #content>
                      <div style="line-height: 1.8;">
                        <div style="font-weight: 500; margin-bottom: 4px;">AI任职方向包括：</div>
                        <div>数据科学与AI工程（ICT）</div>
                        <div>AI算法及应用（ICT）</div>
                        <div>AI软件工程与工具（ICT）</div>
                        <div>AI系统测试（ICT）</div>
                        <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">AI认证方向包括：</div>
                        <div>AI算法技术</div>
                        <div>AI决策推理</div>
                        <div>AI图像语言语义</div>
                      </div>
                    </template>
                    <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </h3>
              </div>
            </template>
            <el-table
              v-if="mergedJobCategoryTableData.length > 0"
              :data="[...mergedJobCategoryTableData, calculateMergedTableTotal(
                jobCategoryAppointmentPoints,
                jobCategoryCertificationPoints,
                hasJobCategoryStats ? resolveJobCategoryQualifiedRate(jobCategoryStats?.competenceCategoryCertStatistics?.totalStatistics) : undefined,
                hasJobCategoryStats ? resolveJobCategoryCertificationRate(jobCategoryStats?.competenceCategoryCertStatistics?.totalStatistics) : undefined,
                hasJobCategoryStats ? resolveJobCategoryQualifiedCount(jobCategoryStats?.competenceCategoryCertStatistics?.totalStatistics) : undefined,
                hasJobCategoryStats ? resolveJobCategoryCertificationCount(jobCategoryStats?.competenceCategoryCertStatistics?.totalStatistics) : undefined
              )]"
              border
              stripe
              size="small"
              :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
              :row-class-name="({ rowIndex }) => rowIndex === mergedJobCategoryTableData.length ? 'summary-row' : ''"
              style="width: 100%"
            >
              <el-table-column prop="label" label="职位类" min-width="180" align="center" header-align="center" />
              <el-table-column prop="appointmentCount" label="AI任职人数" min-width="140" align="center" header-align="center">
                <template #default="{ row }">
                  <el-link
                    type="primary"
                    :underline="false"
                    class="clickable-cell"
                    @click="handleJobCategoryTableCellClick(row, 'appointment')"
                  >
                    {{ formatNumber(row.appointmentCount) }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="appointmentRate" label="AI任职占比" min-width="120" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.appointmentRate) }}
                </template>
              </el-table-column>
              <el-table-column prop="certificationCount" label="AI认证人数" min-width="140" align="center" header-align="center">
                <template #default="{ row }">
                  <el-link
                    type="primary"
                    :underline="false"
                    class="clickable-cell"
                    @click="handleJobCategoryTableCellClick(row, 'certification')"
                  >
                    {{ formatNumber(row.certificationCount) }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="certificationRate" label="AI认证占比" min-width="120" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.certificationRate) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="待提供数据" :image-size="80" />
          </el-card>
        </el-col>
        <!-- 组织AI成熟度数据：图表视图显示两个图表，表格视图显示一个合并表格 -->
        <template v-if="allChartsViewMode === 'chart'">
          <el-col :xs="24" :sm="24" :md="24" :lg="24">
            <el-skeleton :rows="3" animated v-if="loadingAllStaffTrends" />
            <BarLineChart
              v-else-if="dashboardData"
              title="组织AI成熟度任职数据"
              :points="organizationAppointmentPoints"
              count-label="任职总人数"
              rate-label="占比"
              :legend-totals="organizationAppointmentLegendTotals"
              :height="320"
            >
              <template #title-suffix>
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">AI任职方向包括：</div>
                      <div>数据科学与AI工程（ICT）</div>
                      <div>AI算法及应用（ICT）</div>
                      <div>AI软件工程与工具（ICT）</div>
                      <div>AI系统测试（ICT）</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
            </BarLineChart>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="24">
            <el-skeleton :rows="3" animated v-if="loadingAllStaffTrends" />
            <BarLineChart
              v-else-if="dashboardData"
              title="组织AI成熟度认证数据"
              :points="organizationCertificationPoints"
              count-label="认证总人数"
              rate-label="占比"
              :legend-totals="organizationCertificationLegendTotals"
              :height="320"
            >
              <template #title-suffix>
                <el-tooltip
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div style="line-height: 1.8;">
                      <div style="font-weight: 500; margin-bottom: 4px;">AI认证方向包括：</div>
                      <div>AI算法技术</div>
                      <div>AI决策推理</div>
                      <div>AI图像语言语义</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </template>
            </BarLineChart>
          </el-col>
        </template>
        <!-- 表格视图：合并的组织AI成熟度任职/认证数据表格 -->
        <el-col v-else-if="dashboardData && allChartsViewMode === 'table'" :xs="24" :sm="24" :md="24" :lg="24">
          <el-skeleton :rows="3" animated v-if="loadingAllStaffTrends" />
          <el-card v-else shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>
                  组织AI成熟度任职/认证数据
                  <el-tooltip
                    placement="top"
                    effect="dark"
                  >
                    <template #content>
                      <div style="line-height: 1.8;">
                        <div style="font-weight: 500; margin-bottom: 4px;">AI任职方向包括：</div>
                        <div>数据科学与AI工程（ICT）</div>
                        <div>AI算法及应用（ICT）</div>
                        <div>AI软件工程与工具（ICT）</div>
                        <div>AI系统测试（ICT）</div>
                        <div style="margin-top: 12px; font-weight: 500; margin-bottom: 4px;">AI认证方向包括：</div>
                        <div>AI算法技术</div>
                        <div>AI决策推理</div>
                        <div>AI图像语言语义</div>
                      </div>
                    </template>
                    <el-icon style="margin-left: 4px; cursor: pointer; color: #909399;">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </h3>
              </div>
            </template>
            <el-table
              v-if="mergedOrganizationTableData.length > 0"
              :data="[...mergedOrganizationTableData, calculateMergedTableTotal(organizationAppointmentPoints, organizationCertificationPoints)]"
              border
              stripe
              size="small"
              :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
              :row-class-name="({ rowIndex }) => rowIndex === mergedOrganizationTableData.length ? 'summary-row' : ''"
              style="width: 100%"
            >
              <el-table-column prop="label" label="组织AI成熟度" min-width="180" align="center" header-align="center" />
              <el-table-column prop="appointmentCount" label="AI任职人数" min-width="140" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatNumber(row.appointmentCount) }}
                </template>
              </el-table-column>
              <el-table-column prop="appointmentRate" label="AI任职占比" min-width="120" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.appointmentRate) }}
                </template>
              </el-table-column>
              <el-table-column prop="certificationCount" label="AI认证人数" min-width="140" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatNumber(row.certificationCount) }}
                </template>
              </el-table-column>
              <el-table-column prop="certificationRate" label="AI认证占比" min-width="120" align="center" header-align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.certificationRate) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="待提供数据" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </section>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.glass-card {
  border-radius: $radius-lg;
  background: linear-gradient(135deg, rgba(58, 122, 254, 0.18), rgba(155, 92, 255, 0.16));
  box-shadow: 0 18px 45px rgba(58, 122, 254, 0.12);
  padding: $spacing-lg;
  color: #000;

  h2 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #000;
  }

  p {
    margin: $spacing-sm 0 0;
    color: #000;
    line-height: 1.6;
    white-space: nowrap;
  }
}

.header-info {
  max-width: 640px;
}

.filter-card {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;
}

.metric-row {
  margin-top: $spacing-xs;
}

.data-section {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;
  margin-top: $spacing-lg;

  .section-header {
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-main-color;
    }
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

.cadre-data-section {
  margin-top: -10px;
}

.summary-table-grid {
  row-gap: 16px;

  :deep(.el-col) {
    display: flex;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.summary-table-container) {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .summary-table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .summary-table-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    :deep(.el-table) {
      flex: 1;
      --el-table-border-color: rgba(47, 59, 82, 0.08);
      --el-table-row-hover-bg-color: rgba(58, 122, 254, 0.08);
      
      // 确保所有表格单元格中的文本使用正常颜色（除非是占位符或链接）
      td {
        color: #2f3b52 !important;
        
        .cell {
          color: #2f3b52 !important;
          
          // 保留占位符文本的灰色
          .pending-data {
            color: #909399 !important;
          }
          
          // 确保普通文本和数字使用正常颜色（不包括链接）
          span:not(.pending-data):not(.el-link):not(.el-link__inner),
          div:not(.pending-data) {
            color: #2f3b52 !important;
          }
        }
      }
    }

    :deep(.row-even) {
      background: rgba(58, 122, 254, 0.05);
    }

    :deep(.row-odd) {
      background: #fff;
    }

    // 成熟度行（L2、L3）和总计行的样式
    // 使用更具体的选择器确保覆盖 Element Plus 的默认样式
    :deep(.el-table) {
      .maturity-row {
        font-weight: bold !important;
        font-size: 15px !important; // 增大一号（从14px到15px）
        color: #000 !important;
        
        td {
          font-weight: bold !important;
          font-size: 15px !important;
          color: #000 !important;
          
          .cell {
            font-weight: bold !important;
            font-size: 15px !important;
            color: #000 !important;
            line-height: 1.5 !important;
            
            // 确保链接和文本都应用样式
            .el-link,
            .el-link__inner,
            span,
            div,
            * {
              font-weight: bold !important;
              font-size: 15px !important;
              color: #000 !important;
            }
          }
        }
      }
      
      // 针对 small 尺寸的表格
      &.el-table--small {
        .maturity-row {
          font-weight: bold !important;
          font-size: 15px !important;
          color: #000 !important;
          
          td {
            font-weight: bold !important;
            font-size: 15px !important;
            color: #000 !important;
            padding: 8px 0 !important;
            
            .cell {
              font-weight: bold !important;
              font-size: 15px !important;
              color: #000 !important;
              line-height: 1.5 !important;
              
              .el-link,
              .el-link__inner,
              span,
              div,
              * {
                font-weight: bold !important;
                font-size: 15px !important;
                color: #000 !important;
              }
            }
          }
        }
      }
    }

    .clickable-cell {
      cursor: pointer;
    }

    :deep(.cell-placeholder-bg) {
      background-color: rgba(240, 242, 245, 0.7) !important;
    }
  }
}


.charts-section {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }

  :deep(.el-row) {
    row-gap: $spacing-lg;
  }

  .charts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .charts-title {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-main-color;
    }

    p {
      margin: $spacing-xs 0 0;
      color: $text-secondary-color;
    }
  }

  .charts-filter {
    display: flex;
    align-items: center;
    margin-top: 16px;

    :deep(.el-form-item__label) {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .chart-card {
    border: none;
    border-radius: $radius-lg;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: $shadow-card;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: $text-main-color;
      }
    }

    :deep(.el-table) {
      --el-table-border-color: rgba(47, 59, 82, 0.08);
      --el-table-row-hover-bg-color: rgba(58, 122, 254, 0.08);
      width: 100%;

      // 总计行样式
      .summary-row {
        background-color: rgba(58, 122, 254, 0.1) !important;
        font-weight: bold !important;
        
        td {
          background-color: rgba(58, 122, 254, 0.1) !important;
          font-weight: bold !important;
          
          .cell {
            font-weight: bold !important;
            font-size: 14px !important;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .glass-card {
    flex-direction: column;
    gap: $spacing-md;
  }
}

.pending-data {
  background-color: rgba(240, 242, 245, 0.7) !important;
  color: #909399;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  font-size: 12px;
}
</style>