<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchSchoolDetailData } from '@/api/dashboard'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'
import type { SchoolDetailData, SchoolDetailFilters } from '@/types/dashboard'
import { normalizeRoleOptions } from '@/constants/roles'

const props = defineProps<{ id: string }>()
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const detailData = ref<SchoolDetailData | null>(null)
const hideRoleAndDept = computed(() => route.query.hideRoleAndDept === 'true')

// 从 URL query 参数初始化 filters
const initFiltersFromQuery = (): SchoolDetailFilters => {
  const query = route.query
  const filters: SchoolDetailFilters = {
    role: (query.role as string) || '0',
    positionMaturity: '全部',
    departmentPath: [],
  }

  if (query.deptCode && query.deptCode !== '0') {
    filters.deptCode = query.deptCode as string
    filters.departmentPath = [query.deptCode as string]
  }

  if (query.deptLevel) {
    filters.deptLevel = parseInt(query.deptLevel as string, 10)
  }

  if (query.jobCategory) {
    filters.jobCategory = query.jobCategory as string
  }

  return filters
}

const filters = ref<SchoolDetailFilters>(initFiltersFromQuery())

const {
  departmentTree,
  cascaderProps,
  initDepartmentTree,
  refreshDepartmentTree,
} = useDepartmentFilter()

const roleOptions = computed(() => normalizeRoleOptions(detailData.value?.filters.roles ?? []))

const fetchDetail = async () => {
  loading.value = true
  try {
    detailData.value = await fetchSchoolDetailData(props.id, filters.value)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.push({ name: 'SchoolDashboard' })
}

const handleFilterChange = () => {
  fetchDetail()
}

/** 点击姓名，以 employeeId 作为 account 在新标签打开个人训战课程详情页 */
const handleNameDrill = (employeeId: string) => {
  const resolved = router.resolve({
    name: 'SchoolPersonalTrainingDetail',
    query: { account: employeeId },
  })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`

onMounted(() => {
  initDepartmentTree()
  fetchDetail()
})

onActivated(() => {
  // 每次激活时从 query 重新初始化 filters
  Object.assign(filters.value, initFiltersFromQuery())
  refreshDepartmentTree()
  fetchDetail()
})
</script>

<template>
  <section class="detail-view school-detail">
    <header class="detail-view__header glass-card">
      <div class="header-left">
        <el-button class="back-button" type="primary" text :icon="ArrowLeft" @click="handleBack">
          返回列表页
        </el-button>
        <div class="header-content">
          <h2>AI School 看板详情</h2>
          <p>查看学分数据明细与规则说明，支持多维度筛选。</p>
        </div>
      </div>
      <el-space>
        <el-button type="primary" plain :icon="Refresh" @click="fetchDetail">刷新数据</el-button>
        <el-button type="primary">导出报表</el-button>
      </el-space>
    </header>

    <el-card shadow="hover" class="filter-card" v-if="detailData">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="12" :md="6" v-if="!hideRoleAndDept">
          <label>部门筛选：</label>
          <el-cascader
              v-model="filters.departmentPath"
              :options="departmentTree"
              :props="cascaderProps"
              placeholder="请选择部门"
              clearable
              :disabled="!!filters.deptCode"
              @change="handleFilterChange"
              style="width: 100%"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <label>职位族：</label>
          <el-select
              v-model="filters.jobFamily"
              placeholder="请选择职位族"
              clearable
              @change="handleFilterChange"
              style="width: 100%"
          >
            <el-option
                v-for="family in detailData.filters.jobFamilies"
                :key="family"
                :label="family"
                :value="family"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <label>职位类：</label>
          <el-select
              v-model="filters.jobCategory"
              placeholder="请选择职位类"
              clearable
              @change="handleFilterChange"
              style="width: 100%"
          >
            <el-option
                v-for="category in detailData.filters.jobCategories"
                :key="category"
                :label="category"
                :value="category"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <label>职位子类：</label>
          <el-select
              v-model="filters.jobSubCategory"
              placeholder="请选择职位子类"
              clearable
              @change="handleFilterChange"
              style="width: 100%"
          >
            <el-option
                v-for="subCategory in detailData.filters.jobSubCategories"
                :key="subCategory"
                :label="subCategory"
                :value="subCategory"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" v-if="!hideRoleAndDept">
          <label>角色：</label>
          <el-select
              v-model="filters.role"
              placeholder="请选择角色"
              @change="handleFilterChange"
              style="width: 100%"
          >
            <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-skeleton :rows="6" animated v-if="loading" />
    <template v-else-if="detailData">
      <!-- AI School学分数据明细 -->
      <el-card shadow="hover" class="detail-block">
        <template #header>
          <h3>AI School学分数据明细</h3>
        </template>
        <el-table :data="detailData.records" border style="width: 100%" max-height="600">
          <el-table-column prop="name" label="姓名" width="100" fixed="left" align="center" header-align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button link type="primary" class="drill-link" @click="handleNameDrill(row.employeeId)">
                {{ row.name }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="employeeId" label="工号" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="jobFamily" label="职位族" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="jobCategory" label="职位类" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="jobSubCategory" label="职位子类" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="departmentLevel1" label="一级部门" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="departmentLevel2" label="二级部门" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="departmentLevel3" label="三级部门" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="departmentLevel4" label="四级部门" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="departmentLevel5" label="五级部门" width="120" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="minDepartment" label="最小部门" width="150" align="center" header-align="center" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.minDepartment ? row.minDepartment.split('/')[0] : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="currentCredits" label="当前学分" width="100" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="completionRate" label="学分达成率" width="120" align="center" header-align="center" show-overflow-tooltip>
            <template #default="{ row }">{{ formatPercent(row.completionRate) }}</template>
          </el-table-column>
          <el-table-column prop="benchmarkRate" label="所在最小部门标杆学分达成率" width="220" align="center" header-align="center" show-overflow-tooltip>
            <template #default="{ row }">{{ formatPercent(row.benchmarkRate) }}</template>
          </el-table-column>
          <el-table-column prop="scheduleTarget" label="时间进度学分目标" width="160" align="center" header-align="center" show-overflow-tooltip />
          <el-table-column prop="status" label="学分状态预警" width="120" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <el-tag :type="row.statusType">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </section>
</template>

<style scoped lang="scss">
.detail-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.glass-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, rgba(7, 116, 221, 0.18), rgba(61, 210, 255, 0.12));
  box-shadow: 0 18px 40px rgba(7, 116, 221, 0.16);
  color: #000;

  .back-button {
    flex-shrink: 0;
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-sm;
  flex: 1;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  flex: 1;

  h2 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #000;
  }

  p {
    margin: 0;
    max-width: 560px;
    color: #000;
  }
}

.filter-card {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;
  :deep(.el-row) {
    row-gap: $spacing-md;
  }

  label {
    display: inline-block;
    margin-right: $spacing-sm;
    color: $text-main-color;
    font-weight: 500;
  }
}

.detail-block {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;

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
}
</style>