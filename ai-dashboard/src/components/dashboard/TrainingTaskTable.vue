<script setup lang="ts">
import { computed, toRefs } from 'vue'
import type { TrainingTask } from '../../types/dashboard'

interface Props {
  tasks: TrainingTask[]
}

const props = defineProps<Props>()
const { tasks } = toRefs(props)
const emit = defineEmits<{
  (e: 'view-detail', id: string): void
}>()

const statusTagTypeMap: Record<TrainingTask['status'], 'success' | 'warning' | 'info'> = {
  进行中: 'warning',
  待启动: 'info',
  已完成: 'success',
}

const stats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter((item) => item.status === '已完成').length
  const inProgress = tasks.value.filter((item) => item.status === '进行中').length
  return {
    total,
    completed,
    inProgress,
  }
})
</script>

<template>
  <el-card shadow="hover" class="task-card">
    <template #header>
      <div class="task-card__header">
        <div>
          <p class="task-card__title">训练任务列表</p>
          <p class="task-card__description">当前共有 {{ stats.total }} 个任务，{{ stats.completed }} 个已完成。</p>
        </div>
        <el-button type="primary" plain round size="small">新建训练任务</el-button>
      </div>
    </template>
    <el-table :data="tasks" border stripe>
      <el-table-column prop="name" label="任务名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="dataset" label="数据集" min-width="160" show-overflow-tooltip />
      <el-table-column prop="owner" label="负责人" width="120" />
      <el-table-column label="进度" width="160">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" :color="row.progress === 100 ? '#3cb179' : '#3a7afe'" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagTypeMap[row.status as keyof typeof statusTagTypeMap]" effect="light">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="最近更新" width="180" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="emit('view-detail', row.id)">
            查看详情
          </el-button>
          <el-button type="primary" link size="small">复制</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped lang="scss">
.task-card {
  border: none;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-lg;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  &__description {
    margin: 4px 0 0;
    color: $text-secondary-color;
    font-size: 12px;
  }
}

::v-deep(.el-table__body-wrapper) {
  font-size: 13px;
}
</style>

