import * as XLSX from 'xlsx-js-style'
import type { AppointmentAuditRecord, CertificationAuditRecord, CoursePlanningInfo, DepartmentSelection } from '@/types/dashboard'

/**
 * 格式化布尔值为中文
 */
const formatBoolean = (value: boolean | undefined): string => {
  if (value === undefined) {
    return '待提供数据'
  }
  return value ? '是' : '否'
}

/**
 * 导出任职认证数据到Excel
 * @param appointmentRecords 任职记录
 * @param certificationRecords 认证记录
 * @param fileName 文件名（不包含扩展名）
 * @param role 角色类型（'0'-全员，'1'-干部，'2'-专家，'3'-基层主管）
 */
export const exportCertificationDataToExcel = (
  appointmentRecords: AppointmentAuditRecord[],
  certificationRecords: CertificationAuditRecord[],
  fileName: string = '任职认证数据',
  role: string = '0',
) => {
  const isCadre = role === '1'
  const isExpert = role === '2'
  const isCadreOrExpert = isCadre || isExpert
  // 创建工作簿
  const workbook = XLSX.utils.book_new()

  // 准备任职数据
  const appointmentData = appointmentRecords.map((record) => {
    const baseData: Record<string, string> = {
      '是否达标': formatBoolean(record.isQualified),
      '姓名': record.name || '',
      '工号': record.employeeId || '',
      '岗位AI成熟度': record.positionMaturity || '',
      '职位类': record.positionCategory || '',
      '专业任职资格族': record.professionalCategory || '',
      '专业任职资格类（仅体现AI）': record.expertCategory || '',
      '专业任职资格子类': record.professionalSubCategory || '',
      '资格方向': record.qualificationDirection || '',
      '资格级别': record.qualificationLevel || '',
      '生效日期': record.effectiveDate || '',
      '失效日期': record.expiryDate || '',
      '一级部门': record.departmentLevel1 || '',
      '二级部门': record.departmentLevel2 || '',
      '三级部门': record.departmentLevel3 || '',
      '四级部门': record.departmentLevel4 || '',
      '五级部门': record.departmentLevel5 || '',
      '最小部门': record.minDepartment || '',
    }
    
    // 根据角色添加不同的列
    // 专家数据不包含干部类型
    if (isCadre) {
      baseData['干部类型'] = record.cadreType || ''
    } else if (!isCadreOrExpert) {
      baseData['获取方式'] = record.acquisitionMethod || ''
      baseData['职位子类'] = record.positionSubCategory || ''
      baseData['是否干部'] = formatBoolean(record.isCadre)
      baseData['是否专家'] = formatBoolean(record.isExpert)
      baseData['是否基层主管'] = formatBoolean(record.isFrontlineManager)
      baseData['组织AI成熟度'] = record.organizationMaturity || '待提供数据'
      baseData['要求持证类型'] = record.requiredCertificate || '待提供数据'
    }
    
    return baseData
  })

  // 准备认证数据
  const certificationData = certificationRecords.map((record) => {
    const baseData: Record<string, string> = {
      '是否达标': formatBoolean(record.isCertStandard),
      '姓名': record.name || '',
      '工号': record.employeeId || '',
      '岗位AI成熟度': record.positionMaturity || '',
      '职位类': record.positionCategory || '',
      '证书名称': record.certificateName || '',
      '是否通过科目二': formatBoolean(record.subjectTwoPassed),
      '一级部门': record.departmentLevel1 || '',
      '二级部门': record.departmentLevel2 || '',
      '三级部门': record.departmentLevel3 || '',
      '四级部门': record.departmentLevel4 || '',
      '五级部门': record.departmentLevel5 || '',
      '最小部门': record.minDepartment || '',
    }
    
    // 根据角色添加不同的列
    // 专家数据不包含干部类型
    if (isCadre) {
      baseData['干部类型'] = record.cadreType || ''
    } else if (!isCadreOrExpert) {
      baseData['证书生效日期'] = record.certificateEffectiveDate || ''
      baseData['职位子类'] = record.positionSubCategory || ''
      baseData['是否干部'] = formatBoolean(record.isCadre)
      baseData['是否专家'] = formatBoolean(record.isExpert)
      baseData['是否基层主管'] = formatBoolean(record.isFrontlineManager)
      baseData['组织AI成熟度'] = record.organizationMaturity || '待提供数据'
      baseData['要求持证类型'] = record.requiredCertificate || '待提供数据'
    }
    
    return baseData
  })

  // 创建工作表
  const appointmentSheet = XLSX.utils.json_to_sheet(appointmentData)
  const certificationSheet = XLSX.utils.json_to_sheet(certificationData)

  // 设置表头样式（加粗、居中）和数据样式（居中）
  const setSheetStyle = (sheet: XLSX.WorkSheet, data: Record<string, string>[]) => {
    if (data.length === 0) {
      return
    }

    // 获取表头范围
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
    
    // 设置表头样式（第一行）
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!sheet[cellAddress]) {
        continue
      }
      
      // 创建带样式的单元格对象
      const cell = sheet[cellAddress]
      sheet[cellAddress] = {
        ...cell,
        s: {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
        },
      }
    }
    
    // 设置数据行样式（居中）
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!sheet[cellAddress]) {
          continue
        }
        
        const cell = sheet[cellAddress]
        sheet[cellAddress] = {
          ...cell,
          s: {
            alignment: { horizontal: 'center', vertical: 'center' },
          },
        }
      }
    }
  }

  // 设置列宽（根据角色动态调整）
  if (appointmentData.length > 0) {
    const firstRow = appointmentData[0]
    if (firstRow) {
      const appointmentCols = Object.keys(firstRow).map((key) => {
        // 根据列名设置合适的宽度
        if (key.includes('部门') || key.includes('资格') || key.includes('方向')) {
          return { wch: 18 }
        } else if (key.includes('名称') || key.includes('类别')) {
          return { wch: 25 }
        } else if (key.includes('日期')) {
          return { wch: 12 }
        } else if (key.includes('是否') || key.includes('达标')) {
          return { wch: 10 }
        } else {
          return { wch: 15 }
        }
      })
      appointmentSheet['!cols'] = appointmentCols
      // 设置样式
      setSheetStyle(appointmentSheet, appointmentData)
    }
  }

  if (certificationData.length > 0) {
    const firstRow = certificationData[0]
    if (firstRow) {
      const certificationCols = Object.keys(firstRow).map((key) => {
        // 根据列名设置合适的宽度
        if (key.includes('部门') || key.includes('资格') || key.includes('方向')) {
          return { wch: 18 }
        } else if (key.includes('名称') || key.includes('类别')) {
          return { wch: 25 }
        } else if (key.includes('日期')) {
          return { wch: 12 }
        } else if (key.includes('是否') || key.includes('达标')) {
          return { wch: 10 }
        } else {
          return { wch: 15 }
        }
      })
      certificationSheet['!cols'] = certificationCols
      // 设置样式
      setSheetStyle(certificationSheet, certificationData)
    }
  }

  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(workbook, appointmentSheet, '任职数据')
  XLSX.utils.book_append_sheet(workbook, certificationSheet, '认证数据')

  // 生成文件名（包含当前日期）
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const finalFileName = `${fileName}_${dateStr}.xlsx`

  // 导出文件
  XLSX.writeFile(workbook, finalFileName)
}

/**
 * 导出课程规划明细数据到Excel
 * @param planningData 课程规划明细数据
 * @param departmentColumns 部门列信息
 * @param fileName 文件名（不包含扩展名）
 */
export const exportCoursePlanningToExcel = (
  planningData: CoursePlanningInfo[],
  departmentColumns: DepartmentSelection[] = [],
  fileName: string = '训战课程规划明细',
) => {
  // 创建工作簿
  const workbook = XLSX.utils.book_new()

  // 先按bigType排序，确保相同bigType的数据连续
  const sortedData = [...planningData].sort((a, b) => {
    const aType = a.bigType || ''
    const bType = b.bigType || ''
    if (aType !== bType) {
      return aType.localeCompare(bType)
    }
    return 0
  })

  // 准备数据
  const excelData = sortedData.map((item) => {
    const baseData: Record<string, string> = {
      '课程主分类': item.bigType || '',
      '训战分类': item.courseLevel || '',
      '课程名称': item.courseName || '',
      '课程编码（线上课程涉及）': item.courseNumber || '',
      '课程链接': item.courseLink || '',
      '目标人群': 'ALL',
      '学分': item.credit || '',
    }

    // 添加部门列信息
    if (departmentColumns && departmentColumns.length > 0) {
      departmentColumns.forEach(dept => {
        const isSelected = item.selectedDepts?.some(selected => selected.deptCode === dept.deptCode)
        baseData[dept.deptName] = isSelected ? 'Y' : ''
      })
    }
    
    return baseData
  })

  // 创建工作表
  const sheet = XLSX.utils.json_to_sheet(excelData)

  // 计算每列的最大宽度（根据内容）
  let columnKeys = ['课程主分类', '训战分类', '课程名称', '课程编码（线上课程涉及）', '课程链接', '目标人群', '学分']
  if (departmentColumns && departmentColumns.length > 0) {
    columnKeys = [...columnKeys, ...departmentColumns.map(d => d.deptName)]
  }
  
  const columnWidths = columnKeys.map((key) => {
    let maxWidth = key.length // 从表头长度开始
    
    // 如果是部门列，宽度增加一倍（为了更清晰地显示部门名称）
    const isDepartmentCol = departmentColumns && departmentColumns.some(d => d.deptName === key)
    
    // 遍历所有数据行，找到该列的最大长度
    excelData.forEach((row) => {
      const cellValue = String(row[key as keyof typeof row] || '')
      // 计算字符串长度（中文字符按2个字符宽度计算）
      const width = Array.from(cellValue).reduce((sum, char) => {
        // 中文字符、全角字符按2计算，其他按1计算
        return sum + (char.charCodeAt(0) > 127 ? 2 : 1)
      }, 0)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    
    // 如果是部门列，宽度增加一倍
    if (isDepartmentCol) {
      return { wch: Math.min(Math.max(maxWidth * 2 + 4, 20), 80) }
    }

    // 如果是课程编码列，宽度增加两个汉字宽度（4个字符）
    if (key === '课程编码（线上课程涉及）') {
      return { wch: Math.min(Math.max(maxWidth + 6, 14), 50) }
    }
    
    // 设置列宽，加一些padding（最小宽度为10，最大不超过50，并加2个字符的padding）
    return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) }
  })

  // 设置列宽
  sheet['!cols'] = columnWidths

  // 设置表头样式（加粗、居中）
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!sheet[cellAddress]) {
      continue
    }
    const cell = sheet[cellAddress]
    sheet[cellAddress] = {
      ...cell,
      s: {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
    }
  }

  // 设置数据行样式（居中）
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!sheet[cellAddress]) {
        continue
      }
      const cell = sheet[cellAddress]
      sheet[cellAddress] = {
        ...cell,
        s: {
          alignment: { horizontal: 'center', vertical: 'center' },
        },
      }
    }
  }

  // 合并相同bigType的单元格（A列，课程主分类）
  const merges: XLSX.Range[] = []
  if (sortedData.length > 0) {
    let startRow = 1 // 从第2行开始（第1行是表头，索引为0，Excel行号是1）
    let currentBigType = sortedData[0]?.bigType || ''
    
    for (let i = 1; i < sortedData.length; i++) {
      const item = sortedData[i]
      if (!item) continue
      const excelRow = i + 1 // Excel行号（索引i对应Excel第i+1行，因为表头占第1行）
      
      if (item.bigType !== currentBigType) {
        // 如果当前行的bigType与之前不同，合并之前的单元格
        if (startRow < excelRow - 1) {
          // 有多个相同bigType的行，需要合并
          merges.push({
            s: { r: startRow, c: 0 }, // 开始位置：行startRow，列0（A列）
            e: { r: excelRow - 1, c: 0 }, // 结束位置：上一行的行号，列0（A列）
          })
        }
        // 更新起始行和当前bigType
        startRow = excelRow
        currentBigType = item.bigType || ''
      }
    }
    
    // 处理最后一组相同bigType的单元格
    const lastRow = sortedData.length // 最后一行数据的Excel行号
    if (startRow < lastRow) {
      merges.push({
        s: { r: startRow, c: 0 },
        e: { r: lastRow, c: 0 },
      })
    }
  }
  
  // 设置合并单元格
  if (merges.length > 0) {
    sheet['!merges'] = merges
  }

  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(workbook, sheet, '课程规划明细')

  // 生成文件名（包含当前日期）
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const finalFileName = `${fileName}_${dateStr}.xlsx`

  // 导出文件
  XLSX.writeFile(workbook, finalFileName)
}

