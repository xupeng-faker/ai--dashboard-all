import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: false,
      keepAlive: false,
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    redirect: '/dashboard/maturity',
    meta: {
      title: '看板',
      requiresAuth: true,
    },
    children: [
      {
        path: 'maturity',
        name: 'MaturityDashboard',
        component: () => import('@/views/dashboard/MaturityDashboard.vue'),
        meta: {
          title: '组织/岗位AI成熟度看板',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'training',
        name: 'TrainingDashboard',
        component: () => import('@/views/dashboard/TrainingDashboard.vue'),
        meta: {
          title: 'AI训战看板',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'training/detail/:id',
        name: 'TrainingDetail',
        component: () => import('@/views/dashboard/TrainingDetail.vue'),
        meta: {
          title: 'AI训战看板详情',
          requiresAuth: true,
          keepAlive: false,
        },
        props: true,
      },
      {
        path: 'training/personal-detail',
        name: 'PersonalTrainingDetail',
        component: () => import('@/views/dashboard/PersonalTrainingDetail.vue'),
        meta: {
          title: '个人训战课程详情',
          requiresAuth: true,
          keepAlive: false,
        },
      },
      {
        path: 'training/planning',
        name: 'TrainingPlanningDetail',
        component: () => import('@/views/dashboard/TrainingPlanningDetail.vue'),
        meta: {
          title: '训战课程规划明细',
          requiresAuth: true,
          keepAlive: false,
        },
      },
      {
        path: 'school',
        name: 'SchoolDashboard',
        component: () => import('@/views/dashboard/SchoolDashboard.vue'),
        meta: {
          title: 'AI School看板',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'school/detail/:id',
        name: 'SchoolDetail',
        component: () => import('@/views/dashboard/SchoolDetail.vue'),
        meta: {
          title: 'AI School看板详情',
          requiresAuth: true,
          keepAlive: false,
        },
        props: true,
      },
      {
        path: 'certification',
        name: 'CertificationDashboard',
        component: () => import('@/views/dashboard/CertificationDashboard.vue'),
        meta: {
          title: 'AI任职认证看板',
          requiresAuth: true,
          keepAlive: true,
        },
      },
      {
        path: 'certification/detail/:id',
        name: 'CertificationDetail',
        component: () => import('@/views/dashboard/CertificationDetail.vue'),
        props: true,
        meta: {
          title: 'AI任职认证看板详情',
          requiresAuth: true,
          keepAlive: false,
        },
        props: true,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI转型IT看板`
  } else {
    document.title = 'AI转型IT看板'
  }

  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next({ name: 'Home' })
      return
    }
  }

  next()
})

export default router

