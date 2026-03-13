<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, QuestionFilled, Download, ArrowDown, ArrowUp, Search, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { fetchCertificationDetailData, fetchCadreQualifiedDetails, fetchPersonCertDetails } from '@/api/dashboard'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'
import { normalizeRoleOptions } from '@/constants/roles'
import { exportCertificationDataToExcel } from '@/utils/excelExport'
import type {
  AppointmentAuditRecord,
  CertificationAuditRecord,
  CertificationDetailData,
  CertificationDetailFilters,
  CertificationRole,
  EmployeeDetailVO,
} from '@/types/dashboard'

const props = defineProps<{ id: string }>()
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const detailData = ref<CertificationDetailData | null>(null)
const activeTab = ref<'certification' | 'appointment'>('certification')
// 标记是否是用户主动点击查询按钮
const isUserQuery = ref(false)
// 表格引用
const appointmentTableRef = ref()
const ROLE_VALUES: CertificationRole[] = ['0', '1', '2', '3']
// 使用 computed 让 normalizedRole 能够响应路由参数的变化
const normalizedRole = computed<CertificationRole>(() => {
  const routeRole = route.query.role as string | undefined
  return ROLE_VALUES.includes(routeRole as CertificationRole)
    ? (routeRole as CertificationRole)
    : '0'
})
// 实际用于控制表格样式的角色（只在点击查询按钮后更新）
const actualRole = ref<CertificationRole>(normalizedRole.value)
// 从路由参数中解析部门路径
const parseDepartmentPathFromQuery = (): string[] => {
  const departmentPathStr = route.query.departmentPath as string | undefined
  if (departmentPathStr && typeof departmentPathStr === 'string' && departmentPathStr.trim()) {
    const pathArray = departmentPathStr.split(',').filter((dept) => dept.trim().length > 0)
    return pathArray
  }
  return []
}

// 从路由参数中解析成熟度，如果是L5则显示为"全部"
const parseMaturityFromQuery = (): '全部' | 'L1' | 'L2' | 'L3' => {
  const maturityFromQuery = route.query.maturity as string | undefined
  if (maturityFromQuery === 'L5') {
    return '全部' // L5代表总计，显示为"全部"
  }
  if (maturityFromQuery && ['全部', 'L1', 'L2', 'L3'].includes(maturityFromQuery)) {
    return maturityFromQuery as '全部' | 'L1' | 'L2' | 'L3'
  }
  return '全部'
}

// 初始化filters时，统一设置为'0'，避免显示数字
// 等数据加载完成后再根据路由参数设置正确的值
const filters = ref<CertificationDetailFilters>({
  role: '0', // 初始值统一设置为'0'，避免在roleOptions加载前显示数字
  maturity: parseMaturityFromQuery(),
  departmentPath: parseDepartmentPathFromQuery(),
  jobCategory: (route.query.jobCategory as string) || undefined,
  name: undefined,
  employeeId: undefined,
})

const {
  departmentTree: departmentOptions,
  cascaderProps,
  initDepartmentTree,
  refreshDepartmentTree,
} = useDepartmentFilter()
const roleOptions = computed(() => normalizeRoleOptions(detailData.value?.filters.roles ?? []))

// 待设置的部门路径（用于从部门/职位类柱状图跳转时）
const pendingDepartmentPath = ref<string[] | null>(null)

// 筛选框状态管理
const filterInputRef = ref()
const keywordInputRef = ref()
const filterWrapperRef = ref()
const showFieldDropdown = ref(false) // 是否显示字段选择下拉框（第一阶段）
const showKeywordDropdown = ref(false) // 是否显示关键字输入下拉框（第二阶段）
const selectedField = ref<'name' | 'employeeId' | null>(null) // 选中的字段类型
const keywordInput = ref('') // 关键字输入值
const filterInputValue = ref('') // 筛选值（用于显示标签）
const isFilterBoxUpdating = ref(false) // 标记筛选框是否正在更新，避免循环更新

// 将EmployeeDetailVO转换为AppointmentAuditRecord
const convertEmployeeDetailToAppointmentRecord = (employee: EmployeeDetailVO): AppointmentAuditRecord => {
  return {
    id: employee.employeeNumber || '',
    name: employee.name || '',
    employeeId: employee.employeeNumber || '',
    positionCategory: employee.competenceCategory || employee.competenceCategoryCn || '',
    positionSubCategory: employee.competenceSubcategoryCn || employee.competenceSubcategory || '',
    departmentLevel1: employee.firstLevelDept || '',
    departmentLevel2: employee.secondLevelDept || '',
    departmentLevel3: employee.thirdLevelDept || '',
    departmentLevel4: employee.fourthLevelDept || '',
    departmentLevel5: employee.fifthLevelDept || '',
    departmentLevel6: '', // 六级部门不展示
    minDepartment: employee.miniDeptName || '',
    professionalCategory: employee.competenceFamilyCn || '',
    expertCategory: employee.competenceCategoryCn || '',
    professionalSubCategory: employee.competenceSubcategoryCn || '',
    qualificationDirection: employee.directionCnName || '',
    qualificationLevel: employee.competenceRatingCn || '',
    acquisitionMethod: employee.competenceGradeCn || '', // 对应 t_qualifications.competence_grade_cn
    effectiveDate: employee.competenceFrom ? new Date(employee.competenceFrom).toLocaleDateString('zh-CN') : '',
    expiryDate: employee.competenceTo ? new Date(employee.competenceTo).toLocaleDateString('zh-CN') : '',
    isCadre: employee.isCadre === 1,
    cadreType: employee.cadreType || '',
    isExpert: employee.isExpert !== undefined ? employee.isExpert === 1 : undefined,
    isFrontlineManager: undefined, // 暂无数据
    organizationMaturity: undefined, // 暂无数据
    positionMaturity: (employee.aiMaturity as 'L1' | 'L2' | 'L3') || undefined,
    requiredCertificate: undefined, // 暂无数据
    isQualified: employee.isQualificationsStandard !== undefined ? employee.isQualificationsStandard === 1 : undefined,
  }
}

// 从部门路径获取部门代码
const getDeptCodeFromPath = (path?: string[]): string => {
  if (!path || path.length === 0) {
    return '0'
  }
  const last = path[path.length - 1]
  // 特殊处理：如果选中了 ICT_BG 或 云核心网产品线，视为一级部门，传0
  if (last === 'ICT_BG' || last === 'CLOUD_CORE_NETWORK') {
    return '0'
  }
  return last && last.trim().length ? last : '0'
}

const fetchDetail = async () => {
  loading.value = true
  try {
    // 检查是否是从部门柱状图或职位类柱状图点击跳转过来的（有deptCode、personType、queryType参数）
    const deptCodeFromRoute = route.query.deptCode as string | undefined
    const personTypeFromRoute = route.query.personType as string | undefined
    const queryTypeFromRoute = route.query.queryType as string | undefined
    const jobCategoryFromRoute = route.query.jobCategory as string | undefined
    
    // 如果是从部门柱状图或职位类柱状图点击跳转过来的，直接使用这些参数
    // 但是，如果用户主动点击查询按钮，应该使用当前的筛选条件，而不是路由参数
    if (deptCodeFromRoute && personTypeFromRoute && queryTypeFromRoute && !isUserQuery.value) {
      const deptCode = deptCodeFromRoute
      const personType = Number(personTypeFromRoute)
      const queryType = Number(queryTypeFromRoute)
      // 专家数据时，成熟度传参为L6（查询所有成熟度L1、L2、L3）
      const maturityParam: string | undefined = personType === 2 ? 'L6' : undefined // 专家传L6，其他传空
      const jobCategory: string | undefined = jobCategoryFromRoute || undefined // 从路由参数中读取职位类
      
      // 并行加载任职和认证数据
      const [qualifiedResponse, certResponse] = await Promise.all([
        fetchCadreQualifiedDetails(
          deptCode,
          maturityParam,
          jobCategory,
          personType,
          queryType
        ),
        fetchPersonCertDetails(
          deptCode,
          maturityParam,
          jobCategory,
          personType,
          queryType
        ),
      ])
      
      // 转换任职数据
      let appointmentRecords: AppointmentAuditRecord[] = []
      if (qualifiedResponse && qualifiedResponse.employeeDetails) {
        appointmentRecords = qualifiedResponse.employeeDetails.map(
          convertEmployeeDetailToAppointmentRecord
        )
      }
      
      // 转换认证数据
      let certificationRecords: CertificationAuditRecord[] = []
      if (certResponse && certResponse.employeeDetails) {
        certificationRecords = certResponse.employeeDetails.map(
          (emp) => ({
            id: emp.employeeNumber || '',
            name: emp.name || '',
            employeeId: emp.employeeNumber || '',
            positionCategory: emp.competenceCategory || emp.competenceCategoryCn || '',
            positionSubCategory: emp.competenceSubcategoryCn || emp.competenceSubcategory || '',
            departmentLevel1: emp.firstLevelDept || '',
            departmentLevel2: emp.secondLevelDept || '',
            departmentLevel3: emp.thirdLevelDept || '',
            departmentLevel4: emp.fourthLevelDept || '',
            departmentLevel5: emp.fifthLevelDept || '',
            departmentLevel6: emp.sixthLevelDept || '',
            minDepartment: emp.miniDeptName || '',
            certificateName: emp.certTitle || '',
            certificateEffectiveDate: (emp.certStartTime ? new Date(emp.certStartTime).toISOString().split('T')[0] : '') as string,
            subjectTwoPassed: emp.isPassedSubject2 === 1,
            isCadre: emp.isCadre === 1,
            cadreType: emp.cadreType || undefined,
            isExpert: emp.isExpert !== undefined ? emp.isExpert === 1 : undefined,
            isFrontlineManager: undefined,
            organizationMaturity: undefined,
            positionMaturity: emp.aiMaturity || '',
            requiredCertificate: '',
            isQualified: undefined,
            isCertStandard: emp.isCertStandard !== undefined ? emp.isCertStandard === 1 : undefined,
          })
        )
      }
      
      // 设置详情数据
      detailData.value = {
        appointmentRecords,
        certificationRecords,
        filters: {
          departmentTree: departmentOptions.value,
          jobFamilies: [],
          jobCategories: [],
          jobSubCategories: [],
          roles: [
            { label: '全员', value: '0' },
            { label: '干部', value: '1' },
            { label: '专家', value: '2' },
            { label: '基层主管', value: '3' },
          ],
          maturityOptions: [
            { label: '全部', value: '全部' },
            { label: 'L2', value: 'L2' },
            { label: 'L3', value: 'L3' },
          ],
        },
      }
      
      // 根据personType设置角色
      if (personType === 1) {
        // 干部
        activeTab.value = 'appointment'
      } else if (personType === 2) {
        // 专家
        activeTab.value = 'certification'
      }
      
      // 从路由参数中更新筛选框的值（部门和角色视图）
      // 更新部门路径（使用待设置机制，等待部门树加载完成）
      const departmentPathFromQuery = parseDepartmentPathFromQuery()
      if (departmentPathFromQuery.length > 0) {
        // 将路径存储到待设置变量中，等待部门树加载完成后由 watch 自动设置
        pendingDepartmentPath.value = departmentPathFromQuery
        // 确保部门树已初始化
        if (departmentOptions.value.length === 0) {
          initDepartmentTree()
        }
      }
      
      // 更新职位类
      if (jobCategoryFromRoute) {
        filters.value.jobCategory = jobCategoryFromRoute
      }
      
      // 更新角色视图（从路由参数中读取）
      // 由于已经设置了 filters.roles，roleOptions 应该立即有值
      const roleFromRoute = route.query.role as string | undefined
      if (roleFromRoute && ROLE_VALUES.includes(roleFromRoute as CertificationRole)) {
        const targetRole = roleFromRoute as CertificationRole
        // roleOptions 现在应该有值了（因为已经设置了 filters.roles）
        // 使用 nextTick 确保 computed 已经更新
        nextTick(() => {
          if (roleOptions.value.length > 0) {
            const roleExists = roleOptions.value.some((option) => option.value === targetRole)
            if (roleExists) {
              filters.value.role = targetRole
              actualRole.value = targetRole
            } else {
              // 如果角色不在选项中，设置默认值
              filters.value.role = '0'
              actualRole.value = '0'
            }
          } else {
            // 如果 roleOptions 还没有数据，设置默认值
            filters.value.role = '0'
            actualRole.value = targetRole
          }
        })
      } else {
        // 如果没有角色参数，使用默认值
        filters.value.role = '0'
        actualRole.value = '0'
      }
      
      loading.value = false
      return
    }
    
    // 确定使用的角色：如果用户点击查询按钮，使用filters.value.role；否则使用normalizedRole（从路由参数获取）
    const currentRole = isUserQuery.value ? filters.value.role : normalizedRole.value
    
    // 检查是否应该使用新的接口（干部、专家、全员）
    // 干部：currentRole === '1' 且满足查询条件
    // 专家：currentRole === '2'
    // 全员：currentRole === '0'
    const shouldUseNewApi = 
      currentRole === '0' || // 全员
      currentRole === '2' || // 专家
      (currentRole === '1' && 
       (isUserQuery.value || route.query.column) && 
       (isUserQuery.value || ['appointed', 'appointedByRequirement', 'baseline', 'aiCertificateHolders', 'certification'].includes(route.query.column as string))) // 干部

    if (shouldUseNewApi) {
      // 干部、专家、全员角色：同时加载任职和认证数据
      // 使用筛选条件中的值（部门、职位类、成熟度）
      // 确保使用最新的部门路径值（创建副本避免引用问题）
      const departmentPath = filters.value.departmentPath ? [...filters.value.departmentPath] : []
      const deptCode = getDeptCodeFromPath(departmentPath)
      const jobCategory = filters.value.jobCategory || undefined
      
      // 并行加载任职和认证数据（对于干部、专家、全员角色，无论点击哪个列，都同时加载两种数据）
      // personType: 0-全员，1-干部，2-专家
      const personType = currentRole === '0' ? 0 : (currentRole === '1' ? 1 : 2)
      
      // 处理成熟度参数：
      // 专家数据时，成熟度传参为L6（查询所有成熟度L1、L2、L3）
      // 1. 如果用户点击查询按钮（isUserQuery为true），使用筛选条件中的值
      // 2. 如果是首次加载（从看板跳转），优先检查路由参数中是否有L5
      let maturityParam: string | undefined = undefined
      
      // 专家数据时，直接传L6
      if (personType === 2) {
        maturityParam = 'L6'
      } else {
        const maturityFromRoute = route.query.maturity as string | undefined
        const aiMaturity = filters.value.maturity
        
        if (isUserQuery.value) {
          // 用户点击查询按钮，使用筛选条件中的值
          if (aiMaturity === '全部' || !aiMaturity) {
            maturityParam = 'L5' // 全部代表查询L2和L3的数据，传L5；如果未选择也默认传L5
          } else {
            const maturityStr = aiMaturity as string
            if (maturityStr === 'L5') {
              maturityParam = 'L5' // L5代表查询L2和L3的数据
            } else if (maturityStr === '总计' || maturityStr === 'Total' || maturityStr === 'total') {
              maturityParam = 'L5' // 总计行转换为L5
            } else {
              maturityParam = maturityStr
            }
          }
        } else {
          // 首次加载（从看板跳转），优先检查路由参数
          if (maturityFromRoute === 'L5') {
            maturityParam = 'L5' // L5代表查询L2和L3的数据
          } else if (aiMaturity === '全部' || !aiMaturity) {
            maturityParam = 'L5' // 全部代表查询L2和L3的数据，传L5；如果未选择也默认传L5
          } else {
            const maturityStr = aiMaturity as string
            if (maturityStr === 'L5') {
              maturityParam = 'L5' // L5代表查询L2和L3的数据
            } else if (maturityStr === '总计' || maturityStr === 'Total' || maturityStr === 'total') {
              maturityParam = 'L5' // 总计行转换为L5
            } else {
              maturityParam = maturityStr
            }
          }
        }
      }

      // 确定queryType：
      // 1. 如果是从看板跳转过来的（有route.query.column），根据column决定：baseline=2，其他=1
      // 2. 如果是在详情页面点击查询按钮（没有route.query.column），默认为2
      const column = route.query.column as string | undefined
      let queryType = 2 // 默认值：在详情页面点击查询按钮时使用
      if (column) {
        // 从看板跳转过来，根据点击的列决定queryType
        queryType = column === 'baseline' ? 2 : 1
      }
      const [qualifiedResponse, certResponse] = await Promise.all([
        // 加载任职数据，queryType默认为2
        fetchCadreQualifiedDetails(
          deptCode,
          maturityParam,
          jobCategory,
          personType,
          queryType
        ),
        // 加载认证数据，queryType默认为2
        fetchPersonCertDetails(
          deptCode,
          maturityParam,
          jobCategory,
          personType,
          queryType
        ),
      ])

      // 转换任职数据
      let appointmentRecords: AppointmentAuditRecord[] = []
      if (qualifiedResponse && qualifiedResponse.employeeDetails) {
        appointmentRecords = qualifiedResponse.employeeDetails.map(
          convertEmployeeDetailToAppointmentRecord
        )
      }

      // 转换认证数据
      let certificationRecords: CertificationAuditRecord[] = []
      if (certResponse && certResponse.employeeDetails) {
        certificationRecords = certResponse.employeeDetails.map(
          (emp) => ({
            id: emp.employeeNumber || '',
            name: emp.name || '',
            employeeId: emp.employeeNumber || '',
            positionCategory: emp.competenceCategory || emp.competenceCategoryCn || '',
            positionSubCategory: emp.competenceSubcategoryCn || emp.competenceSubcategory || '',
            departmentLevel1: emp.firstLevelDept || '',
            departmentLevel2: emp.secondLevelDept || '',
            departmentLevel3: emp.thirdLevelDept || '',
            departmentLevel4: emp.fourthLevelDept || '',
            departmentLevel5: emp.fifthLevelDept || '',
            departmentLevel6: emp.sixthLevelDept || '',
            minDepartment: emp.miniDeptName || '',
            certificateName: emp.certTitle || '',
            certificateEffectiveDate: (emp.certStartTime ? new Date(emp.certStartTime).toISOString().split('T')[0] : '') as string,
            subjectTwoPassed: emp.isPassedSubject2 === 1,
            isCadre: emp.isCadre === 1,
            cadreType: emp.cadreType || undefined,
            isExpert: emp.isExpert !== undefined ? emp.isExpert === 1 : undefined,
            isFrontlineManager: undefined, // 暂无数据
            organizationMaturity: undefined, // 暂无数据
            positionMaturity: emp.aiMaturity || '',
            requiredCertificate: '',
            isQualified: undefined, // 暂无数据
            isCertStandard: emp.isCertStandard !== undefined ? emp.isCertStandard === 1 : undefined,
          })
        )
      }

      // 构建detailData对象，同时包含任职和认证数据
      detailData.value = {
        summary: null,
        certificationRecords: certificationRecords,
        appointmentRecords: appointmentRecords,
        filters: {
          departmentTree: departmentOptions.value,
          jobFamilies: [],
          jobCategories: [],
          jobSubCategories: [],
          roles: [
            { label: '全员', value: '0' },
            { label: '干部', value: '1' },
            { label: '专家', value: '2' },
            { label: '基层主管', value: '3' },
          ],
          maturityOptions: [
            { label: '全部', value: '全部' },
            { label: 'L2', value: 'L2' },
            { label: 'L3', value: 'L3' },
          ],
        },
      }

      // 根据点击的列和来源决定默认显示的标签页
      // 优先判断具体的列，再判断baseline和source参数
      const source = route.query.source as string | undefined
      
      if (column === 'appointed' || column === 'appointedByRequirement') {
        // 明确是任职相关列，默认显示任职tab
        activeTab.value = 'appointment'
      } else if (column === 'aiCertificateHolders' || column === 'certification') {
        // 明确是认证相关列，默认显示认证tab
        activeTab.value = 'certification'
      } else if (column === 'baseline') {
        // baseline在两个表格中都存在，根据source参数判断
        if (source === 'appointment') {
          // 从干部任职数据表格点击的baseline，显示任职tab
          activeTab.value = 'appointment'
        } else if (source === 'certification') {
          // 从干部认证数据表格点击的baseline，显示认证tab
          activeTab.value = 'certification'
        } else {
          // 如果没有source参数，根据其他列判断
          const isCadreQualifiedOnlyQuery = 
            currentRole === '1' && 
            route.query.column && 
            ['appointed', 'appointedByRequirement'].includes(route.query.column as string)
          const isCadreCertOnlyQuery = 
            currentRole === '1' && 
            route.query.column && 
            ['aiCertificateHolders', 'certification'].includes(route.query.column as string)
          
          if (isCadreQualifiedOnlyQuery) {
            activeTab.value = 'appointment'
          } else if (isCadreCertOnlyQuery) {
            activeTab.value = 'certification'
          } else {
            // 默认显示认证tab
            activeTab.value = 'certification'
          }
        }
      } else {
        // 默认显示认证标签页（对于全员角色，默认显示认证tab）
        activeTab.value = 'certification'
      }
    } else {
      // 使用原有的接口（其他角色或默认情况，包括全员'0'和基层主管'3'）
      // 使用 route.params.id 作为后备，确保 id 有值
      const detailId = props.id || (route.params.id as string) || ''
      if (!detailId) {
        console.error('详情页 ID 为空，无法调用接口')
        ElMessage.error('详情页 ID 为空，无法加载数据')
        return
      }
      detailData.value = await fetchCertificationDetailData(detailId, {
        ...filters.value,
        departmentPath: filters.value.departmentPath?.length
          ? [...(filters.value.departmentPath ?? [])]
          : undefined,
      })
    }
  } catch (error) {
    console.error('加载详情数据失败:', error)
    // 确保即使出错也设置 detailData，避免页面空白
    if (!detailData.value) {
      detailData.value = {
        summary: null,
        certificationRecords: [],
        appointmentRecords: [],
        filters: {
          departmentTree: departmentOptions.value,
          jobFamilies: [],
          jobCategories: [],
          jobSubCategories: [],
          roles: [],
          maturityOptions: [],
        },
      }
    }
  } finally {
    loading.value = false
    // 保存用户查询标志，用于判断是否需要重置角色值
    const wasUserQuery = isUserQuery.value
    // 查询完成后，重置用户查询标志（下次如果是首次加载，会使用路由参数）
    isUserQuery.value = false
    
    // 数据加载完成后，只有在首次加载（非用户查询）时才根据路由参数设置角色值
    // 如果用户点击了查询按钮，保持用户选择的角色值不变
    if (!wasUserQuery) {
      const targetRole = normalizedRole.value
      if (roleOptions.value.length > 0) {
        // roleOptions 已经有数据，可以安全地设置角色值
        const roleExists = roleOptions.value.some((option) => option.value === targetRole)
        if (roleExists) {
          // 使用 nextTick 确保在 DOM 更新后再设置值，让 Element Plus 能正确显示 label
          nextTick(() => {
            filters.value.role = targetRole
            actualRole.value = targetRole
          })
        } else {
          filters.value.role = '0'
          actualRole.value = '0'
        }
      } else {
        // 如果 roleOptions 还没有数据，不要设置角色值，保持为 '0'
        // 当 roleOptions 加载完成后，watch 会自动设置正确的值
        // 这样可以避免在 roleOptions 加载前显示数字
        filters.value.role = '0'
        actualRole.value = normalizedRole.value // 只更新 actualRole，用于控制表格样式
      }
    }
  }
}

const handleBack = () => {
  router.push({ name: 'CertificationDashboard' })
}

// 查询按钮点击事件（用于其他筛选条件）
const handleQuery = () => {
  // 更新实际角色，用于控制表格样式
  actualRole.value = filters.value.role
  isUserQuery.value = true
  // 使用 nextTick 确保级联选择器的值已经更新到 filters.value.departmentPath
  // 虽然 v-model 是同步的，但级联选择器可能存在异步更新情况
  nextTick(() => {
    fetchDetail()
  })
}

const resetFilters = () => {
  filters.value = {
    role: '0',
    maturity: '全部',
    departmentPath: [],
    jobFamily: undefined,
    jobCategory: undefined,
    jobSubCategory: undefined,
    name: undefined,
    employeeId: undefined,
  }
  // 重置筛选框状态
  selectedField.value = null
  filterInputValue.value = ''
  keywordInput.value = ''
  showFieldDropdown.value = false
  showKeywordDropdown.value = false
}

const formatBoolean = (value: boolean) => (value ? '是' : '否')

// 资格级别排序方法：有数据的排在前面，等级越高越靠前
const qualificationLevelSort = (a: any, b: any) => {
  // 空值排在最后
  if (!a.qualificationLevel && !b.qualificationLevel) {
    return 0
  }
  if (!a.qualificationLevel) {
    return 1
  }
  if (!b.qualificationLevel) {
    return -1
  }
  
  // 提取数字部分进行排序（等级越高越靠前，即降序）
  const extractLevel = (levelStr: string) => {
    if (!levelStr) {
      return 0
    }
    // 提取字符串中的数字，支持格式如"1级"、"2级"、"3级"等
    const match = levelStr.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }
  
  const levelA = extractLevel(a.qualificationLevel)
  const levelB = extractLevel(b.qualificationLevel)
  
  // 降序排列：等级高的排在前面
  return levelB - levelA
}

// 导出数据
const handleExport = () => {
  if (!detailData.value) {
    return
  }
  
  // 使用过滤后的数据
  const appointmentRecords = filteredAppointmentRecords.value
  const certificationRecords = filteredCertificationRecords.value
  
  if (appointmentRecords.length === 0 && certificationRecords.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  // 生成文件名
  const deptPath = filters.value.departmentPath?.join('_') || '全部部门'
  const roleLabel = roleOptions.value.find((r) => r.value === actualRole.value)?.label || '全员'
  const maturity = filters.value.maturity || '全部'
  const fileName = `任职认证数据_${roleLabel}_${maturity}_${deptPath}`
  
  try {
    exportCertificationDataToExcel(appointmentRecords, certificationRecords, fileName, actualRole.value)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 处理tab切换，防止页面滚动到顶部
const handleTabClick = async () => {
  // 保存当前滚动位置
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  // 使用nextTick确保在DOM更新后恢复滚动位置
  await nextTick()
  requestAnimationFrame(() => {
    window.scrollTo({
      top: scrollTop,
      behavior: 'instant',
    })
  })
}

// 筛选框相关函数
// 点击输入框时，显示字段选择下拉框
const handleFilterInputFocus = (event: Event) => {
  // 阻止事件冒泡，避免触发handleClickOutside
  event.stopPropagation()
  if (!selectedField.value) {
    // 如果还没有选择字段，显示字段选择下拉框
    showFieldDropdown.value = true
    showKeywordDropdown.value = false
  } else {
    // 如果已经选择了字段，显示关键字输入下拉框
    showFieldDropdown.value = false
    showKeywordDropdown.value = true
    keywordInput.value = filters.value[selectedField.value] || ''
    // 自动聚焦到关键字输入框
    nextTick(() => {
      if (keywordInputRef.value && keywordInputRef.value.$el) {
        const inputEl = keywordInputRef.value.$el.querySelector('input')
        if (inputEl) {
          inputEl.focus()
        }
      }
    })
  }
}

// 选择字段类型（姓名或工号）
const handleFieldSelect = (field: 'name' | 'employeeId') => {
  selectedField.value = field
  const fieldLabel = field === 'name' ? '姓名' : '工号'
  filterInputValue.value = fieldLabel
  showFieldDropdown.value = false
  // 显示关键字输入下拉框
  keywordInput.value = filters.value[field] || ''
  showKeywordDropdown.value = true
  // 自动聚焦到关键字输入框
  nextTick(() => {
    if (keywordInputRef.value && keywordInputRef.value.$el) {
      const inputEl = keywordInputRef.value.$el.querySelector('input')
      if (inputEl) {
        inputEl.focus()
      }
    }
  })
}

// 确认关键字筛选
const handleKeywordConfirm = () => {
  if (!selectedField.value) return
  
  const keyword = keywordInput.value.trim()
  isFilterBoxUpdating.value = true // 标记正在更新
  if (keyword) {
    // 更新筛选条件
    if (selectedField.value === 'name') {
      filters.value.name = keyword
      filters.value.employeeId = undefined
    } else {
      filters.value.employeeId = keyword
      filters.value.name = undefined
    }
    filterInputValue.value = `${selectedField.value === 'name' ? '姓名' : '工号'}: ${keyword}`
  } else {
    // 如果关键字为空，清除筛选
    filters.value.name = undefined
    filters.value.employeeId = undefined
    filterInputValue.value = ''
    selectedField.value = null
  }
  showKeywordDropdown.value = false
  nextTick(() => {
    isFilterBoxUpdating.value = false
  })
}

// 取消关键字筛选
const handleKeywordCancel = () => {
  keywordInput.value = ''
  showKeywordDropdown.value = false
}

// 清除筛选
const handleFilterClear = () => {
  isFilterBoxUpdating.value = true // 标记正在更新
  selectedField.value = null
  filterInputValue.value = ''
  keywordInput.value = ''
  filters.value.name = undefined
  filters.value.employeeId = undefined
  showFieldDropdown.value = false
  showKeywordDropdown.value = false
  nextTick(() => {
    isFilterBoxUpdating.value = false
  })
}

// 监听 filters 的变化，同步筛选框显示（当表单输入框的值变化时）
watch(
  () => [filters.value.name, filters.value.employeeId],
  ([name, employeeId]) => {
    // 如果筛选框正在更新，不处理（避免循环）
    if (isFilterBoxUpdating.value) {
      return
    }
    
    // 根据 filters 的值更新筛选框显示
    if (name && name.trim()) {
      filterInputValue.value = `姓名: ${name.trim()}`
      selectedField.value = 'name'
    } else if (employeeId && employeeId.trim()) {
      filterInputValue.value = `工号: ${employeeId.trim()}`
      selectedField.value = 'employeeId'
    } else {
      // 如果两个都为空，清除筛选框显示
      if (filterInputValue.value) {
        filterInputValue.value = ''
        selectedField.value = null
      }
    }
  },
  { immediate: true }
)


// 过滤认证记录（根据姓名和工号）
const filteredCertificationRecords = computed(() => {
  if (!detailData.value) {
    return []
  }
  let records = detailData.value.certificationRecords
  
  // 根据姓名筛选
  if (filters.value.name && filters.value.name.trim()) {
    const nameFilter = filters.value.name.trim().toLowerCase()
    records = records.filter((record) => 
      record.name && record.name.toLowerCase().includes(nameFilter)
    )
  }
  
  // 根据工号筛选
  if (filters.value.employeeId && filters.value.employeeId.trim()) {
    const employeeIdFilter = filters.value.employeeId.trim().toLowerCase()
    records = records.filter((record) => 
      record.employeeId && record.employeeId.toLowerCase().includes(employeeIdFilter)
    )
  }
  
  // 按是否达标排序：达标（true）排在前面，不达标（false）排在后面，暂无数据（undefined）排在最后
  records.sort((a, b) => {
    // 将 true 映射为 0（最前），false 映射为 1（中间），undefined 映射为 2（最后）
    const getSortValue = (value) => {
      if (value === true) return 0
      if (value === false) return 1
      return 2 // undefined
    }
    return getSortValue(a.isCertStandard) - getSortValue(b.isCertStandard)
  })
  
  return records
})

// 过滤任职记录（根据姓名和工号）
const filteredAppointmentRecords = computed(() => {
  if (!detailData.value) {
    return []
  }
  let records = detailData.value.appointmentRecords
  
  // 根据姓名筛选
  if (filters.value.name && filters.value.name.trim()) {
    const nameFilter = filters.value.name.trim().toLowerCase()
    records = records.filter((record) => 
      record.name && record.name.toLowerCase().includes(nameFilter)
    )
  }
  
  // 根据工号筛选
  if (filters.value.employeeId && filters.value.employeeId.trim()) {
    const employeeIdFilter = filters.value.employeeId.trim().toLowerCase()
    records = records.filter((record) => 
      record.employeeId && record.employeeId.toLowerCase().includes(employeeIdFilter)
    )
  }
  
  // 按是否达标排序：达标（true）> 不达标（false）> 暂无数据（undefined）
  records.sort((a, b) => {
    if (a.isQualified === true && b.isQualified !== true) return -1
    if (a.isQualified !== true && b.isQualified === true) return 1
    if (a.isQualified === false && b.isQualified === undefined) return -1
    if (a.isQualified === undefined && b.isQualified === false) return 1
    return 0
  })
  
  return records
})

const summaryMetrics = computed(() => {
  if (!detailData.value) return []
  // 使用过滤后的数据计算统计指标
  const certificationRecords = filteredCertificationRecords.value
  const appointmentRecords = filteredAppointmentRecords.value
  
  let appointmentRate = 0
  let hasAppointmentData = false
  let certificationRate = 0
  let hasCertData = false
  
  // 当角色为全员时，使用新的计算方式
  if (actualRole.value === '0') {
    // 任职达标率：有任职级别（qualificationLevel）的人数 / 全量人员数量
    const appointmentWithLevel = appointmentRecords.filter((item) => item.qualificationLevel && item.qualificationLevel.trim()).length
    appointmentRate = appointmentRecords.length
      ? Math.round((appointmentWithLevel / appointmentRecords.length) * 100)
      : 0
    hasAppointmentData = appointmentRecords.length > 0
    
    // 认证达标率：有证书名称（certificateName）的人数 / 全量人员数量
    const certWithName = certificationRecords.filter((item) => item.certificateName && item.certificateName.trim()).length
    certificationRate = certificationRecords.length
      ? Math.round((certWithName / certificationRecords.length) * 100)
      : 0
    hasCertData = certificationRecords.length > 0
  } else {
    // 其他角色：使用原有的计算方式
    // 任职达标率：统计 isQualified 为 true 的记录
    const appointmentQualified = appointmentRecords.filter((item) => item.isQualified === true).length
    // 检查是否有任职达标数据（至少有一条记录的 isQualified 不是 undefined）
    hasAppointmentData = appointmentRecords.some((item) => item.isQualified !== undefined)
    appointmentRate = appointmentRecords.length
      ? Math.round((appointmentQualified / appointmentRecords.length) * 100)
      : 0
    
    // 认证达标率：统计 isCertStandard 为 true 的记录
    const certStandardCount = certificationRecords.filter((item) => item.isCertStandard === true).length
    // 检查是否有认证达标数据（至少有一条记录的 isCertStandard 不是 undefined）
    hasCertData = certificationRecords.some((item) => item.isCertStandard !== undefined)
    certificationRate = certificationRecords.length
      ? Math.round((certStandardCount / certificationRecords.length) * 100)
      : 0
  }

  return [
    { label: '任职记录', value: appointmentRecords.length, unit: '条' },
    {
      label: '任职达标率',
      value: !hasAppointmentData && appointmentRecords.length > 0 ? '待提供数据' : appointmentRate,
      unit: !hasAppointmentData && appointmentRecords.length > 0 ? '' : '%',
    },
    { label: '认证记录', value: certificationRecords.length, unit: '条' },
    {
      label: '认证达标率',
      value: !hasCertData && certificationRecords.length > 0 ? '待提供数据' : certificationRate,
      unit: !hasCertData && certificationRecords.length > 0 ? '' : '%',
    },
  ]
})

// AI任职盘点表格默认排序：当角色为全员时，按资格级别降序排列（等级越高越靠前）
// 注意：使用ascending是因为sort-method已经实现了降序逻辑（levelB - levelA）
// 当order为ascending时，Element Plus不会反转sort-method的结果，会直接使用降序逻辑
const appointmentTableDefaultSort = computed(() => {
  if (actualRole.value === '0') {
    return { prop: 'qualificationLevel', order: 'ascending' }
  }
  return null
})

// AI认证盘点表格默认排序：当角色为全员时，按证书名称升序排列；否则按是否达标升序
const certificationTableDefaultSort = computed(() => {
  if (actualRole.value === '0') {
    return { prop: 'certificateName', order: 'ascending' }
  }
  return { prop: 'isCertStandard', order: 'ascending' }
})

// 移除自动触发的watch，改为手动点击查询按钮触发
// watch(
//   () => [
//     filters.value.role,
//     filters.value.maturity,
//     filters.value.departmentPath,
//     filters.value.jobFamily,
//     filters.value.jobCategory,
//     filters.value.jobSubCategory,
//   ],
//   () => {
//     // 只有这些字段变化时才重新加载数据，姓名和工号是前端过滤，不需要重新加载
//     fetchDetail()
//   },
//   { deep: true }
// )

// 监听 roleOptions 的变化，确保当 roleOptions 加载完成后，当前角色值能正确显示
watch(
  () => roleOptions.value,
  (newOptions, oldOptions) => {
    // 如果是用户主动查询，不应该重置角色值
    if (isUserQuery.value) {
      return
    }
    
    // 当 roleOptions 从空变为有数据时，根据路由参数设置角色值
    // 只在首次加载时（从空变为有数据）才设置，避免覆盖用户选择
    const wasEmpty = !oldOptions || oldOptions.length === 0
    if (newOptions.length > 0 && wasEmpty) {
      const targetRole = normalizedRole.value
      const targetRoleExists = newOptions.some((option) => option.value === targetRole)
      
      // 如果目标角色（从路由参数获取）在选项中，使用目标角色
      if (targetRoleExists) {
        // 使用 nextTick 确保在 DOM 更新后再设置值，让 Element Plus 能正确显示 label
        nextTick(() => {
          if (filters.value.role !== targetRole) {
            filters.value.role = targetRole
            actualRole.value = targetRole
          }
        })
      } else {
        // 如果目标角色不在选项中，检查当前角色值是否在选项中
        const currentRoleExists = newOptions.some((option) => option.value === filters.value.role)
        if (!currentRoleExists) {
          // 如果当前角色值也不在选项中，重置为 '0'
          filters.value.role = '0'
          actualRole.value = '0'
        }
      }
    }
  },
  { immediate: true } // 设置为 immediate: true，确保在 roleOptions 初始化时也能触发
)

// 监听路由参数 role 的变化，确保当路由参数变化时能正确更新角色值
watch(
  () => route.query.role,
  (newRole) => {
    // 如果是用户主动查询，不应该根据路由参数重置角色值
    if (isUserQuery.value) {
      return
    }
    
    // 当路由参数 role 变化时，如果 roleOptions 已经有数据，立即更新
    if (roleOptions.value.length > 0) {
      const targetRole = normalizedRole.value
      const roleExists = roleOptions.value.some((option) => option.value === targetRole)
      if (roleExists && filters.value.role !== targetRole) {
        nextTick(() => {
          filters.value.role = targetRole
          actualRole.value = targetRole
        })
      }
    }
  },
  { immediate: false }
)

// 监听部门树的变化，当部门树加载完成且有待设置的路径时，自动设置部门路径
watch(
  () => departmentOptions.value,
  (newTree) => {
    // 如果有待设置的部门路径，且部门树已加载
    if (pendingDepartmentPath.value && newTree.length > 0) {
      const path = pendingDepartmentPath.value
      // 检查路径的第一级是否在部门树中存在
      // 对于多级路径，级联选择器支持懒加载，所以只要第一级存在即可设置
      const firstLevelExists = newTree.some((node) => node.value === path[0])
      
      if (firstLevelExists) {
        // 使用 nextTick 确保 DOM 更新后再设置路径
        // 延迟一点时间，确保级联选择器已完全初始化
        setTimeout(() => {
          nextTick(() => {
            filters.value.departmentPath = path
            pendingDepartmentPath.value = null // 清除待设置路径
          })
        }, 100)
      }
    }
  },
  { deep: true, immediate: true }
)

// 点击外部关闭下拉框
const handleClickOutside = (event: MouseEvent) => {
  if (filterWrapperRef.value && !filterWrapperRef.value.contains(event.target as Node)) {
    showFieldDropdown.value = false
    showKeywordDropdown.value = false
  }
}

onMounted(() => {
  // 添加点击外部关闭下拉框的事件监听
  document.addEventListener('click', handleClickOutside)
  
  initDepartmentTree()
  
  // 从路由参数中更新filters（确保路由参数已准备好）
  const departmentPathFromQuery = parseDepartmentPathFromQuery()
  if (departmentPathFromQuery.length > 0) {
    // 使用待设置机制，等待部门树加载完成
    pendingDepartmentPath.value = departmentPathFromQuery
  }
  
  const jobCategoryFromQuery = route.query.jobCategory as string | undefined
  if (jobCategoryFromQuery) {
    filters.value.jobCategory = jobCategoryFromQuery
  }
  
  // 从路由参数中读取成熟度，如果是L5则显示为"全部"
  const maturityFromQuery = route.query.maturity as string | undefined
  if (maturityFromQuery === 'L5') {
    filters.value.maturity = '全部' // L5代表总计，显示为"全部"
  } else if (maturityFromQuery && ['全部', 'L1', 'L2', 'L3'].includes(maturityFromQuery)) {
    filters.value.maturity = maturityFromQuery as '全部' | 'L1' | 'L2' | 'L3'
  } else {
    filters.value.maturity = '全部'
  }
  
  // 注意：角色视图的设置应该在 fetchDetail() 完成后进行，因为 roleOptions 依赖于 detailData
  // fetchDetail() 的 finally 块中已经有逻辑根据 normalizedRole 设置角色值
  
  // 根据点击的列和来源决定默认显示的标签页
  // 优先判断具体的列，再判断baseline和source参数
  const column = route.query.column as string | undefined
  const source = route.query.source as string | undefined
  
  if (column === 'appointed' || column === 'appointedByRequirement') {
    // 明确是任职相关列，默认显示任职tab
    activeTab.value = 'appointment'
  } else if (column === 'aiCertificateHolders' || column === 'certification') {
    // 明确是认证相关列，默认显示认证tab
    activeTab.value = 'certification'
  } else if (column === 'baseline') {
    // baseline在两个表格中都存在，根据source参数判断
    if (source === 'appointment') {
      // 从干部任职数据表格点击的baseline，显示任职tab
      activeTab.value = 'appointment'
    } else if (source === 'certification') {
      // 从干部认证数据表格点击的baseline，显示认证tab
      activeTab.value = 'certification'
    } else {
      // 如果没有source参数，默认显示认证tab
      activeTab.value = 'certification'
    }
  } else {
    // 默认显示认证tab
    activeTab.value = 'certification'
  }
  
  fetchDetail()
})

onActivated(() => {
  refreshDepartmentTree()
  
  // 从路由参数中更新filters（当从其他页面返回时，路由参数可能已变化）
  const departmentPathFromQuery = parseDepartmentPathFromQuery()
  if (departmentPathFromQuery.length > 0) {
    // 使用待设置机制，等待部门树加载完成
    pendingDepartmentPath.value = departmentPathFromQuery
  }
  
  const jobCategoryFromQuery = route.query.jobCategory as string | undefined
  if (jobCategoryFromQuery) {
    filters.value.jobCategory = jobCategoryFromQuery
  }
  
  // 从路由参数中读取成熟度，如果是L5则显示为"全部"
  const maturityFromQuery = route.query.maturity as string | undefined
  if (maturityFromQuery === 'L5') {
    filters.value.maturity = '全部' // L5代表总计，显示为"全部"
  } else if (maturityFromQuery && ['全部', 'L1', 'L2', 'L3'].includes(maturityFromQuery)) {
    filters.value.maturity = maturityFromQuery as '全部' | 'L1' | 'L2' | 'L3'
  } else {
    filters.value.maturity = '全部'
  }
  
  // 注意：角色视图的设置应该在 fetchDetail() 完成后进行，因为 roleOptions 依赖于 detailData
  // fetchDetail() 的 finally 块中已经有逻辑根据 normalizedRole 设置角色值
  
  fetchDetail()
})

onBeforeUnmount(() => {
  // 移除点击外部关闭下拉框的事件监听
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <section class="detail-view cert-detail">
    <header class="detail-view__header glass-card">
      <div class="header-left">
        <el-button type="primary" text :icon="ArrowLeft" @click="handleBack">返回列表页</el-button>
        <div>
          <h2>{{ detailData?.summary?.name ?? 'AI任职认证详情' }}</h2>
          <p>
            支持六级部门级联、职位族与成熟度多维筛选，结合盘点明细掌握人才任职与认证达标情况。
          </p>
        </div>
      </div>
    </header>

    <!-- 筛选条件 -->
    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters" label-width="90">
        <el-form-item label="部　　门">
          <el-cascader
            v-model="filters.departmentPath"
            :options="departmentOptions"
            :props="cascaderProps"
            clearable
            placeholder="可选择至六级部门"
            separator=" / "
            style="min-width: 260px"
          />
        </el-form-item>
        <el-form-item label="职位族">
          <el-select
            v-model="filters.jobFamily"
            placeholder="全部"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="family in detailData?.filters.jobFamilies ?? []"
              :key="family"
              :label="family"
              :value="family"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职位类">
          <el-select
            v-model="filters.jobCategory"
            placeholder="全部"
            clearable
            style="width: 160px"
          >
            <el-option label="软件类" value="软件类" />
            <el-option label="非软件类" value="非软件类" />
          </el-select>
        </el-form-item>
        <el-form-item label="职位子类">
          <el-select
            v-model="filters.jobSubCategory"
            placeholder="全部"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="sub in detailData?.filters.jobSubCategories ?? []"
              :key="sub"
              :label="sub"
              :value="sub"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色视图">
          <el-select v-model="filters.role" placeholder="全员" style="min-width: 260px">
            <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="成熟度">
          <el-select v-model="filters.maturity" placeholder="全部" style="width: 160px">
            <el-option
              v-for="opt in detailData?.filters.maturityOptions ?? []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button text type="primary" @click="resetFilters" style="margin-left: 8px">重置筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-skeleton :rows="8" animated v-if="loading" />
    <template v-else-if="detailData">
      <el-card shadow="hover" class="summary-card">
        <el-row :gutter="16">
          <el-col v-for="item in summaryMetrics" :key="item.label" :xs="12" :md="6">
            <div class="summary-item">
              <p>{{ item.label }}</p>
              <h3>
                <span :class="{ 'is-placeholder': item.value === '待提供数据' }">{{ item.value }}</span>
                <small v-if="item.unit">{{ item.unit }}</small>
              </h3>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="hover" class="detail-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">任职认证盘点</span>
            <div class="header-actions">
              <div class="filter-area">
                <div class="filter-input-wrapper" ref="filterWrapperRef">
                  <div class="filter-container">
                    <div class="filter-icon-wrapper">
                      <el-icon class="filter-icon">
                        <Search />
                      </el-icon>
                    </div>
                    <div class="filter-input-area">
                      <div class="filter-tags" v-if="filterInputValue">
                        <template v-if="filterInputValue.includes(':')">
                          <span class="filter-tag">
                            <span class="filter-tag-field">{{ filterInputValue.split(':')[0] }}</span>
                            <span class="filter-tag-separator">:</span>
                            <span class="filter-tag-value">{{ filterInputValue.split(':')[1].trim() }}</span>
                          </span>
                        </template>
                        <span v-else class="filter-tag">
                          <span class="filter-tag-field">{{ filterInputValue }}</span>
                        </span>
                      </div>
                      <div class="mainInput">
                        <input
                          ref="filterInputRef"
                          value=""
                          class="filter-input"
                          placeholder="点击此处添加筛选"
                          @focus="handleFilterInputFocus"
                          @click="handleFilterInputFocus"
                          readonly
                          @keydown.prevent
                        />
                      </div>
                    </div>
                    <button
                      v-if="filterInputValue"
                      type="button"
                      class="filter-delete-btn"
                      @click="handleFilterClear"
                      title="删除"
                    >
                      <el-icon>
                        <Close />
                      </el-icon>
                    </button>
                  </div>
                  <!-- 字段选择下拉框（第一阶段） -->
                  <div v-if="showFieldDropdown" class="filter-dropdown field-dropdown" @click.stop>
                    <div class="dropdown-item" @click="handleFieldSelect('name')">
                      <span>姓名</span>
                    </div>
                    <div class="dropdown-item" @click="handleFieldSelect('employeeId')">
                      <span>工号</span>
                    </div>
                  </div>
                  <!-- 关键字输入下拉框（第二阶段） -->
                  <div v-if="showKeywordDropdown" class="filter-dropdown keyword-dropdown" @click.stop>
                    <div class="keyword-input-wrapper">
                      <el-input
                        v-model="keywordInput"
                        :placeholder="`请输入${selectedField === 'name' ? '姓名' : '工号'}`"
                        @keyup.enter="handleKeywordConfirm"
                        @keyup.esc="handleKeywordCancel"
                        ref="keywordInputRef"
                      />
                    </div>
                    <div class="dropdown-actions">
                      <el-button size="small" @click="handleKeywordCancel">取消</el-button>
                      <el-button type="primary" size="small" @click="handleKeywordConfirm">确认</el-button>
                    </div>
                  </div>
                </div>
              </div>
              <el-button type="primary" :icon="Download" @click="handleExport" :disabled="!detailData || (filteredAppointmentRecords.length === 0 && filteredCertificationRecords.length === 0)">
                导出数据
              </el-button>
            </div>
          </div>
        </template>
        <el-tabs v-model="activeTab" stretch class="detail-tabs" @tab-click="handleTabClick">
          <el-tab-pane name="appointment">
            <template #label>
              <span>AI 任职盘点</span>
              <el-tooltip
                placement="top"
                effect="dark"
                style="margin-left: 4px;"
              >
                <template #content>
                  <div style="line-height: 1.8;">
                    <div>干部/专家AI任职能力要求：</div>
                    <div>软件类L3岗位干部牵引26年H2之前获得4+AI任职资格；</div>
                    <div>软件类L2岗位干部牵引获得3+AI任职资格；</div>
                  </div>
                </template>
                <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </template>
            <el-table ref="appointmentTableRef" :data="filteredAppointmentRecords" border stripe height="520" highlight-current-row size="small" :default-sort="appointmentTableDefaultSort">
              <el-table-column 
                v-if="actualRole !== '0'"
                label="是否达标" 
                :width="actualRole === '1' || actualRole === '2' ? '98' : '84'" 
                sortable 
                :sort-method="(a, b) => {
                  if (a.isQualified === true && b.isQualified !== true) return -1
                  if (a.isQualified !== true && b.isQualified === true) return 1
                  if (a.isQualified === false && b.isQualified === undefined) return -1
                  if (a.isQualified === undefined && b.isQualified === false) return 1
                  return 0
                }"
                fixed="left"
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <el-tag v-if="row.isQualified !== undefined" :type="row.isQualified ? 'success' : 'danger'" effect="light">
                    {{ formatBoolean(row.isQualified) }}
                  </el-tag>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="姓名" :width="actualRole === '1' || actualRole === '2' ? '70' : '84'" fixed="left" align="center" header-align="center" />
              <el-table-column prop="employeeId" label="工号" :width="actualRole === '1' || actualRole === '2' ? '94' : '108'" align="center" header-align="center" />
              <el-table-column 
                prop="positionCategory" 
                label="职位类" 
                width="98" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1'"
                prop="positionSubCategory" 
                label="职位子类" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.positionSubCategory">{{ row.positionSubCategory }}</span>
                  <span v-else style="color: #909399;">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole === '1'"
                prop="cadreType" 
                label="干部类型" 
                width="114" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="professionalCategory" 
                label="专业任职资格族" 
                width="126" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="expertCategory" 
                label="专业任职资格类（仅体现AI）" 
                min-width="220" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="professionalSubCategory" 
                label="专业任职资格子类" 
                width="140" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="qualificationDirection" 
                label="资格方向" 
                min-width="160" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="qualificationLevel" 
                label="资格级别" 
                width="92" 
                sortable 
                :sort-method="qualificationLevelSort"
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="acquisitionMethod" 
                label="获取方式" 
                width="92" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column prop="effectiveDate" label="生效日期" width="112" align="center" header-align="center" />
              <el-table-column prop="expiryDate" label="失效日期" width="112" align="center" header-align="center" />
              <el-table-column 
                prop="departmentLevel1" 
                label="一级部门" 
                width="112" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel2" 
                label="二级部门" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel3" 
                label="三级部门" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel4" 
                label="四级部门" 
                min-width="180" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel5" 
                label="五级部门" 
                min-width="220" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="minDepartment" 
                label="最小部门" 
                min-width="200" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                label="是否干部" 
                min-width="110" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  {{ formatBoolean(row.isCadre) }}
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="cadreType" 
                label="干部类型" 
                width="100" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                label="是否专家" 
                min-width="110" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.isExpert !== undefined">{{ formatBoolean(row.isExpert) }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="positionMaturity" 
                label="岗位AI成熟度" 
                :width="actualRole === '1' || actualRole === '2' ? '142' : '128'" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                label="是否基层主管" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.isFrontlineManager !== undefined">{{ formatBoolean(row.isFrontlineManager) }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="organizationMaturity" 
                label="组织AI成熟度" 
                min-width="150" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.organizationMaturity">{{ row.organizationMaturity }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="requiredCertificate" 
                label="要求持证类型" 
                min-width="160" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.requiredCertificate">{{ row.requiredCertificate }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane name="certification">
            <template #label>
              <span>AI 认证盘点</span>
              <el-tooltip
                placement="top"
                effect="dark"
                style="margin-left: 4px;"
              >
                <template #content>
                  <div style="line-height: 1.8;">
                    <div style="font-weight: 500; margin-bottom: 4px;">干部AI认证能力要求：</div>
                    <div>软件类L2/L3干部要求在26年H1之前完成"AI算法技术"专业级认证；</div>
                    <div>其他L2/L3岗位干部要求26年H2之前完成"AI算法技术"工作级认证科目2（算法理论），牵引26H1之前完成；</div>
                    <div>产品线管理团队成员按L2标准要求。</div>
                  </div>
                </template>
                <el-icon style="margin-left: 4px; cursor: pointer; color: #909399; vertical-align: middle;">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </template>
            <el-table 
              :data="filteredCertificationRecords" 
              border 
              stripe 
              height="520" 
              highlight-current-row 
              size="small"
              :default-sort="certificationTableDefaultSort"
            >
              <el-table-column 
                v-if="actualRole !== '0'"
                label="是否达标" 
                :width="actualRole === '1' || actualRole === '2' ? '98' : '84'" 
                sortable 
                prop="isCertStandard"
                :sort-method="(a, b) => {
                  // 将 true 映射为 0（最前），false 映射为 1（中间），undefined 映射为 2（最后）
                  const getSortValue = (value) => {
                    if (value === true) return 0
                    if (value === false) return 1
                    return 2 // undefined
                  }
                  return getSortValue(a.isCertStandard) - getSortValue(b.isCertStandard)
                }"
                fixed="left"
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <el-tag v-if="row.isCertStandard !== undefined" :type="row.isCertStandard ? 'success' : 'danger'" effect="light">
                    {{ formatBoolean(row.isCertStandard) }}
                  </el-tag>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="姓名" :width="actualRole === '1' || actualRole === '2' ? '70' : '84'" fixed="left" align="center" header-align="center" />
              <el-table-column prop="employeeId" label="工号" :width="actualRole === '1' || actualRole === '2' ? '94' : '108'" align="center" header-align="center" />
              <el-table-column 
                prop="positionCategory" 
                label="职位类" 
                width="98" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1'"
                prop="positionSubCategory" 
                label="职位子类" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.positionSubCategory">{{ row.positionSubCategory }}</span>
                  <span v-else style="color: #909399;">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole === '1'"
                prop="cadreType" 
                label="干部类型" 
                width="114" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="certificateName" 
                label="证书名称" 
                :width="actualRole === '1' || actualRole === '2' ? '264' : '292'" 
                sortable 
                :sort-method="(a, b) => {
                  // 空值排在最后
                  if (!a.certificateName && !b.certificateName) return 0
                  if (!a.certificateName) return 1
                  if (!b.certificateName) return -1
                  // 升序排列
                  return a.certificateName.localeCompare(b.certificateName, 'zh-CN')
                }"
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.certificateName">{{ row.certificateName }}</span>
                  <span v-else style="color: #909399;">-</span>
                </template>
              </el-table-column>
              <el-table-column 
                label="是否通过科目二" 
                :width="actualRole === '1' || actualRole === '2' ? '128' : '142'" 
                sortable 
                :sort-method="(a, b) => {
                  if (a.subjectTwoPassed === true && b.subjectTwoPassed !== true) return -1
                  if (a.subjectTwoPassed !== true && b.subjectTwoPassed === true) return 1
                  if (a.subjectTwoPassed === false && b.subjectTwoPassed === undefined) return -1
                  if (a.subjectTwoPassed === undefined && b.subjectTwoPassed === false) return 1
                  return 0
                }"
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="row.subjectTwoPassed ? 'success' : 'info'" effect="light">
                    {{ formatBoolean(row.subjectTwoPassed) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column 
                prop="departmentLevel1" 
                label="一级部门" 
                width="112" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel2" 
                label="二级部门" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel3" 
                label="三级部门" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel4" 
                label="四级部门" 
                min-width="180" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="departmentLevel5" 
                label="五级部门" 
                min-width="220" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                prop="minDepartment" 
                label="最小部门" 
                min-width="200" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                label="是否干部" 
                min-width="110" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  {{ formatBoolean(row.isCadre) }}
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="cadreType" 
                label="干部类型" 
                width="100" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                label="是否专家" 
                min-width="110" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.isExpert !== undefined">{{ formatBoolean(row.isExpert) }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="positionMaturity" 
                label="岗位AI成熟度" 
                :width="actualRole === '1' || actualRole === '2' ? '142' : '128'" 
                sortable 
                align="center"
                header-align="center"
              />
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                label="是否基层主管" 
                min-width="140" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.isFrontlineManager !== undefined">{{ formatBoolean(row.isFrontlineManager) }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="organizationMaturity" 
                label="组织AI成熟度" 
                min-width="150" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.organizationMaturity">{{ row.organizationMaturity }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
              <el-table-column 
                v-if="actualRole !== '1' && actualRole !== '2'"
                prop="requiredCertificate" 
                label="要求持证类型" 
                min-width="160" 
                sortable 
                align="center"
                header-align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.requiredCertificate">{{ row.requiredCertificate }}</span>
                  <span v-else class="pending-data">待提供数据</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
    <el-empty v-else description="暂无详情数据" />
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
    color: #000;
    line-height: 1.6;
    white-space: nowrap;
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
  :deep(.el-form-item) {
    margin-right: $spacing-md;
    margin-bottom: $spacing-sm;
  }
}

.summary-card {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;

  .summary-item {
    padding: $spacing-md;
    border-radius: $radius-md;
    background: linear-gradient(135deg, rgba(58, 122, 254, 0.06), rgba(58, 122, 254, 0.02));

    p {
      margin: 0;
      color: $text-secondary-color;
      font-size: 13px;
    }

    h3 {
      margin: $spacing-xs 0 0;
      font-size: 22px;
      font-weight: 700;
      color: $text-main-color;

      .is-placeholder {
        color: #909399;
        font-weight: normal;
        font-size: 16px;
      }

      small {
        margin-left: 4px;
        font-size: 13px;
        font-weight: 500;
        color: $text-secondary-color;
      }
    }
  }
}

.detail-card {
  border: none;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow-card;
  margin-bottom: $spacing-lg;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-main-color;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .filter-area {
    position: relative;
  }

  .filter-input-wrapper {
    position: relative;
  }

  .filter-container {
    display: flex;
    border: 1px solid #d7d8da;
    border-radius: 5px;
    align-items: center;
    background: white;
    width: 280px;
    min-width: 280px;
    max-width: 280px;
    box-sizing: border-box;
  }

  .filter-icon-wrapper {
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .filter-icon {
      font-size: 18px;
      color: #606266;
    }
  }

  .filter-input-area {
    flex: 1;
    min-width: 0;
    display: flex;
    overflow-x: hidden;
    overflow-y: hidden;
    align-items: center;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .filter-tags {
      white-space: nowrap;
      display: flex;
      align-items: center;
      padding-left: 8px;
      flex-shrink: 0;

      .filter-tag {
        display: inline-block;
        padding: 4px 8px;
        background: #f0f2f5;
        border: 1px solid $primary-color;
        border-radius: 4px;
        font-size: 14px;
        color: #606266;
        margin-right: 8px;
      }

      .filter-tag-field {
        color: $primary-color;
        font-weight: 500;
      }

      .filter-tag-separator {
        margin: 0 4px;
        color: #606266;
      }

      .filter-tag-value {
        color: $primary-color;
        font-weight: 500;
      }
    }

    .mainInput {
      flex: 1;
      min-width: 0;
    }

    .filter-input {
      width: 100%;
      min-width: 150px;
      margin-left: 8px;
      border: none;
      outline: none;
      font-size: 14px;
      color: #606266;
      background: transparent;
      padding: 8px 0;
      cursor: pointer;

      &::placeholder {
        color: #909399;
      }

      &:focus {
        outline: none;
      }
    }
  }

  .filter-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #606266;
    padding: 0;
    flex-shrink: 0;
    transition: color 0.2s;

    &:hover {
      color: #409eff;
    }

    .el-icon {
      font-size: 12px;
    }
  }

  .filter-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 280px;
    width: 280px;
  }

  .field-dropdown {
    min-width: 120px;
    width: 120px;

    .dropdown-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f7fa;
      }

      span {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .keyword-dropdown {
    padding: 12px;
    min-width: 280px;
    width: 280px;

    .keyword-input-wrapper {
      margin-bottom: 12px;
    }

    .dropdown-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  :deep(.el-card__body) {
    padding-bottom: $spacing-lg;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table th) {
    font-size: 12px;
    white-space: nowrap;
    text-align: center;
  }

  :deep(.el-table th .cell) {
    text-align: center;
  }

  :deep(.el-table td) {
    font-size: 12px;
    white-space: nowrap;
  }

  :deep(.el-table .cell) {
    white-space: nowrap;
  }
}

.detail-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    font-weight: 600;
    color: $text-secondary-color;

    &.is-active {
      color: $primary-color;
    }
  }
}


@media (max-width: 768px) {
  .glass-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

.pending-data {
  background-color: rgba(240, 242, 245, 0.7) !important;
  color: #909399;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  font-size: 12px;
}
</style>
