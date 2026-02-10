SET NAMES utf8mb4;

-- 1. 清理旧表
DROP TABLE IF EXISTS `ai_course_planning_info`;
DROP TABLE IF EXISTS `dept_course_selections`;
DROP TABLE IF EXISTS `t_micro_study_info_sync`;
DROP TABLE IF EXISTS `t_mooc_study_info_sync`;
DROP TABLE IF EXISTS `t_employee_sync`;

-- 2. 创建表结构

-- 课程规划信息表
CREATE TABLE `ai_course_planning_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_name` varchar(255) DEFAULT NULL COMMENT '课程名称',
  `course_number` varchar(100) DEFAULT NULL COMMENT '课程编码',
  `course_level` varchar(50) DEFAULT NULL COMMENT '课程级别（基础、进阶、高阶、实战）',
  `big_type` varchar(100) DEFAULT NULL COMMENT '主分类',
  `syb_type` varchar(100) DEFAULT NULL COMMENT '子分类',
  `course_link` varchar(500) DEFAULT NULL COMMENT '课程链接',
  `credit` decimal(10,1) DEFAULT NULL COMMENT '学分',
  `course_status` varchar(50) DEFAULT NULL COMMENT '课程状态',
  `knowledge_point` text COMMENT '知识点',
  `course_explain` text COMMENT '课程说明',
  `study_duration` decimal(10,1) DEFAULT NULL COMMENT '学习时长',
  `in_class_test` varchar(50) DEFAULT NULL COMMENT '随堂测试',
  PRIMARY KEY (`id`),
  KEY `idx_course_number` (`course_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI课程规划信息表';

-- 部门选课信息表
CREATE TABLE `dept_course_selections` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dept_code` varchar(100) NOT NULL COMMENT '部门编码',
  `dept_name` varchar(255) DEFAULT NULL COMMENT '部门名称',
  `course_selections` text COMMENT '选课ID集合（逗号分隔）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dept_code` (`dept_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门选课信息表';

-- 员工同步表 (用于个人课程查询)
CREATE TABLE `t_employee_sync` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `employee_number` varchar(180) DEFAULT NULL COMMENT '员工工号',
  `last_name` text COMMENT '员工姓名',
  `l0_department_code` varchar(180) DEFAULT NULL COMMENT '公司',
  `l0_department_cn_name` varchar(255) DEFAULT NULL,
  `firstdeptcode` varchar(180) DEFAULT NULL COMMENT '一层组织编码',
  `firstdept` varchar(255) DEFAULT NULL COMMENT '一层组织名称',
  `seconddeptcode` varchar(180) DEFAULT NULL COMMENT '二层组织编码',
  `seconddept` varchar(255) DEFAULT NULL COMMENT '二层组织名称',
  `thirddeptcode` varchar(180) DEFAULT NULL COMMENT '三层组织编码',
  `thirddept` varchar(255) DEFAULT NULL COMMENT '三层组织名称',
  `fourthdeptcode` varchar(180) DEFAULT NULL COMMENT '四层组织编码',
  `fourthdept` varchar(255) DEFAULT NULL COMMENT '四层组织名称',
  `fifthdeptcode` varchar(180) DEFAULT NULL COMMENT '五层组织编码',
  `fifthdept` varchar(255) DEFAULT NULL COMMENT '五层组织名称',
  `sixthdeptcode` varchar(180) DEFAULT NULL COMMENT '六层组织编码',
  `sixthdept` varchar(255) DEFAULT NULL COMMENT '六层组织名称',
  `lowest_dept` varchar(255) DEFAULT NULL COMMENT '最小部门编码',
  `lowest_dept_number` varchar(180) DEFAULT NULL COMMENT '最小部门名称',
  `job_category` text COMMENT '职位族、职位类、职位子类',
  `period_id` int(11) DEFAULT NULL,
  `native_name` text,
  `base_location` text,
  `base_loc_start_date` text,
  `days` double DEFAULT NULL,
  `rep_office_name` text,
  `now_oversea_continue_years` double DEFAULT NULL,
  `now_country_continue_years` double DEFAULT NULL,
  `now_country_same_type_year` double DEFAULT NULL,
  `now_country_total_years` double DEFAULT NULL,
  `now_region_time_year` double DEFAULT NULL,
  `now_region_total_year` double DEFAULT NULL,
  `period_of_position` text,
  `now_competence_start_date` text,
  `now_competence_total_days` double DEFAULT NULL,
  `region_name` text,
  `dev_country_total_years` double DEFAULT NULL,
  `legal_entity_code` text,
  `legal_entity_name` text,
  `emp_status_effect_date` text,
  `employee_status` text,
  `working_time` double DEFAULT NULL,
  `manager_flag` text,
  `manager_number` text,
  `manager_name` text,
  `country` text,
  `oversea_total_years` double DEFAULT NULL,
  `contract_end_date` text,
  `contract_start_date` text,
  `contract_subtype` text,
  `service_years` double DEFAULT NULL,
  `hard_country_total_years` double DEFAULT NULL,
  `former_id` text,
  `assignment_type` text,
  `assignment_category` text,
  `normal_country_total_years` double DEFAULT NULL,
  `desired_location` text,
  `contract_type` text,
  `working_type` text,
  `competence` text,
  `competence_level1` text,
  `competence_category1` text,
  `competence_is_def` text,
  `competence_grade1` text,
  `competence_sub1` text,
  `competence_family1` text,
  `competence_is_exis` text,
  `competence_level2` text,
  `competence_category2` text,
  `effective_date_from2` datetime(6) DEFAULT NULL,
  `effective_date_to2` datetime(6) DEFAULT NULL,
  `competence_is_def2` text,
  `competence_grade2` text,
  `competence_sub2` text,
  `competence_family2` text,
  `effective_date_from` text,
  `effective_date_to` text,
  `province` text,
  `city` text,
  `original_enter_date` text,
  `org_date_from` datetime(6) DEFAULT NULL,
  `contract_location_code` text,
  `contract_location` text,
  `research_center` text,
  `business_area` text,
  `bus_domain_start_date` text,
  `business_type` varchar(255) DEFAULT NULL,
  `business_title` varchar(255) DEFAULT NULL,
  `business_subtype` varchar(255) DEFAULT NULL,
  `business_domain` varchar(255) DEFAULT NULL,
  `english_name` text,
  `employment_type` text,
  `recruitment_type` text,
  `job_code` text,
  `job_title` text,
  `job_start_date` text,
  `job` text,
  `job_grade` text,
  `supervisor_id` decimal(38,0) DEFAULT NULL,
  `coa` text,
  `enter_date` text,
  `lowest_org_id` decimal(38,0) DEFAULT NULL,
  `payroll` text,
  `current_level` text,
  `bg` text,
  `module_id` bigint(20) DEFAULT NULL,
  `module_code` varchar(180) DEFAULT NULL,
  `module_name` varchar(255) DEFAULT NULL,
  `role_id` bigint(20) DEFAULT NULL,
  `role_code` varchar(180) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `position_type` text,
  `last_modified_date` datetime(6) DEFAULT NULL,
  `signcompany_code` varchar(150) DEFAULT NULL,
  `signcompany_zh_name` varchar(255) DEFAULT NULL,
  `service_type_code` varchar(150) DEFAULT NULL,
  `service_type_zh_name` varchar(255) DEFAULT NULL,
  `region_code` varchar(150) DEFAULT NULL,
  `region_zh_name` varchar(255) DEFAULT NULL,
  `hire_code` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_number` (`employee_number`) USING BTREE COMMENT '用户工号信息'
) ENGINE=InnoDB AUTO_INCREMENT=220817 DEFAULT CHARSET=utf8mb4 COMMENT='数据组同步--全员基本信息表';

-- 微课学习记录同步表
CREATE TABLE `t_micro_study_info_sync` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `emp_num` varchar(50) DEFAULT NULL COMMENT '工号',
  `course_team_code` varchar(100) DEFAULT NULL COMMENT '课程编码',
  `is_pass` varchar(10) DEFAULT NULL COMMENT '是否通过（1-通过）',
  PRIMARY KEY (`id`),
  KEY `idx_emp_course` (`emp_num`, `course_team_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微课学习记录同步表';

-- MOOC学习记录同步表
CREATE TABLE `t_mooc_study_info_sync` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `emp_num` varchar(50) DEFAULT NULL COMMENT '工号',
  `course_team_code` varchar(100) DEFAULT NULL COMMENT '课程编码',
  `is_pass` varchar(10) DEFAULT NULL COMMENT '是否通过（1-通过）',
  PRIMARY KEY (`id`),
  KEY `idx_emp_course` (`emp_num`, `course_team_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MOOC学习记录同步表';

-- 3. 插入 Mock 数据

-- 插入课程数据
INSERT INTO `ai_course_planning_info` (`id`, `course_name`, `course_number`, `course_level`, `big_type`, `course_link`, `credit`) VALUES
(1, 'AI基础概论', 'AI001', '基础', '理论基础', 'http://ilearning.huawei.com/course/AI001', 1.0),
(2, 'Python编程基础', 'AI002', '基础', '编程语言', 'http://ilearning.huawei.com/course/AI002', 2.0),
(3, '机器学习算法', 'AI003', '进阶', '算法核心', 'http://ilearning.huawei.com/course/AI003', 3.0),
(4, '深度学习框架', 'AI004', '进阶', '框架应用', 'http://ilearning.huawei.com/course/AI004', 3.0),
(5, '自然语言处理实战', 'AI005', '高阶', '领域应用', 'http://ilearning.huawei.com/course/AI005', 4.0),
(6, '计算机视觉项目', 'AI006', '高阶', '领域应用', 'http://ilearning.huawei.com/course/AI006', 4.0),
(7, 'AI大模型微调', 'AI007', '实战', '前沿技术', 'http://ilearning.huawei.com/course/AI007', 5.0),
(8, '生成式AI应用开发', 'AI008', '实战', '应用开发', 'http://ilearning.huawei.com/course/AI008', 5.0);

-- 插入员工数据
INSERT INTO `t_employee_sync` (`employee_number`, `last_name`, `fourthdeptcode`) VALUES
('E001234', '张三', '3001');

-- 插入部门选课数据
-- 部门 3001 选择了除 AI008 以外的所有课程
INSERT INTO `dept_course_selections` (`dept_code`, `dept_name`, `course_selections`) VALUES
('3001', '技术支撑组', '1,2,3,4,5,6,7');

-- 插入学习记录 (部分完成)
-- 张三完成了 AI001, AI003, AI005 (微课) 和 AI002 (MOOC)
INSERT INTO `t_micro_study_info_sync` (`emp_num`, `course_team_code`, `is_pass`) VALUES
('E001234', 'AI001', '1'),
('E001234', 'AI003', '1'),
('E001234', 'AI005', '1');

INSERT INTO `t_mooc_study_info_sync` (`emp_num`, `course_team_code`, `is_pass`) VALUES
('E001234', 'AI002', '1');
