<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElCascader, ElCol, ElDialog, ElForm, ElFormItem, ElRow, ElSelect, ElSkeleton, ElTable, ElTableColumn, ElTag, ElMessage, ElPagination } from 'element-plus'
import { fetchSchoolDashboard } from '@/api/dashboard'
import type { SchoolCreditDetailResponseVO, SchoolCreditRecord } from '@/types/dashboard'
import { getPositionStatistics, getDepartmentStatistics, getSchoolCreditDetailList, getRoleSummary } from '@/api/dashboard_credit'
import type { SchoolRoleSummaryVO } from '@/types/dashboard'
import { normalizeRoleOptions } from '@/constants/roles'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'
import CreditOverviewTable from '@/components/dashboard/CreditOverviewTable.vue'
import { getUserIdFromAccount } from '@/utils/cookie'
import type {
  SchoolAllStaffSummaryRow,
  SchoolDashboardData,
  SchoolDashboardFilters,
  SchoolRoleSummaryRow,
  CreditOverviewVO,
} from '@/types/dashboard'

const router = useRouter()
const loading = ref(false)
const dashboardData = ref<SchoolDashboardData | null>(null)
const filters = reactive<SchoolDashboardFilters>({
  role: '0',
  departmentPath: ['ICT_BG', '0'],
})

// 学分统计数据
const positionData = ref<CreditOverviewVO[]>([])
const departmentData = ref<CreditOverviewVO[]>([])
const loadingPosition = ref(false)
const loadingDepartment = ref(false)
const creditRole = ref('0') // 独立的学分总览角色视图筛选

// 下钻弹窗相关
const drillDialogVisible = ref(false)
const drillDialogTitle = ref('')
const drillLoading = ref(false)
const drillData = ref<SchoolCreditRecord[]>([])
const drillTotal = ref(0)
const drillPageNum = ref(1)
const drillPageSize = ref(50)
const drillParams = reactive({
  deptCode: '',
  deptLevel: 0,
  categoryName: '',
  type: 'department' as 'department' | 'position'
})

// 2. 新增专家/干部数据的独立 ref（不再依赖 dashboardData）
const expertSummary = ref<SchoolRoleSummaryVO[]>([])
const cadreSummary = ref<SchoolRoleSummaryVO[]>([])
const loadingRoleSummary = ref(false)

// 3. 新增单独刷新方法
const fetchRoleSummaryOnly = async () => {
  loadingRoleSummary.value = true
  const deptCode = resolveDeptIdForStats()
  try {
    const res = await getRoleSummary(deptCode)
    if (res) {
      expertSummary.value = res.expertSummary
      cadreSummary.value  = res.cadreSummary
    }
  } catch (err) {
    console.error('获取角色学分总览失败：', err)
  } finally {
    loadingRoleSummary.value = false
  }
}

const {
  departmentTree: departmentOptions,
  cascaderProps,
  initDepartmentTree,
  refreshDepartmentTree,
} = useDepartmentFilter()
const roleOptions = computed(() => normalizeRoleOptions(dashboardData.value?.filters.roles ?? []))

const resolveDeptIdForStats = (): string | undefined => {
  const path = filters.departmentPath
  if (!path || path.length === 0) return undefined
  const last = path[path.length - 1]
  return (last != null && String(last).trim() !== '') ? String(last) : undefined
}

/** 仅刷新学分统计（切换角色视图时），不重新请求整页看板数据 */
const fetchCreditStatsOnly = async () => {
  if (!dashboardData.value) return
  loadingPosition.value = true
  loadingDepartment.value = true

  const deptCode = resolveDeptIdForStats()

  getPositionStatistics(deptCode, creditRole.value)
      .then(res => {
        positionData.value = res
            ? [...res.statistics, ...(res.totalStatistics ? [res.totalStatistics] : [])]
            : []
      })
      .catch(err => console.error('Position stats error:', err))
      .finally(() => loadingPosition.value = false)

  getDepartmentStatistics(deptCode, creditRole.value)
      .then(res => {
        departmentData.value = res
            ? [...res.statistics, ...(res.totalStatistics ? [res.totalStatistics] : [])]
            : []
      })
      .catch(err => console.error('Department stats error:', err))
      .finally(() => loadingDepartment.value = false)
}

const fetchData = async () => {
  loading.value = true
  try {
    const payload: SchoolDashboardFilters = {
      role: filters.role,
      departmentPath: filters.departmentPath?.length ? [...filters.departmentPath] : undefined,
    }

    loadingPosition.value = true
    loadingDepartment.value = true
    loadingRoleSummary.value = true

    fetchSchoolDashboard(payload)
        .then(res => { dashboardData.value = res })
        .catch(err => console.error('Dashboard data error:', err))

    const deptCode = resolveDeptIdForStats()

    getRoleSummary(deptCode)
        .then(res => {
          if (res) {
            expertSummary.value = res.expertSummary
            cadreSummary.value  = res.cadreSummary
          }
        })
        .catch(err => console.error('Role summary error:', err))
        .finally(() => loadingRoleSummary.value = false)

    getPositionStatistics(deptCode, creditRole.value)
        .then(res => {
          positionData.value = res
              ? [...res.statistics, ...(res.totalStatistics ? [res.totalStatistics] : [])]
              : []
        })
        .catch(err => console.error('Position stats error:', err))
        .finally(() => loadingPosition.value = false)

    getDepartmentStatistics(deptCode, creditRole.value)
        .then(res => {
          departmentData.value = res
              ? [...res.statistics, ...(res.totalStatistics ? [res.totalStatistics] : [])]
              : []
        })
        .catch(err => console.error('Department stats error:', err))
        .finally(() => loadingDepartment.value = false)

  } catch (error) {
    console.error('获取School看板数据失败', error)
    ElMessage.error('获取部分数据失败，请重试')
  } finally {
    loading.value = false
  }
}

watch(
    () => [filters.role, filters.departmentPath],
    () => { fetchData() },
    { deep: true }
)

watch(
    () => creditRole.value,
    () => { void fetchCreditStatsOnly() }
)

const resetFilters = () => {
  filters.role = '0'
  filters.departmentPath = ['ICT_BG', '0']  // 改：恢复初始值
}

const goToDetail = (query: Record<string, string | undefined>) => {
  router.push({
    name: 'SchoolDetail',
    params: { id: 'drill-down' },
    query,
  })
}

const handleRoleSummaryDrill = (
    row: SchoolRoleSummaryRow,
    type: 'expert' | 'cadre',
    field: string
) => {
  const resolved = router.resolve({
    name: 'SchoolDetail',
    params: { id: 'drill-down' },
    query: {
      type,
      maturityLevel: row.maturityLevel,
      metric: field,
      role: filters.role,
      hideRoleAndDept: 'true',   // ← 新增
    },
  })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

const handleAllStaffDrill = (row: SchoolAllStaffSummaryRow, field: string) => {
  goToDetail({
    type: 'allStaff',
    dimension: row.dimension,
    metric: field,
    role: filters.role,
  })
}

const handleOverviewDrill = (_metric: string) => {
  const account = getUserIdFromAccount() ?? undefined
  const resolved = router.resolve({
    name: 'SchoolPersonalTrainingDetail',
    query: { account },
  })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

// 处理基线人数下钻 - 跳转到 SchoolDetail 页面，传递当前行的筛选条件
const handleCreditDrillDown = (row: CreditOverviewVO, field: string, type: 'department' | 'position') => {
  if (field !== 'baselineHeadcount') return

  if (type === 'department') {
    const resolved = router.resolve({
      name: 'SchoolDetail',
      params: { id: 'drill-down' },
      query: {
        type: 'department',
        deptCode: row.categoryCode || '0',
        deptLevel: '4',
        role: creditRole.value,
        hideRoleAndDept: 'true',   // ← 新增
      },
    })
    window.open(resolved.href, '_blank', 'noopener,noreferrer')
  } else {
    const currentDeptCode = filters.departmentPath?.length
        ? filters.departmentPath[filters.departmentPath.length - 1]
        : '0'
    const resolved = router.resolve({
      name: 'SchoolDetail',
      params: { id: 'drill-down' },
      query: {
        type: 'position',
        deptCode: currentDeptCode,
        jobCategory: row.categoryName,
        role: creditRole.value,
        hideRoleAndDept: 'true',   // ← 新增
      },
    })
    window.open(resolved.href, '_blank', 'noopener,noreferrer')
  }
}

// 加载下钻明细数据
const loadDrillData = async () => {
  drillLoading.value = true
  try {
    const result = await getSchoolCreditDetailList({
      deptCode: drillParams.deptCode,
      deptLevel: drillParams.deptLevel,
      roleType: parseInt(creditRole.value),
      jobCategory: drillParams.type === 'position' ? drillParams.categoryName : undefined,
      pageNum: drillPageNum.value,
      pageSize: drillPageSize.value
    })

    if (result) {
      drillData.value = result.records
      drillTotal.value = result.total
    } else {
      drillData.value = []
      drillTotal.value = 0
    }
  } catch (error) {
    console.error('加载明细数据失败:', error)
    ElMessage.error('加载明细数据失败')
  } finally {
    drillLoading.value = false
  }
}

// 处理分页变化
const handleDrillPageChange = (page: number) => {
  drillPageNum.value = page
  loadDrillData()
}

// 关闭弹窗
const handleDrillDialogClose = () => {
  drillDialogVisible.value = false
  drillData.value = []
  drillPageNum.value = 1
}

/** 点击弹窗明细表中的姓名，以 employeeId 作为 account 在新标签打开个人训战课程详情页 */
const handleDrillNameClick = (employeeId: string) => {
  const resolved = router.resolve({
    name: 'SchoolPersonalTrainingDetail', // ← 改这里
    query: { account: employeeId },
  })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

const formatPercent = (value: number) => `${(value ?? 0).toFixed(1)}%`
const formatNumber = (value: number) => (value ?? 0).toFixed(1)
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch {
    return dateString
  }
}

const overviewItems = computed(() => {
  if (!dashboardData.value) return []
  const personal = dashboardData.value.personalOverview
  return [
    { label: '目标学分', value: personal.targetCredits.toString() },
    {
      label: '当前学分',
      value: personal.currentCredits.toString(),
      drillKey: 'currentCredits',
    },
    {
      label: '个人学分达成率',
      value: `${personal.completionRate.toFixed(1)}%`,
      drillKey: 'completionRate',
    },
    {
      label: '最小部门标杆学分达成率',
      value: `${personal.benchmarkRate.toFixed(1)}%`,
      drillKey: 'benchmarkRate',
    },
    {
      label: '时间进度学分目标',
      value: personal.scheduleTarget.toString(),
      drillKey: 'scheduleTarget',
    },
    {
      label: '学分达成日期',
      value: formatDate(personal.expectedCompletionDate),
    },
    {
      label: '学分状态预警',
      value: personal.status,
      statusType: personal.statusType,
    },
  ]
})

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
  <section class="dashboard school-dashboard">
    <header class="dashboard__header glass-card">
      <div class="header-info">
        <h2>AI School 看板</h2>
        <p>
          覆盖专家、干部与全员多维度的学分达成态势，结合部门筛选快速定位薄弱环节，支持下钻查看详情。
        </p>
      </div>
    </header>

    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters" label-width="92">
        <el-form-item label="部门筛选">
          <el-cascader
              v-model="filters.departmentPath"
              :options="departmentOptions"
              :props="cascaderProps"
              placeholder="可选择至六级部门"
              clearable
              separator=" / "
              style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="角色视图">
          <el-select v-model="filters.role" placeholder="全员" style="width: 180px">
            <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button text type="primary" @click="resetFilters">重置筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-skeleton :rows="8" animated v-if="loading" />
    <template v-else-if="dashboardData">
      <el-card shadow="hover" class="overview-card">
        <template #header>
          <h3>个人数据总览</h3>
        </template>
        <el-row :gutter="16">
          <el-col v-for="item in overviewItems" :key="item.label" :xs="24" :sm="12" :md="6">
            <div class="overview-item">
              <span class="overview-label">{{ item.label }}</span>
              <template v-if="item.statusType">
                <el-tag :type="item.statusType">{{ item.value }}</el-tag>
              </template>
              <template v-else-if="item.drillKey">
                <el-button link class="drill-link" @click="handleOverviewDrill(item.drillKey)">
                  {{ item.value }}
                </el-button>
              </template>
              <template v-else>
                <span class="overview-value">{{ item.value }}</span>
              </template>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 全员学分总览：放在个人数据总览下面，专家学分总览上面 -->
      <el-card shadow="hover" class="summary-card">
        <template #header>
          <div class="card-header">
            <h3>全员学分总览</h3>
            <el-select v-model="creditRole" placeholder="角色视图" style="width: 140px" size="small">
              <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
            </el-select>
          </div>
        </template>

        <CreditOverviewTable
            title="部门学分总览"
            :data="departmentData"
            :loading="loadingDepartment"
            type="department"
            @drill-down="(row, field) => handleCreditDrillDown(row, field, 'department')"
        />

        <!-- 暂时隐藏职位学分总览表格，后续可能启用
        <CreditOverviewTable
          title="职位学分总览"
          :data="positionData"
          :loading="loadingPosition"
          type="position"
          @drill-down="(row, field) => handleCreditDrillDown(row, field, 'position')"
        />
        -->
      </el-card>

      <el-card shadow="hover" class="summary-card" v-loading="loadingRoleSummary">
        <template #header><h3>专家学分总览</h3></template>
        <el-table
            :data="expertSummary"
            border
            style="width: 100%"
            :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', fontSize: '12px', textAlign: 'center' }"
            :cell-style="{ textAlign: 'center' }"
        >
          <el-table-column prop="maturityLevel" label="专家岗位成熟度等级" width="180" />
          <el-table-column prop="baseline" label="专家人数" width="120">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'expert', 'baseline')">
                {{ row.baseline }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="maxCredits" label="专家个人最高学分" width="150">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'expert', 'maxCredits')">
                {{ row.maxCredits }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="minCredits" label="专家个人最低学分" width="150">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'expert', 'minCredits')">
                {{ row.minCredits }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="averageCredits" label="当前平均学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'expert', 'averageCredits')">
                {{ formatNumber(row.averageCredits) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="targetCredits" label="目标平均学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'expert', 'targetCredits')">
                {{ formatNumber(row.targetCredits) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="completionRate" label="学分达成率" width="120">
            <template #default="{ row }">{{ formatPercent(row.completionRate) }}</template>
          </el-table-column>
          <el-table-column prop="scheduleTarget" label="时间进度学分目标" width="150" />
          <el-table-column prop="status" label="学分状态预警" width="120">
            <template #default="{ row }">
              <el-tag :type="row.statusType">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="hover" class="summary-card" v-loading="loadingRoleSummary">
        <template #header><h3>干部学分总览</h3></template>
        <el-table
            :data="cadreSummary"
            border
            style="width: 100%"
            :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', fontSize: '12px', textAlign: 'center' }"
            :cell-style="{ textAlign: 'center' }"
        >
          <el-table-column prop="maturityLevel" label="干部岗位成熟度等级" width="180" />
          <el-table-column prop="baseline" label="干部人数" width="120">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'cadre', 'baseline')">
                {{ row.baseline }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="maxCredits" label="干部个人最高学分" width="150">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'cadre', 'maxCredits')">
                {{ row.maxCredits }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="minCredits" label="干部个人最低学分" width="150">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'cadre', 'minCredits')">
                {{ row.minCredits }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="averageCredits" label="当前平均学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'cadre', 'averageCredits')">
                {{ formatNumber(row.averageCredits) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="targetCredits" label="目标平均学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleRoleSummaryDrill(row, 'cadre', 'targetCredits')">
                {{ formatNumber(row.targetCredits) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="completionRate" label="学分达成率" width="120">
            <template #default="{ row }">{{ formatPercent(row.completionRate) }}</template>
          </el-table-column>
          <el-table-column prop="scheduleTarget" label="时间进度学分目标" width="150" />
          <el-table-column prop="status" label="学分状态预警" width="120">
            <template #default="{ row }">
              <el-tag :type="row.statusType">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card
          v-for="group in dashboardData.allStaffSummary.groups"
          :key="group.title"
          shadow="hover"
          class="summary-card"
      >
        <template #header>
          <h3>全员学分总览表 - {{ group.title }}</h3>
        </template>
        <el-table :data="group.rows" border style="width: 100%">
          <el-table-column prop="dimension" :label="group.dimensionLabel" width="180" />
          <el-table-column prop="baseline" label="基线人数" width="120">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleAllStaffDrill(row, 'baseline')">
                {{ row.baseline }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="maxCredits" label="个人最高学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleAllStaffDrill(row, 'maxCredits')">
                {{ row.maxCredits }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="minCredits" label="个人最低学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleAllStaffDrill(row, 'minCredits')">
                {{ row.minCredits }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="averageCredits" label="平均学分" width="120">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleAllStaffDrill(row, 'averageCredits')">
                {{ formatNumber(row.averageCredits) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="targetCredits" label="目标平均学分" width="130">
            <template #default="{ row }">
              <el-button link class="drill-link" @click="handleAllStaffDrill(row, 'targetCredits')">
                {{ formatNumber(row.targetCredits) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="completionRate" label="学分达成率" width="120">
            <template #default="{ row }">{{ formatPercent(row.completionRate) }}</template>
          </el-table-column>
          <el-table-column prop="scheduleTarget" label="时间进度学分目标" width="150" />
          <el-table-column prop="status" label="学分状态预警" width="120">
            <template #default="{ row }">
              <el-tag :type="row.statusType">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

    </template>

    <!-- 基线人数下钻明细弹窗 -->
    <el-dialog
        v-model="drillDialogVisible"
        :title="drillDialogTitle"
        width="90%"
        top="5vh"
        destroy-on-close
        @closed="handleDrillDialogClose"
    >
      <el-table
          v-loading="drillLoading"
          :data="drillData"
          border
          stripe
          height="60vh"
          style="width: 100%"
          :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', textAlign: 'center' }"
          :cell-style="{ textAlign: 'center' }"
      >
        <el-table-column prop="name" label="姓名" width="100" fixed="left">
          <template #default="{ row }">
            <el-button link type="primary" class="drill-link" @click="handleDrillNameClick(row.employeeId)">
              {{ row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="employeeId" label="工号" width="120" />
        <el-table-column prop="jobFamily" label="职位族" width="120" />
        <el-table-column prop="jobCategory" label="职位类" width="120" />
        <el-table-column prop="jobSubCategory" label="职位子类" width="120" />
        <el-table-column prop="departmentLevel1" label="一级部门" width="120" />
        <el-table-column prop="departmentLevel2" label="二级部门" width="120" />
        <el-table-column prop="departmentLevel3" label="三级部门" width="120" />
        <el-table-column prop="departmentLevel4" label="四级部门" width="120" />
        <el-table-column prop="departmentLevel5" label="五级部门" width="120" />
        <el-table-column prop="minDepartment" label="最小部门" width="150">
          <template #default="{ row }">
            {{ row.minDepartment ? row.minDepartment.split('/')[0] : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="isCadre" label="是否干部" width="100">
          <template #default="{ row }">{{ row.isCadre ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="isExpert" label="是否专家" width="100">
          <template #default="{ row }">{{ row.isExpert ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="organizationMaturity" label="组织成熟度" width="120" />
        <el-table-column prop="positionMaturity" label="岗位成熟度" width="120" />
        <el-table-column prop="currentCredits" label="当前学分" width="100" />
        <el-table-column prop="completionRate" label="达成率" width="100">
          <template #default="{ row }">{{ row.completionRate?.toFixed ? `${row.completionRate.toFixed(1)}%` : row.completionRate }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" fixed="right">
          <template #default="{ row }">
            <el-tag :type="row.statusType">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-pagination
              v-model:current-page="drillPageNum"
              v-model:page-size="drillPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="drillTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadDrillData"
              @current-change="handleDrillPageChange"
          />
        </div>
      </template>
    </el-dialog>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;

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
    max-width: 720px;
  }
}

.header-info {
  max-width: 720px;
}

.filter-card {
  border: none;

  .el-form-item {
    margin-right: $spacing-md;
  }
}

.overview-card {
  border: none;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .overview-item {
    padding: $spacing-md;
    text-align: center;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);

    .overview-label {
      color: $text-secondary-color;
      font-size: 13px;
      margin-bottom: $spacing-xs;
      display: block;
    }

    .overview-value {
      font-size: 20px;
      font-weight: 600;
      color: $text-main-color;
    }

    .drill-link {
      font-size: 20px;
      font-weight: 600;
      color: $primary-color;
    }
  }
}

.summary-card {
  border: none;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.drill-link {
  font-weight: 600;
  padding: 0;
  border-radius: 0;
  color: $primary-color;
  background: transparent;

  &.is-link {
    color: $primary-color;
  }

  &:hover {
    background: transparent;
    text-decoration: underline;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

@media (max-width: 768px) {
  .glass-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>