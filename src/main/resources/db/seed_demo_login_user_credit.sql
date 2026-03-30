-- =============================================================================
-- 演示登录用户个人学分（与前端 devMockAuth / demo-token 解析工号 E001234 一致）
-- =============================================================================
-- 解决：个人数据总览下钻提示「未获取到当前用户工号」——多为 t_personal_credit 无 E001234
-- 可重复执行（按 uk employee_number 冲突则更新）
-- 执行：mysql -h127.0.0.1 -uroot -p ai_transform < src/main/resources/db/seed_demo_login_user_credit.sql
-- =============================================================================

SET NAMES utf8mb4;

INSERT INTO t_personal_credit (
  employee_number, last_name, lowest_dept_number, lowest_dept,
  l0_department_code, l0_department_cn_name,
  firstdeptcode, firstdept, seconddeptcode, seconddept,
  thirddeptcode, thirddept, fourthdeptcode, fourthdept,
  job_family, job_category, job_subcategory,
  target_credit, current_credit, personal_credit_completion_rate,
  dept_benchmark_completion_rate, credit_completion_date
) VALUES (
  'E001234', '张三', '3001', '技术支撑组',
  '001', '华为技术有限公司',
  '1001', '云核心网运营部', '2001', '亚太运营支撑处',
  '3001', '技术支撑组', '3001', '技术支撑组',
  '管理族', '管理类', '行政管理',
  100.00, 85.00, 85.00, 90.00, NULL
)
ON DUPLICATE KEY UPDATE
  last_name = VALUES(last_name),
  lowest_dept_number = VALUES(lowest_dept_number),
  lowest_dept = VALUES(lowest_dept),
  l0_department_code = VALUES(l0_department_code),
  l0_department_cn_name = VALUES(l0_department_cn_name),
  firstdeptcode = VALUES(firstdeptcode),
  firstdept = VALUES(firstdept),
  seconddeptcode = VALUES(seconddeptcode),
  seconddept = VALUES(seconddept),
  thirddeptcode = VALUES(thirddeptcode),
  thirddept = VALUES(thirddept),
  fourthdeptcode = VALUES(fourthdeptcode),
  fourthdept = VALUES(fourthdept),
  job_family = VALUES(job_family),
  job_category = VALUES(job_category),
  job_subcategory = VALUES(job_subcategory),
  target_credit = VALUES(target_credit),
  current_credit = VALUES(current_credit),
  personal_credit_completion_rate = VALUES(personal_credit_completion_rate),
  dept_benchmark_completion_rate = VALUES(dept_benchmark_completion_rate),
  credit_completion_date = VALUES(credit_completion_date);
