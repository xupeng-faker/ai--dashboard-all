import type { DepartmentInfo } from '../types'

type DepartmentStore = Record<string, DepartmentInfo[]>

const departmentStore: DepartmentStore = {
  '0': [
    {
      deptCode: 'dept-ict-core-ops',
      deptName: '云核心网运营部云核心网运营部云核心网运营',
      deptLevel: '3',
      parentDeptCode: 'CLOUD_CORE_NETWORK',
    },
    {
      deptCode: 'dept-ict-core-dev',
      deptName: '云核心网研发部',
      deptLevel: '3',
      parentDeptCode: 'CLOUD_CORE_NETWORK',
    },
    {
      deptCode: 'dept-ict-core-solution',
      deptName: '云核心网解决方案部',
      deptLevel: '3',
      parentDeptCode: 'CLOUD_CORE_NETWORK',
    },
  ],
  'dept-ict-core-ops': [
    {
      deptCode: 'dept-ict-core-ops-asia',
      deptName: '亚太运营支撑处',
      deptLevel: '4',
      parentDeptCode: 'dept-ict-core-ops',
    },
    {
      deptCode: 'dept-ict-core-ops-emea',
      deptName: '欧洲中东非运营支撑处',
      deptLevel: '4',
      parentDeptCode: 'dept-ict-core-ops',
    },
  ],
  'dept-ict-core-dev': [
    {
      deptCode: 'dept-ict-core-dev-platform',
      deptName: '网络云平台研发室',
      deptLevel: '4',
      parentDeptCode: 'dept-ict-core-dev',
    },
    {
      deptCode: 'dept-ict-core-dev-ai',
      deptName: 'AI 网络创新室',
      deptLevel: '4',
      parentDeptCode: 'dept-ict-core-dev',
    },
  ],
  'dept-ict-core-solution': [
    {
      deptCode: 'dept-ict-core-solution-5g',
      deptName: '5G 解决方案办',
      deptLevel: '4',
      parentDeptCode: 'dept-ict-core-solution',
    },
    {
      deptCode: 'dept-ict-core-solution-cloud',
      deptName: '云化核心网方案办',
      deptLevel: '4',
      parentDeptCode: 'dept-ict-core-solution',
    },
  ],
}

export const getDepartmentsByParent = (deptId: string): DepartmentInfo[] => {
  return departmentStore[deptId] ?? []
}
