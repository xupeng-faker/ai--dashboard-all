<script setup lang="ts">
import type { CertificationItem } from '../../types/dashboard'

interface Props {
  certifications: CertificationItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'view-detail', id: string): void
}>()

const statusTypeMap: Record<CertificationItem['status'], 'success' | 'warning' | 'info'> = {
  报名中: 'success',
  进行中: 'warning',
  已结束: 'info',
}
</script>

<template>
  <el-card class="cert-card" shadow="hover">
    <template #header>
      <div class="cert-card__header">
        <div>
          <p class="cert-card__title">AI 任职认证概览</p>
          <p class="cert-card__description">掌握认证报名、进行中与历史通过率情况。</p>
        </div>
        <el-button type="primary" plain round size="small">创建新认证</el-button>
      </div>
    </template>
    <el-table :data="props.certifications" border>
      <el-table-column prop="name" label="认证名称" min-width="200" />
      <el-table-column prop="level" label="等级" width="100" />
      <el-table-column label="参与人数" width="120">
        <template #default="{ row }">
          <el-tag type="success" effect="plain">{{ row.participants }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="通过率" width="140">
        <template #default="{ row }">
          <el-progress :percentage="row.passRate" :stroke-width="6" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTypeMap[row.status as keyof typeof statusTypeMap]" effect="light">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="emit('view-detail', row.id)">
            查看详情
          </el-button>
          <el-button type="primary" link size="small">导出数据</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped lang="scss">
.cert-card {
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
  }
}

::v-deep(.el-table__body-wrapper) {
  font-size: 13px;
}
</style>

