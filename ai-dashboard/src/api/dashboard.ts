import type {
  DepartmentCertStatistic,
  AppointmentAuditRecord,
  CadreAppointmentSummaryRow,
  CadreCertificationSummaryRow,
  CadreMaturityJobCategoryCertStatisticsResponse,
  CadreMaturityJobCategoryQualifiedStatisticsResponse,
  CadrePositionOverviewResponseVO,
  CadreAiCertificationOverviewResponseVO,
  ExpertAiCertStatisticsResponse,
  ExpertAiQualifiedStatisticsResponse,
  CertificationAuditRecord,
  CertificationDashboardData,
  CertificationDashboardFilters,
  CertificationDetailData,
  CertificationDetailFilters,
  CertificationItem,
  CertificationRole,
  CompetenceCategoryCertStatistics,
  CompetenceCategoryCertStatisticsResponse,
  CourseItem,
  CoursePlanningInfo,
  DepartmentInfoVO,
  DepartmentNode,
  EmployeeCertStatisticsResponse,
  EmployeeDrillDownResponseVO,
  ExpertAppointmentSummaryRow,
  ExpertCertificationSummaryRow,
  MetricItem,
  PersonalCourseCompletionResponse,
  PersonalCredit,
  PlTmCertStatisticsResponse,
  Result,
  SchoolDashboardData,
  SchoolDashboardFilters,
  SchoolDetailData,
  SchoolDetailFilters,
  SchoolCreditRecord,
  SchoolCreditDetailResponseVO,
  SelectOption,
  StaffChartPoint,
  TrendPoint,
  TrainingAllStaffSummaryGroup,
  TrainingDashboardData,
  TrainingDashboardFilters,
  TrainingExpertCadreSummary,
  TrainingDetailData,
  TrainingDetailFilters,
  TrainingBattleRecord,
  TrainingCoursePlanRecord,
  DepartmentCourseCompletionRateRow,
  DepartmentEmployeeTrainingOverviewRow,
  PositionAiMaturityCourseCompletionRateVO,
  TrainingPersonalOverviewRow,
  TrainingPlanningResource,
  TrainingRole,
  TrainingRoleSummaryRow,
  TrainingTask,
  CreditOverviewVO,
} from '../types/dashboard'
import { get } from '../utils/request'

const delay = (ms = 320) => new Promise((resolve) => window.setTimeout(resolve, ms))

const resolveDepartmentCode = (deptPath?: string[]) => {
  if (!deptPath || deptPath.length === 0) {
    return '0'
  }
  const last = deptPath[deptPath.length - 1]
  return last && last.trim().length ? last : '0'
}

const mapDepartmentCertStatsToCharts = (stats?: DepartmentCertStatistic[]) => {
  if (!stats || stats.length === 0) {
    return null
  }

  const resolveQualifiedCount = (item: DepartmentCertStatistic) =>
    item.qualifiedCount ?? item.certifiedCount ?? 0
  const resolveQualifiedRate = (item: DepartmentCertStatistic) =>
    Number(item.qualifiedRate ?? item.certRate ?? 0)

  const normalizeLabel = (name?: string, code?: string) => {
    if (name && name.trim().length) {
      return name
    }
    if (code && code.trim().length) {
      return code
    }
    return '未知部门'
  }

  return {
    appointment: stats.map((item) => ({
      label: normalizeLabel(item.deptName, item.deptCode),
      count: item.totalCount ?? 0,
      rate: Number(item.certRate ?? 0),
      deptCode: item.deptCode, // 添加部门编码，用于点击跳转
    })),
    certification: stats.map((item) => ({
      label: normalizeLabel(item.deptName, item.deptCode),
      count: resolveQualifiedCount(item),
      rate: resolveQualifiedRate(item),
      deptCode: item.deptCode, // 添加部门编码，用于点击跳转
    })),
  }
}

const fetchEmployeeCertStatistics = async (
  deptCode: string,
  personType: string
): Promise<EmployeeCertStatisticsResponse | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
      personType: personType || '0',
    })
    const response = await get<Result<EmployeeCertStatisticsResponse>>(
      `/expert-cert-statistics/employee-cert-statistics?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取员工任职/认证数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取员工任职/认证数据异常：', error)
    return null
  }
}

export const fetchCompetenceCategoryCertStatistics = async (
  deptCode: string,
  personType: string
): Promise<CompetenceCategoryCertStatisticsResponse | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
      personType: personType || '0',
    })
    const response = await get<Result<CompetenceCategoryCertStatisticsResponse>>(
      `/expert-cert-statistics/competence-category-cert-statistics?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取职位类任职/认证数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取职位类任职/认证数据异常：', error)
    return null
  }
}

export const fetchCadreMaturityJobCategoryCertStatistics = async (
  deptCode: string
): Promise<CadreMaturityJobCategoryCertStatisticsResponse | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
    })
    const response = await get<Result<CadreMaturityJobCategoryCertStatisticsResponse>>(
      `/expert-cert-statistics/cadre-cert-statistics/by-maturity-and-job-category?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取干部认证数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取干部认证数据异常：', error)
    return null
  }
}

export const fetchCadreMaturityJobCategoryQualifiedStatistics = async (
  deptCode: string
): Promise<CadreMaturityJobCategoryQualifiedStatisticsResponse | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
    })
    const response = await get<Result<CadreMaturityJobCategoryQualifiedStatisticsResponse>>(
      `/expert-cert-statistics/cadre-cert-statistics/by-maturity-and-job-category-qualified?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取干部任职数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取干部任职数据异常：', error)
    return null
  }
}

export const fetchExpertAiCertStatistics = async (
  deptCode: string
): Promise<ExpertAiCertStatisticsResponse | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
    })
    const response = await get<Result<ExpertAiCertStatisticsResponse>>(
      `/expert-cert-statistics/expert-ai-cert-statistics?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取专家AI认证数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取专家AI认证数据异常：', error)
    return null
  }
}

export const fetchExpertAiQualifiedStatistics = async (
  deptCode: string
): Promise<ExpertAiQualifiedStatisticsResponse | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
    })
    const response = await get<Result<ExpertAiQualifiedStatisticsResponse>>(
      `/expert-cert-statistics/expert-ai-qualified-statistics?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取专家AI任职数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取专家AI任职数据异常：', error)
    return null
  }
}

export const fetchMaturityMetrics = async (): Promise<MetricItem[]> => {
  return []
}

export const fetchMaturityTrend = async (): Promise<TrendPoint[]> => {
  return []
}

export const fetchTrainingTasks = async (): Promise<TrainingTask[]> => {
  return []
}

export const fetchCourses = async (): Promise<CourseItem[]> => {
  return []
}

export const fetchCertifications = async (): Promise<CertificationItem[]> => {
  return []
}

export const fetchCertificationDetail = async (id: string): Promise<CertificationItem | undefined> => {
  const list = await fetchCertifications()
  return list.find((item) => item.id === id)
}

// 获取专家认证和任职数据
export const fetchExpertData = async (
  deptCode: string
): Promise<{
  certification: ExpertCertificationSummaryRow[]
  appointment: ExpertAppointmentSummaryRow[]
}> => {
  await delay()
  const [expertData, expertCertStats, expertQualifiedStats] = await Promise.all([
    fetchExpertCertificationSummary(),
    fetchExpertAiCertStatistics(deptCode),
    fetchExpertAiQualifiedStatistics(deptCode),
  ])

  // 将专家AI认证数据转换为表格格式
  const mapExpertCertStatsToRows = (
    stats?: ExpertAiCertStatisticsResponse | null
  ): (ExpertCertificationSummaryRow & { isMaturityRow?: boolean })[] => {
    if (!stats || !stats.maturityStatistics || stats.maturityStatistics.length === 0) {
      return expertData.certification
    }

    const rows: (ExpertCertificationSummaryRow & { isMaturityRow?: boolean })[] = []

    stats.maturityStatistics.forEach((maturity) => {
      if (maturity.jobCategoryStatistics && maturity.jobCategoryStatistics.length > 0) {
        // 添加成熟度行
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          certified: maturity.certifiedCount,
          certificationRate: Number(maturity.certRate),
          isMaturityRow: true,
        })

        // 对于L2成熟度，需要特殊处理职位类
        if (maturity.maturityLevel === 'L2') {
          // 保留的职位类：测试类、软件类、系统类、研究类
          const allowedCategories = ['测试类', '软件类', '系统类', '研究类']
          
          // 用于汇总其他类的数据
          let otherBaseline = 0
          let otherCertified = 0
          
          // 先处理保留的职位类
          maturity.jobCategoryStatistics.forEach((jobCategory) => {
            if (allowedCategories.includes(jobCategory.jobCategory)) {
              rows.push({
                maturityLevel: '',
                jobCategory: jobCategory.jobCategory,
                baseline: jobCategory.baselineCount,
                certified: jobCategory.certifiedCount,
                certificationRate: Number(jobCategory.certRate),
                isMaturityRow: false,
              })
            } else {
              // 累计其他类的数据
              otherBaseline += jobCategory.baselineCount || 0
              otherCertified += jobCategory.certifiedCount || 0
            }
          })
          
          // 如果有其他类数据，添加"其他类"行
          if (otherBaseline > 0 || otherCertified > 0) {
            const otherCertRate = otherBaseline > 0 
              ? (otherCertified / otherBaseline) * 100 
              : 0
            rows.push({
              maturityLevel: '',
              jobCategory: '其他类',
              baseline: otherBaseline,
              certified: otherCertified,
              certificationRate: Number(otherCertRate.toFixed(2)),
              isMaturityRow: false,
            })
          }
        } else {
          // 非L2成熟度，正常显示所有职位类
          maturity.jobCategoryStatistics.forEach((jobCategory) => {
            rows.push({
              maturityLevel: '',
              jobCategory: jobCategory.jobCategory,
              baseline: jobCategory.baselineCount,
              certified: jobCategory.certifiedCount,
              certificationRate: Number(jobCategory.certRate),
              isMaturityRow: false,
            })
          })
        }
      } else {
        // 如果没有职位类明细，只添加成熟度行
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          certified: maturity.certifiedCount,
          certificationRate: Number(maturity.certRate),
          isMaturityRow: true,
        })
      }
    })

    // 添加总计行
    if (stats.totalStatistics) {
      rows.push({
        maturityLevel: '总计',
        jobCategory: '',
        baseline: stats.totalStatistics.baselineCount,
        certified: stats.totalStatistics.certifiedCount,
        certificationRate: Number(stats.totalStatistics.certRate),
        isMaturityRow: true,
      })
    }

    return rows.length > 0 ? rows : expertData.certification
  }

  // 将专家AI任职数据转换为表格格式
  const mapExpertQualifiedStatsToRows = (
    stats?: ExpertAiQualifiedStatisticsResponse | null
  ): (ExpertAppointmentSummaryRow & { isMaturityRow?: boolean })[] => {
    if (!stats || !stats.maturityStatistics || stats.maturityStatistics.length === 0) {
      return expertData.appointment
    }

    const rows: (ExpertAppointmentSummaryRow & { isMaturityRow?: boolean })[] = []

    stats.maturityStatistics.forEach((maturity) => {
      if (maturity.jobCategoryStatistics && maturity.jobCategoryStatistics.length > 0) {
        // 添加成熟度行
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          appointed: maturity.qualifiedCount,
          appointedByRequirement: maturity.qualifiedByRequirementCount ?? 0,
          appointmentRate: Number(maturity.qualifiedRate),
          certificationCompliance: Number(maturity.qualifiedByRequirementRate ?? 0),
          baselineCountByRequirement: maturity.baselineCountByRequirement,
          isMaturityRow: true,
        })

        // 对于L2成熟度，需要特殊处理职位类
        if (maturity.maturityLevel === 'L2') {
          // 用于汇总非软件类的数据
          let nonSoftwareBaseline = 0
          let nonSoftwareQualified = 0
          
          // 先处理软件类
          maturity.jobCategoryStatistics.forEach((jobCategory) => {
            if (jobCategory.jobCategory === '软件类') {
              rows.push({
                maturityLevel: '',
                jobCategory: jobCategory.jobCategory,
                baseline: jobCategory.baselineCount,
                appointed: jobCategory.qualifiedCount,
                appointedByRequirement: jobCategory.qualifiedByRequirementCount ?? 0,
                appointmentRate: Number(jobCategory.qualifiedRate),
                certificationCompliance: Number(jobCategory.qualifiedByRequirementRate ?? 0),
                baselineCountByRequirement: jobCategory.baselineCountByRequirement,
                isMaturityRow: false,
              })
            } else {
              // 累计非软件类的数据
              nonSoftwareBaseline += jobCategory.baselineCount || 0
              nonSoftwareQualified += jobCategory.qualifiedCount || 0
            }
          })
          
          // 如果有非软件类数据，添加"非软件类"行
          if (nonSoftwareBaseline > 0 || nonSoftwareQualified > 0) {
            const nonSoftwareRate = nonSoftwareBaseline > 0 
              ? (nonSoftwareQualified / nonSoftwareBaseline) * 100 
              : 0
            // 计算非软件类的按要求任职人数和占比
            let nonSoftwareQualifiedByRequirement = 0
            let nonSoftwareBaselineCountByRequirement = 0
            maturity.jobCategoryStatistics.forEach((jobCategory) => {
              if (jobCategory.jobCategory !== '软件类') {
                nonSoftwareQualifiedByRequirement += jobCategory.qualifiedByRequirementCount ?? 0
                // 累加baselineCountByRequirement（L2非软件类为0，已由后端处理）
                nonSoftwareBaselineCountByRequirement += jobCategory.baselineCountByRequirement ?? 0
              }
            })
            const nonSoftwareQualifiedByRequirementRate = nonSoftwareBaseline > 0 
              ? (nonSoftwareQualifiedByRequirement / nonSoftwareBaseline) * 100 
              : 0
            rows.push({
              maturityLevel: '',
              jobCategory: '非软件类',
              baseline: nonSoftwareBaseline,
              appointed: nonSoftwareQualified,
              appointedByRequirement: nonSoftwareQualifiedByRequirement,
              appointmentRate: Number(nonSoftwareRate.toFixed(2)),
              certificationCompliance: Number(nonSoftwareQualifiedByRequirementRate.toFixed(2)),
              baselineCountByRequirement: nonSoftwareBaselineCountByRequirement,
              isMaturityRow: false,
            })
          }
        } else {
          // 非L2成熟度，正常显示所有职位类
          maturity.jobCategoryStatistics.forEach((jobCategory) => {
            rows.push({
              maturityLevel: '',
              jobCategory: jobCategory.jobCategory,
              baseline: jobCategory.baselineCount,
              appointed: jobCategory.qualifiedCount,
              appointedByRequirement: jobCategory.qualifiedByRequirementCount ?? 0,
              appointmentRate: Number(jobCategory.qualifiedRate),
              certificationCompliance: Number(jobCategory.qualifiedByRequirementRate ?? 0),
              baselineCountByRequirement: jobCategory.baselineCountByRequirement,
              isMaturityRow: false,
            })
          })
        }
      } else {
        // 如果没有职位类明细，只添加成熟度行
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          appointed: maturity.qualifiedCount,
          appointedByRequirement: maturity.qualifiedByRequirementCount ?? 0,
          appointmentRate: Number(maturity.qualifiedRate),
          certificationCompliance: Number(maturity.qualifiedByRequirementRate ?? 0),
          baselineCountByRequirement: maturity.baselineCountByRequirement,
          isMaturityRow: true,
        })
      }
    })

    // 添加总计行
    if (stats.totalStatistics) {
      rows.push({
        maturityLevel: '总计',
        jobCategory: '',
        baseline: stats.totalStatistics.baselineCount,
        appointed: stats.totalStatistics.qualifiedCount,
        appointedByRequirement: stats.totalStatistics.qualifiedByRequirementCount ?? 0,
        appointmentRate: Number(stats.totalStatistics.qualifiedRate),
        certificationCompliance: Number(stats.totalStatistics.qualifiedByRequirementRate ?? 0),
        baselineCountByRequirement: stats.totalStatistics.baselineCountByRequirement,
        isMaturityRow: true,
      })
    }

    return rows.length > 0 ? rows : expertData.appointment
  }

  return {
    certification: mapExpertCertStatsToRows(expertCertStats),
    appointment: mapExpertQualifiedStatsToRows(expertQualifiedStats),
  }
}

// 获取干部认证和任职数据
export const fetchCadreData = async (
  deptCode: string
): Promise<{
  certification: (CadreCertificationSummaryRow & { isMaturityRow?: boolean })[]
  appointment: (CadreAppointmentSummaryRow & { isMaturityRow?: boolean })[]
}> => {
  await delay()
  const [cadreData, cadreCertStats, cadreQualifiedStats] = await Promise.all([
    fetchCadreCertificationSummary(),
    fetchCadreMaturityJobCategoryCertStatistics(deptCode),
    fetchCadreMaturityJobCategoryQualifiedStatistics(deptCode),
  ])

  // 将干部认证数据转换为表格格式
  const mapCadreCertStatsToRows = (
    stats?: CadreMaturityJobCategoryCertStatisticsResponse | null
  ): (CadreCertificationSummaryRow & { isMaturityRow?: boolean })[] => {
    if (!stats || !stats.maturityStatistics || stats.maturityStatistics.length === 0) {
      return cadreData.certification
    }

    const rows: (CadreCertificationSummaryRow & { isMaturityRow?: boolean })[] = []

    stats.maturityStatistics.forEach((maturity) => {
      if (maturity.jobCategoryStatistics && maturity.jobCategoryStatistics.length > 0) {
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          aiCertificateHolders: maturity.certifiedCount,
          subjectTwoPassed: maturity.subject2PassCount,
          certificateRate: Number(maturity.certRate),
          subjectTwoRate: Number(maturity.subject2PassRate),
          certStandardCount: maturity.certStandardCount ?? 0,
          complianceRate: maturity.certStandardRate != null ? Number(maturity.certStandardRate) : null,
          isMaturityRow: true,
        })

        // 直接使用后端返回的所有职位类数据（包括L2的非软件类）
        maturity.jobCategoryStatistics.forEach((jobCategory) => {
          rows.push({
            maturityLevel: '',
            jobCategory: jobCategory.jobCategory,
            baseline: jobCategory.baselineCount,
            aiCertificateHolders: jobCategory.certifiedCount,
            subjectTwoPassed: jobCategory.subject2PassCount,
            certificateRate: Number(jobCategory.certRate),
            subjectTwoRate: Number(jobCategory.subject2PassRate),
            certStandardCount: jobCategory.certStandardCount ?? 0,
            complianceRate: jobCategory.certStandardRate != null ? Number(jobCategory.certStandardRate) : null,
            isMaturityRow: false,
            // 添加成熟度信息，方便模板判断
            actualMaturityLevel: maturity.maturityLevel,
          } as any)
        })
      } else {
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          aiCertificateHolders: maturity.certifiedCount,
          subjectTwoPassed: maturity.subject2PassCount,
          certificateRate: Number(maturity.certRate),
          subjectTwoRate: Number(maturity.subject2PassRate),
          certStandardCount: maturity.certStandardCount ?? 0,
          complianceRate: maturity.certStandardRate != null ? Number(maturity.certStandardRate) : null,
          isMaturityRow: true,
        })
      }
    })

    if (stats.totalStatistics) {
      rows.push({
        maturityLevel: stats.totalStatistics.maturityLevel,
        jobCategory: '',
        baseline: stats.totalStatistics.baselineCount,
        aiCertificateHolders: stats.totalStatistics.certifiedCount,
        subjectTwoPassed: stats.totalStatistics.subject2PassCount,
        certificateRate: Number(stats.totalStatistics.certRate),
        subjectTwoRate: Number(stats.totalStatistics.subject2PassRate),
        certStandardCount: stats.totalStatistics.certStandardCount ?? 0,
        complianceRate: stats.totalStatistics.certStandardRate != null ? Number(stats.totalStatistics.certStandardRate) : null,
        isMaturityRow: true,
      })
    }

    return rows.length > 0 ? rows : cadreData.certification
  }

  // 将干部任职数据转换为表格格式
  const mapCadreQualifiedStatsToRows = (
    stats?: CadreMaturityJobCategoryQualifiedStatisticsResponse | null
  ): (CadreAppointmentSummaryRow & { isMaturityRow?: boolean })[] => {
    if (!stats || !stats.maturityStatistics || stats.maturityStatistics.length === 0) {
      return cadreData.appointment
    }

    const rows: (CadreAppointmentSummaryRow & { isMaturityRow?: boolean })[] = []

    stats.maturityStatistics.forEach((maturity) => {
      if (maturity.jobCategoryStatistics && maturity.jobCategoryStatistics.length > 0) {
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          appointed: maturity.qualifiedCount,
          appointedByRequirement: maturity.qualifiedByRequirementCount ?? 0,
          appointmentRate: Number(maturity.qualifiedRate),
          certificationCompliance: Number(maturity.qualifiedByRequirementRate ?? 0),
          isMaturityRow: true,
        })

        // 直接使用后端返回的所有职位类数据（包括L2的非软件类）
        maturity.jobCategoryStatistics.forEach((jobCategory) => {
          rows.push({
            maturityLevel: '',
            jobCategory: jobCategory.jobCategory,
            baseline: jobCategory.baselineCount,
            appointed: jobCategory.qualifiedCount,
            appointedByRequirement: jobCategory.qualifiedByRequirementCount ?? 0,
            appointmentRate: Number(jobCategory.qualifiedRate),
            certificationCompliance: Number(jobCategory.qualifiedByRequirementRate ?? 0),
            isMaturityRow: false,
            // 添加成熟度信息，方便模板判断
            actualMaturityLevel: maturity.maturityLevel,
          } as any)
        })
      } else {
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          appointed: maturity.qualifiedCount,
          appointedByRequirement: maturity.qualifiedByRequirementCount ?? 0,
          appointmentRate: Number(maturity.qualifiedRate),
          certificationCompliance: Number(maturity.qualifiedByRequirementRate ?? 0),
          isMaturityRow: true,
        })
      }
    })

    if (stats.totalStatistics) {
      rows.push({
        maturityLevel: stats.totalStatistics.maturityLevel,
        jobCategory: '',
        baseline: stats.totalStatistics.baselineCount,
        appointed: stats.totalStatistics.qualifiedCount,
        appointedByRequirement: stats.totalStatistics.qualifiedByRequirementCount ?? 0,
        appointmentRate: Number(stats.totalStatistics.qualifiedRate),
        certificationCompliance: Number(stats.totalStatistics.qualifiedByRequirementRate ?? 0),
        isMaturityRow: true,
      })
    }

    return rows.length > 0 ? rows : cadreData.appointment
  }

  return {
    certification: mapCadreCertStatsToRows(cadreCertStats),
    appointment: mapCadreQualifiedStatsToRows(cadreQualifiedStats),
  }
}

// 获取全员趋势数据
export const fetchAllStaffTrends = async (): Promise<{
  departmentAppointment: StaffChartPoint[]
  organizationAppointment: StaffChartPoint[]
  jobCategoryAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  organizationCertification: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
}> => {
  await delay()
  return await fetchOverallCertificationTrends()
}

// 获取部门统计数据
export const fetchDepartmentStats = async (
  deptCode: string,
  personType: string
): Promise<{
  departmentAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  employeeCertStatistics: EmployeeCertStatisticsResponse | null
}> => {
  await delay()
  const employeeCertStats = await fetchEmployeeCertStatistics(deptCode, personType)
  const departmentCharts = mapDepartmentCertStatsToCharts(employeeCertStats?.departmentStatistics)

  return {
    departmentAppointment: departmentCharts?.appointment ?? [],
    departmentCertification: departmentCharts?.certification ?? [],
    employeeCertStatistics: employeeCertStats,
  }
}

// 整合职位类数据：将除了指定类别外的其他类别汇总为"其他类"
const consolidateJobCategories = (
  stats?: CompetenceCategoryCertStatisticsResponse
): CompetenceCategoryCertStatisticsResponse | null => {
  if (!stats || !stats.categoryStatistics || stats.categoryStatistics.length === 0) {
    return stats ?? null
  }

  // 需要保留的职位类（按照指定顺序）
  const allowedCategories = ['软件类', '研究类', '测试类', '系统类', '产品开发项目管理类']
  // 职位类排序顺序
  const jobCategoryOrder = ['软件类', '研究类', '测试类', '系统类', '产品开发项目管理类', '其他类']
  
  // 获取职位类的排序索引
  const getJobCategoryOrder = (category: string): number => {
    const index = jobCategoryOrder.indexOf(category)
    return index >= 0 ? index : jobCategoryOrder.length // 未定义的职位类排在最后
  }
  
  // 用于汇总其他类的数据
  let otherQualifiedCount = 0
  let otherCertifiedCount = 0
  let otherTotalCount = 0
  
  // 保留的职位类列表
  const allowedCategoryStats: CompetenceCategoryCertStatistics[] = []
  
  stats.categoryStatistics.forEach((item) => {
    if (allowedCategories.includes(item.competenceCategory)) {
      // 保留的职位类，直接添加
      allowedCategoryStats.push(item)
    } else if (item.competenceCategory !== '总计') {
      // 其他类别（排除总计），累加到其他类
      otherQualifiedCount += item.qualifiedCount ?? 0
      otherCertifiedCount += item.certifiedCount ?? 0
      otherTotalCount += item.totalCount ?? 0
    }
  })
  
  // 如果有其他类数据，添加"其他类"统计项
  if (otherTotalCount > 0 || otherQualifiedCount > 0 || otherCertifiedCount > 0) {
    const otherQualifiedRate = otherTotalCount > 0 
      ? Number(((otherQualifiedCount / otherTotalCount) * 100).toFixed(2)) 
      : 0
    const otherCertRate = otherTotalCount > 0 
      ? Number(((otherCertifiedCount / otherTotalCount) * 100).toFixed(2)) 
      : 0
    
    allowedCategoryStats.push({
      competenceCategory: '其他类',
      totalCount: otherTotalCount,
      qualifiedCount: otherQualifiedCount,
      certifiedCount: otherCertifiedCount,
      qualifiedRate: otherQualifiedRate,
      certRate: otherCertRate,
    })
  }
  
  // 按照指定顺序排序职位类数据
  allowedCategoryStats.sort((a, b) => {
    const orderA = getJobCategoryOrder(a.competenceCategory)
    const orderB = getJobCategoryOrder(b.competenceCategory)
    return orderA - orderB
  })
  
  return {
    deptCode: stats.deptCode,
    deptName: stats.deptName,
    categoryStatistics: allowedCategoryStats,
    totalStatistics: stats.totalStatistics,
  }
}

// 获取职位类统计数据
export const fetchJobCategoryStats = async (
  deptCode: string,
  personType: string
): Promise<{
  jobCategoryAppointment: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
  competenceCategoryCertStatistics: CompetenceCategoryCertStatisticsResponse | null
}> => {
  await delay()
  const competenceCategoryStats = await fetchCompetenceCategoryCertStatistics(deptCode, personType)

  // 整合职位类数据
  const consolidatedStats = consolidateJobCategories(competenceCategoryStats ?? undefined)

  const mapCompetenceCategoryToCharts = (
    stats?: CompetenceCategoryCertStatisticsResponse
  ): { appointment: StaffChartPoint[]; certification: StaffChartPoint[] } | null => {
    if (!stats || !stats.categoryStatistics || stats.categoryStatistics.length === 0) {
      return null
    }

    return {
      appointment: stats.categoryStatistics.map((item) => ({
        label: item.competenceCategory,
        count: item.qualifiedCount ?? 0,
        rate: Number(item.qualifiedRate ?? 0),
      })),
      certification: stats.categoryStatistics.map((item) => ({
        label: item.competenceCategory,
        count: item.certifiedCount ?? 0,
        rate: Number(item.certRate ?? 0),
      })),
    }
  }

  const jobCategoryCharts = mapCompetenceCategoryToCharts(consolidatedStats ?? undefined)

  return {
    jobCategoryAppointment: jobCategoryCharts?.appointment ?? [],
    jobCategoryCertification: jobCategoryCharts?.certification ?? [],
    competenceCategoryCertStatistics: consolidatedStats,
  }
}

// 获取部门树和角色选项
export const fetchDashboardFilters = async (): Promise<{
  departmentTree: DepartmentNode[]
  roles: SelectOption<CertificationRole>[]
}> => {
  await delay()
  const deptTree = await fetchDepartmentTree()
  return {
    departmentTree: deptTree,
    roles: [
      { label: '全员', value: '0' },
      { label: '干部', value: '1' },
      { label: '专家', value: '2' },
      { label: '基层主管', value: '3' },
    ],
  }
}

export const fetchCertificationDashboard = async (
  _filters?: CertificationDashboardFilters
): Promise<CertificationDashboardData> => {
  await delay()
  const deptCode = resolveDepartmentCode(_filters?.departmentPath)
  const personType = _filters?.role ?? '0'
  const [expertData, cadreData, allStaffData, deptTree, employeeCertStats, competenceCategoryStats, cadreCertStats, cadreQualifiedStats] =
    await Promise.all([
      fetchExpertCertificationSummary(),
      fetchCadreCertificationSummary(),
      fetchOverallCertificationTrends(),
      fetchDepartmentTree(),
      fetchEmployeeCertStatistics(deptCode, personType),
      fetchCompetenceCategoryCertStatistics(deptCode, personType),
      fetchCadreMaturityJobCategoryCertStatistics(deptCode),
      fetchCadreMaturityJobCategoryQualifiedStatistics(deptCode),
    ])

  const departmentCharts = mapDepartmentCertStatsToCharts(employeeCertStats?.departmentStatistics)

  // 整合职位类数据
  const consolidatedCompetenceCategoryStats = consolidateJobCategories(competenceCategoryStats ?? undefined)

  // 将职位类统计数据转换为图表数据格式
  const mapCompetenceCategoryToCharts = (
    stats?: CompetenceCategoryCertStatisticsResponse
  ): { appointment: StaffChartPoint[]; certification: StaffChartPoint[] } | null => {
    if (!stats || !stats.categoryStatistics || stats.categoryStatistics.length === 0) {
      return null
    }

    return {
      appointment: stats.categoryStatistics.map((item) => ({
        label: item.competenceCategory,
        count: item.qualifiedCount ?? 0,
        rate: Number(item.qualifiedRate ?? 0),
      })),
      certification: stats.categoryStatistics.map((item) => ({
        label: item.competenceCategory,
        count: item.certifiedCount ?? 0,
        rate: Number(item.certRate ?? 0),
      })),
    }
  }

  const jobCategoryCharts = mapCompetenceCategoryToCharts(consolidatedCompetenceCategoryStats ?? undefined)

  // 将干部认证数据转换为表格格式
  const mapCadreCertStatsToRows = (
    stats?: CadreMaturityJobCategoryCertStatisticsResponse | null
  ): (CadreCertificationSummaryRow & { isMaturityRow?: boolean })[] => {
    if (!stats || !stats.maturityStatistics || stats.maturityStatistics.length === 0) {
      return cadreData.certification
    }

    const rows: (CadreCertificationSummaryRow & { isMaturityRow?: boolean })[] = []

    // 遍历每个成熟度等级
    stats.maturityStatistics.forEach((maturity) => {
      // 如果有职位类统计，先添加成熟度行（跨两列显示），然后为每个职位类创建一行
      if (maturity.jobCategoryStatistics && maturity.jobCategoryStatistics.length > 0) {
        // 先添加成熟度行（跨两列显示，使用成熟度级别的汇总数据）
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          aiCertificateHolders: maturity.certifiedCount,
          subjectTwoPassed: maturity.subject2PassCount,
          certificateRate: Number(maturity.certRate),
          subjectTwoRate: Number(maturity.subject2PassRate),
          certStandardCount: maturity.certStandardCount ?? 0,
          complianceRate: null, // 按要求持证率数据暂无，直接置为null
          isMaturityRow: true, // 标记为成熟度行
        })

        // 为每个职位类创建一行
        maturity.jobCategoryStatistics.forEach((jobCategory) => {
          rows.push({
            maturityLevel: '', // 成熟度列为空
            jobCategory: jobCategory.jobCategory,
            baseline: jobCategory.baselineCount,
            aiCertificateHolders: jobCategory.certifiedCount,
            subjectTwoPassed: jobCategory.subject2PassCount,
            certificateRate: Number(jobCategory.certRate),
            subjectTwoRate: Number(jobCategory.subject2PassRate),
            certStandardCount: jobCategory.certStandardCount ?? 0,
            complianceRate: null, // 按要求持证率数据暂无，直接置为null
            isMaturityRow: false, // 标记为职位类行
          })
        })
      } else {
        // 如果没有职位类统计，只添加成熟度级别的汇总行（跨两列显示）
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          aiCertificateHolders: maturity.certifiedCount,
          subjectTwoPassed: maturity.subject2PassCount,
          certificateRate: Number(maturity.certRate),
          subjectTwoRate: Number(maturity.subject2PassRate),
          certStandardCount: maturity.certStandardCount ?? 0,
          complianceRate: null, // 按要求持证率数据暂无，直接置为null
          isMaturityRow: true, // 标记为成熟度行
        })
      }
    })

    // 添加总计行（跨两列显示）
    if (stats.totalStatistics) {
      rows.push({
        maturityLevel: stats.totalStatistics.maturityLevel,
        jobCategory: '',
        baseline: stats.totalStatistics.baselineCount,
        aiCertificateHolders: stats.totalStatistics.certifiedCount,
        subjectTwoPassed: stats.totalStatistics.subject2PassCount,
        certificateRate: Number(stats.totalStatistics.certRate),
        subjectTwoRate: Number(stats.totalStatistics.subject2PassRate),
        certStandardCount: stats.totalStatistics.certStandardCount ?? 0,
        complianceRate: null, // 按要求持证率数据暂无，直接置为null
        isMaturityRow: true, // 标记为成熟度行
      })
    }

    return rows.length > 0 ? rows : cadreData.certification
  }

  const cadreCertificationRows = mapCadreCertStatsToRows(cadreCertStats)

  // 将干部任职数据转换为表格格式
  const mapCadreQualifiedStatsToRows = (
    stats?: CadreMaturityJobCategoryQualifiedStatisticsResponse | null
  ): (CadreAppointmentSummaryRow & { isMaturityRow?: boolean })[] => {
    if (!stats || !stats.maturityStatistics || stats.maturityStatistics.length === 0) {
      return cadreData.appointment
    }

    const rows: (CadreAppointmentSummaryRow & { isMaturityRow?: boolean })[] = []

    // 遍历每个成熟度等级（仅L2和L3）
    stats.maturityStatistics.forEach((maturity) => {
      // 如果有职位类统计，先添加成熟度行，然后为每个职位类创建一行
      if (maturity.jobCategoryStatistics && maturity.jobCategoryStatistics.length > 0) {
        // 先添加成熟度行（使用成熟度级别的汇总数据）
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          appointed: maturity.qualifiedCount,
          appointedByRequirement: maturity.qualifiedCount, // 按要求任职人数暂时使用任职人数
          appointmentRate: Number(maturity.qualifiedRate),
          certificationCompliance: Number(maturity.qualifiedRate), // 按要求认证人数占比暂时使用任职率
          isMaturityRow: true, // 标记为成熟度行
        })

        // 为每个职位类创建一行
        maturity.jobCategoryStatistics.forEach((jobCategory) => {
          rows.push({
            maturityLevel: '', // 成熟度列为空
            jobCategory: jobCategory.jobCategory,
            baseline: jobCategory.baselineCount,
            appointed: jobCategory.qualifiedCount,
            appointedByRequirement: jobCategory.qualifiedCount, // 按要求任职人数暂时使用任职人数
            appointmentRate: Number(jobCategory.qualifiedRate),
            certificationCompliance: Number(jobCategory.qualifiedRate), // 按要求认证人数占比暂时使用任职率
            isMaturityRow: false, // 标记为职位类行
          })
        })
      } else {
        // 如果没有职位类统计，只添加成熟度级别的汇总行
        rows.push({
          maturityLevel: maturity.maturityLevel,
          jobCategory: '',
          baseline: maturity.baselineCount,
          appointed: maturity.qualifiedCount,
          appointedByRequirement: maturity.qualifiedCount, // 按要求任职人数暂时使用任职人数
          appointmentRate: Number(maturity.qualifiedRate),
          certificationCompliance: Number(maturity.qualifiedRate), // 按要求认证人数占比暂时使用任职率
          isMaturityRow: true, // 标记为成熟度行
        })
      }
    })

    // 添加总计行
    if (stats.totalStatistics) {
      rows.push({
        maturityLevel: stats.totalStatistics.maturityLevel,
        jobCategory: '',
        baseline: stats.totalStatistics.baselineCount,
        appointed: stats.totalStatistics.qualifiedCount,
        appointedByRequirement: stats.totalStatistics.qualifiedCount, // 按要求任职人数暂时使用任职人数
        appointmentRate: Number(stats.totalStatistics.qualifiedRate),
        certificationCompliance: Number(stats.totalStatistics.qualifiedRate), // 按要求认证人数占比暂时使用任职率
        isMaturityRow: true, // 标记为成熟度行
      })
    }

    return rows.length > 0 ? rows : cadreData.appointment
  }

  const cadreAppointmentRows = mapCadreQualifiedStatsToRows(cadreQualifiedStats)

  return {
    metrics: [],
    expertCertification: expertData.certification,
    expertAppointment: expertData.appointment,
    cadreCertification: cadreCertificationRows,
    cadreAppointment: cadreAppointmentRows,
    allStaff: {
      departmentAppointment: departmentCharts?.appointment?.length
        ? departmentCharts.appointment
        : allStaffData.departmentAppointment,
      organizationAppointment: allStaffData.organizationAppointment,
      jobCategoryAppointment: jobCategoryCharts?.appointment?.length
        ? jobCategoryCharts.appointment
        : allStaffData.jobCategoryAppointment,
      departmentCertification: departmentCharts?.certification?.length
        ? departmentCharts.certification
        : allStaffData.departmentCertification,
      organizationCertification: allStaffData.organizationCertification,
      jobCategoryCertification: jobCategoryCharts?.certification?.length
        ? jobCategoryCharts.certification
        : allStaffData.jobCategoryCertification,
    },
    employeeCertStatistics: employeeCertStats ?? null,
    competenceCategoryCertStatistics: consolidatedCompetenceCategoryStats ?? null,
    filters: {
      departmentTree: deptTree,
      roles: [
        { label: '全员', value: '0' },
        { label: '干部', value: '1' },
        { label: '专家', value: '2' },
        { label: '基层主管', value: '3' },
      ],
    },
  }
}

export const fetchCertificationDetailData = async (
  id: string,
  _filters?: CertificationDetailFilters
): Promise<{
  summary: {
    id: string;
    name: string;
    level: string;
    participants: number;
    passRate: number;
    status: string;
    updatedAt: string
  };
  certificationRecords: CertificationAuditRecord[];
  appointmentRecords: AppointmentAuditRecord[];
  filters: {
    departmentTree: Awaited<{
      certificateAudits: CertificationAuditRecord[];
      appointmentAudits: AppointmentAuditRecord[]
    }>;
    jobFamilies: string[];
    jobCategories: string[];
    jobSubCategories: string[];
    roles: ({ label: string; value: string } | { label: string; value: string } | { label: string; value: string } | {
      label: string;
      value: string
    })[];
    maturityOptions: ({ label: string; value: string } | { label: string; value: string } | {
      label: string;
      value: string
    } | { label: string; value: string })[]
  }
}> => {
  await delay()
  const [auditData, deptTree] = await Promise.all([fetchCertificationAuditRecords(), fetchDepartmentTree()])

  return {
    summary: {
      id,
      name: '',
      level: '',
      participants: 0,
      passRate: 0,
      status: '',
      updatedAt: '',
    },
    certificationRecords: auditData.certificateAudits,
    appointmentRecords: auditData.appointmentAudits,
    filters: {
      departmentTree: deptTree,
      jobFamilies: ['技术类', '管理类', '业务类'],
      jobCategories: ['AI 架构师', '数据科学家', '算法专家', '营销干部', '运营干部', '客服干部'],
      jobSubCategories: ['CV', 'NLP', '流程优化', '渠道拓展'],
      roles: [
        { label: '全员', value: '0' },
        { label: '干部', value: '1' },
        { label: '专家', value: '2' },
        { label: '基层主管', value: '3' },
      ],
      maturityOptions: [
        { label: '全部', value: '全部' },
        { label: 'L1', value: 'L1' },
        { label: 'L2', value: 'L2' },
        { label: 'L3', value: 'L3' },
      ],
    },
  }
}

export const fetchCourseDetail = async (id: string): Promise<CourseItem | undefined> => {
  const list = await fetchCourses()
  return list.find((item) => item.id === id)
}

export const fetchTrainingDetail = async (
  _id: string,
  _filters?: TrainingDetailFilters
): Promise<TrainingDetailData> => {
  await delay()
  const [deptTree] = await Promise.all([fetchDepartmentTree()])

  const records: TrainingBattleRecord[] = []

  const coursePlans: TrainingCoursePlanRecord[] = []

  return {
    records,
    coursePlans,
    filters: {
      departmentTree: deptTree,
      jobFamilies: ['技术类', '管理类', '业务类'],
      jobCategories: ['算法专家', '数据科学家', '运营干部', '营销干部', '基层主管', '产品经理'],
      jobSubCategories: ['CV', 'NLP', '流程优化', '渠道拓展', '服务运营', '智能产品'],
      roles: [
        { label: '全员', value: '0' },
        { label: '干部', value: '1' },
        { label: '专家', value: '2' },
        { label: '基层主管', value: '3' },
      ],
      maturityOptions: [
        { label: '全部', value: '全部' },
        { label: 'L1', value: 'L1' },
        { label: 'L2', value: 'L2' },
        { label: 'L3', value: 'L3' },
      ],
    },
  }
}

/**
 * 获取个人课程完成情况（/completion 接口）
 * @param account 可选，工号；不传时后端从 cookie 获取当前用户
 * @returns 个人课程完成情况数据
 */
export const fetchPersonalCourseCompletion = async (
  account?: string
): Promise<PersonalCourseCompletionResponse | null> => {
  try {
    const url =
      account != null && account.trim() !== ''
        ? `/personal-course/completion?account=${encodeURIComponent(account.trim())}`
        : '/personal-course/completion'
    const response = await get<Result<PersonalCourseCompletionResponse>>(url)
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取个人课程完成情况失败：', response.message)
    return null
  } catch (error) {
    console.error('获取个人课程完成情况异常：', error)
    return null
  }
}

/**
 * 部门课程完成率：根据父部门ID返回下一层级各部门的课程完成率统计
 * @param deptId 父部门ID（0 或二级部门时返回所有四级部门；三级返回四级子部门；四/五/六级返回下一层级子部门）
 * @param personType 人员类型，当前仅处理 0
 */
export const fetchDepartmentCompletionRate = async (
  deptId: string,
  personType: number = 0
): Promise<DepartmentCourseCompletionRateRow[]> => {
  try {
    const url = `/personal-course/department-completion-rate?deptId=${encodeURIComponent(deptId)}&personType=${personType}`
    const response = await get<Result<DepartmentCourseCompletionRateRow[]>>(url)
    if (response.code === 200 && Array.isArray(response.data)) {
      return response.data
    }
    return []
  } catch (error) {
    console.error('获取部门课程完成率异常：', error)
    return []
  }
}

/**
 * 部门全员训战总览（下钻）：根据部门ID返回该部门下全员训战明细
 * @param deptId 部门ID（部门编码）
 * @param personType 0 全员；1 干部；2 专家
 * @param aiMaturity 岗位 AI 成熟度（可选）：L1、L2、L3；仅 personType 为 1 或 2 时生效
 */
export const fetchDepartmentEmployeeTrainingOverview = async (
  deptId: string,
  personType: number = 0,
  aiMaturity?: string
): Promise<DepartmentEmployeeTrainingOverviewRow[]> => {
  try {
    const params = new URLSearchParams({
      deptId,
      personType: String(personType),
    })
    if (aiMaturity != null && String(aiMaturity).trim() !== '') {
      params.set('ai_maturity', String(aiMaturity).trim())
    }
    const url = `/personal-course/department-employee-training-overview?${params.toString()}`
    const response = await get<Result<DepartmentEmployeeTrainingOverviewRow[]>>(url)
    if (response.code === 200 && Array.isArray(response.data)) {
      return response.data
    }
    return []
  } catch (error) {
    console.error('获取部门全员训战总览异常：', error)
    return []
  }
}

const MATURITY_LEVEL_ORDER = ['L1', 'L2', 'L3']

const sortMaturityTrainingRows = (rows: TrainingRoleSummaryRow[]): TrainingRoleSummaryRow[] => {
  return [...rows].sort((a, b) => {
    const ka = String(a.maturityLevel ?? '')
      .trim()
      .toUpperCase()
    const kb = String(b.maturityLevel ?? '')
      .trim()
      .toUpperCase()
    const ia = MATURITY_LEVEL_ORDER.indexOf(ka)
    const ib = MATURITY_LEVEL_ORDER.indexOf(kb)
    const va = ia === -1 ? 999 : ia
    const vb = ib === -1 ? 999 : ib
    return va - vb
  })
}

/**
 * 后端为基础/进阶/实战三档；表格「高阶」列无对应字段，置 0。
 */
export const mapPositionAiMaturityToTrainingRoleSummaryRow = (
  row: PositionAiMaturityCourseCompletionRateVO
): TrainingRoleSummaryRow => {
  const n = (v: number | undefined | null) =>
    v != null && !Number.isNaN(Number(v)) ? Number(v) : 0
  return {
    maturityLevel: row.positionAiMaturity ?? '',
    personCount: n(row.baselineCount),
    beginnerCourses: n(row.basicCourseCount),
    intermediateCourses: n(row.advancedCourseCount),
    advancedCourses: 0,
    practiceCourses: n(row.practicalCourseCount),
    beginnerAvgLearners: n(row.basicAvgCompletedCount),
    intermediateAvgLearners: n(row.advancedAvgCompletedCount),
    advancedAvgLearners: 0,
    practiceAvgLearners: n(row.practicalAvgCompletedCount),
    beginnerCompletionRate: n(row.basicAvgCompletionRate),
    intermediateCompletionRate: n(row.advancedAvgCompletionRate),
    advancedCompletionRate: 0,
    practiceCompletionRate: n(row.practicalAvgCompletionRate),
  }
}

/**
 * 专家/干部训战：按岗位 AI 成熟度汇总（personType 仅 1 干部、2 专家）
 * @param deptId 部门编码，未选部门时传 0
 */
export const fetchMaturityTrainingCourses = async (
  deptId: string,
  personType: 1 | 2
): Promise<TrainingRoleSummaryRow[]> => {
  try {
    const url = `/trainning-courses/maturity-trainning-courses?deptId=${encodeURIComponent(deptId)}&personType=${personType}`
    const response = await get<Result<PositionAiMaturityCourseCompletionRateVO[]>>(url)
    if (response.code === 200 && Array.isArray(response.data)) {
      const mapped = response.data.map(mapPositionAiMaturityToTrainingRoleSummaryRow)
      return sortMaturityTrainingRows(mapped)
    }
    return []
  } catch (error) {
    console.error('获取岗位AI成熟度训战统计异常：', error)
    return []
  }
}

export const fetchTrainingDashboard = async (
  filters?: TrainingDashboardFilters
): Promise<TrainingDashboardData> => {
  await delay()
  const departmentTree = await fetchDepartmentTree()
  const role: TrainingRole = (filters?.role ?? '0')

  // 获取个人训战总览数据
  console.log('开始获取个人训战总览数据...')
  const personalCompletionData = await fetchPersonalCourseCompletion()
  console.log('个人训战总览数据获取结果：', personalCompletionData)
  const personalOverview: TrainingPersonalOverviewRow[] = []
  
  if (personalCompletionData?.courseStatistics) {
    // 转换各分类数据
    const categoryRows = personalCompletionData.courseStatistics.map((stat) => ({
      classification: stat.courseLevel ?? '',
      courseTotal: stat.totalCourses ?? 0,
      targetCompleted: stat.targetCourses ?? 0,
      actualCompleted: stat.completedCourses ?? 0,
      completionRate: stat.completionRate ?? 0,
    }))
    
    // 计算总计行
    const totalRow: TrainingPersonalOverviewRow = {
      classification: '总计',
      courseTotal: categoryRows.reduce((sum, row) => sum + row.courseTotal, 0),
      targetCompleted: categoryRows.reduce((sum, row) => sum + row.targetCompleted, 0),
      actualCompleted: categoryRows.reduce((sum, row) => sum + row.actualCompleted, 0),
      completionRate: 0,
    }
    
    // 计算总计的完课占比
    if (totalRow.targetCompleted > 0) {
      totalRow.completionRate = (totalRow.actualCompleted / totalRow.targetCompleted) * 100
    }
    
    // 合并分类数据和总计行
    personalOverview.push(...categoryRows, totalRow)
  }

  const expertSummary: TrainingRoleSummaryRow[] = []

  const cadreSummary: TrainingRoleSummaryRow[] = []

  const expertCadreSummary: TrainingExpertCadreSummary = {
    title: '',
    dimensionLabel: '',
    rows: [],
  }

  const allStaffGroups: TrainingAllStaffSummaryGroup[] = []

  const planningResources: TrainingPlanningResource[] = []

  return {
    personalOverview,
    expertSummary,
    cadreSummary,
    expertCadreSummary,
    allStaffSummary: {
      role,
      groups: allStaffGroups,
    },
    planningResources,
    filters: {
      departmentTree,
      roles: [
        { label: '全员', value: '0' },
        { label: '干部', value: '1' },
        { label: '专家', value: '2' },
        { label: '基层主管', value: '3' },
      ],
    },
  }
}

export const fetchDepartmentTree = async (): Promise<DepartmentNode[]> => {
  return []
}

export const fetchExpertCertificationSummary = async (): Promise<{
  certification: ExpertCertificationSummaryRow[]
  appointment: ExpertAppointmentSummaryRow[]
}> => {
  return {
    certification: [],
    appointment: [],
  }
}

export const fetchCadreCertificationSummary = async (): Promise<{
  certification: CadreCertificationSummaryRow[]
  appointment: CadreAppointmentSummaryRow[]
}> => {
  return {
    certification: [],
    appointment: [],
  }
}

export const fetchOverallCertificationTrends = async (): Promise<{
  departmentAppointment: StaffChartPoint[]
  organizationAppointment: StaffChartPoint[]
  jobCategoryAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  organizationCertification: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
}> => {
  try {
    const response = await get<Result<{
      departmentAppointment: StaffChartPoint[]
      organizationAppointment: StaffChartPoint[]
      jobCategoryAppointment: StaffChartPoint[]
      departmentCertification: StaffChartPoint[]
      organizationCertification: StaffChartPoint[]
      jobCategoryCertification: StaffChartPoint[]
    }>>('/expert-cert-statistics/overall-certification-trends')
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取全员趋势数据失败：', response.message)
    return {
      departmentAppointment: [],
      organizationAppointment: [],
      jobCategoryAppointment: [],
      departmentCertification: [],
      organizationCertification: [],
      jobCategoryCertification: [],
    }
  } catch (error) {
    console.error('获取全员趋势数据异常：', error)
    return {
      departmentAppointment: [],
      organizationAppointment: [],
      jobCategoryAppointment: [],
      departmentCertification: [],
      organizationCertification: [],
      jobCategoryCertification: [],
    }
  }
}

export const fetchCertificationAuditRecords = async (): Promise<{
  certificateAudits: CertificationAuditRecord[]
  appointmentAudits: AppointmentAuditRecord[]
}> => {
  return {
    certificateAudits: [],
    appointmentAudits: [],
  }
}

/**
 * 获取个人学分概览数据
 * @returns 个人学分概览数据
 */
export const fetchPersonalCreditOverview = async (): Promise<PersonalCredit | null> => {
  try {
    const response = await get<Result<PersonalCredit>>('/api/personal-credit/overview')
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取个人学分概览失败：', response.message)
    return null
  } catch (error) {
    console.error('获取个人学分概览异常：', error)
    return null
  }
}

export const fetchSchoolDashboard = async (
  _filters?: SchoolDashboardFilters
): Promise<SchoolDashboardData> => {
  await delay()
  const [deptTree, personalCredit] = await Promise.all([
    fetchDepartmentTree(),
    fetchPersonalCreditOverview()
  ])

  // 计算时间进度学分目标和预警状态
  let scheduleTarget = 0
  let status: '正常' | '轻度预警' | '滞后预警' = '正常'
  let statusType: 'success' | 'warning' | 'danger' = 'success'
  
  if (personalCredit) {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const endOfYear = new Date(now.getFullYear(), 11, 31)
    const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    const passedDays = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    
    // 时间进度学分目标 = 当前已过去时间/一年总时间 * 目标学分
    if (personalCredit.targetCredit > 0) {
      scheduleTarget = Number(((passedDays / totalDays) * personalCredit.targetCredit).toFixed(1))
    }
    
    // 学分预警状态：当前学分和时间进度学分目标比大小
    if (personalCredit.currentCredit >= scheduleTarget) {
      status = '正常'
      statusType = 'success'
    } else {
      // 简单预警逻辑：小于进度目标即为滞后，可根据差距程度细分轻度/滞后
      status = '滞后预警'
      statusType = 'danger'
    }
  }

  return {
    personalOverview: {
      targetCredits: personalCredit?.targetCredit ?? 0,
      currentCredits: personalCredit?.currentCredit ?? 0,
      completionRate: personalCredit?.personalCreditCompletionRate ?? 0,
      benchmarkRate: personalCredit?.deptBenchmarkCompletionRate ?? 0,
      scheduleTarget,
      expectedCompletionDate: personalCredit?.creditCompletionDate ?? '-', // 如果未达成，显示 -
      status,
      statusType,
      ...personalCredit
    },
    expertSummary: [],
    cadreSummary: [],
    allStaffSummary: {
      role: '0',
      groups: [],
    },
    filters: {
      departmentTree: deptTree,
      roles: [
        { label: '全员', value: '0' },
        { label: '干部', value: '1' },
        { label: '专家', value: '2' },
        { label: '基层主管', value: '3' },
      ],
    },
  }
}

export const fetchSchoolDetailData = async (
  _id: string,
  filters?: SchoolDetailFilters
): Promise<SchoolDetailData> => {
  const [deptTree] = await Promise.all([fetchDepartmentTree()])

  // 构建查询参数：优先使用直接传入的 deptCode/deptLevel，否则从 departmentPath 推导
  const deptCode: string = filters?.deptCode
    || (filters?.departmentPath?.length
      ? filters.departmentPath[filters.departmentPath.length - 1]
      : undefined)
    || '0'
  const deptLevel = filters?.deptLevel ?? (filters?.departmentPath?.length || 0)

  // 调用后端接口获取学分明细数据
  const query = new URLSearchParams()
  query.append('deptCode', deptCode)
  query.append('deptLevel', String(deptLevel))
  if (filters?.role && filters.role !== '0') {
    query.append('roleType', filters.role)
  }
  if (filters?.jobFamily) {
    query.append('jobFamily', filters.jobFamily)
  }
  if (filters?.jobCategory) {
    query.append('jobCategory', filters.jobCategory)
  }
  if (filters?.jobSubCategory) {
    query.append('jobSubCategory', filters.jobSubCategory)
  }
  if (filters?.positionMaturity && filters.positionMaturity !== '全部') {
    query.append('positionMaturity', filters.positionMaturity)
  }
  query.append('pageNum', '1')
  query.append('pageSize', '100')

  let records: SchoolCreditRecord[] = []
  let jobFamilies: string[] = []
  let jobCategories: string[] = []
  let jobSubCategories: string[] = []
  try {
    const response = await get<Result<SchoolCreditDetailResponseVO>>(
      `/api/school-credit-detail/list?${query.toString()}`
    )
    if (response.code === 200 && response.data) {
      records = response.data.records
      jobFamilies = response.data.jobFamilies ?? []
      jobCategories = response.data.jobCategories ?? []
      jobSubCategories = response.data.jobSubCategories ?? []
    }
  } catch (error) {
    console.error('获取学分明细数据失败:', error)
  }

  return {
    records,
    rules: [],
    filters: {
      departmentTree: deptTree,
      jobFamilies,
      jobCategories,
      jobSubCategories,
      roles: [
        { label: '全员', value: '0' },
        { label: '干部', value: '1' },
        { label: '专家', value: '2' },
        { label: '基层主管', value: '3' },
      ],
      maturityOptions: [
        { label: '全部', value: '全部' },
        { label: 'L1', value: 'L1' },
        { label: 'L2', value: 'L2' },
        { label: 'L3', value: 'L3' },
      ],
    },
  }
}

/**
 * 根据部门ID查询子部门列表
 * @param deptId 部门ID（部门编码），为空或"0"时查询一级部门
 * @returns 子部门列表
 */
const departmentChildrenCache = new Map<string, DepartmentInfoVO[]>()
const departmentChildrenPromises = new Map<string, Promise<DepartmentInfoVO[]>>()

export const fetchDepartmentChildren = (
  deptId: string | number = '0',
  options?: { force?: boolean }
): Promise<DepartmentInfoVO[]> => {
  const cacheKey = String(deptId)
  if (!options?.force) {
    if (departmentChildrenCache.has(cacheKey)) {
      return Promise.resolve(departmentChildrenCache.get(cacheKey)!)
    }
    if (departmentChildrenPromises.has(cacheKey)) {
      return departmentChildrenPromises.get(cacheKey)!
    }
  }

  const requestPromise = (async () => {
    try {
      const response = await get<Result<DepartmentInfoVO[]>>(
        `/department-info/children?deptId=${deptId}`
      )
      if (response.code === 200 && response.data) {
        departmentChildrenCache.set(cacheKey, response.data)
        return response.data
      }
      throw new Error(response.message || '查询部门数据失败')
    } catch (error) {
      console.error('获取部门子节点失败:', error)
      throw error
    } finally {
      departmentChildrenPromises.delete(cacheKey)
    }
  })()

  departmentChildrenPromises.set(cacheKey, requestPromise)
  return requestPromise
}
/**
 * 查询干部或专家认证数据详情
 * @param deptCode 部门ID（部门编码）
 * @param aiMaturity 岗位AI成熟度（可选，L5代表查询L2和L3的数据）
 * @param jobCategory 职位类（可选）
 * @param personType 人员类型（1-干部，2-专家）
 * @param queryType 查询类型（1-任职人数，2-基线人数），默认为1，仅对干部类型有效
 * @returns 员工详细信息列表
 */
export const fetchPersonCertDetails = async (
  deptCode: string,
  aiMaturity?: string,
  jobCategory?: string,
  personType: number = 1,
  queryType: number = 1
): Promise<EmployeeDrillDownResponseVO | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
      personType: String(personType),
      queryType: String(queryType),
    })
    if (aiMaturity && aiMaturity.trim().length) {
      query.append('aiMaturity', aiMaturity)
    }
    if (jobCategory && jobCategory.trim().length) {
      query.append('jobCategory', jobCategory)
    }
    const response = await get<Result<EmployeeDrillDownResponseVO>>(
      `/expert-cert-statistics/person-cert-details?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取干部或专家认证数据详情失败：', response.message)
    return null
  } catch (error) {
    console.error('获取干部或专家认证数据详情异常：', error)
    return null
  }
}

/**
 * 查询干部任职数据详情
 * @param deptCode 部门ID（部门编码）
 * @param aiMaturity 岗位AI成熟度（可选）
 * @param jobCategory 职位类（可选）
 * @param personType 人员类型（1-干部）
 * @param queryType 查询类型（1-任职人数，2-基线人数），默认为1
 * @returns 员工详细信息列表
 */
export const fetchCadreQualifiedDetails = async (
  deptCode: string,
  aiMaturity?: string,
  jobCategory?: string,
  personType: number = 1,
  queryType: number = 1
): Promise<EmployeeDrillDownResponseVO | null> => {
  try {
    const query = new URLSearchParams({
      deptCode: deptCode || '0',
      personType: String(personType),
      queryType: String(queryType),
    })
    if (aiMaturity && aiMaturity.trim().length) {
      query.append('aiMaturity', aiMaturity)
    }
    if (jobCategory && jobCategory.trim().length) {
      query.append('jobCategory', jobCategory)
    }
    const response = await get<Result<EmployeeDrillDownResponseVO>>(
      `/expert-cert-statistics/cadre-qualified-details?${query.toString()}`
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取干部任职数据详情失败：', response.message)
    return null
  } catch (error) {
    console.error('获取干部任职数据详情异常：', error)
    return null
  }
}

/**
 * 获取课程规划明细列表
 * @returns 课程规划明细列表
 */
export const fetchCoursePlanningInfoList = async (): Promise<CoursePlanningInfo[]> => {
  try {
    const response = await get<Result<CoursePlanningInfo[]>>('/course-planning-info/list')
    if (response.code === 200) {
      return response.data || []
    }
    console.warn('获取课程规划明细列表失败：', response.message)
    return []
  } catch (error) {
    console.error('获取课程规划明细列表异常：', error)
    return []
  }
}

/**
 * 获取PL/TM任职与认证统计数据
 * @returns PL/TM任职与认证统计数据
 */
export const fetchPlTmCertStatistics = async (): Promise<PlTmCertStatisticsResponse | null> => {
  try {
    const response = await get<Result<PlTmCertStatisticsResponse>>(
      '/entry-level-manager/pl-tm-cert-statistics'
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取PL/TM任职与认证数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取PL/TM任职与认证数据异常：', error)
    return null
  }
}

/**
 * 获取AI干部岗位概述统计数据
 * @returns AI干部岗位概述统计数据
 */
export const fetchCadrePositionOverview = async (): Promise<CadrePositionOverviewResponseVO | null> => {
  try {
    const response = await get<Result<CadrePositionOverviewResponseVO>>(
      '/cadre-cert-statistics/cadre-position-overview'
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取AI干部岗位概述数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取AI干部岗位概述数据异常：', error)
    return null
  }
}

/**
 * 获取干部AI任职认证表统计数据
 * @returns 干部AI任职认证表统计数据
 */
export const fetchCadreAiCertificationOverview = async (): Promise<CadreAiCertificationOverviewResponseVO | null> => {
  try {
    const response = await get<Result<CadreAiCertificationOverviewResponseVO>>(
      '/cadre-cert-statistics/cadre-ai-certification-overview'
    )
    if (response.code === 200) {
      return response.data
    }
    console.warn('获取干部AI任职认证表数据失败：', response.message)
    return null
  } catch (error) {
    console.error('获取干部AI任职认证表数据异常：', error)
    return null
  }
}