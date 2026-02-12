-- Mock Data for t_personal_credit table
-- Department Level 4 (fourthdept) is used for department statistics under Cloud Core Network (106828)

-- Clear existing mock data (optional, be careful in production)
-- DELETE FROM t_personal_credit WHERE employee_number LIKE 'MOCK%';

-- 1. 研发管理部 (Dept_001) - 软件类
-- 达标 (100/80)
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK001', '张三', '100001', '研发一部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
    '软件类', 'Java开发',
    80, 100, 100.00,
    90.00, NOW(), NOW()
);

-- 未达标 (50/80) - 预警
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK002', '李四', '100001', '研发一部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
    '软件类', 'C++开发',
    80, 50, 62.50,
    90.00, NOW(), NOW()
);

-- 专家 (120/100)
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK003', '王五专家', '100001', '研发一部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
    '软件类(专家)', '架构师',
    100, 120, 100.00,
    90.00, NOW(), NOW()
);

-- 2. 研发管理部 (Dept_001) - 测试类
-- 达标 (90/90)
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK004', '赵六', '100002', '测试部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '研发部', '106830', '研发管理部',
    '测试类', '自动化测试',
    90, 90, 100.00,
    95.00, NOW(), NOW()
);

-- 3. 产品管理部 (Dept_002) - 产品类
-- 干部 (150/120)
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK005', '孙七干部', '100003', '产品规划部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '产品部', '106831', '产品管理部',
    '产品类(干部)', '产品规划',
    120, 150, 100.00,
    88.00, NOW(), NOW()
);

-- 未达标 (20/100) - 严重滞后
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK006', '周八', '100003', '产品规划部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '产品部', '106831', '产品管理部',
    '产品类', '需求分析',
    100, 20, 20.00,
    88.00, NOW(), NOW()
);

-- 4. 市场营销部 (Dept_003) - 营销类
-- 主管 (110/100)
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK007', '吴九主管', '100004', '区域营销部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '营销部', '106832', '市场营销部',
    '营销类(主管)', '区域销售',
    100, 110, 100.00,
    92.00, NOW(), NOW()
);

-- 达标 (105/100)
INSERT INTO t_personal_credit (
    employee_number, last_name, lowest_dept_number, lowest_dept,
    l0_department_code, l0_department_cn_name, firstdeptcode, firstdept,
    seconddeptcode, seconddept, thirddeptcode, thirddept, fourthdeptcode, fourthdept,
    job_category, job_subcategory,
    target_credit, current_credit, personal_credit_completion_rate,
    dept_benchmark_completion_rate, create_time, update_time
) VALUES (
    'MOCK008', '郑十', '100004', '区域营销部',
    'ICT_BG', 'ICT BG', '100000', 'ICT产品与解决方案',
    '106828', '云核心网产品线', '106829', '营销部', '106832', '市场营销部',
    '营销类', '解决方案销售',
    100, 105, 100.00,
    92.00, NOW(), NOW()
);
