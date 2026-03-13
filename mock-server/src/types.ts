export interface DepartmentInfo {
  deptCode: string
  deptName: string
  deptLevel: string
  parentDeptCode?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface DepartmentCertStatistic {
  deptCode: string
  deptName: string
  totalCount: number
  certifiedCount: number
  certRate: number
  qualifiedCount?: number
  qualifiedRate?: number
}

export interface EmployeeCertStatisticsResponse {
  departmentStatistics: DepartmentCertStatistic[]
  totalStatistics: DepartmentCertStatistic
}

export interface CompetenceCategoryCertStatistics {
  competenceCategory: string
  totalCount: number
  certifiedCount: number
  qualifiedCount: number
  certRate: number
  qualifiedRate: number
}

export interface CompetenceCategoryCertStatisticsResponse {
  deptCode: string
  deptName: string
  categoryStatistics: CompetenceCategoryCertStatistics[]
  totalStatistics: CompetenceCategoryCertStatistics
}

export interface CadreJobCategoryCertStatistics {
  jobCategory: string
  baselineCount: number
  certifiedCount: number
  certRate: number
  subject2PassCount: number
  subject2PassRate: number
}

export interface CadreMaturityCertStatistics {
  maturityLevel: string
  baselineCount: number
  certifiedCount: number
  certRate: number
  subject2PassCount: number
  subject2PassRate: number
  jobCategoryStatistics?: CadreJobCategoryCertStatistics[]
}

export interface CadreMaturityJobCategoryCertStatisticsResponse {
  deptCode: string
  deptName: string
  maturityStatistics: CadreMaturityCertStatistics[]
  totalStatistics: CadreMaturityCertStatistics
}

export interface CadreJobCategoryQualifiedStatistics {
  jobCategory: string
  baselineCount: number
  qualifiedCount: number
  qualifiedRate: number
}

export interface CadreMaturityQualifiedStatistics {
  maturityLevel: string
  baselineCount: number
  qualifiedCount: number
  qualifiedRate: number
  jobCategoryStatistics?: CadreJobCategoryQualifiedStatistics[]
}

export interface CadreMaturityJobCategoryQualifiedStatisticsResponse {
  deptCode: string
  deptName: string
  maturityStatistics: CadreMaturityQualifiedStatistics[]
  totalStatistics: CadreMaturityQualifiedStatistics
}

export interface EmployeeDetailVO {
  name: string
  employeeNumber: string
  competenceCategory?: string
  competenceSubcategory?: string
  firstLevelDept?: string
  secondLevelDept?: string
  thirdLevelDept?: string
  fourthLevelDept?: string
  fifthLevelDept?: string
  sixthLevelDept?: string
  certTitle?: string
  certStartTime?: string
  isPassedSubject2?: number
  isCadre?: number
  aiMaturity?: string
  miniDeptName?: string
  cadreType?: string
  competenceFamilyCn?: string
  competenceCategoryCn?: string
  competenceSubcategoryCn?: string
  directionCnName?: string
  competenceRatingCn?: string
  competenceGradeCn?: string
  competenceFrom?: string
  competenceTo?: string
}

export interface EmployeeDrillDownResponseVO {
  employeeDetails: EmployeeDetailVO[]
}

export interface StaffChartPoint {
  label: string
  count: number
  rate: number
}

export interface OverallCertificationTrendsResponse {
  departmentAppointment: StaffChartPoint[]
  organizationAppointment: StaffChartPoint[]
  jobCategoryAppointment: StaffChartPoint[]
  departmentCertification: StaffChartPoint[]
  organizationCertification: StaffChartPoint[]
  jobCategoryCertification: StaffChartPoint[]
}

export interface ExpertJobCategoryCertStatistics {
  jobCategory: string
  baselineCount: number
  certifiedCount: number
  certRate: number
}

export interface ExpertMaturityCertStatistics {
  maturityLevel: string
  baselineCount: number
  certifiedCount: number
  certRate: number
  jobCategoryStatistics?: ExpertJobCategoryCertStatistics[]
}

export interface ExpertAiCertStatisticsResponse {
  deptCode: string
  deptName: string
  maturityStatistics: ExpertMaturityCertStatistics[]
  totalStatistics: ExpertMaturityCertStatistics
}

export interface ExpertJobCategoryQualifiedStatistics {
  jobCategory: string
  baselineCount: number
  qualifiedCount: number
  qualifiedRate: number
  qualifiedByRequirementCount?: number
  qualifiedByRequirementRate?: number
}

export interface ExpertMaturityQualifiedStatistics {
  maturityLevel: string
  baselineCount: number
  qualifiedCount: number
  qualifiedRate: number
  qualifiedByRequirementCount?: number
  qualifiedByRequirementRate?: number
  jobCategoryStatistics?: ExpertJobCategoryQualifiedStatistics[]
}

export interface ExpertAiQualifiedStatisticsResponse {
  deptCode: string
  deptName: string
  maturityStatistics: ExpertMaturityQualifiedStatistics[]
  totalStatistics: ExpertMaturityQualifiedStatistics
}

// PL/TM或PM统计数据
export interface PlTmPmStatistics {
  totalCount: number // 总人数
  qualifiedCount: number // 通过任职标准的人数（is_qualifications_standard=1）
  qualifiedRatio: number // 任职占比（qualifiedCount/totalCount）
  certCount: number // 通过认证标准的人数（is_cert_standard=1）
  certRatio: number // 认证占比（certCount/totalCount）
}

// PL/TM部门统计数据
export interface PlTmDepartmentStatistics {
  deptCode: string // 部门编码
  deptName: string // 部门名称
  plTm: PlTmPmStatistics // PL/TM统计数据（PL和TM合并统计）
  pm: PlTmPmStatistics // PM（项目经理）统计数据（单独统计）
}

// PL/TM任职与认证统计响应
export interface PlTmCertStatisticsResponse {
  summary: PlTmDepartmentStatistics // 研发管理部汇总数据
  departmentList: PlTmDepartmentStatistics[] // 各四级部门统计数据列表
}

// 课程信息
export interface CourseInfo {
  courseName: string // 课程名称
  courseNumber: string // 课程编码
  isCompleted: boolean // 是否已完成
}

// 课程分类统计数据
export interface CourseCategoryStatistics {
  courseLevel: string // 训战分类（基础、进阶、高阶、实战）
  totalCourses: number // 课程总数
  targetCourses: number // 目标课程数
  completedCourses: number // 实际完课数
  completionRate: number // 完课占比（百分比）
  courseList: CourseInfo[] // 该分类下的所有目标课程列表
}

// 个人课程完成情况响应
export interface PersonalCourseCompletionResponse {
  empNum: string // 员工工号
  empName: string // 员工姓名
  courseStatistics: CourseCategoryStatistics[] // 各训战分类的课程统计列表
}
