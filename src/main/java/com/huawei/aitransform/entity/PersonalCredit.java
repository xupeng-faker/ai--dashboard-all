package com.huawei.aitransform.entity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 个人学分实体类
 */
public class PersonalCredit implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    private Long id;

    /**
     * 工号
     */
    private String employeeNumber;

    /**
     * 姓名
     */
    private String lastName;

    /**
     * 最小部门编号
     */
    private String lowestDeptNumber;

    /**
     * 最小部门名称
     */
    private String lowestDept;

    /**
     * 目标学分
     */
    private BigDecimal targetCredit;

    /**
     * 当前学分
     */
    private BigDecimal currentCredit;

    /**
     * 个人学分达成率
     */
    private BigDecimal personalCreditCompletionRate;

    /**
     * 部门最小标杆学分达成率
     */
    private BigDecimal deptBenchmarkCompletionRate;

    /**
     * 学分达成日期
     */
    private Date creditCompletionDate;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeNumber() {
        return employeeNumber;
    }

    public void setEmployeeNumber(String employeeNumber) {
        this.employeeNumber = employeeNumber;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getLowestDeptNumber() {
        return lowestDeptNumber;
    }

    public void setLowestDeptNumber(String lowestDeptNumber) {
        this.lowestDeptNumber = lowestDeptNumber;
    }

    public String getLowestDept() {
        return lowestDept;
    }

    public void setLowestDept(String lowestDept) {
        this.lowestDept = lowestDept;
    }

    public BigDecimal getTargetCredit() {
        return targetCredit;
    }

    public void setTargetCredit(BigDecimal targetCredit) {
        this.targetCredit = targetCredit;
    }

    public BigDecimal getCurrentCredit() {
        return currentCredit;
    }

    public void setCurrentCredit(BigDecimal currentCredit) {
        this.currentCredit = currentCredit;
    }

    public BigDecimal getPersonalCreditCompletionRate() {
        return personalCreditCompletionRate;
    }

    public void setPersonalCreditCompletionRate(BigDecimal personalCreditCompletionRate) {
        this.personalCreditCompletionRate = personalCreditCompletionRate;
    }

    public BigDecimal getDeptBenchmarkCompletionRate() {
        return deptBenchmarkCompletionRate;
    }

    public void setDeptBenchmarkCompletionRate(BigDecimal deptBenchmarkCompletionRate) {
        this.deptBenchmarkCompletionRate = deptBenchmarkCompletionRate;
    }

    public Date getCreditCompletionDate() {
        return creditCompletionDate;
    }

    public void setCreditCompletionDate(Date creditCompletionDate) {
        this.creditCompletionDate = creditCompletionDate;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public Date getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(Date updateTime) {
        this.updateTime = updateTime;
    }
}
