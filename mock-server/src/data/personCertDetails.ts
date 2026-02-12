import type { EmployeeDetailVO, EmployeeDrillDownResponseVO } from '../types'

// 模拟数据存储
const mockEmployeeDetails: EmployeeDetailVO[] = [
  // 干部 - 管理类 - L2
  {
    name: '张三',
    employeeNumber: 'E001234',
    competenceCategory: '管理类',
    competenceSubcategory: '管理',
    firstLevelDept: '云核心网运营部',
    secondLevelDept: '亚太运营支撑处',
    thirdLevelDept: '技术支撑组',
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
    isCadre: 1,
  },
  // 专家 - 软件类 - L2
  {
    name: '王五',
    employeeNumber: 'E001236',
    competenceCategory: '软件类',
    competenceSubcategory: '软件开发',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: '网络云平台研发室',
    thirdLevelDept: 'AI平台组',
    aiMaturity: 'L2',
    miniDeptName: 'AI平台组',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '自然语言处理子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '中级',
    competenceGradeCn: 'P4',
    competenceFrom: '2023-03-20T00:00:00Z',
    isCadre: 0,
    isQualificationsStandard: 1,
  },
  // 专家 - 软件类 - L3
  {
    name: '赵六',
    employeeNumber: 'E001237',
    competenceCategory: '软件类',
    competenceSubcategory: '软件开发',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: 'AI 网络创新室',
    thirdLevelDept: '视觉算法组',
    aiMaturity: 'L3',
    miniDeptName: '视觉算法组',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '计算机视觉子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '高级',
    competenceGradeCn: 'P5',
    competenceFrom: '2022-11-10T00:00:00Z',
    isCadre: 0,
    isQualificationsStandard: 1,
  },
    // 专家 - 软件类 - L4
  {
    name: '李四',
    employeeNumber: 'E001238',
    competenceCategory: '软件类',
    competenceSubcategory: '软件开发',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: '网络云平台研发室',
    thirdLevelDept: '智能运维组',
    aiMaturity: 'L4',
    miniDeptName: '智能运维组',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '智能运维子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '高级',
    competenceGradeCn: 'P6',
    competenceFrom: '2022-10-10T00:00:00Z',
    isCadre: 0,
    isQualificationsStandard: 1,
  },
  // 干部 - 研究类 - L2
  {
    name: '周八',
    employeeNumber: 'E001239',
    competenceCategory: '研究类',
    competenceSubcategory: '算法研究',
    firstLevelDept: '云核心网解决方案部',
    secondLevelDept: '云化核心网方案办',
    thirdLevelDept: '知识工程组',
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
    isCadre: 1,
  },
  // 干部 - 管理类 - L3
  {
    name: '孙七',
    employeeNumber: 'E001240',
    competenceCategory: '管理类',
    competenceSubcategory: '项目管理',
    firstLevelDept: '云核心网运营部',
    secondLevelDept: '亚太运营支撑处',
    thirdLevelDept: '交付管理组',
    aiMaturity: 'L3',
    miniDeptName: '交付管理组',
    cadreType: '项目干部',
    competenceFamilyCn: '项目管理族',
    competenceCategoryCn: '项目管理类',
    competenceSubcategoryCn: '交付子类',
    directionCnName: '交付方向',
    competenceRatingCn: '专家',
    competenceGradeCn: 'P7',
    competenceFrom: '2022-06-15T00:00:00Z',
    isCadre: 1,
    isQualificationsStandard: 1,
  },
  // 专家 - 硬件类 - L2
  {
    name: '周九',
    employeeNumber: 'E001241',
    competenceCategory: '硬件类',
    competenceSubcategory: '硬件开发',
    firstLevelDept: '云核心网硬件部',
    secondLevelDept: '硬件平台室',
    thirdLevelDept: 'FPGA组',
    aiMaturity: 'L2',
    miniDeptName: 'FPGA组',
    competenceFamilyCn: '硬件族',
    competenceCategoryCn: '硬件类',
    competenceSubcategoryCn: '逻辑开发子类',
    directionCnName: '硬件方向',
    competenceRatingCn: '中级',
    competenceGradeCn: 'P4',
    competenceFrom: '2023-04-01T00:00:00Z',
    isCadre: 0,
    isQualificationsStandard: 0,
  },
  // 专家 - 软件类 - L3
  {
    name: '郑十',
    employeeNumber: 'E001242',
    competenceCategory: '软件类',
    competenceSubcategory: '软件开发',
    firstLevelDept: '云核心网研发部',
    secondLevelDept: '云平台研发室',
    thirdLevelDept: '容器引擎组',
    aiMaturity: 'L3',
    miniDeptName: '容器引擎组',
    competenceFamilyCn: '软件族',
    competenceCategoryCn: '软件类',
    competenceSubcategoryCn: '云计算子类',
    directionCnName: '云原生方向',
    competenceRatingCn: '高级',
    competenceGradeCn: 'P5',
    competenceFrom: '2022-08-20T00:00:00Z',
    isCadre: 0,
    isQualificationsStandard: 1,
  },
   // 专家 - 研究类 - L4
  {
    name: '钱十一',
    employeeNumber: 'E001243',
    competenceCategory: '研究类',
    competenceSubcategory: '算法研究',
    firstLevelDept: '2012实验室',
    secondLevelDept: '中央研究院',
    thirdLevelDept: '诺亚方舟实验室',
    aiMaturity: 'L4',
    miniDeptName: '诺亚方舟实验室',
    competenceFamilyCn: 'AI能力族',
    competenceCategoryCn: 'AI能力类',
    competenceSubcategoryCn: '深度学习子类',
    directionCnName: 'AI方向',
    competenceRatingCn: '资深专家',
    competenceGradeCn: 'P8',
    competenceFrom: '2021-01-10T00:00:00Z',
    isCadre: 0,
    isQualificationsStandard: 1,
  },
]

/**
 * 根据条件获取人员认证详情数据
 * @param deptCode 部门编码
 * @param aiMaturity 岗位AI成熟度（可选）
 * @param jobCategory 职位类（可选）
 * @param personType 人员类型（1-干部，2-专家）
 * @param queryType 查询类型（1-任职人数，2-基线人数），默认为1
 */
export const getPersonCertDetails = (
  deptCode: string,
  aiMaturity?: string,
  jobCategory?: string,
  personType: number = 1,
  queryType: number = 1,
): EmployeeDrillDownResponseVO => {
  // 根据部门编码过滤数据
  let filtered = mockEmployeeDetails.filter((emp) => {
    if (deptCode === '0') {
      return true // 查询所有部门
    }
    // 简单模拟部门匹配
    return (
      (emp.firstLevelDept && emp.firstLevelDept.includes(deptCode)) ||
      (emp.secondLevelDept && emp.secondLevelDept.includes(deptCode)) ||
      (emp.thirdLevelDept && emp.thirdLevelDept.includes(deptCode))
    )
  })

  // 根据 AI 成熟度过滤
  if (aiMaturity && aiMaturity.trim().length > 0) {
    if (aiMaturity === 'L5') {
       // L5 通常表示查询 L2 和 L3，或者汇总数据，这里简单处理为包含 L2 和 L3
       filtered = filtered.filter((emp) => emp.aiMaturity === 'L2' || emp.aiMaturity === 'L3')
    } else {
       filtered = filtered.filter((emp) => emp.aiMaturity === aiMaturity)
    }
  }

  // 根据职位类过滤
  if (jobCategory && jobCategory.trim().length > 0) {
    filtered = filtered.filter((emp) => emp.competenceCategory === jobCategory)
  }

  // 人员类型过滤
  if (personType === 1) {
    // 干部
    filtered = filtered.filter((emp) => emp.isCadre === 1)
  } else if (personType === 2) {
    // 专家 (这里假设非干部即专家，或者显式标记)
    // 实际上 mock 数据中并没有 explicit 的 isExpert 字段，我们可以假设 isCadre !== 1 的都是专家
    // 或者我们可以添加更明确的逻辑。为简单起见，假设非干部就是专家
    filtered = filtered.filter((emp) => emp.isCadre !== 1)
  }

  // queryType 处理
  // 1-任职人数（已认证/已任职），2-基线人数（总人数）
  if (queryType === 1) {
    // 过滤掉没有认证信息或不达标的
     filtered = filtered.filter((emp) => emp.competenceRatingCn || emp.isQualificationsStandard === 1)
  }

  return {
    employeeDetails: filtered,
  }
}
