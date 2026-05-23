# Tasks

- [x] Task 1: 修复P0级安全问题 — SQLite文件保护、JWT默认值、登录限流、PHP扩展检查
  - [x] SubTask 1.1: 在Nginx配置中添加/data/和/backups/目录禁止访问规则
  - [x] SubTask 1.2: 在config.php中添加JWT_SECRET默认值检测和自动随机生成
  - [x] SubTask 1.3: 实现登录失败次数限制（IP级，5次失败锁定15分钟）
  - [x] SubTask 1.4: 在config.php启动时检查PDO/SQLite/JSON/mbstring/OpenSSL扩展

- [x] Task 2: 修复P1级前端样式问题 — 暗色主题、响应式、酷炫效果、Element Plus桥接
  - [x] SubTask 2.1: 补充完整的暗色主题CSS变量（20+个变量 + Element Plus覆盖）
  - [x] SubTask 2.2: 定义响应式断点（sm/md/lg/xl）及使用规范
  - [x] SubTask 2.3: 明确酷炫效果实现方案（CSS keyframes定义、countup.js用法）
  - [x] SubTask 2.4: 补充Element Plus主题桥接代码
  - [x] SubTask 2.5: 补充Chart.js暗色模式适配逻辑

- [x] Task 3: 修复P1级后端问题 — 错误日志、CORS、SQLite重试、目录权限、路由分组
  - [x] SubTask 3.1: 添加PHP错误日志配置（log_errors + error_log路径）
  - [x] SubTask 3.2: 补充CORS生产环境白名单实现方式
  - [x] SubTask 3.3: 补充前端SQLite并发重试逻辑
  - [x] SubTask 3.4: 补充data/backups目录权限说明（Windows vs Linux）
  - [x] SubTask 3.5: 补充路由按模块分组建议（已提供建议，未强制修改代码结构）

- [x] Task 4: 修复P1级架构问题 — 路由守卫、404页面、环境变量
  - [x] SubTask 4.1: 补充router.beforeEach路由守卫完整实现
  - [x] SubTask 4.2: 补充NotFoundView.vue和通配路由配置
  - [x] SubTask 4.3: 补充.env环境变量配置（开发/生产）

- [x] Task 5: P2级优化 — 会员系统简化、自动备份、密码复杂度、CSV超时、开发计划更新
  - [x] SubTask 5.1: 补充会员系统简化建议（适用于小范围场景）
  - [x] SubTask 5.2: 补充自动备份机制（每次写入时检查，每天首次备份）
  - [x] SubTask 5.3: 补充密码复杂度建议（6→8位）
  - [x] SubTask 5.4: CSV导入请求单独设置超时30秒
  - [x] SubTask 5.5: 更新§13开发计划中的过时描述

# Task Dependencies
- [Task 2] depends on [Task 1]（样式修复需要先确保基础安全）
- [Task 3] depends on [Task 1]（后端修复需要先确保基础安全）
- [Task 4] is independent
- [Task 5] is independent
