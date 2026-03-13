<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  unit?: string
  delta?: number
  trend?: 'up' | 'down' | 'flat'
  icon?: Component
  subtitle?: string
}

const props = defineProps<Props>()

const trendText = computed(() => {
  if (props.delta === undefined) return '--'
  const prefix = props.delta > 0 ? '+' : ''
  return `${prefix}${props.delta}${props.unit ?? ''}`
})

const trendType = computed(() => {
  if (!props.trend) return 'flat'
  return props.trend
})

const iconComponent = computed(() => props.icon)
</script>

<template>
  <el-card shadow="hover" class="stat-card">
    <div class="stat-card__body">
      <div class="stat-card__meta">
        <p class="stat-card__title">
          {{ title }}
        </p>
        <p class="stat-card__subtitle" v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="stat-card__value">
        <span class="value">{{ value }}<small v-if="unit">{{ unit }}</small></span>
        <span class="trend" :class="[`trend--${trendType}`]">
          {{ trendText }}
        </span>
      </div>
    </div>
    <div class="stat-card__icon" v-if="iconComponent">
      <component :is="iconComponent" />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.stat-card {
  position: relative;
  overflow: hidden;
  border: none;
  background: linear-gradient(135deg, rgba(58, 122, 254, 0.08), rgba(155, 92, 255, 0.05));

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__meta {
    min-height: 48px;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: rgba(18, 29, 54, 0.88);
  }

  &__subtitle {
    margin: 0;
    margin-top: $spacing-xs;
    color: $text-secondary-color;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;
    font-weight: 600;

    .value {
      font-size: 32px;
      line-height: 1;

      small {
        font-size: 16px;
        margin-left: 4px;
      }
    }

    .trend {
      font-size: 14px;
      font-weight: 500;

      &--up {
        color: #3cb179;
      }

      &--down {
        color: #e26271;
      }

      &--flat {
        color: $text-secondary-color;
      }
    }
  }

  &__icon {
    position: absolute;
    right: 18px;
    bottom: 16px;
    font-size: 32px;
    color: rgba(58, 122, 254, 0.45);
  }
}
</style>

