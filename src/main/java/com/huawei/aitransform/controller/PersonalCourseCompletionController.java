package com.huawei.aitransform.controller;

import com.huawei.aitransform.common.Result;
import com.huawei.aitransform.entity.PersonalCourseCompletionResponseVO;
import com.huawei.aitransform.entity.UserAccountResponseVO;
import com.huawei.aitransform.service.PersonalCourseCompletionService;
import com.huawei.aitransform.service.UserConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

/**
 * 个人课程完成情况控制器
 */
@RestController
@RequestMapping("/personal-course")
public class PersonalCourseCompletionController {

    @Autowired
    private PersonalCourseCompletionService personalCourseCompletionService;

    @Autowired
    private UserConfigService userConfigService;

    /**
     * 查询个人课程完成情况。
     * 若带有请求参数 empNum，则查询该工号（看板明细姓名下钻，与行内员工一致）；否则从 Cookie 或 Bearer demo-token 解析当前用户。
     */
    @GetMapping("/completion")
    public ResponseEntity<Result<PersonalCourseCompletionResponseVO>> getPersonalCourseCompletion(
            HttpServletRequest request,
            @CookieValue(value = "account", required = false) String accountCookie,
            @RequestParam(value = "empNum", required = false) String empNumParam) {
        try {
            String empNum;
            // 看板明细「姓名」下钻会带 empNum：直接按该行员工查课程数据，不依赖门户 Cookie（与展示行数据一致）
            if (empNumParam != null && !empNumParam.trim().isEmpty()) {
                empNum = empNumParam.trim();
            } else {
                UserAccountResponseVO accountInfo = userConfigService.resolveCurrentUser(request, accountCookie);
                if (accountInfo == null || accountInfo.getEmpNum() == null || accountInfo.getEmpNum().trim().isEmpty()) {
                    return ResponseEntity.ok(Result.error(400, "未获取到用户信息，请先登录"));
                }
                empNum = accountInfo.getEmpNum().trim();
            }

            PersonalCourseCompletionResponseVO result = personalCourseCompletionService.getPersonalCourseCompletion(empNum);
            
            return ResponseEntity.ok(Result.success("查询成功", result));
        } catch (Exception e) {
            return ResponseEntity.ok(Result.error(500, "系统异常：" + e.getMessage()));
        }
    }
}

