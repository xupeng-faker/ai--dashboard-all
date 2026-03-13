package com.huawei.aitransform.service.impl;

import com.huawei.aitransform.entity.SchoolCreditDetailRequestVO;
import com.huawei.aitransform.entity.SchoolCreditDetailResponseVO;
import com.huawei.aitransform.entity.SchoolCreditDetailVO;
import com.huawei.aitransform.mapper.SchoolCreditDetailMapper;
import com.huawei.aitransform.service.SchoolCreditDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * AI School学分数据明细查询Service实现类
 */
@Service
public class SchoolCreditDetailServiceImpl implements SchoolCreditDetailService {

    @Autowired
    private SchoolCreditDetailMapper schoolCreditDetailMapper;

    @Override
    public SchoolCreditDetailResponseVO getCreditDetailList(SchoolCreditDetailRequestVO request) {
        // 计算分页偏移量
        int offset = (request.getPageNum() - 1) * request.getPageSize();

        // 查询数据列表
        List<SchoolCreditDetailVO> records = schoolCreditDetailMapper.getCreditDetailList(request, offset);

        // 查询总记录数
        Long total = schoolCreditDetailMapper.getCreditDetailCount(request);

        // 计算总页数
        int pages = (int) Math.ceil((double) total / request.getPageSize());

        // 组装响应
        SchoolCreditDetailResponseVO response = new SchoolCreditDetailResponseVO();
        response.setRecords(records);
        response.setTotal(total);
        response.setPageNum(request.getPageNum());
        response.setPageSize(request.getPageSize());
        response.setPages(pages);

        return response;
    }
}
