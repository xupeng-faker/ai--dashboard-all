import type { StaffChartPoint } from '../types'

export const getOverallCertificationTrends = (): {
  departmentAppointment: StaffChartPoint[]
  organizationAppointment: StaffChartPoint[]
  jobCategoryAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  organizationCertification: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
} => {
  // 部门任职数据
  const departmentAppointment: StaffChartPoint[] = [
    { label: '云核心网运营部', count: 320, rate: 65.0 },
    { label: '云核心网研发部', count: 280, rate: 67.86 },
    { label: '云核心网解决方案部', count: 240, rate: 70.0 },
    { label: '无线网络产品部', count: 350, rate: 70.0 },
    { label: '传送与接入产品部', count: 290, rate: 70.0 },
    { label: 'C Lab（模块）', count: 180, rate: 72.5 },
  ]

  // 组织AI成熟度任职数据
  const organizationAppointment: StaffChartPoint[] = [
    { label: 'L3', count: 450, rate: 68.5 },
    { label: 'L2', count: 620, rate: 70.2 },
    { label: 'L1', count: 380, rate: 65.8 },
  ]

  // 职位类任职数据
  const jobCategoryAppointment: StaffChartPoint[] = [
    { label: 'AI架构师', count: 120, rate: 65.0 },
    { label: '数据科学家', count: 150, rate: 65.33 },
    { label: '算法专家', count: 180, rate: 65.0 },
    { label: '产品经理', count: 100, rate: 65.0 },
    { label: '运营干部', count: 80, rate: 65.0 },
  ]

  // 部门认证数据
  const departmentCertification: StaffChartPoint[] = [
    { label: '云核心网运营部', count: 208, rate: 65.0 },
    { label: '云核心网研发部', count: 190, rate: 67.86 },
    { label: '云核心网解决方案部', count: 168, rate: 70.0 },
    { label: '无线网络产品部', count: 245, rate: 70.0 },
    { label: '传送与接入产品部', count: 203, rate: 70.0 },
    { label: 'C Lab（模块）', count: 130, rate: 72.5 },
  ]

  // 组织AI成熟度认证数据
  const organizationCertification: StaffChartPoint[] = [
    { label: 'L3', count: 308, rate: 68.5 },
    { label: 'L2', count: 435, rate: 70.2 },
    { label: 'L1', count: 250, rate: 65.8 },
  ]

  // 职位类认证数据
  const jobCategoryCertification: StaffChartPoint[] = [
    { label: 'AI架构师', count: 84, rate: 70.0 },
    { label: '数据科学家', count: 105, rate: 70.0 },
    { label: '算法专家', count: 126, rate: 70.0 },
    { label: '产品经理', count: 70, rate: 70.0 },
    { label: '运营干部', count: 56, rate: 70.0 },
  ]

  return {
    departmentAppointment,
    organizationAppointment,
    jobCategoryAppointment,
    departmentCertification,
    organizationCertification,
    jobCategoryCertification,
  }
}







