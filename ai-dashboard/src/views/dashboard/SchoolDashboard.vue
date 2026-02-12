<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElCascader, ElCol, ElForm, ElFormItem, ElLink, ElRow, ElSelect, ElSkeleton, ElTable, ElTableColumn, ElTag, ElMessage } from 'element-plus'
import { fetchSchoolDashboard } from '@/api/dashboard'
import { getPositionStatistics, getDepartmentStatistics } from '@/api/dashboard_credit'
import { normalizeRoleOptions } from '@/constants/roles'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'
import CreditOverviewTable from '@/components/dashboard/CreditOverviewTable.vue'
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

const {
  departmentTree: departmentOptions,
  cascaderProps,
  initDepartmentTree,
  refreshDepartmentTree,
} = useDepartmentFilter()
const roleOptions = computed(() => normalizeRoleOptions(dashboardData.value?.filters.roles ?? []))

const DOWNLOAD_RESOURCES = [
  {
    id: 'rules',
    title: 'AI School学分规则表',
    description: '查看最新学分来源与计算说明',
    href: 'https://example.com/docs/ai-school-credit-rules.xlsx',
  },
  {
    id: 'targets',
    title: 'AI School学分目标表',
    description: '下载最新学分目标与预警阈值',
    href: 'https://example.com/docs/ai-school-credit-targets.xlsx',
  },
] as const

const fetchData = async () => {
  loading.value = true
  try {
    const payload: SchoolDashboardFilters = {
      role: filters.role,
      departmentPath: filters.departmentPath?.length ? [...filters.departmentPath] : undefined,
    }
    
    // 并行获取仪表盘数据和学分统计数据
    loadingPosition.value = true
    loadingDepartment.value = true
    
    // 分开处理，避免一个失败导致全部失败
    fetchSchoolDashboard(payload)
      .then(res => dashboardData.value = res)
      .catch(err => console.error('Dashboard data error:', err))

    // 获取当前选中的部门编码
    const currentDeptCode = filters.departmentPath?.length 
      ? filters.departmentPath[filters.departmentPath.length - 1] 
      : undefined
      
    getPositionStatistics(currentDeptCode, creditRole.value)
      .then(res => {
        if (res) {
          // 合并列表和总计
          const list = [...res.statistics]
          if (res.totalStatistics) {
            list.push(res.totalStatistics)
          }
          positionData.value = list
        } else {
          positionData.value = []
        }
      })
      .catch(err => console.error('Position stats error:', err))
      .finally(() => loadingPosition.value = false)
      
    getDepartmentStatistics(currentDeptCode, creditRole.value)
      .then(res => {
        if (res) {
           // 合并列表和总计
          const list = [...res.statistics]
          if (res.totalStatistics) {
            list.push(res.totalStatistics)
          }
          departmentData.value = list
        } else {
          departmentData.value = []
        }
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
  () => [filters.role, filters.departmentPath, creditRole.value],
  () => {
    fetchData()
  },
  { deep: true }
)

const resetFilters = () => {
  filters.role = '0'
  filters.departmentPath = []
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
  goToDetail({
    type,
    maturityLevel: row.maturityLevel,
    metric: field,
    role: filters.role,
  })
}

const handleAllStaffDrill = (row: SchoolAllStaffSummaryRow, field: string) => {
  goToDetail({
    type: 'allStaff',
    dimension: row.dimension,
    metric: field,
    role: filters.role,
  })
}

const handleOverviewDrill = (metric: string) => {
  goToDetail({ type: 'personal', metric })
}

const handleCreditDrillDown = (row: CreditOverviewVO, field: string) => {
  if (field === 'baselineHeadcount') {
    // 简单的下钻逻辑，可以根据需要扩展
    // 对于部门维度，可能需要进入该部门的详情
    // 对于职位维度，可能需要进入该职位的详情
    // 这里暂时复用 SchoolDetail 路由，传递参数
    goToDetail({
      type: 'credit-drill',
      categoryName: row.categoryName,
      field: field,
      role: creditRole.value
    })
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
      value: personal.expectedCompletionDate,
    },
    {
      label: '学分状态预警',
      value: personal.status,
      statusType: personal.statusType,
    },
  ]
})

const formatPercent = (value: number) => `${(value ?? 0).toFixed(1)}%`
const formatNumber = (value: number) => (value ?? 0).toFixed(1)

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

    <el-card shadow="hover" class="resource-card">
      <el-row :gutter="16">
        <el-col v-for="item in DOWNLOAD_RESOURCES" :key="item.id" :xs="24" :sm="12">
          <article class="resource-card__item">
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
            <el-link type="primary" :href="item.href" target="_blank">下载文档</el-link>
          </article>
        </el-col>
      </el-row>
    </el-card>

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

      <el-card shadow="hover" class="summary-card">
        <template #header>
          <h3>专家学分总览</h3>
        </template>
        <el-table :data="dashboardData.expertSummary" border style="width: 100%">
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

      <el-card shadow="hover" class="summary-card">
        <template #header>
          <h3>干部学分总览</h3>
        </template>
        <el-table :data="dashboardData.cadreSummary" border style="width: 100%">
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

      <!-- 新增全员学分总览板块 -->
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
          @drill-down="handleCreditDrillDown"
        />
        
        <CreditOverviewTable
          title="职位学分总览"
          :data="positionData"
          :loading="loadingPosition"
          type="position"
          @drill-down="handleCreditDrillDown"
        />
      </el-card>
    </template>
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

.resource-card {
  border: none;

  &__item {
    border-radius: $radius-lg;
    background: rgba(58, 122, 254, 0.08);
    padding: $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;

    h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-main-color;
    }

    p {
      margin: 0;
      color: $text-secondary-color;
    }
  }
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

@media (max-width: 768px) {
  .glass-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .resource-card__item {
    align-items: flex-start;
  }
}
</style>
