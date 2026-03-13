package com.huawei.aitransform.entity;

import java.io.Serializable;
import java.util.List;

/**
 * AI School学分数据明细查询响应VO
 */
public class SchoolCreditDetailResponseVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 数据列表
     */
    private List<SchoolCreditDetailVO> records;

    /**
     * 总记录数
     */
    private Long total;

    /**
     * 当前页码
     */
    private Integer pageNum;

    /**
     * 每页大小
     */
    private Integer pageSize;

    /**
     * 总页数
     */
    private Integer pages;

    public SchoolCreditDetailResponseVO() {
    }

    public List<SchoolCreditDetailVO> getRecords() {
        return records;
    }

    public void setRecords(List<SchoolCreditDetailVO> records) {
        this.records = records;
    }

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }

    public Integer getPageNum() {
        return pageNum;
    }

    public void setPageNum(Integer pageNum) {
        this.pageNum = pageNum;
    }

    public Integer getPageSize() {
        return pageSize;
    }

    public void setPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }

    public Integer getPages() {
        return pages;
    }

    public void setPages(Integer pages) {
        this.pages = pages;
    }
}
