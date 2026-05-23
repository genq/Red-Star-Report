# Tasks

- [x] Task 1: 大学数据年份机制 — data_year字段替代硬编码年份
  - [x] SubTask 1.1: 修改universities表结构（增加data_year字段，去掉年份后缀）
  - [x] SubTask 1.2: 修改CSV模板（增加data_year列）
  - [x] SubTask 1.3: 修改大学查询API（自动取最新年份，返回availableYears）
  - [x] SubTask 1.4: 修改差距分析算法（始终取最新年份录取分）
  - [x] SubTask 1.5: 补充大学数据年份管理说明

- [x] Task 2: 邮箱验证=专业版+有效期2028-06-06
  - [x] SubTask 2.1: 修改注册API（membership_expires_at='2028-06-06 23:59:59'）
  - [x] SubTask 2.2: 修改邮箱验证API（验证后role升级为PRO，有效期确认为2028-06-06）
  - [x] SubTask 2.3: 修改会员规则说明（明确邮箱认证=专业版激活）
  - [x] SubTask 2.4: 修改needVerified函数（增加会员到期检查）

- [x] Task 3: API代码与Schema表名/字段名统一
  - [x] SubTask 3.1: 统一accounts表字段名（name/subjects/is_email_verified/membership_expires_at/status/graduation_status）
  - [x] SubTask 3.2: 替换所有SQL中的users→accounts
  - [x] SubTask 3.3: 修复currentUser()函数字段名
  - [x] SubTask 3.4: 修复初始数据INSERT语句
  - [x] SubTask 3.5: 修复Pinia Store类型定义
  - [x] SubTask 3.6: 修复API接口列表字段名
  - [x] SubTask 3.7: 修复迁移代码中的字段名
  - [x] SubTask 3.8: 修复验证规则和线框图中的字段名

- [x] Task 4: Schema补充缺失表和字段
  - [x] SubTask 4.1: 添加score_edit_logs表CREATE TABLE语句
  - [x] SubTask 4.2: 添加graduation_status和graduation_date字段到accounts表

- [x] Task 5: 补充管理员模块API实现代码
  - [x] SubTask 5.1: 用户管理（列表/角色修改/重置密码/禁用启用）
  - [x] SubTask 5.2: 考试管理（创建考试）
  - [x] SubTask 5.3: 学校管理（CRUD）
  - [x] SubTask 5.4: 系统设置（GET/PUT）
  - [x] SubTask 5.5: 年级升级（POST grade-up）
  - [x] SubTask 5.6: 备份管理（手动备份/备份列表）
  - [x] SubTask 5.7: 操作日志（列表/筛选/分页）

- [x] Task 6: 补充Layout组件规格+main.ts
  - [x] SubTask 6.1: 补充main.ts完整代码
  - [x] SubTask 6.2: 补充App.vue代码
  - [x] SubTask 6.3: 补充MainLayout.vue详细规格（侧边栏菜单/顶部导航/移动端适配）
  - [x] SubTask 6.4: 补充AdminLayout.vue详细规格

# Task Dependencies
- All tasks completed independently
