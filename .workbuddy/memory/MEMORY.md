# 阳光学情分析系统 - 项目长期记忆

## 项目基础
- 系统名称：阳光学情分析系统（内部代号 Red-Star）
- 类型：面向安徽省马鞍山市高中生的个人学情分析与目标管理系统
- 核心定位：主要为老板儿子打造，顺便分享给同学使用，小规模（几十人级别）
- 核心原则：零部署 / 便携迁移 / 干净高效
- 技术栈：PHP 8.3 + SQLite + Vue 3 + Vite + Element Plus + Chart.js
- 开发模型：GLM-5.1

## 开发环境
- 本地宝塔 Nginx + PHP 8.3
- 网站目录：D:/wwwroot/rs.cn
- 测试域名：rs.cn（本地 hosts，无 SSL，HTTP）
- 工作空间：d:\AiWork\理科\Red-Star学情报告
- 开发文档：Red-Star学情报告-开发文档.md（v6.0, 2026-04-29）

## 管理员账号
- 超级管理员：superadmin / 18955579998 / hy@chge.cn / 密码 211985316
- 管理员：admin / 15805555559 / hy@uicn.cn / 密码 211985316
- 内置账号 id=1,2 受保护，不可删除

## 关键设计决策
- 域名 rs.cn 为测试域名，生产环境需替换并配 SSL
- 项目名：对外"阳光学情分析系统"，代码用 Red-Star
- 注册必填：用户名+姓名+手机号+邮箱+密码+学校+年级+班级
- 三种方式登录：用户名/手机号/邮箱（后端自动识别）
- 权限分层：超管可禁用管理员但不能禁自己；管理员可禁用学生
- 大学数据导入：CSV 批量导入，之前版本数据因错乱被废弃需重新导入
- 学情报告导出：HTML 预览 + 浏览器打印保存 PDF（不用后端 PDF 库）
- 新高考科目体系：3+1+2，但简化为**预设组合+成绩自动识别**
  - 预设5种组合：物化生/历政地/物化地/物化政/自由组合（subject_presets 表）
  - 学生无需手动选科，录入成绩时系统自动识别选科组合
  - 也可在个人资料页手动选择预设组合
- 学校预设5所马鞍山高中：二中/中加双语/红星/八中/二十二中
- Schema 迁移机制：版本号追踪 + 增量迁移（getDB 时自动执行）
- 消息通知：站内通知，轮询 60 秒，无 WebSocket
- 前端风格：酷炫（渐变背景+粒子动画+发光效果+数字跳动）
- 系统有首页/落地页：展示系统功能，未登录可见

## 审计修复记录（V5.0, 2026-04-29）
- 18项审计问题全部修复，文档升级到V5.0（Schema v4）
- P0修复：bcrypt真实hash、JWT base64url对称编码、Nginx /api/直通PHP-FPM、PHP sort()返回bool修复、migrateDB同步v3+v4
- P1修复：动态路由参数解析、忘记密码（邮箱自助+管理员重置，发邮件点链接）、SMTP配置模块（settings表驱动+超管后台）、mail.php完整规范（fsockopen零依赖）、Pinia stores结构、API分页格式、成绩分析算法定义、版本号统一V5.0、个人资料更新字段权限
- P2修复：SubjectSetupView路由、报告标题改系统名、needAuth()返回用户对象、CORS生产配置说明
- 新增表：password_resets（密码重置令牌）
- 新增迁移：v4（password_resets表+settings SMTP项）
- 新增页面：ForgotPasswordView.vue、ResetPasswordView.vue
- 新增接口：forgot-password、reset-password、admin/smtp（GET/PUT/test）

## 考试系统重构（V6.0, 2026-04-29）
- **去掉班型排名**：stream_rank 从 scores/rank_goals/goal_results 三表移除，前端/API 全部清理
- **考试系统重构**：preset_exams + user_exams → 单一 exams 表
  - exams 表结构化字段：academic_year/grade/semester/exam_type/sub_type
  - 唯一性约束：UNIQUE(academic_year, grade, semester, exam_type, sub_type)
  - 考试类型：月考(按月份)/期中(每学期1次)/期末(每学期1次)/模拟(一模/二模/三模)
  - 月考月份：上学期→9/10/11/12月，下学期→2/3/4/5月
  - 考试名称自动生成：如"2025-2026学年高一上学期期中考试"
- scores 表：user_exam_id → exam_id，直接关联 exams 表
- goal_results 表：user_exam_id → exam_id
- 删除表：preset_exams、user_exams
- 新增迁移：v5（旧表数据迁移到新表+旧表删除）
- Schema version 升到 5，文档版本升到 V6.0
- API 变更：/api/user-exams 删除，/api/preset-exams → /api/exams，/api/admin/preset-exams → /api/admin/exams
- 前端变更：成绩录入页从"预设考试下拉"改为"年级+学期筛选→考试列表选择"

## V6.0 开发文档审查（2026-04-29）
- 完成全面审查，输出独立报告文件：开发文档审查报告-V6.0.md
- P0级7项：Schema语法错误(password_resets)、前端页面无实现规格、管理后台8页零规格、API全部伪代码占位、缺Dashboard数据接口、忘记密码页无规格、v5迁移外键违规
- P1级8项：组件架构未定义、组件级样式缺失、Chart.js配置缺失、业务逻辑漏洞、TypeScript类型缺失、前端依赖未锁定、部署配置不完整、通知前端细节不足
- P2级6项：空状态设计、错误处理规范、数据导出规格、移动端适配、操作确认规范、日志记录范围
- 结论：当前文档不足以让另一工程师完美开发，需大量补充实现级规格
- 后续：老板安排其他工程师根据审查报告继续完善文档
