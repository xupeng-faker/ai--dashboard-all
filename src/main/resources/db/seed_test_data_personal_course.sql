-- =============================================================================
-- 测试用假数据 — 个人训战 / 课程完成（联调姓名下钻 PersonalTrainingDetail）
-- =============================================================================
-- 必须先存在以下表及基础数据（建议执行 db/personal_course_init.sql 全文）：
--   ai_course_planning_info, dept_course_selections, t_employee_sync,
--   t_micro_study_info_sync, t_mooc_study_info_sync
-- 可与 seed_test_data.sql 同时使用：工号 TEST_DEMO_001~003 与学分表一致
-- 执行：mysql -h127.0.0.1 -uroot -p ai_transform < src/main/resources/db/seed_test_data_personal_course.sql
-- =============================================================================

SET NAMES utf8mb4;

DELETE FROM t_micro_study_info_sync WHERE emp_num LIKE 'TEST_DEMO_%';
DELETE FROM t_mooc_study_info_sync WHERE emp_num LIKE 'TEST_DEMO_%';
DELETE FROM t_employee_sync WHERE employee_number LIKE 'TEST_DEMO_%';

INSERT INTO dept_course_selections (dept_code, dept_name, course_selections)
VALUES ('3001', '技术支撑组', '1,2,3,4,5,6,7')
ON DUPLICATE KEY UPDATE
  dept_name = VALUES(dept_name),
  course_selections = VALUES(course_selections);

INSERT INTO dept_course_selections (dept_code, dept_name, course_selections)
VALUES ('3003', 'AI平台组', '1,2,3,4,5,6,7')
ON DUPLICATE KEY UPDATE
  dept_name = VALUES(dept_name),
  course_selections = VALUES(course_selections);

INSERT INTO t_employee_sync (
  employee_number, last_name,
  l0_department_code, l0_department_cn_name,
  firstdeptcode, firstdept, seconddeptcode, seconddept,
  thirddeptcode, thirddept, fourthdeptcode, fourthdept,
  period_id
) VALUES
('TEST_DEMO_001', '测试员甲',
 '001', '华为技术有限公司',
 '1001', '云核心网运营部', '2001', '亚太运营支撑处',
 '3001', '技术支撑组', '3001', '技术支撑组',
 1),
('TEST_DEMO_002', '测试员乙',
 '001', '华为技术有限公司',
 '1001', '云核心网运营部', '2001', '亚太运营支撑处',
 '3001', '技术支撑组', '3001', '技术支撑组',
 1),
('TEST_DEMO_003', '测试员丙',
 '001', '华为技术有限公司',
 '1002', '云核心网研发部', '2002', '网络云平台研发室',
 '3003', 'AI平台组', '3003', 'AI平台组',
 1);

INSERT INTO t_micro_study_info_sync (emp_num, course_team_code, is_pass) VALUES
('TEST_DEMO_001', 'AI001', '1'),
('TEST_DEMO_001', 'AI003', '1'),
('TEST_DEMO_001', 'AI005', '1');

INSERT INTO t_mooc_study_info_sync (emp_num, course_team_code, is_pass) VALUES
('TEST_DEMO_001', 'AI002', '1');

INSERT INTO t_micro_study_info_sync (emp_num, course_team_code, is_pass) VALUES
('TEST_DEMO_002', 'AI001', '1'),
('TEST_DEMO_002', 'AI003', '1'),
('TEST_DEMO_002', 'AI005', '1'),
('TEST_DEMO_002', 'AI007', '1');

INSERT INTO t_mooc_study_info_sync (emp_num, course_team_code, is_pass) VALUES
('TEST_DEMO_002', 'AI002', '1'),
('TEST_DEMO_002', 'AI004', '1'),
('TEST_DEMO_002', 'AI006', '1');

INSERT INTO t_micro_study_info_sync (emp_num, course_team_code, is_pass) VALUES
('TEST_DEMO_003', 'AI001', '1'),
('TEST_DEMO_003', 'AI002', '1');
