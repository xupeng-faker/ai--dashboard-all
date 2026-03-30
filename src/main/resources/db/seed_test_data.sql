-- =============================================================================
-- 测试用假数据（可重复执行）— 仅个人学分表 t_personal_credit
-- =============================================================================
-- 适用：AI School 学分明细、部门筛选等，不依赖训战相关表。
-- 工号前缀 TEST_DEMO_
-- 执行：mysql -h127.0.0.1 -uroot -p ai_transform < src/main/resources/db/seed_test_data.sql
-- =============================================================================

SET NAMES utf8mb4;

DELETE FROM t_personal_credit WHERE employee_number LIKE 'TEST_DEMO_%';

INSERT INTO t_personal_credit (
  employee_number, last_name, lowest_dept_number, lowest_dept,
  l0_department_code, l0_department_cn_name,
  firstdeptcode, firstdept, seconddeptcode, seconddept,
  thirddeptcode, thirddept, fourthdeptcode, fourthdept,
  job_family, job_category, job_subcategory,
  target_credit, current_credit, personal_credit_completion_rate,
  dept_benchmark_completion_rate, credit_completion_date
) VALUES
(
  'TEST_DEMO_001', '测试员甲', 'DEPT_MIN_001',
  '云核心网产品数据开发团队（模块）/Cloud Core Network Product Data Development Team,CCN(Module)',
  'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
  '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
  '技术族', '软件类', '数据开发',
  80.00, 95.00, 100.00, 88.50, DATE_SUB(NOW(), INTERVAL 2 DAY)
),
(
  'TEST_DEMO_002', '测试员乙', 'DEPT_MIN_001',
  '云核心网产品数据开发团队（模块）/Cloud Core Network Product Data Development Team,CCN(Module)',
  'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
  '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
  '技术族', '软件类', '平台开发',
  80.00, 45.00, 56.25, 88.50, NULL
),
(
  'TEST_DEMO_003', '测试员丙', 'DEPT_MIN_002',
  '智能运维组/Intelligent O&M Team',
  'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
  '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
  '技术族', '软件类', '智能运维',
  100.00, 72.00, 72.00, 90.00, NULL
),
(
  'TEST_DEMO_004', '测试员丁', 'DEPT_MIN_003',
  '产品规划部/Product Planning',
  'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
  '106828', '云核心网产品线', '106829', '产品部', '106831', '产品管理部',
  '产品族', '产品类', '需求分析',
  90.00, 88.00, 97.78, 85.00, NULL
),
(
  'TEST_DEMO_005', '测试员戊', 'DEPT_MIN_004',
  '区域营销部/Regional Marketing',
  'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
  '106828', '云核心网产品线', '106829', '营销部', '106832', '市场营销部',
  '营销族', '营销类', '解决方案销售',
  100.00, 30.00, 30.00, 82.00, NULL
);
