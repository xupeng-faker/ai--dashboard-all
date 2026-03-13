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

const goToDashboard = (name: DashboardTabName) => {
  if (DEVELOPING_DASHBOARD_TABS.has(name)) {
    ElMessage.info('组织/岗位AI成熟度看板功能开发中')
    return
  }
  goTo(name)
}
</script>

<template>
  <section class="dashboard-nav-capsules">
    <div class="nav-capsules__inner">
      <div class="nav-capsules__list">
        <button
          v-for="card in cardItems"
          :key="card.name"
          class="capsule"
          :class="{ 'is-active': activeTab === card.name }"
          :style="{ '--capsule-accent': card.accent }"
          type="button"
          @click="goToDashboard(card.name)"
        >
          <span class="capsule__icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </span>
          <span class="capsule__label">
            {{ card.label }}
            <el-tag v-if="card.badge" size="small" effect="plain">{{ card.badge }}</el-tag>
          </span>
          <span
            v-if="card.name !== 'maturity'"
            class="capsule__action"
            :class="{ 'is-active': activeTab === card.name }"
          >
            {{ activeTab === card.name ? '当前' : '进入' }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.dashboard-nav-capsules {
  width: 100%;
  margin-bottom: $spacing-lg;
}

.nav-capsules__inner {
  padding: $spacing-xs $spacing-lg;
  background: rgba(255, 255, 255, 0.92);
  border-radius: $radius-xl;
  border: 1px solid rgba(58, 122, 254, 0.06);
  box-shadow: 0 8px 20px rgba(32, 52, 115, 0.06);
  backdrop-filter: blur(12px);
}

.nav-capsules__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: $spacing-md;
  width: 100%;
}

.capsule {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(27, 43, 69, 0.06);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 4px 10px rgba(32, 52, 115, 0.08);
  transition: all 0.18s ease;
  cursor: pointer;

  &:hover {
    border-color: rgba(58, 122, 254, 0.18);
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 6px 14px rgba(52, 79, 140, 0.12);
  }

  &.is-active {
    border-color: var(--capsule-accent, $primary-color);
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9));
    box-shadow: 0 0 0 1px rgba(58, 122, 254, 0.12), 0 10px 20px rgba(32, 52, 115, 0.16);
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 11px;
    background: rgba(90, 124, 255, 0.12);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: var(--capsule-accent, $primary-color);
  }

  &__label {
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 600;
    color: #1b2533;

    .el-tag {
      font-weight: 500;
      padding: 0 $spacing-xs;
      border-radius: 999px;
    }
  }

  &__action {
    font-size: 12px;
    color: rgba(31, 43, 61, 0.65);
    padding: 2px 12px;
    border-radius: 999px;
    border: 1px solid rgba(31, 43, 61, 0.16);
    background: rgba(255, 255, 255, 0.9);

    &.is-active {
      color: var(--capsule-accent, $primary-color);
      border-color: transparent;
      background: linear-gradient(90deg, rgba(58, 122, 254, 0.16), rgba(58, 122, 254, 0.04));
    }
  }
}

@media (max-width: 960px) {
  .capsule {
    min-width: 100%;
  }
}
</style>


