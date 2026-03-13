import { ref, computed } from 'vue'
import type { DepartmentInfoVO, DepartmentNode } from '../types/dashboard'
import { fetchDepartmentChildren } from '../api/dashboard'

/**
 * 部门筛选 Composable
 * 支持多级懒加载查询部门数据
 */
export function useDepartmentFilter() {
  const loading = ref(false)
  const departmentTree = ref<DepartmentNode[]>([
    {
      label: 'ICT BG',
      value: 'ICT_BG',
      disabled: true,
      children: [
        {
          label: '云核心网产品线',
          value: '0',
        },
      ],
    },
  ])
  const selectedDepartmentPath = ref<string[]>([])

  const buildDefaultDepartmentTree = (): DepartmentNode[] => [
    {
      label: 'ICT BG',
      value: 'ICT_BG',
      disabled: true,
      children: [
        {
          label: '云核心网产品线',
          value: '0',
        },
      ],
    },
  ]

  const clearDepartmentState = () => {
    departmentTree.value = buildDefaultDepartmentTree()
    selectedDepartmentPath.value = []
  }

  /**
   * 将 DepartmentInfoVO 转换为 DepartmentNode
   */
  const convertToDepartmentNode = (dept: DepartmentInfoVO): DepartmentNode => {
    return {
      label: dept.deptName,
      value: dept.deptCode,
      children: dept.children?.map(convertToDepartmentNode),
    }
  }

  /**
   * 加载一级部门（默认值）
   */
  const loadRootDepartments = async () => {
    try {
      loading.value = true
      const departments = await fetchDepartmentChildren('0')
      departmentTree.value = departments.map(convertToDepartmentNode)
    } catch (error) {
      console.error('加载一级部门失败:', error)
      departmentTree.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据部门编码加载子部门
   * @param deptCode 部门编码
   * @param parentNode 父节点（用于更新树结构）
   */
  const loadChildDepartments = async (deptCode: string, parentNode?: DepartmentNode) => {
    try {
      const departments = await fetchDepartmentChildren(deptCode)
      const childNodes = departments.map(convertToDepartmentNode)

      if (parentNode) {
        parentNode.children = childNodes
      } else {
        // 如果找不到父节点，尝试在树中查找
        const findAndUpdateNode = (nodes: DepartmentNode[]): boolean => {
          for (const node of nodes) {
            if (node.value === deptCode) {
              node.children = childNodes
              return true
            }
            if (node.children && findAndUpdateNode(node.children)) {
              return true
            }
          }
          return false
        }
        findAndUpdateNode(departmentTree.value)
      }

      return childNodes
    } catch (error) {
      console.error(`加载部门 ${deptCode} 的子部门失败:`, error)
      return []
    }
  }

  /**
   * 懒加载部门数据（用于 Element Plus Cascader）
   * @param node 当前节点
   * @param resolve 回调函数，用于返回子节点数据
   */
  const lazyLoadDepartments = async (node: any, resolve: (nodes: DepartmentNode[]) => void) => {
    // 检查节点是否已经有数据，避免重复加载
    const data = node.data || node
    if (Array.isArray(data.children) && data.children.length > 0) {
      resolve(data.children)
      return
    }

    // 检查是否是叶子节点（isLeaf），如果是叶子节点，不需要加载子部门
    if (data.leaf === true) {
      resolve([])
      return
    }

    if (node.value === '0') {
      try {
        const departments = await fetchDepartmentChildren('0')
        const childNodes = departments.map(convertToDepartmentNode)
        if (node.data) {
          node.data.children = childNodes
        } else {
          node.children = childNodes
        }
        resolve(childNodes)
        return
      } catch (error) {
        console.error('加载三级部门失败:', error)
        resolve([])
        return
      }
    }

    // 其他层级的部门正常懒加载
    const childNodes = await loadChildDepartments(node.value, node.data || node)
    
    // 如果没有子部门，将其标记为叶子节点
    if (childNodes.length === 0) {
      if (node.data) {
        node.data.leaf = true
      }
      node.leaf = true
    }
    
    resolve(childNodes)
  }

  /**
   * 初始化部门树（一级和二级部门写死为固定值，不可选择）
   * 三级部门通过 deptId=0 查询
   */
  const initDepartmentTree = async () => {
    try {
      loading.value = true
      
      departmentTree.value = buildDefaultDepartmentTree()
      
      // 三级部门默认通过 deptId=0 查询
      try {
        const level3Departments = await fetchDepartmentChildren('0')
        if (departmentTree.value[0]?.children?.[0]) {
          departmentTree.value[0].children[0].children = level3Departments.map(convertToDepartmentNode)
        }
      } catch (error) {
        console.warn('预加载三级部门失败，将使用懒加载:', error)
        // 如果预加载失败，不影响使用，后续通过懒加载获取
      }
    } catch (error) {
      console.error('初始化部门树失败:', error)
      departmentTree.value = buildDefaultDepartmentTree()
    } finally {
      loading.value = false
    }
  }

  const refreshDepartmentTree = async () => {
    clearDepartmentState()
    await initDepartmentTree()
  }

  /**
   * 根据部门路径查询三级部门数据
   * @param deptPath 部门路径数组，例如 ['deptCode1', 'deptCode2']
   * @returns 三级部门列表
   */
  const getLevel3Departments = async (deptPath: string[]): Promise<DepartmentNode[]> => {
    if (deptPath.length < 2) {
      return []
    }

    try {
      const level2DeptCode = deptPath[1]
      const departments = await fetchDepartmentChildren(level2DeptCode)
      return departments.map(convertToDepartmentNode)
    } catch (error) {
      console.error('查询三级部门失败:', error)
      return []
    }
  }

  /**
   * 重置筛选条件
   */
  const resetFilter = () => {
    selectedDepartmentPath.value = []
  }

  /**
   * Cascader 组件的 props 配置
   */
  const cascaderProps = computed(() => ({
    value: 'value',
    label: 'label',
    children: 'children',
    disabled: 'disabled', // 支持禁用节点
    multiple: false,
    checkStrictly: true,
    emitPath: true,
    lazy: true,
    lazyLoad: lazyLoadDepartments,
  }))

  return {
    loading,
    departmentTree,
    selectedDepartmentPath,
    loadRootDepartments,
    loadChildDepartments,
    lazyLoadDepartments,
    initDepartmentTree,
    getLevel3Departments,
    resetFilter,
    clearDepartmentState,
    refreshDepartmentTree,
    cascaderProps,
  }
}
