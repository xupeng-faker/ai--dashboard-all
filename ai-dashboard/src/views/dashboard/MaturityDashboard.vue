<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { DataBoard } from '@element-plus/icons-vue'
import { fetchMaturityMetrics, fetchMaturityTrend } from '@/api/dashboard'
import StatCard from '@/components/common/StatCard.vue'
import TrendChartCard from '@/components/common/TrendChartCard.vue'
import type { MetricItem, TrendPoint } from '@/types/dashboard'

const metrics = ref<MetricItem[]>([])
const trends = ref<TrendPoint[]>([])
const loading = ref(false)

const capabilityGaps = [
  {
    title: 'Prompt 复用率偏低',
    description: '一线业务岗位对通用 Prompt 的复用率仅 45%，建议建立跨组织 Prompt 分享机制。',
    actions: ['搭建 Prompt 知识库', '设置复用奖励机制'],
  },
  {
    title: '数据治理成熟度不足',
    description: '数据标注质量波动较大，建议重点培训数据标注团队并建立质检抽检机制。',
    actions: ['推出标注质量培训营', '上线标注质检看板'],
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const [metricRes, trendRes] = await Promise.all([
      fetchMaturityMetrics(),
      fetchMaturityTrend(),
    ])
    metrics.value = metricRes
    trends.value = trendRes
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <section class="dashboard maturity-dashboard">
    <header class="dashboard__header">
      <div>
        <h2>组织/岗位 AI 成熟度看板</h2>
        <p>跟踪各组织与岗位的 AI 能力构建情况，识别差距并驱动迭代。</p>
      </div>
      <el-space>
        <el-button type="primary" plain>导出报告</el-button>
        <el-button type="primary">生成提升计划</el-button>
      </el-space>
    </header>

    <el-skeleton :rows="4" animated v-if="loading" />
    <template v-else>
      <el-row :gutter="16">
        <el-col v-for="metric in metrics" :key="metric.id" :xs="24" :sm="12" :md="6">
          <StatCard :title="metric.title" :value="metric.value" :unit="metric.unit" :delta="metric.delta" :trend="metric.trend" />
        </el-col>
      </el-row>

      <el-row :gutter="16" class="dashboard__row">
        <el-col :xs="24" :md="16">
          <TrendChartCard title="成熟度提升趋势" description="观察近 8 周成熟度得分走势" :points="trends" />
        </el-col>
        <el-col :xs="24" :md="8">
          <el-card shadow="hover" class="plan-card">
            <template #header>
              <div class="plan-card__header">
                <p class="plan-card__title">本周关键待办</p>
                <el-tag type="primary" effect="plain">Auto Generated</el-tag>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item timestamp="05-20" type="primary" placement="top">
                发布组织统一 AI 能力成熟度评分标准
              </el-timeline-item>
              <el-timeline-item timestamp="05-22" type="success" placement="top">
                启动 AI 赋能教练驻场计划，覆盖 3 个核心业务部门
              </el-timeline-item>
              <el-timeline-item timestamp="05-24" type="warning" placement="top">
                公布 Prompt 复用挑战赛机制，提高一线复用率
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="gap-card" shadow="hover">
        <template #header>
          <div class="gap-card__header">
            <h3>
              <el-icon><DataBoard /></el-icon>
              能力短板诊断
            </h3>
            <span class="gap-card__desc">基于成熟度模型自动识别的重点提升项</span>
          </div>
        </template>
        <el-row :gutter="16">
          <el-col v-for="item in capabilityGaps" :key="item.title" :xs="24" :sm="12">
            <el-card shadow="never" class="gap-card__item">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              <ul>
                <li v-for="todo in item.actions" :key="todo">{{ todo }}</li>
              </ul>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </template>
  </section>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-lg;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    p {
      margin: $spacing-xs 0 0;
      color: $text-secondary-color;
    }
  }

  &__row {
    align-items: stretch;
  }
}

.plan-card {
  border: none;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    font-weight: 600;
  }
}

.gap-card {
  border: none;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    h3 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
    }

    .gap-card__desc {
      color: $text-secondary-color;
    }
  }

  &__item {
    border-radius: $radius-md;
    border: 1px solid rgba(58, 122, 254, 0.08);
    background: rgba(255, 255, 255, 0.94);
    h4 {
      margin: 0 0 $spacing-sm;
      font-size: 16px;
      font-weight: 600;
    }

    p {
      margin: 0 0 $spacing-sm;
      color: $text-secondary-color;
      min-height: 48px;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: $text-main-color;
    }
  }
}

@media (max-width: 768px) {
  .dashboard__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

