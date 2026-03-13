import type { PersonalCourseCompletionResponse, CourseCategoryStatistics } from '../types'

/**
 * 获取个人课程完成情况mock数据
 * @returns 个人课程完成情况数据
 */
export const getPersonalCourseCompletion = (): PersonalCourseCompletionResponse => {
  // 基础分类的课程列表
  const basicCourses: CourseCategoryStatistics = {
    courseLevel: '基础',
    totalCourses: 10,
    targetCourses: 10,
    completedCourses: 8,
    completionRate: 80.0,
    courseList: [
      {
        courseName: 'AI基础概念与原理',
        courseNumber: 'COURSE_BASIC_001',
        isCompleted: true,
      },
      {
        courseName: '机器学习入门',
        courseNumber: 'COURSE_BASIC_002',
        isCompleted: true,
      },
      {
        courseName: '深度学习基础',
        courseNumber: 'COURSE_BASIC_003',
        isCompleted: true,
      },
      {
        courseName: 'Python编程基础',
        courseNumber: 'COURSE_BASIC_004',
        isCompleted: true,
      },
      {
        courseName: '数据科学基础',
        courseNumber: 'COURSE_BASIC_005',
        isCompleted: true,
      },
      {
        courseName: '统计学基础',
        courseNumber: 'COURSE_BASIC_006',
        isCompleted: true,
      },
      {
        courseName: '数据可视化',
        courseNumber: 'COURSE_BASIC_007',
        isCompleted: true,
      },
      {
        courseName: '算法与数据结构',
        courseNumber: 'COURSE_BASIC_008',
        isCompleted: true,
      },
      {
        courseName: '自然语言处理入门',
        courseNumber: 'COURSE_BASIC_009',
        isCompleted: false,
      },
      {
        courseName: '计算机视觉入门',
        courseNumber: 'COURSE_BASIC_010',
        isCompleted: false,
      },
    ],
  }

  // 进阶分类的课程列表
  const intermediateCourses: CourseCategoryStatistics = {
    courseLevel: '进阶',
    totalCourses: 8,
    targetCourses: 8,
    completedCourses: 5,
    completionRate: 62.5,
    courseList: [
      {
        courseName: '深度学习进阶',
        courseNumber: 'COURSE_INTER_001',
        isCompleted: true,
      },
      {
        courseName: '神经网络架构设计',
        courseNumber: 'COURSE_INTER_002',
        isCompleted: true,
      },
      {
        courseName: '模型训练与优化',
        courseNumber: 'COURSE_INTER_003',
        isCompleted: true,
      },
      {
        courseName: '迁移学习',
        courseNumber: 'COURSE_INTER_004',
        isCompleted: true,
      },
      {
        courseName: '强化学习基础',
        courseNumber: 'COURSE_INTER_005',
        isCompleted: true,
      },
      {
        courseName: '模型部署与工程化',
        courseNumber: 'COURSE_INTER_006',
        isCompleted: false,
      },
      {
        courseName: '分布式训练',
        courseNumber: 'COURSE_INTER_007',
        isCompleted: false,
      },
      {
        courseName: '模型压缩与加速',
        courseNumber: 'COURSE_INTER_008',
        isCompleted: false,
      },
    ],
  }

  // 高阶分类的课程列表
  const advancedCourses: CourseCategoryStatistics = {
    courseLevel: '高阶',
    totalCourses: 6,
    targetCourses: 6,
    completedCourses: 3,
    completionRate: 50.0,
    courseList: [
      {
        courseName: '大模型原理与应用',
        courseNumber: 'COURSE_ADV_001',
        isCompleted: true,
      },
      {
        courseName: 'Transformer架构深入',
        courseNumber: 'COURSE_ADV_002',
        isCompleted: true,
      },
      {
        courseName: '多模态学习',
        courseNumber: 'COURSE_ADV_003',
        isCompleted: true,
      },
      {
        courseName: '生成式AI技术',
        courseNumber: 'COURSE_ADV_004',
        isCompleted: false,
      },
      {
        courseName: 'AI安全与伦理',
        courseNumber: 'COURSE_ADV_005',
        isCompleted: false,
      },
      {
        courseName: 'AI系统架构设计',
        courseNumber: 'COURSE_ADV_006',
        isCompleted: false,
      },
    ],
  }

  // 实战分类的课程列表
  const practiceCourses: CourseCategoryStatistics = {
    courseLevel: '实战',
    totalCourses: 5,
    targetCourses: 5,
    completedCourses: 2,
    completionRate: 40.0,
    courseList: [
      {
        courseName: 'AI项目实战：智能推荐系统',
        courseNumber: 'COURSE_PRAC_001',
        isCompleted: true,
      },
      {
        courseName: 'AI项目实战：图像识别系统',
        courseNumber: 'COURSE_PRAC_002',
        isCompleted: true,
      },
      {
        courseName: 'AI项目实战：对话系统',
        courseNumber: 'COURSE_PRAC_003',
        isCompleted: false,
      },
      {
        courseName: 'AI项目实战：知识图谱构建',
        courseNumber: 'COURSE_PRAC_004',
        isCompleted: false,
      },
      {
        courseName: 'AI项目实战：自动化运维',
        courseNumber: 'COURSE_PRAC_005',
        isCompleted: false,
      },
    ],
  }

  return {
    empNum: '123456',
    empName: '张三',
    courseStatistics: [basicCourses, intermediateCourses, advancedCourses, practiceCourses],
  }
}

