<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElAvatar,
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElLink,
  ElMessage,
  ElOption,
  ElSelect,
  ElSkeleton,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { fetchPersonalCourseCompletionDetailed, fetchPersonalCreditOverview } from '@/api/dashboard'
import type { PersonalCourseCompletionResponse, CourseInfo, PersonalCredit } from '@/types/dashboard'

const router = useRouter()
const route = useRoute()

/** 与明细行 employeeId 一致；训战入口可仅用 empNum */
const resolveEmployeeKey = (): string | undefined => {
  const id = route.query.employeeId
  const emp = route.query.empNum
  if (typeof id === 'string' && id.trim()) return id.trim()
  if (typeof emp === 'string' && emp.trim()) return emp.trim()
  return undefined
}

const isSchoolCreditPage = computed(() => route.name === 'PersonalSchoolCreditDetail')
const pageTitle = computed(() =>
  isSchoolCreditPage.value ? '个人课程学分详情' : '个人训战课程详情'
)
const pageSubtitle = computed(() =>
  isSchoolCreditPage.value ? '查看该行员工学分与课程完课情况' : '查看个人训战课程完课情况'
)
const levelColumnLabel = computed(() => (isSchoolCreditPage.value ? '课程分级' : '训战分类'))

const loading = ref(false)
const detailData = ref<PersonalCourseCompletionResponse | null>(null)
const creditOverview = ref<PersonalCredit | null>(null)
const selectedCategory = ref<string>('全部')

const categoryOptions = computed(() => {
  if (!detailData.value) {
    return []
  }
  const options = detailData.value.courseStatistics.map((stat) => stat.courseLevel)
  return ['全部', ...options]
})

// 训战分类排序顺序（支持多种名称映射）
const categoryOrder = ['基础', '进阶', '高阶', '实战']
const categoryMapping: Record<string, string> = {
  '初阶': '基础',
  '中阶': '进阶',
  'L1': '基础',
  'L2': '进阶',
  'L3': '高阶',
}

// 标准化分类名称
const normalizeCategory = (category: string): string => {
  return categoryMapping[category] || category
}

const getCategoryOrder = (category: string): number => {
  const normalized = normalizeCategory(category)
  const index = categoryOrder.indexOf(normalized)
  return index >= 0 ? index : categoryOrder.length
}

const filteredCourses = computed(() => {
  if (!detailData.value) {
    return []
  }
  
  // 收集所有课程
  const allCourses: Array<CourseInfo & { category: string }> = []
  detailData.value.courseStatistics.forEach((stat) => {
    if (stat.courseList) {
      stat.courseList.forEach((course) => {
        allCourses.push({
          ...course,
          category: stat.courseLevel,
        })
      })
    }
  })
  
  // 按筛选条件过滤
  let filtered = selectedCategory.value === '全部' 
    ? allCourses 
    : allCourses.filter((course) => course.category === selectedCategory.value)
  
  // 按主分类分组
  const groupedByBigType = new Map<string, Array<CourseInfo & { category: string }>>()
  filtered.forEach((course) => {
    const bigType = course.bigType || '未分类'
    if (!groupedByBigType.has(bigType)) {
      groupedByBigType.set(bigType, [])
    }
    groupedByBigType.get(bigType)!.push(course)
  })
  
  // 对每个主分类内的课程进行排序和分组
  const result: Array<CourseInfo & { category: string; bigType: string }> = []
  
  // 按主分类的课程数量排序（数量多的在前），如果数量相同则按名称排序
  const sortedBigTypes = Array.from(groupedByBigType.keys()).sort((a, b) => {
    const countA = groupedByBigType.get(a)!.length
    const countB = groupedByBigType.get(b)!.length
    if (countA !== countB) {
      return countB - countA // 数量多的在前
    }
    return a.localeCompare(b) // 数量相同时按名称排序
  })
  
  sortedBigTypes.forEach((bigType) => {
    const courses = groupedByBigType.get(bigType)!
    
    // 按训战分类分组
    const groupedByCategory = new Map<string, Array<CourseInfo & { category: string }>>()
    courses.forEach((course) => {
      const category = course.category || '未分类'
      if (!groupedByCategory.has(category)) {
        groupedByCategory.set(category, [])
      }
      groupedByCategory.get(category)!.push(course)
    })
    
    // 按训战分类排序（基础、进阶、高阶、实战）
    const sortedCategories = Array.from(groupedByCategory.keys()).sort((a, b) => {
      return getCategoryOrder(a) - getCategoryOrder(b)
    })
    
    // 对每个训战分类内的课程排序：完课在前，未完课在后
    sortedCategories.forEach((category) => {
      const categoryCourses = groupedByCategory.get(category)!
      categoryCourses.sort((a, b) => {
        // 完课的在前（true 在前），未完课的在后（false 在后）
        if (a.isCompleted === b.isCompleted) {
          return 0
        }
        return a.isCompleted ? -1 : 1
      })
      
      // 添加到结果中，并添加 bigType 字段
      categoryCourses.forEach((course) => {
        result.push({
          ...course,
          bigType: bigType,
        })
      })
    })
  })
  
  return result
})

// 计算合并单元格的 span-method
const getSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  if (columnIndex === 0) {
    // 课程主分类列需要合并
    const currentBigType = row.bigType
    let rowspan = 1
    
    // 向前查找相同主分类的行数
    let startIndex = rowIndex
    while (startIndex > 0 && filteredCourses.value[startIndex - 1]?.bigType === currentBigType) {
      startIndex--
    }
    
    // 向后查找相同主分类的行数
    let endIndex = rowIndex
    while (endIndex < filteredCourses.value.length - 1 && filteredCourses.value[endIndex + 1]?.bigType === currentBigType) {
      endIndex++
    }
    
    // 如果是该主分类的第一行，则合并
    if (rowIndex === startIndex) {
      rowspan = endIndex - startIndex + 1
      return {
        rowspan: rowspan,
        colspan: 1,
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0,
      }
    }
  }
  
  return {
    rowspan: 1,
    colspan: 1,
  }
}

const loadAll = async () => {
  loading.value = true
  try {
    const key = resolveEmployeeKey()
    if (isSchoolCreditPage.value && !key) {
      detailData.value = null
      creditOverview.value = null
      ElMessage.warning('缺少员工工号参数')
      return
    }

    const [courseResult, credit] = await Promise.all([
      fetchPersonalCourseCompletionDetailed(key),
      isSchoolCreditPage.value && key
        ? fetchPersonalCreditOverview({ account: key })
        : Promise.resolve(null),
    ])

    if (courseResult.ok) {
      detailData.value = courseResult.data
    } else {
      detailData.value = null
      ElMessage.warning(courseResult.message || '获取个人课程详情失败')
    }

    creditOverview.value = credit
  } catch (error) {
    console.error('获取个人详情异常：', error)
    ElMessage.error('获取个人详情异常')
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  if (route.name === 'PersonalSchoolCreditDetail') {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push({ name: 'SchoolDashboard' })
    }
    return
  }
  if (route.query.from === 'school') {
    router.push({ name: 'SchoolDashboard' })
    return
  }
  router.push({ name: 'TrainingDashboard' })
}

watch(
  () => [route.name, route.query.employeeId, route.query.empNum],
  () => {
    loadAll()
  }
)

const formatPercent = (value: number) => `${(value ?? 0).toFixed(1)}%`

const formatBoolean = (value: boolean) => (value ? '是' : '否')

// 根据工号生成头像URL
const avatarUrl = computed(() => {
  if (!detailData.value?.empNum) {
    return null
  }
  return `https://w3.huawei.com/w3lab/rest/yellowpage/face/${detailData.value.empNum}/120`
})

// 计算包含总计行的表格数据
const tableDataWithTotal = computed(() => {
  if (!detailData.value?.courseStatistics || detailData.value.courseStatistics.length === 0) {
    return []
  }
  
  const statistics = detailData.value.courseStatistics
  
  // 计算总计行数据
  const totalRow = {
    courseLevel: '总计',
    totalCourses: statistics.reduce((sum, stat) => sum + (stat.totalCourses || 0), 0),
    targetCourses: statistics.reduce((sum, stat) => sum + (stat.targetCourses || 0), 0),
    completedCourses: statistics.reduce((sum, stat) => sum + (stat.completedCourses || 0), 0),
    completionRate: 0,
  }
  
  // 计算总计的完课占比
  if (totalRow.targetCourses > 0) {
    totalRow.completionRate = (totalRow.completedCourses / totalRow.targetCourses) * 100
  }
  
  // 合并原始数据和总计行
  return [...statistics, totalRow]
})

onMounted(() => {
  loadAll()
})

onActivated(() => {
  loadAll()
})
</script>

<template>
  <section class="detail-view personal-training-detail">
    <header class="detail-view__header glass-card">
      <div class="header-left">
        <el-button type="primary" text :icon="ArrowLeft" @click="handleBack">返回列表页</el-button>
        <div>
          <h2>{{ pageTitle }}</h2>
          <div v-if="detailData" class="user-info">
            <el-avatar 
              :src="avatarUrl" 
              :size="40"
              class="user-avatar"
            />
            <span class="user-details">
              <span class="emp-num">{{ detailData.empNum }}</span>
              <span class="emp-name">{{ detailData.empName || '未获取' }}</span>
            </span>
          </div>
          <p v-else>{{ pageSubtitle }}</p>
        </div>
      </div>
      <el-space>
        <el-button type="primary" plain :icon="Refresh" @click="loadAll">刷新数据</el-button>
      </el-space>
    </header>

    <el-skeleton :rows="8" animated v-if="loading" />
    <template v-else>
      <el-card
        v-if="isSchoolCreditPage && creditOverview"
        shadow="hover"
        class="summary-card credit-summary-card"
      >
        <template #header>
          <h3>个人学分数据（本条员工）</h3>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工号">{{ creditOverview.employeeNumber || '—' }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ creditOverview.lastName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="目标学分">{{ creditOverview.targetCredit ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="当前学分">{{ creditOverview.currentCredit ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="个人学分达成率">
            {{ creditOverview.personalCreditCompletionRate != null ? `${Number(creditOverview.personalCreditCompletionRate).toFixed(1)}%` : '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="部门标杆达成率">
            {{ creditOverview.deptBenchmarkCompletionRate != null ? `${Number(creditOverview.deptBenchmarkCompletionRate).toFixed(1)}%` : '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <template v-if="detailData">
      <!-- 课程完课统计 -->
      <el-card shadow="hover" class="summary-card">
        <template #header>
          <h3>个人学分总览</h3>
        </template>
        <el-table 
          :data="tableDataWithTotal" 
          border 
          style="width: 100%"
          :header-cell-class-name="() => 'personal-overview-header'"
          :row-class-name="({ row }) => row.courseLevel === '总计' ? 'personal-overview-total-row' : ''"
        >
          <el-table-column prop="courseLevel" :label="levelColumnLabel" min-width="120" align="center" />
          <el-table-column prop="totalCourses" label="课程总数" min-width="140" align="center" />
          <el-table-column prop="targetCourses" label="目标完课数" min-width="140" align="center" />
          <el-table-column prop="completedCourses" label="实际完课数" min-width="140" align="center" />
          <el-table-column prop="completionRate" label="目标课程完课占比" min-width="180" align="center">
            <template #default="{ row }">{{ formatPercent(row.completionRate) }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 课程分类筛选 -->
      <el-card shadow="hover" class="filter-card">
        <template #header>
          <div class="filter-header">
            <h3>目标课程列表</h3>
            <div class="filter-controls">
              <span class="filter-label">{{ levelColumnLabel }}：</span>
              <el-select v-model="selectedCategory" placeholder="选择分类" style="width: 180px">
                <el-option
                  v-for="option in categoryOptions"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
            </div>
          </div>
        </template>
        <el-table 
          :data="filteredCourses" 
          border 
          stripe 
          style="width: 100%" 
          max-height="600"
          :span-method="getSpanMethod"
        >
          <el-table-column prop="bigType" label="课程主分类" min-width="140" align="center" />
          <el-table-column prop="category" :label="levelColumnLabel" width="120" align="center" />
          <el-table-column prop="courseName" label="课程名称" min-width="200" align="center">
            <template #default="{ row }">
              <el-link
                v-if="row.courseLink"
                :href="row.courseLink"
                target="_blank"
                type="primary"
                :underline="false"
              >
                {{ row.courseName }}
              </el-link>
              <span v-else>{{ row.courseName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="是否目标课程" width="140" align="center">
            <template #default>
              <el-tag type="success" effect="light">是</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否完课" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isCompleted ? 'success' : 'warning'" effect="light">
                {{ formatBoolean(row.isCompleted) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      </template>
      <el-empty
        v-else
        :description="isSchoolCreditPage ? '暂无课程完课数据' : '暂无详情数据'"
      />
    </template>
  </section>
</template>

<style scoped lang="scss">
.detail-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.glass-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, rgba(7, 116, 221, 0.18), rgba(61, 210, 255, 0.12));
  box-shadow: 0 18px 40px rgba(7, 116, 221, 0.16);
  color: #000;

  h2 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #000;
  }

  p {
    margin: $spacing-sm 0 0;
    max-width: 560px;
    color: #000;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin: $spacing-sm 0 0;
  }

  .user-avatar {
    flex-shrink: 0;
  }

  .user-details {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: #000;
    font-size: 14px;
  }

  .emp-num {
    font-weight: 500;
  }

  .emp-name {
    font-weight: 500;
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  align-items: flex-start;
}

.filter-card {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      .filter-label {
        font-size: 14px;
        color: $text-main-color;
        white-space: nowrap;
      }
    }
  }

  :deep(.el-table) {
    .el-table__header-wrapper {
      .el-table__header {
        th {
          text-align: center;
          font-weight: 700;
          font-size: 17px;
          font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
          color: #000;
        }
      }
    }

    .el-table__body-wrapper {
      .el-table__body {
        td {
          text-align: center;
        }
      }
    }
  }
}

.summary-card {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  :deep(.el-table) {
    .el-table__header-wrapper {
      .el-table__header {
        th {
          text-align: center;
          font-weight: 700;
          font-size: 16px;
          color: #000;
        }
      }
    }

    .el-table__body-wrapper {
      .el-table__body {
        td {
          text-align: center;
        }
      }
    }

    tr.personal-overview-total-row {
      td {
        font-weight: 700;
        font-size: 16px;
        color: #000;
      }
    }
  }
}

@media (max-width: 768px) {
  .glass-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-header {
    flex-direction: column;
    gap: $spacing-sm;
    align-items: flex-start;
  }
}
</style>

