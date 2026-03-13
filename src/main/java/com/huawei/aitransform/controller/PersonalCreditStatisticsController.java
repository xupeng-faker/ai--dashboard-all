package com.huawei.aitransform.controller;

import com.huawei.aitransform.common.Result;
import com.huawei.aitransform.entity.CreditOverviewVO;
import com.huawei.aitransform.entity.CreditStatisticsResponseVO;
import com.huawei.aitransform.service.PersonalCreditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 个人学分统计Controller
 */
@RestController
@RequestMapping("/api/credit/statistics")
public class PersonalCreditStatisticsController {

    @Autowired
    private PersonalCreditService personalCreditService;

    /**
     * 获取职位学分总览
     */
    @GetMapping("/position")
    public ResponseEntity<Result<CreditStatisticsResponseVO>> getPositionStatistics(
            @RequestParam(required = false) String deptCode,
            @RequestParam(required = false) String role) {
        try {
            CreditStatisticsResponseVO result = personalCreditService.getPositionStatistics(deptCode, role);
            return ResponseEntity.ok(Result.success("查询成功", result));
        } catch (Exception e) {
            return ResponseEntity.ok(Result.error(500, "系统异常：" + e.getMessage()));
        }
    }

    /**
     * 获取部门学分总览
     * @param deptCode 部门编码
     */
    @GetMapping("/department")
    public ResponseEntity<Result<CreditStatisticsResponseVO>> getDepartmentStatistics(
            @RequestParam(required = false) String deptCode,
            @RequestParam(required = false) String role) {
        try {
            CreditStatisticsResponseVO result = personalCreditService.getDepartmentStatistics(deptCode, role);
            return ResponseEntity.ok(Result.success("查询成功", result));
        } catch (Exception e) {
            return ResponseEntity.ok(Result.error(500, "系统异常：" + e.getMessage()));
        }
    }
}
