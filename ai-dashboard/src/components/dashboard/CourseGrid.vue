<script setup lang="ts">
import type { CourseItem } from '../../types/dashboard'

interface Props {
  courses: CourseItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'view-detail', id: string): void
}>()

const getTagType = (completion: number) => {
  if (completion >= 80) return 'success'
  if (completion >= 60) return 'warning'
  return 'info'
}
</script>

<template>
  <el-card class="course-card" shadow="hover">
    <template #header>
      <div class="course-card__header">
        <div>
          <p class="course-card__title">AI School 课程概览</p>
          <p class="course-card__description">涵盖基础能力、Prompt 工程、数据治理等课程体系。</p>
        </div>
        <el-button type="primary" plain round size="small">创建新课程</el-button>
      </div>
    </template>
    <el-row :gutter="16">
      <el-col v-for="course in props.courses" :key="course.id" :xs="24" :sm="12" :md="8">
        <el-card shadow="never" class="course-card__item">
          <div class="course-card__item-header">
            <el-tag type="info" effect="plain">{{ course.category }}</el-tag>
            <el-tag :type="getTagType(course.completionRate)" effect="light">
              完成率 {{ course.completionRate }}%
            </el-tag>
          </div>
          <h3>{{ course.title }}</h3>
          <p class="course-meta">
            <span>学习人数：{{ course.learners }}</span>
            <span>更新：{{ course.updatedAt }}</span>
          </p>
          <div class="course-progress">
            <el-progress :percentage="course.completionRate" :stroke-width="6" />
          </div>
          <div class="course-actions">
            <el-button type="primary" link @click="emit('view-detail', course.id)">
              查看详情
            </el-button>
            <el-button type="primary" text>开始学习</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped lang="scss">
.course-card {
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

  &__item {
    border-radius: $radius-md;
    border: 1px solid rgba(58, 122, 254, 0.08);
    background: rgba(255, 255, 255, 0.92);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-card;
    }

    h3 {
      margin: $spacing-md 0 $spacing-sm;
      font-size: 16px;
      font-weight: 600;
      color: $text-main-color;
    }
  }

  &__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: $text-secondary-color;
  font-size: 12px;
}

.course-progress {
  margin: $spacing-md 0;
}

.course-actions {
  display: flex;
  justify-content: space-between;
}
</style>

