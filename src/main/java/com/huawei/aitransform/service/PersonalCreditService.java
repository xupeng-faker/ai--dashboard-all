package com.huawei.aitransform.service;

import com.huawei.aitransform.entity.CoursePlanningInfoVO;
import com.huawei.aitransform.entity.DeptCourseSelection;
import com.huawei.aitransform.entity.EmployeeSyncDataVO;
import com.huawei.aitransform.entity.PersonalCredit;
import com.huawei.aitransform.mapper.CoursePlanningInfoMapper;
import com.huawei.aitransform.mapper.PersonalCourseCompletionMapper;
import com.huawei.aitransform.mapper.PersonalCreditMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 个人学分服务类
 */
@Service
public class PersonalCreditService {

    private static final Logger logger = LoggerFactory.getLogger(PersonalCreditService.class);

    @Autowired
    private PersonalCreditMapper personalCreditMapper;

    @Autowired
    private PersonalCourseCompletionMapper personalCourseCompletionMapper;

    @Autowired
    private CoursePlanningInfoMapper coursePlanningInfoMapper;

    /**
     * 根据工号获取个人学分概览
     * @param employeeNumber 工号
     * @return 个人学分信息
     */
    public PersonalCredit getPersonalCreditOverview(String employeeNumber) {
        return personalCreditMapper.getByEmployeeNumber(employeeNumber);
    }

    /**
     * 同步计算所有用户的个人学分
     */
    @Transactional(rollbackFor = Exception.class)
    public void syncAllPersonalCredits() {
        logger.info("Start syncing personal credits...");

        // 1. 获取最新周期ID
        Integer latestPeriodId = personalCourseCompletionMapper.getLatestPeriodId();
        if (latestPeriodId == null) {
            logger.warn("No period_id found in t_employee_sync.");
            return;
        }

        // 2. 获取该周期的所有员工
        List<EmployeeSyncDataVO> employees = personalCourseCompletionMapper.getEmployeesByPeriodId(latestPeriodId);
        if (employees == null || employees.isEmpty()) {
            logger.info("No employees found for period_id: {}", latestPeriodId);
            return;
        }

        // 3. 预加载课程信息和部门选课信息
        // 3.1 所有课程信息 (Map: ID -> Credit)
        List<CoursePlanningInfoVO> allCourses = coursePlanningInfoMapper.getAllCoursePlanningInfo();
        Map<Integer, BigDecimal> courseCreditMap = new HashMap<>();
        Map<String, BigDecimal> courseNumberCreditMap = new HashMap<>(); // Number -> Credit
        
        for (CoursePlanningInfoVO course : allCourses) {
            BigDecimal credit = BigDecimal.ZERO;
            try {
                if (course.getCredit() != null && !course.getCredit().isEmpty()) {
                    credit = new BigDecimal(course.getCredit());
                }
            } catch (Exception e) {
                logger.warn("Invalid credit format for course {}: {}", course.getId(), course.getCredit());
            }
            if (course.getId() != null) {
                courseCreditMap.put(course.getId(), credit);
            }
            if (course.getCourseNumber() != null) {
                courseNumberCreditMap.put(course.getCourseNumber(), credit);
            }
        }

        // 3.2 所有部门选课信息 (Map: DeptCode -> List<CourseID>)
        List<DeptCourseSelection> allDeptSelections = coursePlanningInfoMapper.getAllDeptSelections();
        Map<String, List<Integer>> deptSelectionMap = new HashMap<>();
        for (DeptCourseSelection selection : allDeptSelections) {
            List<Integer> courseIds = new ArrayList<>();
            if (selection.getCourseSelections() != null && !selection.getCourseSelections().trim().isEmpty()) {
                String[] ids = selection.getCourseSelections().split(",");
                for (String idStr : ids) {
                    try {
                        courseIds.add(Integer.parseInt(idStr.trim()));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
            }
            deptSelectionMap.put(selection.getDeptCode(), courseIds);
        }

        // 4. 遍历员工计算学分
        List<String> employeeNumbers = employees.stream()
                .map(EmployeeSyncDataVO::getEmployeeNumber)
                .collect(Collectors.toList());
        
        // 批量查询现有记录
        Map<String, PersonalCredit> existingCreditMap = new HashMap<>();
        if (!employeeNumbers.isEmpty()) {
            int batchSize = 1000;
            for (int i = 0; i < employeeNumbers.size(); i += batchSize) {
                int end = Math.min(i + batchSize, employeeNumbers.size());
                List<String> subList = employeeNumbers.subList(i, end);
                List<PersonalCredit> existingList = personalCreditMapper.getByEmployeeNumbers(subList);
                for (PersonalCredit pc : existingList) {
                    existingCreditMap.put(pc.getEmployeeNumber(), pc);
                }
            }
        }

        List<PersonalCredit> toSaveList = new ArrayList<>();
        for (EmployeeSyncDataVO employee : employees) {
            PersonalCredit credit = calculateEmployeeCredit(employee, courseCreditMap, courseNumberCreditMap, deptSelectionMap, allCourses, existingCreditMap);
            if (credit != null) {
                toSaveList.add(credit);
            }
        }

        // 批量保存
        if (!toSaveList.isEmpty()) {
            int batchSize = 1000;
            for (int i = 0; i < toSaveList.size(); i += batchSize) {
                int end = Math.min(i + batchSize, toSaveList.size());
                personalCreditMapper.batchInsertOrUpdate(toSaveList.subList(i, end));
            }
        }

        // 5. 计算并更新部门标杆
        updateDeptBenchmarks();
        
        logger.info("Finished syncing personal credits for {} employees.", employees.size());
    }

    private PersonalCredit calculateEmployeeCredit(EmployeeSyncDataVO employee, 
                                                Map<Integer, BigDecimal> courseCreditMap,
                                                Map<String, BigDecimal> courseNumberCreditMap,
                                                Map<String, List<Integer>> deptSelectionMap,
                                                List<CoursePlanningInfoVO> allCourses,
                                                Map<String, PersonalCredit> existingCreditMap) {
        String empNum = employee.getEmployeeNumber();
        String fourthDeptCode = employee.getFourthdeptcode();

        // 计算目标学分
        BigDecimal targetCredit = BigDecimal.ZERO;
        List<String> targetCourseNumbers = new ArrayList<>();
        
        List<Integer> selectedCourseIds = deptSelectionMap.get(fourthDeptCode);
        
        // 如果部门没有选课，或者是空列表，默认使用所有课程？
        // 原逻辑：if (targetCourseIds.isEmpty()) useAllCourses = true;
        // 这里沿用原逻辑：如果没选课，则是所有课程
        boolean useAllCourses = (selectedCourseIds == null || selectedCourseIds.isEmpty());

        if (useAllCourses) {
            for (CoursePlanningInfoVO course : allCourses) {
                BigDecimal credit = BigDecimal.ZERO;
                try {
                     if (course.getCredit() != null) credit = new BigDecimal(course.getCredit());
                } catch (Exception e) {}
                targetCredit = targetCredit.add(credit);
                targetCourseNumbers.add(course.getCourseNumber());
            }
        } else {
            for (Integer courseId : selectedCourseIds) {
                BigDecimal credit = courseCreditMap.getOrDefault(courseId, BigDecimal.ZERO);
                targetCredit = targetCredit.add(credit);
                // 找到对应的courseNumber
                allCourses.stream().filter(c -> c.getId().equals(courseId)).findFirst()
                        .ifPresent(c -> targetCourseNumbers.add(c.getCourseNumber()));
            }
        }

        // 计算当前学分
        BigDecimal currentCredit = BigDecimal.ZERO;
        if (!targetCourseNumbers.isEmpty()) {
            List<String> completedCourseNumbers = personalCourseCompletionMapper.getCompletedCourseNumbers(empNum, targetCourseNumbers);
            for (String courseNum : completedCourseNumbers) {
                BigDecimal credit = courseNumberCreditMap.getOrDefault(courseNum, BigDecimal.ZERO);
                currentCredit = currentCredit.add(credit);
            }
        }

        // 计算达成率
        BigDecimal completionRate = BigDecimal.ZERO;
        if (targetCredit.compareTo(BigDecimal.ZERO) > 0) {
            completionRate = currentCredit.divide(targetCredit, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }

        // 准备保存数据
        PersonalCredit existing = existingCreditMap.get(empNum);
        PersonalCredit toSave = new PersonalCredit();
        toSave.setEmployeeNumber(empNum);
        toSave.setLastName(employee.getLastName());
        toSave.setLowestDeptNumber(employee.getLowestDeptNumber());
        toSave.setLowestDept(employee.getLowestDept());
        toSave.setTargetCredit(targetCredit);
        toSave.setCurrentCredit(currentCredit);
        toSave.setPersonalCreditCompletionRate(completionRate);
        toSave.setDeptBenchmarkCompletionRate(BigDecimal.ZERO); // 先置0，后续统一更新

        // 处理达成日期
        if (existing != null) {
            toSave.setCreditCompletionDate(existing.getCreditCompletionDate());
        }
        
        // 如果当前已达标（current >= target）且之前没有日期，则设置当前时间
        // 注意：targetCredit可能为0，需处理
        if (targetCredit.compareTo(BigDecimal.ZERO) > 0 && currentCredit.compareTo(targetCredit) >= 0) {
            if (toSave.getCreditCompletionDate() == null) {
                toSave.setCreditCompletionDate(new Date());
            }
        } else if (targetCredit.compareTo(BigDecimal.ZERO) == 0 && currentCredit.compareTo(BigDecimal.ZERO) >= 0) {
             // 目标为0，视为达标？通常应该有学分。这里假设不处理或视为达标
             if (toSave.getCreditCompletionDate() == null) {
                 toSave.setCreditCompletionDate(new Date());
             }
        }

        return toSave;
    }

    private void updateDeptBenchmarks() {
        // 1. 获取所有涉及的最小部门
        List<String> lowestDeptNumbers = personalCreditMapper.getAllLowestDeptNumbers();
        
        // 2. 遍历部门，计算最大达成率并更新
        for (String deptNum : lowestDeptNumbers) {
            BigDecimal maxRate = personalCreditMapper.getMaxCompletionRateByDept(deptNum);
            if (maxRate == null) maxRate = BigDecimal.ZERO;
            
            personalCreditMapper.updateBenchmarkRateByDept(deptNum, maxRate);
        }
    }
}
