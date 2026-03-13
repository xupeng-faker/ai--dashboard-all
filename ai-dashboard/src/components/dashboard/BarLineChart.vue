<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import type { StaffChartPoint } from '../../types/dashboard'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

interface Props {
  title: string
  points: StaffChartPoint[]
  showRate?: boolean
  countLabel?: string
  rateLabel?: string
  height?: number
  legendTotals?: Record<string, string | number>
}

const props = withDefaults(defineProps<Props>(), {
  showRate: true,
  countLabel: '人数',
  rateLabel: '占比',
  height: 280,
  legendTotals: () => ({}),
})

const emit = defineEmits<{
  (e: 'barClick', data: { label: string; deptCode?: string; count: number; rate: number }): void
}>()

type ChartInstance = ReturnType<typeof echarts.init>

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: ChartInstance | null = null

const disposeChart = () => {
  chartInstance?.dispose()
  chartInstance = null
}

const ensureChartInstance = () => {
  if (!chartRef.value) {
    return null
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  return chartInstance
}

const getOption = (): EChartsOption => {
  const categories = props.points.map((item) => item.label)
  const counts = props.points.map((item) => item.count)
  const rates = props.points.map((item) => item.rate)
  const longestLabelLength = categories.reduce((max, label) => Math.max(max, label.length), 0)
  
  // 判断图表类型：根据 countLabel 判断是任职表还是认证表
  const isAppointmentChart = props.countLabel?.includes('任职') || false
  const isCertificationChart = props.countLabel?.includes('认证') || false
  
  // 根据图表类型设置坐标轴名称
  const leftAxisName = isCertificationChart ? '认证人数占比' : isAppointmentChart ? '任职人数占比' : '人数占比'
  const rightAxisName = isCertificationChart ? '认证人数' : isAppointmentChart ? '任职人数' : props.countLabel || '人数'
  
  // 判断是否是职位类任职数据或职位类认证数据图表
  const isJobCategoryChart = props.title === '职位类任职数据' || props.title === '职位类认证数据'
  // 判断是否是部门图表（部门任职数据或部门认证数据）
  const isDepartmentChart = props.title === '部门任职数据' || props.title === '部门认证数据'
  const maxCharsPerLine = 4
  const departmentFirstLineChars = 4 // 部门图表第一行字符数
  const departmentOtherLineChars = 6 // 部门图表其余行字符数
  
  // 职位类图表不换行，其他图表按原逻辑处理
  const shouldWrapLabels = isJobCategoryChart ? false : longestLabelLength > maxCharsPerLine
  const axisLabelMargin = 8
  const fontSize = 12
  const lineHeight = fontSize * 1.2
  // 计算预估行数：部门图表使用新的换行规则
  let estimatedLines = 1
  if (isJobCategoryChart) {
    estimatedLines = 1
  } else if (isDepartmentChart && longestLabelLength > departmentFirstLineChars) {
    // 部门图表：第一行4个字，其余行6个字
    estimatedLines = 1 + Math.ceil((longestLabelLength - departmentFirstLineChars) / departmentOtherLineChars)
  } else if (shouldWrapLabels) {
    estimatedLines = Math.ceil(longestLabelLength / maxCharsPerLine)
  }
  const estimatedLabelHeight = estimatedLines * lineHeight
  const gridBottom = Math.max(30, Math.ceil(estimatedLabelHeight + axisLabelMargin + 16))

  // 只添加折线图，不再添加柱状图
  const series: EChartsOption['series'] = []
  
  if (props.showRate) {
    // 占比折线图
    series.push({
      name: props.rateLabel,
      type: 'line',
      data: rates,
      yAxisIndex: 0, // 折线图使用左侧坐标轴（index=0）
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      z: 1,
      silent: false, // 允许点击
      lineStyle: {
        width: 3,
        color: '#34c38f',
      },
      itemStyle: {
        color: '#34c38f',
        shadowBlur: 8,
        shadowColor: 'rgba(52, 195, 143, 0.35)',
      },
      // 在折点上显示占比信息
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => {
          return `${params.value}%`
        },
        color: '#34c38f',
        fontSize: 12,
        fontWeight: 'bold',
      },
    })
    
    // 添加一个隐藏的人数系列，用于在图例中显示人数信息
    series.push({
      name: props.countLabel,
      type: 'line',
      data: counts,
      yAxisIndex: 0,
      showSymbol: false, // 不显示折点
      color: '#3a7afe', // 设置颜色为蓝色，用于图例显示
      lineStyle: {
        width: 0, // 不显示线条
        opacity: 0, // 完全透明
      },
      itemStyle: {
        opacity: 0, // 完全透明
      },
      silent: true, // 不响应交互
      legendHoverLink: false, // 禁用图例悬停联动
    })
  } else {
    // 如果没有占比，只显示人数折线图
    series.push({
      name: props.countLabel,
      type: 'line',
      data: counts,
      yAxisIndex: 0,
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      z: 1,
      silent: false,
      lineStyle: {
        width: 3,
        color: '#3a7afe',
      },
      itemStyle: {
        color: '#3a7afe',
        shadowBlur: 8,
        shadowColor: 'rgba(58, 122, 254, 0.35)',
      },
    })
  }

  return {
    grid: {
      left: '6%',
      right: '4%', // 去掉右侧空间，因为不再有右侧坐标轴
      top: props.showRate ? 60 : 40, // 当有占比时，增加顶部空间，为坐标轴名称和图例留出位置
      bottom: gridBottom,
      containLabel: false,
    },
    legend: {
      right: 20, // 图例位置调整
      top: props.showRate ? 5 : 10,
      itemHeight: 12,
      itemWidth: 18,
      icon: 'rect', // 使用矩形图标
      borderRadius: 6,
      padding: [6, 12],
      backgroundColor: 'rgba(255, 255, 255, 0.86)',
      borderColor: 'rgba(58, 122, 254, 0.18)',
      borderWidth: 1,
      itemGap: 16,
      textStyle: {
        color: 'rgba(31, 45, 61, 0.78)',
        fontSize: 12,
      },
      formatter: (name: string) => {
        const total = props.legendTotals?.[name]
        if (total === undefined || total === null || total === '') {
          return name
        }
        return `${name}（${total}）`
      },
      selectedMode: false, // 禁用图例点击切换
      // 明确指定图例数据，确保颜色正确显示
      data: props.showRate
        ? [
            {
              name: props.rateLabel,
              icon: 'rect',
              itemStyle: {
                color: '#34c38f', // 绿色小方块
              },
            },
            {
              name: props.countLabel,
              icon: 'rect',
              itemStyle: {
                color: '#3a7afe', // 蓝色小方块，与悬浮提示中的蓝色圆点颜色一致
              },
            },
          ]
        : [
            {
              name: props.countLabel,
              icon: 'rect',
              itemStyle: {
                color: '#3a7afe', // 蓝色小方块
              },
            },
          ],
    },
    tooltip: {
      trigger: 'axis',
      borderWidth: 1,
      borderColor: 'rgba(58, 122, 254, 0.25)',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      textStyle: { color: '#122136' },
      formatter: (params: any) => {
        const lines = [`<strong>${params[0]?.axisValue}</strong>`]
        // 获取当前数据点的索引
        const dataIndex = params[0]?.dataIndex
        if (dataIndex !== undefined && dataIndex >= 0 && dataIndex < props.points.length) {
          const point = props.points[dataIndex]
          // 占比显示绿色圆点，人数显示蓝色圆点
          if (point) {
            // 占比信息（绿色圆点）
            if (props.showRate && point.rate !== undefined) {
              lines.push(
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#34c38f;margin-right:6px;"></span>${props.rateLabel}：${point.rate}%`
              )
            }
            // 人数信息（蓝色圆点）
            if (point.count !== undefined) {
              lines.push(
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#3a7afe;margin-right:6px;"></span>${props.countLabel}：${point.count}`
              )
            }
          }
        } else {
          // 兼容旧格式（如果没有数据点信息）
          params.forEach((item: any) => {
            const value = item.seriesName === props.rateLabel ? `${item.data}%` : item.data
            const color = item.seriesName === props.rateLabel ? '#34c38f' : '#3a7afe'
            lines.push(
              `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${color};margin-right:6px;"></span>${item.seriesName}：${value}`
            )
          })
        }
        return lines.join('<br/>')
      },
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: 'rgba(31, 45, 61, 0.2)' } },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(31, 45, 61, 0.65)',
        rotate: 0,
        interval: 0,
        fontSize: fontSize,
        margin: axisLabelMargin,
        align: 'center',
        verticalAlign: 'top',
        formatter: (value: string) => {
          // 特殊处理：C Lab（模块）部门名称，让C Lab在一行，后面的（模块）在下一行
          if (value === 'C Lab（模块）') {
            return 'C Lab\n（模块）'
          }
          // 职位类图表不换行，直接返回原始值
          if (isJobCategoryChart) {
            return value
          }
          // 特殊处理：云核心网产品工程与IT装备部，确保IT在一起显示
          if (isDepartmentChart && value === '云核心网产品工程与IT装备部') {
            return '云核心网\n产品工程与IT\n装备部'
          }
          // 部门图表：第一行4个字，其余行6个字
          if (isDepartmentChart && value.length > departmentFirstLineChars) {
            const lines: string[] = []
            // 第一行4个字
            lines.push(value.slice(0, departmentFirstLineChars))
            // 剩余部分每6个字一行
            for (let i = departmentFirstLineChars; i < value.length; i += departmentOtherLineChars) {
              lines.push(value.slice(i, i + departmentOtherLineChars))
            }
            return lines.join('\n')
          }
          // 其他情况按原逻辑处理
          if (!shouldWrapLabels || value.length <= maxCharsPerLine) {
            return value
          }
          const lines: string[] = []
          for (let i = 0; i < value.length; i += maxCharsPerLine) {
            lines.push(value.slice(i, i + maxCharsPerLine))
          }
          return lines.join('\n')
        },
      },
    },
    yAxis: [
      // 只保留左侧坐标轴：人数占比（根据图表类型动态设置）
      props.showRate
        ? {
            type: 'value',
            name: leftAxisName,
            min: 0,
            max: 100,
            position: 'left',
            nameLocation: 'end', // 名称显示在坐标轴上方
            nameGap: 12, // 增大间距，使标题上移
            nameRotate: 0, // 文字横向排列
            nameTextStyle: {
              padding: [-5, 0, 0, -5], // 顶部负padding，使标题上移；左侧负padding，使标题左移
            },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: 'rgba(31, 45, 61, 0.12)' } },
            axisLabel: {
              formatter: '{value}%',
              color: 'rgba(31, 45, 61, 0.65)',
            },
          }
        : {
            type: 'value',
            name: props.countLabel,
            position: 'left',
            nameLocation: 'end', // 名称显示在坐标轴上方
            nameRotate: 0, // 文字横向排列
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: 'rgba(31, 45, 61, 0.12)' } },
            axisLabel: { color: 'rgba(31, 45, 61, 0.65)' },
          },
    ] as EChartsOption['yAxis'],
    series,
  }
}

const renderChart = () => {
  const instance = ensureChartInstance()
  if (!instance) {
    disposeChart()
    return
  }

  instance.setOption(getOption(), true)
  instance.resize()
  
  // 添加点击事件监听
  instance.off('click') // 先移除之前的监听，避免重复绑定
  
  // 监听所有点击事件（现在只有折线图）
  instance.on('click', (params: any) => {
    // 处理点击事件：点击折线图时触发下钻
    if (params.componentType === 'series' && params.dataIndex !== undefined && params.dataIndex >= 0) {
      const dataIndex = params.dataIndex
      if (dataIndex < props.points.length) {
        const point = props.points[dataIndex]
        if (point) {
          // 折线图点击触发下钻
          const isLineClick = params.seriesType === 'line' && params.seriesName === props.rateLabel
          
          if (isLineClick) {
            emit('barClick', {
              label: point.label,
              deptCode: point.deptCode,
              count: point.count,
              rate: point.rate,
            })
          }
        }
      }
    } else {
      // 如果点击的不是系列，尝试使用坐标转换来判断
      if (params.event && params.event.offsetX !== undefined && params.event.offsetY !== undefined) {
        try {
          const pointInPixel = [params.event.offsetX, params.event.offsetY]
          const pointInGrid = instance.convertFromPixel('grid', pointInPixel)
          if (pointInGrid && pointInGrid[0] !== undefined) {
            const dataIndex = Math.round(pointInGrid[0])
            if (dataIndex >= 0 && dataIndex < props.points.length) {
              const point = props.points[dataIndex]
              if (point) {
                emit('barClick', {
                  label: point.label,
                  deptCode: point.deptCode,
                  count: point.count,
                  rate: point.rate,
                })
              }
            }
          }
        } catch (error) {
          console.warn('Failed to convert pixel to grid:', error)
        }
      }
    }
  })
}

watch(
  () => [props.points, props.showRate, props.countLabel, props.rateLabel, props.legendTotals],
  () => {
    nextTick(() => {
      if (props.points.length) {
        renderChart()
      } else {
        disposeChart()
      }
    })
  },
  { deep: true }
)

onMounted(() => {
  if (props.points.length) {
    nextTick(renderChart)
  }
})

onBeforeUnmount(() => {
  disposeChart()
})

useResizeObserver(chartRef, () => {
  chartInstance?.resize()
})
</script>

<template>
  <el-card shadow="hover" class="chart-card">
    <template #header>
      <div class="card-header">
        <h3>
          {{ title }}
          <slot name="title-suffix" />
        </h3>
        <slot name="header-extra" />
      </div>
    </template>
    <div v-if="points.length" ref="chartRef" class="chart-wrapper" :style="{ height: `${height}px` }" />
    <el-empty v-else description="待提供数据" :image-size="80" />
  </el-card>
</template>

<style scoped lang="scss">
.chart-card {
  border: none;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $text-main-color;
    }
  }
}

.chart-wrapper {
  width: 100%;
}
</style>

