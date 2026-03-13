<script setup lang="ts">
import { computed } from 'vue'
import { Bell, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import DashboardNavCards from '@/components/common/DashboardNavCards.vue'
import { useAppStore } from '@/stores/modules/app'
import { getUserAvatarUrl } from '@/utils/cookie'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const isDashboard = computed(() => route.path.startsWith('/dashboard'))
// 获取用户头像URL
const userAvatarUrl = computed(() => getUserAvatarUrl())

const handleGoHome = () => {
  router.push({ name: 'Home' })
}

const handlePermissionManagement = () => {
  ElMessage.info('页面开发中')
}
</script>

<template>
  <el-container class="layout-root app-container">
    <el-header class="layout-header">
      <div class="header-left" @click="handleGoHome">
        <div class="logo">
          <span class="logo-dot" />
        </div>
        <div class="title">
          <h1>AI转型IT看板</h1>
          <small>AI转型IT看板</small>
        </div>
      </div>
      <div class="header-right">
        <el-space :size="16" alignment="center">
          <el-tooltip content="通知中心" placement="bottom">
            <el-button circle text :icon="Bell" />
          </el-tooltip>
          <el-dropdown>
            <span class="user-avatar-wrapper">
              <el-avatar
                :size="36"
                :src="userAvatarUrl"
                :icon="User"
                class="user-avatar"
              />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleGoHome">返回首页</el-dropdown-item>
                <el-dropdown-item divided @click="handlePermissionManagement">权限管理</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-space>
      </div>
    </el-header>
    <el-main class="layout-main main-content" :class="{ 'is-dashboard': isDashboard }">
      <DashboardNavCards v-if="isDashboard" />
      <slot />
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.layout-root {
  background-color: transparent;
}

.layout-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-lg;
  background-color: #fff;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  cursor: pointer;

  .logo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(58, 122, 254, 0.2), rgba(58, 122, 254, 0.05));
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .logo-dot {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      background: linear-gradient(135deg, #3a7afe, #9b5cff);
      box-shadow: 0 8px 18px rgba(58, 122, 254, 0.4);
    }
  }

  .title {
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-main-color;
    }

    small {
      color: $text-secondary-color;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  .user-avatar {
    background: linear-gradient(135deg, rgba(58, 122, 254, 0.15), rgba(155, 92, 255, 0.15));
    color: $primary-color;
    border: 2px solid transparent;
    transition: border-color 0.2s;

    &:hover {
      border-color: $primary-color;
    }
  }
}

.layout-main {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding-top: $spacing-lg;

  &.is-dashboard {
    padding-bottom: $spacing-lg;
  }
}

::v-deep(.el-button.is-text) {
  color: $text-secondary-color;
}
</style>

