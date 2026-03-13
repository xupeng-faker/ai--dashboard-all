<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useDashboardTabs } from '@/composables/useDashboardTabs'
import type { DashboardTabName } from '@/stores/modules/app'
import { DASHBOARD_CARD_META, DEVELOPING_DASHBOARD_TABS } from '@/constants/dashboardCards'

const { tabs, activeTab, goTo } = useDashboardTabs()

const cardItems = computed(() =>
  tabs.map((tab) => ({
    ...tab,
    ...DASHBOARD_CARD_META[tab.name],
  })),
)

const primaryCard = computed(() => cardItems.value[0])
const secondaryCards = computed(() => cardItems.value.slice(1))

const goToDashboard = (name: DashboardTabName) => {
  if (DEVELOPING_DASHBOARD_TABS.has(name)) {
    ElMessage.info('组织/岗位AI成熟度看板功能开发中')
    return
  }
  goTo(name)
}
</script>

<template>
  <section class="home-view" v-if="primaryCard">
    <el-row :gutter="24" class="nav-row nav-row--primary">
      <el-col :xs="24">
        <el-card
          class="nav-card nav-card--primary"
          shadow="hover"
          :style="{ '--card-gradient': primaryCard.gradient, '--card-accent': primaryCard.accent }"
          @click="goToDashboard(primaryCard.name)"
        >
          <div class="nav-card__chip" v-if="primaryCard.badge">
            <el-tag size="small" type="primary" round effect="dark">{{ primaryCard.badge }}</el-tag>
          </div>
          <div class="nav-card__icon">
            <el-icon><component :is="primaryCard.icon" /></el-icon>
          </div>
          <h2 class="nav-card__title">{{ primaryCard.label }}</h2>
          <p class="nav-card__description">
            {{ primaryCard.description }}
          </p>
          <div class="nav-card__meta">
            <el-button
              class="nav-card__action"
              type="primary"
              size="large"
              round
              :plain="activeTab !== primaryCard.name"
              @click.stop="goToDashboard(primaryCard.name)"
            >
              进入主看板
            </el-button>
          </div>
          <div class="nav-card__spotlight" />
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="24" class="nav-row nav-row--secondary">
      <el-col
        v-for="card in secondaryCards"
        :key="card.name"
        :xs="24"
        :sm="12"
        :lg="8"
        @click="goToDashboard(card.name)"
      >
        <el-card
          class="nav-card nav-card--secondary"
          shadow="hover"
          :style="{ '--card-gradient': card.gradient, '--card-accent': card.accent }"
        >
          <div class="nav-card__icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <h3 class="nav-card__title">{{ card.label }}</h3>
          <p class="nav-card__description">
            {{ card.description }}
          </p>
          <div class="nav-card__meta">
            <el-button
              class="nav-card__action"
              type="primary"
              text
              :plain="activeTab !== card.name"
              @click.stop="goToDashboard(card.name)"
            >
              进入看板
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped lang="scss">
.home-view {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: $spacing-lg $spacing-md;
  background: linear-gradient(180deg, #f4f7ff 0%, #f7f9ff 60%, #f9fbff 100%);
  border-radius: 28px;
}

.nav-row {
  margin: 0;
  & + & {
    margin-top: $spacing-lg;
  }
}

.nav-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-xl $spacing-lg;
  border: none;
  border-radius: $radius-lg;
  border: 1px solid transparent;
  background: var(--card-gradient, #fff);
  box-shadow: $shadow-card;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: hidden;
  height: 100%;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 36px rgba(15, 19, 88, 0.12);
    border-color: rgba(255, 255, 255, 0.4);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 12px;
    border-radius: $radius-md;
    border: 1px dashed rgba(255, 255, 255, 0.25);
    pointer-events: none;
  }

  &__chip {
    align-self: flex-start;
  }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: var(--card-accent, #3a7afe);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1b2533;
  }

  &__description {
    margin: 0;
    color: rgba(27, 37, 51, 0.72);
    line-height: 1.6;
    min-height: 52px;
  }

  &__meta {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
  }

  &__action {
    align-self: flex-start;
    padding: 0;
    font-weight: 600;
  }
}

.nav-card--primary {
  padding: $spacing-xl;
  min-height: 360px;
  justify-content: space-between;
  background: var(--card-gradient, #fff);
  box-shadow: 0 28px 52px rgba(58, 122, 254, 0.16);

  .nav-card__icon {
    width: 72px;
    height: 72px;
    font-size: 36px;
    margin-bottom: $spacing-md;
  }

  .nav-card__title {
    font-size: 24px;
  }

  .nav-card__meta {
    margin-top: $spacing-lg;
    align-items: center;
    gap: $spacing-sm;
  }

  .nav-card__action {
    padding: 0 $spacing-lg;
    font-size: 16px;
  }
}

.nav-card--secondary {
  min-height: 240px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.96)),
    var(--card-gradient, #fff);
  box-shadow: 0 18px 32px rgba(59, 92, 160, 0.12);

  .nav-card__icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }
}

.nav-card__spotlight {
  position: absolute;
  inset: auto auto -40px -40px;
  width: 180px;
  height: 180px;
  border-radius: 100%;
  background: radial-gradient(circle, rgba(58, 122, 254, 0.16) 0%, rgba(58, 122, 254, 0) 70%);
  pointer-events: none;
}

@media (max-width: 768px) {
  .nav-card {
    padding: $spacing-lg;
    &::after {
      inset: 10px;
    }
  }

  .nav-card--primary {
    min-height: auto;
  }
}
</style>

