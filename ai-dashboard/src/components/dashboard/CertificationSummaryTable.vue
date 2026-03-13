<script setup lang="ts">
import { useRouter } from 'vue-router'

interface TableColumn {
  prop: string
  label: string
  width?: number
  clickable?: boolean
  valueType?: 'text' | 'number' | 'percent'
}

interface Props {
  title: string
  columns: TableColumn[]
  data: Array<Record<string, any>>
  onCellClick?: (row: any, column: string) => void
}

const props = defineProps<Props>()
const router = useRouter()

const handleCellClick = (row: any, column: string) => {
  if (props.onCellClick) {
    props.onCellClick(row, column)
  } else {
    router.push({
      name: 'CertificationDetail',
      params: { id: 'detail' },
      query: { type: column, value: row[column] },
    })
  }
}

const formatNumber = (value: number) => {
  if (Number.isNaN(value)) {
    return value
  }
  return new Intl.NumberFormat('zh-CN').format(value)
}

const formatPercent = (value: number) => {
  if (value > 1) {
    return `${value.toFixed(1)}%`
  }
  return `${(value * 100).toFixed(1)}%`
}

const formatCellValue = (row: Record<string, any>, column: TableColumn) => {
  const value = row[column.prop]
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (column.valueType === 'percent' && typeof value === 'number') {
    return formatPercent(value)
  }

  if (column.valueType === 'number' && typeof value === 'number') {
    return formatNumber(value)
  }

  return value
}

const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  if (rowIndex % 2 === 0) {
    return 'row-even'
  }
  return 'row-odd'
}
</script>

<template>
  <div class="summary-table-container">
    <div class="summary-table-header">
      <h3>
        {{ title }}
        <slot name="title-suffix" />
      </h3>
      <slot name="header-extra" />
    </div>
    <div class="summary-table-body">
      <el-table
        :data="data"
        border
        stripe
        size="small"
        :header-cell-style="{ background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52' }"
        :row-class-name="getRowClassName"
      >
        <el-table-column
          v-for="(col, index) in columns"
          :key="col.prop"
          :prop="col.prop"
          :min-width="col.width || 120"
          :align="index === 0 ? 'left' : 'center'"
          :header-align="'center'"
        >
          <template #header>
            <span style="white-space: normal; word-break: break-word; line-height: 1.4;">{{ col.label }}</span>
          </template>
          <template #default="{ row }">
            <el-link
              v-if="col.clickable"
              type="primary"
              :underline="false"
              class="clickable-cell"
              @click="handleCellClick(row, col.prop)"
            >
              {{ formatCellValue(row, col) }}
            </el-link>
            <span v-else>
              {{ formatCellValue(row, col) }}
            </span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="待提供数据" :image-size="80" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary-table-container {
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
  }

  :deep(.el-table__header-wrapper) {
    .el-table__header {
      th {
        .cell {
          white-space: normal;
          word-break: break-word;
          line-height: 1.4;
          padding: 8px 0;
        }
      }
    }
  }

  :deep(.row-even) {
    background: rgba(58, 122, 254, 0.02);
  }

  :deep(.row-odd) {
    background: #fff;
  }
}

.clickable-cell {
  cursor: pointer;
}
</style>
