
-- 个人学分表
CREATE TABLE `t_personal_credit` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `employee_number` varchar(50) NOT NULL COMMENT '工号',
  `last_name` varchar(100) DEFAULT NULL COMMENT '姓名',
  `lowest_dept_number` varchar(50) DEFAULT NULL COMMENT '最小部门编号',
  `lowest_dept` varchar(200) DEFAULT NULL COMMENT '最小部门名称',
  `target_credit` decimal(10,2) DEFAULT '0.00' COMMENT '目标学分',
  `current_credit` decimal(10,2) DEFAULT '0.00' COMMENT '当前学分',
  `personal_credit_completion_rate` decimal(5,2) DEFAULT '0.00' COMMENT '个人学分达成率',
  `dept_benchmark_completion_rate` decimal(5,2) DEFAULT '0.00' COMMENT '部门最小标杆学分达成率',
  `credit_completion_date` datetime DEFAULT NULL COMMENT '学分达成日期',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_number` (`employee_number`),
  KEY `idx_lowest_dept` (`lowest_dept_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='个人学分表';
