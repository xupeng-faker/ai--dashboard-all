package com.huawei.aitransform.mapper;

import com.huawei.aitransform.entity.PersonalCredit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 个人学分Mapper接口
 */
@Mapper
public interface PersonalCreditMapper {

    /**
     * 根据工号查询个人学分信息
     * @param employeeNumber 工号
     * @return 个人学分信息
     */
    PersonalCredit getByEmployeeNumber(@Param("employeeNumber") String employeeNumber);

    /**
     * 插入或更新个人学分信息
     * @param personalCredit 个人学分信息
     * @return 影响行数
     */
    int insertOrUpdate(PersonalCredit personalCredit);

    /**
     * 批量更新部门标杆学分达成率
     * @param lowestDeptNumber 最小部门编号
     * @param benchmarkRate 标杆达成率
     */
    void updateBenchmarkRateByDept(@Param("lowestDeptNumber") String lowestDeptNumber, @Param("benchmarkRate") java.math.BigDecimal benchmarkRate);

    /**
     * 查询某部门下的最大个人学分达成率
     * @param lowestDeptNumber 最小部门编号
     * @return 最大达成率
     */
    java.math.BigDecimal getMaxCompletionRateByDept(@Param("lowestDeptNumber") String lowestDeptNumber);

    /**
     * 获取所有有变动的最小部门编号列表（基于最近更新的记录）
     * 实际业务中可能直接遍历所有部门，或者在SyncTask中处理
     * 这里提供一个查询所有部门编号的方法
     */
    List<String> getAllLowestDeptNumbers();
}
