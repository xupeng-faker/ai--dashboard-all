<script setup lang="ts">
import { computed } from 'vue'
import type { TrendPoint } from '../../types/dashboard'

interface Props {
  title: string
  description?: string
  points: TrendPoint[]
  min?: number
  max?: number
}

const props = defineProps<Props>()

const normalizedPoints = computed(() => {
  if (!props.points.length) return []
  const min = props.min ?? Math.min(...props.points.map((item) => item.value))
  const max = props.max ?? Math.max(...props.points.map((item) => item.value))
  const gap = max - min || 1

  return props.points.map((point, index) => {
    const x = (index / Math.max(props.points.length - 1, 1)) * 100
    const y = ((point.value - min) / gap) * 100
    return {
      ...point,
      x,
      y: 100 - y,
    }
  })
})

const pathData = computed(() => {
  if (!normalizedPoints.value.length) return ''
  return normalizedPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ')
})
</script>

<template>
  <el-card class="trend-card" shadow="hover">
    <div class="trend-card__header">
      <div>
        <p class="trend-card__title">{{ title }}</p>
        <p v-if="description" class="trend-card__description">{{ description }}</p>
      </div>
      <el-tag type="info" effect="light">
        最近 {{ points.length }} 周
      </el-tag>
    </div>
    <div class="trend-card__chart" v-if="normalizedPoints.length">
      <svg viewBox="0 0 100 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(58, 122, 254, 0.35)" />
            <stop offset="100%" stop-color="rgba(58, 122, 254, 0.05)" />
          </linearGradient>
        </defs>
        <path :d="`${pathData} L100,60 L0,60 Z`" fill="url(#trendGradient)" />
        <path :d="pathData" stroke="#3a7afe" stroke-width="2" fill="none" stroke-linecap="round" />
        <template v-for="point in normalizedPoints" :key="point.label">
          <circle :cx="point.x" :cy="point.y" r="1.6" fill="#fff" stroke="#3a7afe" stroke-width="0.8" />
        </template>
      </svg>
      <div class="trend-card__labels">
        <span v-for="point in points" :key="point.label">{{ point.label }}</span>
      </div>
    </div>
    <el-empty v-else description="暂无趋势数据" :image-size="100" />
  </el-card>
</template>

<style scoped lang="scss">
.trend-card {
  border: none;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-main-color;
  }

  &__description {
    margin: 4px 0 0;
    color: $text-secondary-color;
  }

  &__chart {
    width: 100%;
    position: relative;

    svg {
      width: 100%;
      height: 180px;
    }

    circle {
      transition: transform 0.2s ease;
    }

    circle:hover {
      transform: scale(1.2);
    }
  }

  &__labels {
    margin-top: $spacing-sm;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    font-size: 12px;
    color: $text-secondary-color;
  }
}
</style>

