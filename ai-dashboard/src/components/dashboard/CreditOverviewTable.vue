<script setup lang="ts">
import { computed } from 'vue'
import type { CreditOverviewVO } from '@/types/dashboard'

interface Props {
  title: string
  data: CreditOverviewVO[]
  loading: boolean
  type?: 'position' | 'department'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'department',
})

interface Emits {
  (e: 'drill-down', row: CreditOverviewVO, field: string): void
}

const emit = defineEmits<Emits>()

const categoryLabel = computed(() => {
  return props.type === 'position' ? '职位类别' : '部门'
})

const formatPercent = (_row: any, _column: any, cellValue: number) => {
  if (cellValue == null) return '-'
  return `${cellValue}%`
}

const formatScore = (_row: any, _column: any, cellValue: number) => {
  if (cellValue == null) return '-'
  return cellValue
}
const handleDrillDown = (row: CreditOverviewVO, field: string) => {
  emit('drill-down', row, field)
}

const tableRowClassName = ({ row }: { row: CreditOverviewVO }) => {
  if (row.categoryName === '总计') {
    return 'total-row'
  }
  return ''
}
</script>

<template>
  <el-card class="credit-overview-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <h3>{{ title }}</h3>
      </div>
    </template>
    
    <el-table
      v-loading="loading"
      :data="data"
      border
      stripe
      style="width: 100%"
      :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52', textAlign: 'center' }"
      :cell-style="{ textAlign: 'center' }"
      :row-class-name="tableRowClassName"
    >
      <el-table-column prop="categoryName" :label="categoryLabel" min-width="180" fixed />
      <el-table-column prop="baselineHeadcount" label="基线人数" min-width="100">
        <template #default="{ row }">
          <el-button 
            link 
            class="drill-link" 
            @click="handleDrillDown(row, 'baselineHeadcount')"
          >
            {{ row.baselineHeadcount }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="maxScore" label="最高分" min-width="100" :formatter="formatScore" />
      <el-table-column prop="minScore" label="最低分" min-width="100" :formatter="formatScore" />
      <el-table-column prop="averageCurrentCredit" label="当前平均学分" min-width="120" :formatter="formatScore" />
      <el-table-column prop="averageTargetCredit" label="目标平均学分" min-width="120" :formatter="formatScore" />
      <el-table-column prop="achievementRate" label="达成率" min-width="120">
        <template #default="{ row }">
          <span :class="{ 'warning-text': row.isWarning }">
            {{ row.achievementRate != null ? `${row.achievementRate}%` : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="timeProgress" label="时间进度" min-width="120" :formatter="formatPercent" />
      <el-table-column label="状态" min-width="100" fixed="right">
        <template #default="{ row }">
          <el-tag :type="row.isWarning ? 'danger' : 'success'" effect="light">
            {{ row.isWarning ? '预警' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped lang="scss">
.credit-overview-card {
  border: none;
  margin-bottom: 24px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.warning-text {
  color: #f56c6c;
  font-weight: bold;
}

.drill-link {
  font-weight: 600;
  padding: 0;
  border-radius: 0;
  color: #409eff; /* element-plus primary color */
  background: transparent;

  &:hover {
    background: transparent;
    text-decoration: underline;
  }
}

:deep(.el-table .total-row) {
  font-weight: bold;
  --el-table-tr-bg-color: #f5f7fa;
}

:deep(.el-table .total-row td.el-table__cell) {
  background-color: #f5f7fa !important;
}
</style>
