import type { EmployeeDetailVO, EmployeeDrillDownResponseVO } from '../types'

// 模拟数据存储
const mockEmployeeDetails: EmployeeDetailVO[] = [
  // 管理类 - L2
  {
    name: '张三',
    employeeNumber: 'E001234',
    competenceCategory: '管理类',
    competenceSubcategory: '管理',
    firstLevelDept: '云核心网运营部',
    secondLevelDept: '亚太运营支撑处',
    thirdLevelDept: '技术支撑组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L2',
    miniDeptName: '技术支撑组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '机器学习子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '高级',
    competenceGradeCn: 'P5',
    competenceFrom: '2023-01-01T00:00:00Z',
    competenceTo: null,
  },
  // 管理类 - L3
  {
    name: '李四',
    employeeNumber: 'E001235',
    competenceCategory: '管理类',
    competenceSubcategory: '管理',
    firstLevelDept: '云核心网运营部',
    secondLevelDept: '亚太运营支撑处',
    thirdLevelDept: '技术支撑组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L3',
    miniDeptName: '技术支撑组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '深度学习子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '专家',
    competenceGradeCn: 'P6',
    competenceFrom: '2022-06-15T00:00:00Z',
    competenceTo: null,
  },
  // 软件类 - L2
  {
    name: '王五',
    employeeNumber: 'E001236',
    competenceCategory: '软件类',
    competenceSubcategory: '软件开发',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: '网络云平台研发室',
    thirdLevelDept: 'AI平台组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L2',
    miniDeptName: 'AI平台组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '自然语言处理子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '中级',
    competenceGradeCn: 'P4',
    competenceFrom: '2023-03-20T00:00:00Z',
    competenceTo: null,
  },
  // 软件类 - L3
  {
    name: '赵六',
    employeeNumber: 'E001237',
    competenceCategory: '软件类',
    competenceSubcategory: '软件开发',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: 'AI 网络创新室',
    thirdLevelDept: '视觉算法组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L3',
    miniDeptName: '视觉算法组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '计算机视觉子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '高级',
    competenceGradeCn: 'P5',
    competenceFrom: '2022-11-10T00:00:00Z',
    competenceTo: null,
  },
  // 系统类 - L4
  {
    name: '孙七',
    employeeNumber: 'E001238',
    competenceCategory: '系统类',
    competenceSubcategory: '系统架构',
    firstLevelDept: '云核心网解决方案部',
    secondLevelDept: '5G 解决方案办',
    thirdLevelDept: '智能优化组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L4',
    miniDeptName: '智能优化组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '强化学习子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '专家',
    competenceGradeCn: 'P6',
    competenceFrom: '2021-09-01T00:00:00Z',
    competenceTo: null,
  },
  // 研究类 - L2
  {
    name: '周八',
    employeeNumber: 'E001239',
    competenceCategory: '研究类',
    competenceSubcategory: '算法研究',
    firstLevelDept: '云核心网解决方案部',
    secondLevelDept: '云化核心网方案办',
    thirdLevelDept: '知识工程组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L2',
    miniDeptName: '知识工程组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '知识图谱子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '中级',
    competenceGradeCn: 'P4',
    competenceFrom: '2023-05-15T00:00:00Z',
    competenceTo: null,
  },
  // 研究类 - L3
  {
    name: '吴九',
    employeeNumber: 'E001240',
    competenceCategory: '研究类',
    competenceSubcategory: '算法研究',
    firstLevelDept: '云核心网运营部',
    secondLevelDept: '欧洲中东非运营支撑处',
    thirdLevelDept: '智能推荐组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L3',
    miniDeptName: '智能推荐组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '推荐系统子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '高级',
    competenceGradeCn: 'P5',
    competenceFrom: '2022-08-20T00:00:00Z',
    competenceTo: null,
  },
  // 系统类 - L3
  {
    name: '郑十',
    employeeNumber: 'E001241',
    competenceCategory: '系统类',
    competenceSubcategory: '系统架构',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: '网络云平台研发室',
    thirdLevelDept: '语音技术组',
    fourthLevelDept: null,
    fifthLevelDept: null,
    sixthLevelDept: null,
    aiMaturity: 'L4',
    miniDeptName: '语音技术组',
    cadreType: '技术干部',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '语音识别子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '专家',
    competenceGradeCn: 'P6',
    competenceFrom: '2021-12-01T00:00:00Z',
    competenceTo: null,
  },
]

/**
 * 根据条件获取干部任职详情数据
 * @param deptCode 部门编码
 * @param aiMaturity 岗位AI成熟度（可选）
 * @param jobCategory 职位类（可选）
 * @param personType 人员类型（1-干部）
 * @param queryType 查询类型（1-任职人数，2-基线人数），默认为1
 */
export const getCadreQualifiedDetails = (
  deptCode: string,
  aiMaturity?: string,
  jobCategory?: string,
  personType: number = 1,
  queryType: number = 1,
): EmployeeDrillDownResponseVO => {
  // 根据部门编码过滤数据
  let filtered = mockEmployeeDetails.filter((emp) => {
    // 根据部门编码匹配（这里简化处理，实际应该根据部门层级匹配）
    if (deptCode === '0') {
      return true // 查询所有部门
    }
    // 可以根据部门编码进行更精确的匹配
    return (
      emp.firstLevelDept?.includes(deptCode) ||
      emp.secondLevelDept?.includes(deptCode) ||
      emp.thirdLevelDept?.includes(deptCode)
    )
  })

  // 根据 AI 成熟度过滤
  if (aiMaturity && aiMaturity.trim().length > 0) {
    filtered = filtered.filter((emp) => emp.aiMaturity === aiMaturity)
  }

  // 根据职位类过滤（jobCategory 对应 competenceCategory 字段）
  if (jobCategory && jobCategory.trim().length > 0) {
    filtered = filtered.filter((emp) => emp.competenceCategory === jobCategory)
  }

  // 人员类型过滤（只返回干部数据）
  if (personType === 1) {
    filtered = filtered.filter((emp) => emp.isCadre === 1 || emp.cadreType)
  }

  // queryType=1（任职人数）时，需要过滤有任职记录的员工
  // queryType=2（基线人数）时，返回所有干部，不过滤任职条件
  // 注意：mock 数据中可能没有任职相关字段，这里仅做参数接收，实际过滤逻辑由后端实现
  if (queryType === 1) {
    // 任职人数：可以在这里添加任职相关的过滤逻辑（如果有任职字段）
    // 由于 mock 数据可能没有任职字段，这里暂时不做额外过滤
  }

  return {
    employeeDetails: filtered,
  }
}

