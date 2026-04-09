export type TrendType = 'up' | 'down' | 'flat'

export interface MetricItem {
  id: string
  title: string
  value: number
  unit?: string
  delta?: number
  trend?: TrendType
}

export interface TrendPoint {
  label: string
  value: number
}

export interface TrainingTask {
  id: string
  name: string
  owner: string
  status: '进行中' | '待启动' | '已完成'
  progress: number
  dataset: string
  updatedAt: string
}

export type RoleValue = '0' | '1' | '2' | '3'

export type TrainingRole = RoleValue

export interface TrainingPlanningResource {
  id: string
  title: string
  owner: string
  updatedAt: string
  downloadUrl: string
  description?: string
}

export interface TrainingPersonalOverviewRow {
  classification: string
  courseTotal: number
  targetCompleted: number
  actualCompleted: number
  completionRate: number
}

/** 部门课程完成率（/department-completion-rate 单条） */
export interface DepartmentCourseCompletionRateRow {
  deptId: string
  deptName: string
  baselineCount: number
  basicCourseCount: number
  advancedCourseCount: number
  practicalCourseCount: number
  basicAvgCompletedCount: number
  advancedAvgCompletedCount: number
  practicalAvgCompletedCount: number
  basicAvgCompletionRate: number
  advancedAvgCompletionRate: number
  practicalAvgCompletionRate: number
}

/** 部门全员训战总览下钻（/department-employee-training-overview 单条） */
export interface DepartmentEmployeeTrainingOverviewRow {
  name: string
  employeeNumber: string
  jobCategory: string
  jobSubcategory: string
  firstDept: string
  secondDept: string
  thirdDept: string
  fourthDept: string
  fifthDept: string
  lowestDept: string
  basicTargetCourseCount: number
  basicCompletedCount: number
  basicCompletionRate: number
  advancedTargetCourseCount: number
  advancedCompletedCount: number
  advancedCompletionRate: number
  /** 实战目标课程数（/department-employee-training-overview） */
  practicalTargetCourseCount?: number
  /** 实战目标课程完课数 */
  practicalCompletedCount?: number
  /** 实战目标课程完课占比（百分比数值） */
  practicalCompletionRate?: number
  totalTargetCourseCount: number
  totalCompletedCount: number
  totalCompletionRate: number
}

export interface TrainingRoleSummaryRow {
  maturityLevel: string
  personCount: number
  beginnerCourses: number
  intermediateCourses: number
  advancedCourses: number
  practiceCourses: number
  beginnerAvgLearners: number
  intermediateAvgLearners: number
  advancedAvgLearners: number
  practiceAvgLearners: number
  beginnerCompletionRate: number
  intermediateCompletionRate: number
  advancedCompletionRate: number
  practiceCompletionRate: number
}

/** GET /trainning-courses/maturity-trainning-courses 单条（与后端 PositionAiMaturityCourseCompletionRateVO 一致） */
export interface PositionAiMaturityCourseCompletionRateVO {
  positionAiMaturity?: string
  personType?: number
  baselineCount?: number
  basicCourseCount?: number
  advancedCourseCount?: number
  practicalCourseCount?: number
  basicAvgCompletedCount?: number
  advancedAvgCompletedCount?: number
  practicalAvgCompletedCount?: number
  basicAvgCompletionRate?: number
  advancedAvgCompletionRate?: number
  practicalAvgCompletionRate?: number
}

export interface TrainingExpertCadreSummaryRow {
  dimension: string
  personCount: number
  beginnerCourses: number
  intermediateCourses: number
  advancedCourses: number
  practiceCourses: number
  beginnerAvgLearners: number
  intermediateAvgLearners: number
  advancedAvgLearners: number
  practiceAvgLearners: number
  beginnerCompletionRate: number
  intermediateCompletionRate: number
  advancedCompletionRate: number
  practiceCompletionRate: number
}

export interface TrainingExpertCadreSummary {
  title: string
  dimensionLabel: string
  rows: TrainingExpertCadreSummaryRow[]
}

export interface TrainingAllStaffSummaryRow {
  dimension: string
  baseline: number
  beginnerCourses: number
  intermediateCourses: number
  advancedCourses: number
  practiceCourses: number
  beginnerAvgLearners: number
  intermediateAvgLearners: number
  advancedAvgLearners: number
  practiceAvgLearners: number
  beginnerCompletionRate: number
  intermediateCompletionRate: number
  advancedCompletionRate: number
  practiceCompletionRate: number
}

export interface TrainingAllStaffSummaryGroup {
  title: string
  dimensionLabel: string
  rows: TrainingAllStaffSummaryRow[]
}

export interface TrainingDashboardFilters {
  departmentPath?: string[]
  role?: TrainingRole
}

export interface TrainingDashboardData {
  personalOverview: TrainingPersonalOverviewRow[]
  expertSummary: TrainingRoleSummaryRow[]
  cadreSummary: TrainingRoleSummaryRow[]
  expertCadreSummary: TrainingExpertCadreSummary
  allStaffSummary: {
    role: TrainingRole
    groups: TrainingAllStaffSummaryGroup[]
  }
  planningResources: TrainingPlanningResource[]
  filters: {
    departmentTree: DepartmentNode[]
    roles: SelectOption<TrainingRole>[]
  }
}

export interface TrainingBattleRecord {
  id: string
  name: string
  employeeId: string
  jobFamily: string
  jobCategory: string
  jobSubCategory: string
  departmentPath: string[]
  departmentLevel1: string
  departmentLevel2: string
  departmentLevel3: string
  departmentLevel4: string
  departmentLevel5: string
  departmentLevel6: string
  minDepartment: string
  trainingCategory: string
  courseCategory: string
  courseName: string
  isTargetCourse: boolean
  isCompleted: boolean
  completionDate?: string
  isCadre: boolean
  cadreType?: string
  isExpert: boolean
  isFrontlineManager: boolean
  organizationMaturity: 'L1' | 'L2' | 'L3'
  positionMaturity: 'L1' | 'L2' | 'L3'
}

export interface TrainingCoursePlanRecord {
  id: string
  trainingCategory: string
  courseName: string
  courseCode: string
  targetAudience: string
  credits: number
  courseUrl: string
}

export interface TrainingDetailData {
  records: TrainingBattleRecord[]
  coursePlans: TrainingCoursePlanRecord[]
  filters: {
    departmentTree: DepartmentNode[]
    jobFamilies: string[]
    jobCategories: string[]
    jobSubCategories: string[]
    roles: SelectOption<TrainingRole>[]
    maturityOptions: SelectOption<'全部' | 'L1' | 'L2' | 'L3'>[]
  }
}

export interface TrainingDetailFilters {
  departmentPath?: string[]
  jobFamily?: string
  jobCategory?: string
  jobSubCategory?: string
  role?: TrainingRole
  positionMaturity?: '全部' | 'L1' | 'L2' | 'L3'
}

export interface CourseItem {
  id: string
  title: string
  category: string
  learners: number
  completionRate: number
  updatedAt: string
}

export interface CertificationItem {
  id: string
  name: string
  level: '初级' | '中级' | '高级'
  participants: number
  passRate: number
  status: '报名中' | '进行中' | '已结束'
  updatedAt: string
}

export interface DepartmentNode {
  label: string
  value: string
  children?: DepartmentNode[]
  disabled?: boolean // 是否禁用该节点
}

export interface ExpertCertificationSummaryRow {
  maturityLevel: string
  jobCategory: string
  baseline: number
  certified: number
  certificationRate: number
  isMaturityRow?: boolean
}

export interface ExpertAppointmentSummaryRow {
  maturityLevel: string
  jobCategory: string
  baseline: number
  appointed: number
  appointedByRequirement: number
  appointmentRate: number
  certificationCompliance: number
  baselineCountByRequirement?: number
  isMaturityRow?: boolean
}

export interface CadreCertificationSummaryRow {
  maturityLevel: string
  jobCategory: string
  baseline: number
  aiCertificateHolders: number
  subjectTwoPassed: number
  certificateRate: number
  subjectTwoRate: number
  certStandardCount?: number
  complianceRate: number | null
  isMaturityRow?: boolean
  actualMaturityLevel?: string
}

export interface CadreAppointmentSummaryRow {
  maturityLevel: string
  jobCategory: string
  baseline: number
  appointed: number
  appointedByRequirement: number
  appointmentRate: number
  certificationCompliance: number
  isMaturityRow?: boolean
  actualMaturityLevel?: string
}

export type CertificationRole = RoleValue

export interface OverallCertificationTrendRow {
  role: CertificationRole
  dimension: string
  category: string
  appointed: number
  appointedRate: number
  certified: number
  certifiedRate: number
}

export interface CertificationAuditRecord {
  id: string
  name: string
  employeeId: string
  positionCategory: string
  positionSubCategory: string
  departmentLevel1: string
  departmentLevel2: string
  departmentLevel3: string
  departmentLevel4: string
  departmentLevel5: string
  departmentLevel6?: string
  minDepartment: string
  certificateName: string
  certificateEffectiveDate: string
  subjectTwoPassed: boolean
  isCadre: boolean
  cadreType?: string
  isExpert?: boolean
  isFrontlineManager?: boolean
  organizationMaturity?: 'L1' | 'L2' | 'L3'
  positionMaturity?: 'L1' | 'L2' | 'L3'
  requiredCertificate: string
  isQualified?: boolean
  isCertStandard?: boolean
}

export interface AppointmentAuditRecord {
  id: string
  name: string
  employeeId: string
  positionCategory: string
  positionSubCategory: string
  departmentLevel1: string
  departmentLevel2: string
  departmentLevel3: string
  departmentLevel4: string
  departmentLevel5: string
  departmentLevel6: string
  minDepartment: string
  professionalCategory: string
  expertCategory: string
  professionalSubCategory: string
  qualificationDirection: string
  qualificationLevel: string
  acquisitionMethod: string
  effectiveDate: string
  expiryDate: string
  isCadre: boolean
  cadreType?: string
  isExpert?: boolean
  isFrontlineManager?: boolean
  organizationMaturity?: 'L1' | 'L2' | 'L3'
  positionMaturity?: 'L1' | 'L2' | 'L3'
  requiredCertificate?: string
  isQualified?: boolean
}

export interface StaffChartPoint {
  label: string
  count: number
  rate: number
  deptCode?: string // 部门编码，用于点击跳转
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
  certStandardCount?: number
  certStandardRate?: number
}

export interface CadreMaturityCertStatistics {
  maturityLevel: string
  baselineCount: number
  certifiedCount: number
  certRate: number
  subject2PassCount: number
  subject2PassRate: number
  certStandardCount?: number
  certStandardRate?: number
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
  qualifiedByRequirementCount?: number
  qualifiedByRequirementRate?: number
}

export interface CadreMaturityQualifiedStatistics {
  maturityLevel: string
  baselineCount: number
  qualifiedCount: number
  qualifiedRate: number
  qualifiedByRequirementCount?: number
  qualifiedByRequirementRate?: number
  jobCategoryStatistics?: CadreJobCategoryQualifiedStatistics[]
}

export interface CadreMaturityJobCategoryQualifiedStatisticsResponse {
  deptCode: string
  deptName: string
  maturityStatistics: CadreMaturityQualifiedStatistics[]
  totalStatistics: CadreMaturityQualifiedStatistics
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
  baselineCountByRequirement?: number
}

export interface ExpertMaturityQualifiedStatistics {
  maturityLevel: string
  baselineCount: number
  qualifiedCount: number
  qualifiedRate: number
  qualifiedByRequirementCount?: number
  qualifiedByRequirementRate?: number
  baselineCountByRequirement?: number
  jobCategoryStatistics?: ExpertJobCategoryQualifiedStatistics[]
}

export interface ExpertAiQualifiedStatisticsResponse {
  deptCode: string
  deptName: string
  maturityStatistics: ExpertMaturityQualifiedStatistics[]
  totalStatistics: ExpertMaturityQualifiedStatistics
}

export interface SelectOption<T extends string> {
  label: string
  value: T
}

// PL/TM或PM统计数据（接口返回）
export interface PlTmPmStatistics {
  totalCount: number // 总人数
  qualifiedCount: number // 通过任职标准的人数（is_qualifications_standard=1）
  qualifiedRatio: number // 任职占比（qualifiedCount/totalCount）
  certCount: number // 通过认证标准的人数（is_cert_standard=1）
  certRatio: number // 认证占比（certCount/totalCount）
}

// PL/TM部门统计数据（接口返回）
export interface PlTmDepartmentStatistics {
  deptCode: string // 部门编码
  deptName: string // 部门名称
  plTm: PlTmPmStatistics // PL/TM统计数据（PL和TM合并统计）
  pm: PlTmPmStatistics // PM（项目经理）统计数据（单独统计）
}

// PL/TM任职与认证统计响应（接口返回）
export interface PlTmCertStatisticsResponse {
  summary: PlTmDepartmentStatistics // 研发管理部汇总数据
  departmentList: PlTmDepartmentStatistics[] // 各四级部门统计数据列表
}

// 基层主管和PM AI任职认证数据
export interface EntryLevelManagerPmCertRow {
  department: string // 部门
  // TM/PL队伍数据
  tmPlTotalCount: number // TM/PL总人数
  tmPlAi3PlusCount: number // TM/PL具备AI 3+任职人数
  tmPlAi3PlusRate: number // TM/PL具备AI 3+任职占比
  tmPlProfessionalCertCount: number // TM/PL具备专业级认证人数
  tmPlProfessionalCertRate: number // TM/PL具备专业级认证占比
  // PM队伍数据
  pmTotalCount: number // PM总人数
  pmAi3PlusCount: number // PM具备AI 3+任职人数
  pmAi3PlusRate: number // PM具备AI 3+任职占比
  pmProfessionalCertCount: number // PM具备专业级认证人数
  pmProfessionalCertRate: number // PM具备专业级认证占比
}

export interface CadrePositionOverviewRow {
  department: string // 部门
  totalPositionCount: number // 干部岗位总数
  l2L3TotalCount: number // L2、L3干部岗位总数
  l2L3Rate: number // L2/L3干部岗位占比
  l2SoftwareCount: number // L2干部岗位数量-软件类
  l2NonSoftwareCount: number // L2干部岗位数量-非软件类
  l3SoftwareCount: number // L3干部岗位数量-软件类
  l3NonSoftwareCount: number // L3干部岗位数量-非软件类
  // 辅助字段
  isLevel3?: boolean
  isLevel4?: boolean
  deptCode?: string
}

export interface CadreAiAppointmentCertRow {
  department: string // 部门
  totalCadreCount: number // 干部总人数
  l2L3Count: number // L2/L3人数
  softwareL2Count: number // 软件L2人数
  softwareL3Count: number // 软件L3人数
  nonSoftwareL2L3Count: number // 非软件L2/L3人数
  qualifiedL2L3Count: number // 满足岗位AI要求L2/L3干部人数
  qualifiedL2L3Ratio: number // 满足岗位AI要求L2/L3干部占比
  // 辅助字段
  isLevel3?: boolean
  isLevel4?: boolean
  deptCode?: string
}

export type SchoolRole = RoleValue

export interface SchoolPersonalOverview {
  targetCredits: number
  currentCredits: number
  completionRate: number
  benchmarkRate: number
  scheduleTarget: number
  expectedCompletionDate: string
  status: '正常' | '轻度预警' | '滞后预警'
  statusType: 'success' | 'warning' | 'danger'
}

export interface SchoolRoleSummaryRow {
  maturityLevel: string
  baseline: number
  maxCredits: number
  minCredits: number
  averageCredits: number
  targetCredits: number
  completionRate: number
  scheduleTarget: number
  status: '正常' | '轻度预警' | '滞后预警'
  statusType: 'success' | 'warning' | 'danger'
}

export interface SchoolAllStaffSummaryRow {
  dimension: string
  baseline: number
  maxCredits: number
  minCredits: number
  averageCredits: number
  targetCredits: number
  completionRate: number
  scheduleTarget: number
  status: '正常' | '轻度预警' | '滞后预警'
  statusType: 'success' | 'warning' | 'danger'
}

export interface SchoolAllStaffSummaryGroup {
  title: string
  dimensionLabel: string
  rows: SchoolAllStaffSummaryRow[]
}

export interface SchoolAllStaffSummary {
  role: SchoolRole
  groups: SchoolAllStaffSummaryGroup[]
}

export interface SchoolDashboardData {
  personalOverview: SchoolPersonalOverview
  expertSummary: SchoolRoleSummaryRow[]
  cadreSummary: SchoolRoleSummaryRow[]
  allStaffSummary: SchoolAllStaffSummary
  filters: {
    departmentTree: DepartmentNode[]
    roles: SelectOption<SchoolRole>[]
  }
}

export interface SchoolDashboardFilters {
  departmentPath?: string[]
  role?: SchoolRole
}

export interface SchoolCreditRecord {
  id: string
  name: string
  employeeId: string
  jobFamily: string
  jobCategory: string
  jobSubCategory: string
  departmentPath: string[]
  departmentLevel1: string
  departmentLevel2: string
  departmentLevel3: string
  departmentLevel4: string
  departmentLevel5: string
  departmentLevel6?: string
  minDepartment: string
  isCadre: boolean
  cadreType?: string
  isExpert: boolean
  isFrontlineManager: boolean
  organizationMaturity: 'L1' | 'L2' | 'L3'
  positionMaturity: 'L1' | 'L2' | 'L3'
  currentCredits: number
  completionRate: number
  benchmarkRate: number
  completionDate: string
  scheduleTarget: number
  status: '正常' | '轻度预警' | '滞后预警'
  statusType: 'success' | 'warning' | 'danger'
}

export interface SchoolRuleRecord {
  id: string
  sourceType: string
  content: string
  credits: number
}

export interface SchoolDetailData {
  records: SchoolCreditRecord[]
  rules: SchoolRuleRecord[]
  filters: {
    departmentTree: DepartmentNode[]
    jobFamilies: string[]
    jobCategories: string[]
    jobSubCategories: string[]
    roles: SelectOption<SchoolRole>[]
    maturityOptions: SelectOption<'全部' | 'L1' | 'L2' | 'L3'>[]
  }
}

export interface SchoolDetailFilters {
  departmentPath?: string[]
  deptCode?: string
  deptLevel?: number
  jobFamily?: string
  jobCategory?: string
  jobSubCategory?: string
  role?: SchoolRole
  positionMaturity?: '全部' | 'L1' | 'L2' | 'L3'
}

export interface CertificationDashboardFilters {
  departmentPath?: string[]
  role?: CertificationRole
}

export interface CertificationDashboardData {
  metrics: MetricItem[]
  expertCertification: ExpertCertificationSummaryRow[]
  expertAppointment: ExpertAppointmentSummaryRow[]
  cadreCertification: CadreCertificationSummaryRow[]
  cadreAppointment: CadreAppointmentSummaryRow[]
  allStaff: {
    departmentAppointment: StaffChartPoint[]
    organizationAppointment: StaffChartPoint[]
    jobCategoryAppointment: StaffChartPoint[]
    departmentCertification: StaffChartPoint[]
    organizationCertification: StaffChartPoint[]
    jobCategoryCertification: StaffChartPoint[]
  }
  employeeCertStatistics?: EmployeeCertStatisticsResponse | null
  competenceCategoryCertStatistics?: CompetenceCategoryCertStatisticsResponse | null
  filters: {
    departmentTree: DepartmentNode[]
    roles: SelectOption<CertificationRole>[]
  }
}

export interface CertificationDetailFilters {
  departmentPath?: string[]
  jobFamily?: string
  jobCategory?: string
  jobSubCategory?: string
  role?: CertificationRole
  maturity?: '全部' | 'L1' | 'L2' | 'L3'
  name?: string
  employeeId?: string
}

export interface CertificationDetailData {
  summary: CertificationItem | null
  certificationRecords: CertificationAuditRecord[]
  appointmentRecords: AppointmentAuditRecord[]
  filters: {
    departmentTree: DepartmentNode[]
    jobFamilies: string[]
    jobCategories: string[]
    jobSubCategories: string[]
    roles: SelectOption<CertificationRole>[]
    maturityOptions: SelectOption<'全部' | 'L1' | 'L2' | 'L3'>[]
  }
}

/**
 * 后端统一响应结果
 */
export interface Result<T> {
  code: number
  message: string
  data: T
}

/**
 * 部门信息VO（对应后端 DepartmentInfoVO）
 */
export interface DepartmentInfoVO {
  deptCode: string
  deptName: string
  deptLevel: string
  parentDeptCode?: string
  children?: DepartmentInfoVO[]
}

/**
 * 员工详细信息VO（对应后端 EmployeeDetailVO）
 */
export interface EmployeeDetailVO {
  name?: string
  employeeNumber?: string
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
  isQualificationsStandard?: number
  isCertStandard?: number
}

/**
 * 员工下钻查询响应VO（对应后端 EmployeeDrillDownResponseVO）
 */
export interface EmployeeDrillDownResponseVO {
  employeeDetails?: EmployeeDetailVO[]
}

export interface DepartmentSelection {
  deptCode: string
  deptName: string
}

/**
 * 课程规划明细信息（对应后端 CoursePlanningInfoVO）
 */
export interface CoursePlanningInfo {
  id?: number
  bigType?: string // 大类（课程主分类）
  sybType?: string // 子类（训战分类）
  courseName?: string // 课程名称
  courseLink?: string // 课程链接（课程编码）
  credit?: string // 学分
  courseStatus?: string // 课程状态
  knowledgePoint?: string // 知识点
  courseExplain?: string // 课程说明
  studyDuration?: string // 学习时长
  courseLevel?: string // 课程级别
  inClassTest?: string // 随堂测试
  courseNumber?: string // 课程编码
  selectedDepts?: DepartmentSelection[] // 已选该课程的部门列表
}

// AI干部岗位概述表相关接口
export interface L2L3StatisticsVO {
  totalCount: number
  softwareCount: number
  nonSoftwareCount: number
}

export interface DepartmentPositionStatisticsVO {
  deptCode: string
  deptName: string
  deptLevel: string
  totalPositionCount: number
  l2L3PositionCount: number
  l2L3PositionRatio: number
  l2Statistics: L2L3StatisticsVO
  l3Statistics: L2L3StatisticsVO
  children?: DepartmentPositionStatisticsVO[]
}

export interface SummaryStatisticsVO {
  totalPositionCount: number
  l2L3PositionCount: number
  l2L3PositionRatio: number
  l2Statistics: L2L3StatisticsVO
  l3Statistics: L2L3StatisticsVO
}

export interface CadrePositionOverviewResponseVO {
  summary: SummaryStatisticsVO
  departmentList: DepartmentPositionStatisticsVO[]
}

// 干部AI任职认证表相关接口
export interface CadreAiOverviewStatisticsVO {
  deptCode: string
  deptName: string
  deptLevel?: string
  totalCadreCount: number
  l2L3Count: number
  softwareL2Count: number
  softwareL3Count: number
  nonSoftwareL2L3Count: number
  qualifiedL2L3Count: number
  qualifiedL2L3Ratio: number
  children?: CadreAiOverviewStatisticsVO[]
}

export interface CadreAiCertificationOverviewResponseVO {
  summary: CadreAiOverviewStatisticsVO
  departmentList: CadreAiOverviewStatisticsVO[]
}

/**
 * 课程信息（对应后端 CourseInfoVO）
 */
export interface CourseInfo {
  courseName: string // 课程名称
  courseNumber: string // 课程编码
  isCompleted: boolean // 是否已完成
  isTargetCourse?: boolean // 是否目标课程
  bigType?: string // 课程主分类
  courseLink?: string // 课程链接
}

/**
 * 课程分类统计数据（对应后端 CourseCategoryStatisticsVO）
 */
export interface CourseCategoryStatistics {
  courseLevel: string // 训战分类（初阶、中阶、高阶、实战）
  totalCourses: number // 课程总数
  targetCourses: number // 目标课程数
  completedCourses: number // 实际完课数
  completionRate: number // 完课占比（百分比）
  courseList?: CourseInfo[] // 该分类下的所有目标课程列表（包含已完成和未完成的课程）
}

/**
 * 个人课程完成情况响应（对应后端 PersonalCourseCompletionResponseVO）
 */
export interface PersonalCourseCompletionResponse {
  empNum: string // 员工工号
  empName: string // 员工姓名
  courseStatistics: CourseCategoryStatistics[] // 各训战分类的课程统计列表
}

// 个人学分
export interface PersonalCredit {
  id: string
  employeeNumber: string
  lastName: string
  lowestDeptNumber: string
  lowestDept: string
  targetCredit: number
  currentCredit: number
  personalCreditCompletionRate: number
  deptBenchmarkCompletionRate: number
  creditCompletionDate?: string
  createTime?: string
  updateTime?: string
}

export interface CreditOverviewVO {
  categoryName: string
  baselineHeadcount: number
  maxScore: number
  minScore: number
  averageCurrentCredit: number
  averageTargetCredit: number
  achievementRate: number
  timeProgress: number
  isWarning: boolean
}

export interface CreditStatisticsResponseVO {
  deptCode: string
  deptName: string
  statistics: CreditOverviewVO[]
  totalStatistics: CreditOverviewVO
}

/**
 * AI School学分数据明细查询响应VO
 */
export interface SchoolCreditDetailResponseVO {
  records: SchoolCreditRecord[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

/**
 * AI School学分数据明细查询请求参数
 */
export interface SchoolCreditDetailRequest {
  deptCode: string
  deptLevel?: number
  roleType?: number
  jobFamily?: string
  jobCategory?: string
  jobSubCategory?: string
  organizationMaturity?: string
  positionMaturity?: string
  queryType?: string
  pageNum?: number
  pageSize?: number
}

export interface SchoolRoleSummaryVO {
  maturityLevel: string
  baseline: number
  maxCredits: number
  minCredits: number
  averageCredits: number
  targetCredits: number
  completionRate: number
  scheduleTarget: number
  status: string
  statusType: 'success' | 'warning' | 'danger' | 'info'
}

export interface SchoolRoleSummaryResponseVO {
  expertSummary: SchoolRoleSummaryVO[]
  cadreSummary: SchoolRoleSummaryVO[]
}