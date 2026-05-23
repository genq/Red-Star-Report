# 阳光学情报告 (Red-Star) — Code Wiki

> **版本**: 7.5.2 | **代号**: Red-Star | **最后更新**: 2026-05-06

---

## 一、项目概述

阳光学情报告（Red-Star Academic Report Platform）是一套面向高中阶段学生、教师和管理员的**学情数据分析与志愿填报辅助系统**。系统以考试成绩管理为核心，提供成绩录入、趋势分析、排名目标追踪、大学志愿匹配、志愿分析报告等功能，同时具备完整的用户管理、权限控制和运维工具。

### 核心特性

| 特性 | 说明 |
|------|------|
| 零外部依赖 | 纯 PHP + SQLite，无需 Composer / npm / MySQL |
| 免部署免配置 | 复制到 PHP 环境即可运行，数据库自动创建与迁移 |
| 模块化架构 | API 入口按模块拆分为 10 个路由文件，`index.php` 仅做引导分发 |
| 前后端一体 | PHP 渲染外壳 + 原生 JS SPA，无构建步骤 |
| 自动备份 | 每日自动 SQLite 数据库备份 |
| JWT 认证 | 自实现 JWT 令牌，支持 Cookie 双模式 |

---

## 二、项目架构

### 2.1 目录结构

```
rs.uicn.cn/                     # Web 根目录
├── index.php                   # 主应用入口（SPA 壳，需登录）
├── login.php                   # 登录/注册/验证页
├── assets/
│   ├── app.js                  # 前端 SPA 逻辑（~2700行）
│   └── style.css               # 全局样式
├── api/
│   ├── config.php              # 核心配置 + 全局函数库
│   ├── index.php               # API 引导入口（路由分发 + include）
│   ├── routes/                 # 模块路由文件（按功能拆分）
│   │   ├── common.routes.php   # 公共路由（验证码/设置/更新记录/选项）
│   │   ├── auth.routes.php     # 认证路由（注册/登录/验证/重置密码）
│   │   ├── profile.routes.php  # 个人信息路由
│   │   ├── dashboard.routes.php # 仪表盘路由
│   │   ├── scores.routes.php   # 成绩路由（录入/管理/趋势/统计/分析）
│   │   ├── exams.routes.php    # 考试路由
│   │   ├── goals.routes.php    # 排名目标路由
│   │   ├── universities.routes.php # 大学库+目标大学路由
│   │   ├── preference.routes.php   # 志愿分析路由
│   │   └── admin.routes.php    # 管理员+通知+工单路由
│   ├── routes.php              # 路由定义（MVC 重构版，未启用）
│   ├── schema.sql              # 数据库建表脚本
│   ├── check_db.php            # 数据库调试工具
│   ├── import_data_web.php     # 大学数据 Web 导入脚本
│   ├── import_uni_data.php     # 大学数据 CLI 导入脚本
│   ├── import_universities_2025.sql  # 2025年安徽高考大学数据
│   ├── update_university_types.php   # 大学类型自动识别更新工具
│   ├── Core/
│   │   ├── Router.php          # 路由器（MVC 重构版）
│   │   └── MiddlewarePipeline.php    # 中间件管道
│   ├── Middlewares/
│   │   ├── AuthMiddleware.php  # 登录验证中间件
│   │   ├── VerifiedMiddleware.php    # 邮箱验证+会员检查中间件
│   │   └── AdminMiddleware.php # 管理员权限中间件
│   └── Controllers/            # 控制器（MVC 重构版，仅 AuthController 完整实现）
│       ├── AuthController.php
│       ├── AdminController.php
│       ├── CommonController.php
│       ├── DashboardController.php
│       ├── ExamController.php
│       ├── GoalController.php
│       ├── NotificationController.php
│       ├── PreferenceController.php
│       ├── ProfileController.php
│       ├── ScoreController.php
│       └── UniversityController.php
├── data/
│   ├── redstar.db              # SQLite 数据库（自动创建）
│   └── php_errors.log          # PHP 错误日志
└── backups/                    # 自动/手动备份目录
    ├── auto_YYYYMMDD.db        # 每日自动备份
    └── manual_YYYYMMDD_HHMMSS.db  # 手动备份
```

### 2.2 架构模式

系统采用**模块化 PHP API + 原生 JS SPA** 混合架构：

```
┌──────────────────────────────────────────────────────────┐
│                     浏览器                                │
│  login.php ──→ index.php (PHP渲染壳 + JS SPA)            │
│       │              │                                    │
│       └──────────────┼── fetch('/api/...') ──→           │
│                      │                                    │
└──────────────────────┼────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              api/index.php (引导入口)                      │
│  ┌─────────────────────────────────────────────────┐     │
│  │  config.php (配置 + 全局函数)                     │     │
│  │  ├── 常量定义 (DB/JWT/SMTP/站点)                  │     │
│  │  ├── 数据库连接 + 迁移 (getDB)                    │     │
│  │  ├── JWT 生成/验证                                │     │
│  │  ├── 认证辅助 (me/needAuth/needAdmin...)          │     │
│  │  ├── 邮件发送 (sendMail/sendVerificationEmail...) │     │
│  │  ├── 登录限流                                    │     │
│  │  └── 工具函数 (ok/err/logAction/autoBackup...)    │     │
│  └─────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────┐     │
│  │  routes/*.routes.php (模块路由文件)               │     │
│  │  ├── common.routes.php    公共接口               │     │
│  │  ├── auth.routes.php      认证模块               │     │
│  │  ├── profile.routes.php   个人信息               │     │
│  │  ├── dashboard.routes.php 仪表盘                 │     │
│  │  ├── scores.routes.php    成绩模块               │     │
│  │  ├── exams.routes.php     考试模块               │     │
│  │  ├── goals.routes.php     目标模块               │     │
│  │  ├── universities.routes.php  大学模块           │     │
│  │  ├── preference.routes.php 志愿分析              │     │
│  │  └── admin.routes.php     管理后台+通知+工单      │     │
│  └─────────────────────────────────────────────────┘     │
│                      │                                    │
│                      ▼                                    │
│              SQLite (data/redstar.db)                     │
└──────────────────────────────────────────────────────────┘
```

### 2.3 路由加载机制

`api/index.php` 作为引导入口，负责：
1. 加载 `config.php`（全局函数和配置）
2. 解析请求路径和方法
3. 处理 CORS
4. 按顺序 `include` 10 个模块路由文件
5. 未匹配任何路由时返回 404

每个路由文件中的 `if` 块共享 `$routePath`、`$method`、`$input` 等变量，匹配成功后通过 `ok()`/`err()` 输出响应并终止执行。

### 2.4 双架构说明

项目存在两套路由架构：

| 架构 | 入口文件 | 状态 | 说明 |
|------|---------|------|------|
| **模块化** | `api/index.php` + `routes/*.routes.php` | ✅ 生产使用 | 路由按模块拆分为 10 个文件，入口仅做引导分发 |
| **MVC 重构版** | `api/routes.php` + Controllers | ⚠️ 未完成 | 仅 `AuthController` 完整实现，其余 Controller 为空壳 |

---

## 三、数据库设计

### 3.1 技术选型

- **引擎**: SQLite 3（文件数据库 `data/redstar.db`）
- **模式**: WAL（Write-Ahead Logging），支持并发读
- **迁移**: 内置于 `config.php` 的 `getDB()` 函数，首次访问自动建表，版本号驱动增量迁移

### 3.2 数据表一览

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `db_meta` | 数据库元信息 | `key`, `value` (含 version) |
| `schools` | 学校信息 | `id`, `name`, `address`, `contact` |
| `accounts` | 用户账号 | `id`, `email`, `name`, `role`, `is_email_verified`, `membership_type`, `grade`, `class_name`, `subject_type`, `subjects` |
| `subject_presets` | 选科预设模板 | `id`, `name`, `first_choice`, `re_choices`, `subjects` |
| `grades` | 年级选项 | `id`, `name`, `sort_order` |
| `classes` | 班级选项 | `id`, `name`, `sort_order` |
| `exams` | 考试信息 | `id`, `name`, `date`, `semester`, `grade_range`, `is_active` |
| `scores` | 成绩记录 | `id`, `exam_id`, `user_id`, `subject`, `score`, `full_score`, `grade_rank`, `class_rank`, `assigned_score` |
| `score_edit_logs` | 成绩修改日志 | `id`, `score_id`, `editor_id`, `field_name`, `old_value`, `new_value` |
| `rank_goals` | 排名目标 | `id`, `user_id`, `name`, `target_type`, `target_value`, `subject_scores`, `exam_id` |
| `goal_results` | 目标达成结果 | `id`, `goal_id`, `exam_id`, `actual_class_rank`, `actual_grade_rank`, `is_achieved` |
| `universities` | 大学库 | `id`, `name`, `province`, `university_level`, `university_type`, `subject_type`, `data_year`, `admission_score`, `admission_rank` |
| `university_goals` | 用户目标大学 | `id`, `user_id`, `university_id`, `target_rank` |
| `notifications` | 通知消息 | `id`, `user_id`, `type`, `title`, `message`, `is_read` |
| `password_resets` | 密码重置令牌 | `id`, `email`, `token`, `expires_at`, `used` |
| `tickets` | 技术支持工单 | `id`, `user_id`, `title`, `content`, `captcha`, `status`, `admin_reply` |
| `changelog` | 版本更新记录 | `id`, `version`, `title`, `content` |
| `logs` | 操作日志 | `id`, `user_id`, `action`, `description`, `ip` |
| `settings` | 系统设置 | `key`, `value`, `updated_at` |
| `preference_analyses` | 志愿分析记录 | `id`, `user_id`, `avg_score`, `total_score`, `volatility`, `trend`, `subject_type`, `subject_avg_scores`, `school_data` |

### 3.3 ER 关系

```
schools ──1:N──→ accounts (school_id)
accounts ──1:N──→ scores (user_id)
accounts ──1:N──→ rank_goals (user_id)
accounts ──1:N──→ university_goals (user_id)
accounts ──1:N──→ notifications (user_id)
accounts ──1:N──→ tickets (user_id)
accounts ──1:N──→ preference_analyses (user_id)
exams ──1:N──→ scores (exam_id)
scores ──1:N──→ score_edit_logs (score_id)
rank_goals ──1:N──→ goal_results (goal_id)
universities ──1:N──→ university_goals (university_id)
```

### 3.4 数据库迁移机制

`config.php` 中的 `getDB()` 函数实现了自动迁移：

1. 首次运行时，读取 `schema.sql` 创建所有表和初始数据
2. 读取 `db_meta` 表中的 `version` 值
3. 按版本号顺序执行 `$migrations` 数组中的 SQL 语句
4. 当前迁移版本为 **8**，包含：字段扩展、新表创建、预设数据插入等

---

## 四、核心模块详解

### 4.1 配置与全局函数 (`api/config.php`)

这是整个系统的**基础设施层**，提供所有共享功能。

#### 常量定义

| 常量 | 值 | 说明 |
|------|---|------|
| `DB_PATH` | `../data/redstar.db` | SQLite 数据库路径 |
| `SITE_NAME` | 阳光学情报告 | 站点名称 |
| `SITE_CODE` | Red-Star | 站点代号 |
| `SITE_VERSION` | 7.5.2 | 版本号 |
| `SITE_URL` | http://rs.cn | 站点 URL |
| `JWT_SECRET` | (自动生成) | JWT 签名密钥 |
| `JWT_EXPIRE` | 604800 (7天) | JWT 有效期 |
| `SMTP_HOST` | smtp.feishu.cn | 邮件服务器 |
| `SMTP_PORT` | 465 | SMTP 端口 |
| `EMAIL_ENABLED` | true | 邮件功能开关 |
| `RESET_TOKEN_EXPIRE` | 1800 (30分钟) | 密码重置令牌有效期 |

#### 关键函数

| 函数 | 签名 | 说明 |
|------|------|------|
| `getDB()` | `→ PDO` | 获取数据库连接（单例），自动建表和迁移 |
| `queryOne()` | `(sql, params) → array\|null` | 查询单行 |
| `queryAll()` | `(sql, params) → array` | 查询多行 |
| `getSetting()` | `(key, default) → string` | 读取系统设置 |
| `generateJwt()` | `(payload) → string` | 生成 JWT 令牌 |
| `verifyJwt()` | `(token) → array\|null` | 验证 JWT 令牌 |
| `me()` | `→ array\|null` | 获取当前登录用户信息 |
| `needAuth()` | `→ array` | 要求登录，未登录返回 401 |
| `needAdmin()` | `→ array` | 要求管理员权限 |
| `needSuperAdmin()` | `→ array` | 要求超级管理员权限 |
| `needAdminOrViewer()` | `→ array` | 要求管理员或查看者权限 |
| `needVerified()` | `(user) → void` | 要求邮箱验证 + 会员有效 |
| `protectSuperAdmin()` | `(userId) → void` | 禁止修改超级管理员 |
| `ok()` | `(data) → void` | 返回成功 JSON 响应 |
| `err()` | `(msg, code) → void` | 返回错误 JSON 响应 |
| `logAction()` | `(userId, action, desc) → void` | 记录操作日志 |
| `sendMail()` | `(to, subject, body) → bool` | 原生 SMTP 邮件发送 |
| `sendVerificationEmail()` | `(email, code) → void` | 发送验证码邮件 |
| `sendResetEmail()` | `(email, link) → void` | 发送密码重置邮件 |
| `sendTicketNotification()` | `(ticketData) → void` | 发送工单通知给管理员 |
| `checkLoginRateLimit()` | `(account) → array` | 登录限流检查（5次/15分钟） |
| `recordLoginFailure()` | `(account) → void` | 记录登录失败 |
| `autoBackupIfNeeded()` | `→ void` | 每日自动备份数据库 |
| `sanitizeUser()` | `(user) → array` | 移除敏感字段（password_hash, verification_code） |

#### JWT 实现细节

- 算法：HS256
- 载荷：`uid`（用户ID）、`email`、`role`、`exp`（过期时间）、`iat`（签发时间）
- 密钥自动生成：首次运行时若密钥为默认值，自动生成随机密钥并写回 `config.php`
- 令牌传递：支持 `Authorization: Bearer <token>` 请求头和 `token` Cookie 双模式

#### 邮件发送

使用原生 `fsockopen` + SSL 实现 SMTP 协议通信，不依赖第三方邮件库。流程：`EHLO → AUTH LOGIN → MAIL FROM → RCPT TO → DATA → QUIT`。

#### 登录限流

- 基于 IP + 账号组合的 MD5 哈希作为限流键
- 5 次失败后锁定 15 分钟
- 锁定记录 1 小时后自动清理
- 限流数据存储在 `data/login_limits.json`

---

### 4.2 认证模块 (`/auth/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/auth/register` | POST | 公开 | 用户注册（邮箱+密码+姓名+学校+年级+班级） |
| `/auth/login` | POST | 公开 | 用户登录（返回 JWT 令牌） |
| `/auth/verify-email` | GET | 公开 | 邮箱验证（通过验证码） |
| `/auth/request-reset` | POST | 公开 | 请求密码重置（发送重置链接到邮箱） |
| `/auth/reset-password` | POST | 公开 | 执行密码重置 |
| `/auth/me` | GET | 登录 | 获取当前用户完整信息 |
| `/auth/resend-email` | POST | 登录 | 重发验证邮件 |
| `/me` | GET | 登录 | 获取当前用户信息（含学校名） |
| `/me` | PUT | 登录 | 更新个人信息 |
| `/me/change-password` | POST | 登录 | 修改密码 |
| `/me/subjects` | POST | 登录 | 保存选科信息 |

**注册流程**：
1. 用户提交注册信息 → 密码 bcrypt 加密 → 生成6位验证码
2. 发送验证码到邮箱 → 用户输入验证码验证
3. 验证成功后自动升级为 PRO 会员

**用户角色体系**：

| 角色 | 权限 |
|------|------|
| `USER` | 基础用户（未验证邮箱） |
| `PRO` | 专业版用户（已验证邮箱） |
| `ADMIN` | 管理员 |
| `SUPER_ADMIN` | 超级管理员（不可被修改） |

---

### 4.3 成绩模块 (`/scores/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/scores` | GET | 登录 | 查询成绩列表（支持按考试/科目/用户筛选，分页） |
| `/scores` | POST | 验证+会员 | 批量录入成绩 |
| `/scores/{id}` | PUT | 验证+会员 | 修改单条成绩（含编辑日志） |
| `/scores/{id}` | DELETE | 验证+会员 | 删除单条成绩 |
| `/scores/trend` | GET | 登录 | 成绩趋势数据 |
| `/scores/stats` | GET | 登录 | 成绩统计（考试次数/平均分/最高最低） |
| `/scores/analysis` | GET | 登录 | 成绩综合分析（总分趋势+各科统计） |

**成绩录入逻辑**：
- 按考试+用户+科目唯一约束，重复录入时先删后插
- 支持年级排名和班级排名
- 支持赋分成绩（`assigned_score`）
- 管理员可操作任意用户成绩，普通用户仅操作自己
- 录入/删除后触发自动备份

**成绩修改审计**：
- 修改成绩时自动记录到 `score_edit_logs` 表
- 记录修改者、字段名、旧值、新值

---

### 4.4 考试模块 (`/exams/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/exams` | GET | 登录 | 获取考试列表 |
| `/exams/current` | GET | 登录 | 获取当前/最近考试（含科目列表） |
| `/exams/select` | POST | 验证+会员 | 选择考试 |

**考试数据**：
- 预设了高一至高三各学期月考、期中、期末考试
- 高三包含一模、二模、三模、高考仿真模拟
- 每场考试关联年级范围（`grade_range`，JSON 数组）
- 科目列表根据用户选科和考试学期动态生成

---

### 4.5 目标模块 (`/goals/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/goals` | GET | 登录 | 查询目标列表（含达成结果） |
| `/goals` | POST | 验证+会员 | 创建排名目标 |
| `/goals/{id}` | PUT | 登录 | 更新目标 |
| `/goals/{id}` | DELETE | 登录 | 删除目标 |

**目标体系**：
- 每个目标包含名称、各科目标分数（`subject_scores`，JSON）、目标排名
- 可关联特定考试（`exam_id`）
- 通过 `goal_results` 表记录实际达成情况

---

### 4.6 大学模块 (`/universities/*`, `/user/universities/*`, `/university-goals/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/universities` | GET | 登录 | 大学库查询（搜索/省份/层次/科类/年份筛选，分页） |
| `/user/universities` | GET | 登录 | 用户目标大学列表（含匹配度分析） |
| `/user/universities/link` | POST | 验证+会员 | 关联目标大学（最多3所） |
| `/user/universities/{id}` | DELETE | 登录 | 移除目标大学 |
| `/university-goals` | GET | 登录 | 目标大学列表（别名路由） |
| `/university-goals` | POST | 登录 | 添加目标大学 |
| `/university-goals/{id}` | DELETE | 登录 | 移除目标大学 |

**大学匹配算法**：
- 根据用户最近一次考试总分与大学录取分数的差值进行匹配
- 差值 ≥ 30：`safe`（稳妥）
- 差值 ≥ 10：`match`（匹配）
- 差值 ≥ -10：`risk`（冲刺）
- 差值 < -10：`danger`（风险）

**大学数据结构**：
- 同一大学按科类（物理类/历史类/艺术类）分别存储录取分数和排名
- 查询时按大学名称分组，合并多科类数据

---

### 4.7 志愿分析模块 (`/preference/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/preference/analyze` | GET | 登录 | 志愿匹配分析（按考试总分匹配大学） |
| `/preference/exams` | GET | 登录 | 获取有成绩的考试列表 |
| `/preference/score-analysis` | GET | 验证+会员 | 按指定分数进行志愿分析 |
| `/preference/analyses` | GET | 登录 | 获取历史分析记录 |
| `/preference/analyses` | POST | 登录 | 保存分析记录 |
| `/preference/analyses` | DELETE | 登录 | 清空分析记录 |
| `/preference/analyses/{id}` | GET | 登录 | 查看单条分析详情 |

**志愿分析输出**：
- 将所有大学按分数差分为四档：稳妥(safe)、匹配(match)、冲刺(risk)、风险(danger)
- 分析记录包含：平均分、总分、最高分、波动率、趋势、各科均分/最低分/最高分、学校数据

---

### 4.8 通知模块 (`/notifications/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/notifications` | GET | 登录 | 通知列表（分页） |
| `/notifications/unread-count` | GET | 登录 | 未读通知数量 |
| `/notifications/{id}/read` | PUT | 登录 | 标记已读 |

---

### 4.9 工单系统 (`/tickets/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/tickets` | POST | 登录 | 提交工单（需验证码） |
| `/tickets` | GET | 登录 | 我的工单列表 |
| `/tickets/{id}` | GET | 登录 | 工单详情 |
| `/tickets/{id}/reply` | POST | 登录 | 用户追加回复 |

**验证码机制**：
- 通过 `/captcha` 接口生成图形验证码
- 验证码存储在 PHP Session 中，使用后即销毁

---

### 4.10 管理员模块 (`/admin/*`)

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/admin/users` | GET | 管理员 | 用户列表（搜索/角色筛选，分页） |
| `/admin/users/{id}` | PUT | 管理员 | 编辑用户信息 |
| `/admin/users/{id}/role` | PUT | 管理员 | 修改用户角色 |
| `/admin/users/{id}/reset-password` | POST | 管理员 | 重置用户密码 |
| `/admin/users/{id}/status` | PUT | 管理员 | 启用/禁用用户 |
| `/admin/exams` | GET | 管理员 | 考试列表 |
| `/admin/exams` | POST | 管理员 | 创建考试/切换考试状态 |
| `/admin/schools` | GET/POST/DELETE | 管理员 | 学校 CRUD |
| `/admin/subject-presets` | GET/POST/DELETE | 管理员 | 选科预设 CRUD |
| `/admin/settings` | GET/PUT/POST | 管理员 | 系统设置管理 |
| `/admin/grade-up` | POST | 管理员 | 年级升级（高三毕业→高二升高三→高一升高二） |
| `/admin/backup` | POST | 管理员 | 手动备份数据库 |
| `/admin/backups` | GET | 管理员 | 备份文件列表 |
| `/admin/backups/{name}/download` | GET | 管理员 | 下载备份文件 |
| `/admin/backups/{name}` | DELETE | 管理员 | 删除备份文件 |
| `/admin/logs` | GET | 管理员 | 操作日志查询 |
| `/admin/universities` | GET | 管理员 | 大学库管理 |
| `/admin/universities/import` | POST | 管理员 | CSV 导入大学数据 |
| `/admin/universities/{id}` | DELETE | 管理员 | 删除大学记录 |
| `/admin/changelog` | GET/POST | 管理员 | 更新记录管理 |
| `/admin/changelog/{id}` | PUT/DELETE | 管理员 | 编辑/删除更新记录 |
| `/admin/tickets` | GET | 管理员 | 工单列表 |
| `/admin/tickets/{id}` | GET | 管理员 | 工单详情 |
| `/admin/tickets/{id}/reply` | POST | 管理员 | 回复工单 |

**年级升级逻辑**：
1. 高三学生标记为已毕业（`graduation_status=1`）
2. 高二学生升级为高三
3. 高一学生升级为高二
4. 整个操作在事务中执行

---

### 4.11 公共接口

| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/captcha` | GET | 公开 | 获取图形验证码 |
| `/settings` | GET | 公开 | 获取系统设置 |
| `/changelog` | GET | 公开 | 获取更新记录 |
| `/options` | GET | 公开 | 获取下拉选项（学校/年级/班级/选科预设） |

---

## 五、前端架构

### 5.1 技术方案

- **无框架**：纯原生 JavaScript，零构建步骤
- **SPA 模式**：通过 `navigate()` 函数切换页面，动态渲染 HTML
- **模板方式**：使用模板字符串直接拼接 HTML
- **API 通信**：封装 `api()` 函数，基于 `fetch` + Cookie 认证

### 5.2 页面路由

| 页面标识 | 函数 | 说明 |
|---------|------|------|
| `dashboard` | `renderDashboard()` | 仪表盘（考试数/平均分/趋势图） |
| `score-entry` | `renderScoreEntry()` | 成绩录入 |
| `score-manage` | `renderScoreManage()` | 成绩管理 |
| `exam-goal` | `renderExamGoal()` | 排名目标 |
| `score-analysis` | `renderScoreAnalysis()` | 成绩分析（趋势图/排名图） |
| `target-uni` | `renderTargetUni()` | 目标大学 |
| `universities` | `loadUniversities()` | 大学库浏览 |
| `preference` | `renderPreference()` | 志愿分析 |
| `profile` | `renderProfile()` | 个人信息 |
| `support` | `renderSupport()` | 技术支持（工单） |
| `admin` | `renderAdmin()` | 管理后台 |

### 5.3 前端核心函数

| 函数 | 说明 |
|------|------|
| `initApp()` | 应用初始化（渲染菜单/用户信息/默认页面） |
| `navigate(page)` | 页面导航（切换内容区） |
| `api(method, url, data)` | API 请求封装（自动携带 Cookie） |
| `renderMenu()` | 渲染侧边栏菜单（根据角色动态显示） |
| `getSubjectMap()` | 获取当前用户的选科科目映射 |
| `getExamSubjects(exam)` | 根据考试和年级获取科目列表 |
| `drawTrendChart(...)` | Canvas 绘制成绩趋势图 |
| `drawRankChart(...)` | Canvas 绘制排名变化图 |
| `exportScores()` | 导出成绩为 CSV |

### 5.4 样式体系

- CSS 变量驱动主题（`--primary`, `--success`, `--warning` 等）
- 侧边栏 + 顶栏 + 内容区经典后台布局
- 响应式设计，支持移动端（侧边栏折叠）
- 仿 Element UI 风格

---

## 六、中间件体系（MVC 重构版）

> 注意：此中间件体系仅在 `routes.php` 路由模式下生效，当前生产环境未启用。

### 6.1 中间件基类

```php
abstract class Core\Middleware {
    abstract public function handle(): void;
}
```

### 6.2 中间件管道

`Core\MiddlewarePipeline` 按注册顺序依次执行中间件的 `handle()` 方法，任一中间件调用 `err()` 即终止请求。

### 6.3 已实现中间件

| 中间件 | 文件 | 检查逻辑 |
|--------|------|---------|
| `AuthMiddleware` | `Middlewares/AuthMiddleware.php` | 检查是否登录 |
| `VerifiedMiddleware` | `Middlewares/VerifiedMiddleware.php` | 检查登录 + 邮箱验证 + 会员有效 |
| `AdminMiddleware` | `Middlewares/AdminMiddleware.php` | 检查登录 + 管理员角色 |

---

## 七、依赖关系

### 7.1 PHP 扩展依赖

| 扩展 | 用途 | 必需 |
|------|------|------|
| `pdo` | 数据库抽象层 | ✅ |
| `pdo_sqlite` | SQLite 驱动 | ✅ |
| `json` | JSON 编解码 | ✅ |
| `mbstring` | 多字节字符串处理 | ✅ |
| `openssl` | JWT 签名 + SMTP SSL 连接 | ✅ |
| `gd` | 验证码图片生成 | ✅ (验证码功能需要) |
| `session` | 验证码存储 | ✅ (验证码功能需要) |

> 启动时 `config.php` 会自动检查前5个扩展，缺失则报错终止。

### 7.2 外部服务依赖

| 服务 | 用途 | 可选 |
|------|------|------|
| SMTP 邮件服务 | 邮箱验证/密码重置/工单通知 | ⚠️ 可通过 `EMAIL_ENABLED=false` 关闭 |

### 7.3 零第三方库

项目**不使用任何第三方 PHP/JS 库**：
- 无 Composer 依赖
- 无 npm 依赖
- 无 CDN 引用
- JWT、SMTP、路由、模板全部自行实现

---

## 八、项目运行方式

### 8.1 环境要求

- PHP ≥ 7.4（推荐 8.0+）
- PHP 扩展：pdo, pdo_sqlite, json, mbstring, openssl, gd, session
- Web 服务器：Apache / Nginx / 内置 PHP Server
- 操作系统：Linux / Windows / macOS

### 8.2 快速启动

#### 方式一：PHP 内置服务器（开发）

```bash
cd rs.uicn.cn
php -S localhost:8080
```

访问 `http://localhost:8080/login.php`

#### 方式二：Apache / Nginx（生产）

将 `rs.uicn.cn` 目录配置为 Web 根目录，确保 URL 重写将 `/api/*` 请求转发到 `api/index.php`。

**Apache `.htaccess` 示例**（放置在 `rs.uicn.cn/` 目录）：

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]
```

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name rs.cn;
    root /path/to/rs.uicn.cn;
    index index.php login.php;

    location /api/ {
        try_files $uri /api/index.php$is_args$args;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 8.3 初始账号

| 邮箱 | 密码 | 角色 |
|------|------|------|
| hy@chge.cn | 211985316 | 超级管理员 (SUPER_ADMIN) |
| hy@uicn.cn | 211985316 | 管理员 (ADMIN) |

### 8.4 免部署免配置确认

✅ **确认：本项目免部署、免配置，复制到 PHP 环境即可运行。**

具体依据：

1. **零外部依赖**：无需 Composer、npm、MySQL 等任何外部服务
2. **数据库自动创建**：首次访问时 `getDB()` 自动创建 SQLite 数据库并执行 `schema.sql`
3. **数据库自动迁移**：基于版本号的增量迁移，无需手动执行 SQL
4. **JWT 密钥自动生成**：首次运行自动生成随机密钥
5. **目录自动创建**：`data/`、`backups/` 目录不存在时自动创建
6. **初始数据内置**：`schema.sql` 包含管理员账号、学校、年级、班级、选科预设等初始数据
7. **唯一配置项**：如需修改站点 URL 或 SMTP 配置，编辑 `api/config.php` 即可

> ⚠️ 注意：邮件功能需要配置正确的 SMTP 信息。如无 SMTP 服务，可将 `EMAIL_ENABLED` 设为 `false`，系统会进入调试模式（验证码直接返回给前端）。

---

## 九、数据导入工具

### 9.1 大学数据导入

| 工具 | 访问方式 | 说明 |
|------|---------|------|
| `import_data_web.php` | 浏览器访问 `/api/import_data_web.php` | Web 界面导入 |
| `import_uni_data.php` | 命令行 `php import_uni_data.php` | CLI 导入 |
| `update_university_types.php` | 浏览器访问 `/api/update_university_types.php?run=1` | 自动识别并更新大学类型 |

### 9.2 大学数据格式

CSV 格式：`大学名称,省份,层次,科类,录取分数,录取排名,数据年份`

SQL 文件：`import_universities_2025.sql` 包含 2025 年安徽省高考大学录取数据。

---

## 十、安全机制

| 机制 | 实现方式 |
|------|---------|
| 密码存储 | bcrypt 哈希（`password_hash` + `PASSWORD_BCRYPT`） |
| 身份认证 | JWT (HS256) + Cookie 双模式 |
| 登录限流 | IP+账号组合，5次失败锁定15分钟 |
| 验证码 | 图形验证码（GD 库生成，Session 存储） |
| CORS | 白名单域名控制 |
| 超管保护 | `protectSuperAdmin()` 禁止修改超级管理员 |
| SQL 注入 | PDO 预处理语句（参数化查询） |
| XSS | `htmlspecialchars()` 输出转义 |
| 错误隐藏 | 生产环境关闭 `display_errors`，写入日志文件 |
| 操作审计 | `logAction()` 记录关键操作 |
| 成绩审计 | `score_edit_logs` 记录成绩修改历史 |

---

## 十一、API 响应格式

所有 API 返回统一 JSON 格式：

**成功响应**：
```json
{
    "success": true,
    "data": { ... }
}
```

**错误响应**：
```json
{
    "success": false,
    "message": "错误描述"
}
```

**HTTP 状态码**：

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 |
| 403 | 权限不足/会员过期/邮箱未验证 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（登录限流） |
| 500 | 服务器内部错误 |

---

## 十二、系统设置项

存储在 `settings` 表中，可通过管理后台修改：

| 设置键 | 默认值 | 说明 |
|--------|--------|------|
| `site_name` | 阳光学情报告 | 站点名称 |
| `items_per_page` | 20 | 每页条数 |
| `default_grade` | 高一 | 默认年级 |
| `maintenance_mode` | 0 | 维护模式 |
| `allow_register` | 1 | 允许注册 |
| `email_verify_required` | 1 | 邮箱验证必填 |
| `membership_default_expires` | 2028-06-06 23:59:59 | 会员默认到期时间 |
| `site_notice` | (空) | 站点公告 |
| `exam_full_score_chinese` | 150 | 语文满分 |
| `exam_full_score_math` | 150 | 数学满分 |
| `exam_full_score_english` | 150 | 英语满分 |
| `exam_full_score_default` | 100 | 其他科目满分 |
| `data_year` | 2025 | 数据年份 |
| `province` | 安徽 | 省份 |

---

## 十三、版本迁移历史

| 版本 | 迁移内容 |
|------|---------|
| v1 | settings 表增加 `updated_at` 字段 |
| v2 | 新增 `tickets`（工单）和 `changelog`（更新记录）表 |
| v3 | accounts 表增加 `phone` 字段 |
| v4 | 新增 `grades`（年级）和 `classes`（班级）表及预设数据 |
| v5 | rank_goals 增加 `subject_scores` 和 `exam_id` 字段；预设考试数据 |
| v6 | scores 增加 `assigned_score`（赋分）字段 |
| v7 | universities 增加 `admission_score` 字段 |
| v8 | universities 增加 `university_type` 字段 |

---

## 十四、技术债务与优化记录

### 已完成优化

| 优化项 | 完成时间 | 说明 |
|--------|---------|------|
| API 模块拆分 | 2026-05-06 | 将 `api/index.php`（1600行）拆分为 10 个模块路由文件，入口仅保留 42 行引导代码 |

### 待优化项

1. **前端架构**：`app.js` 约 2700 行，所有页面逻辑集中在一个文件中，可考虑拆分为模块
2. **类型安全**：PHP 代码未使用严格类型声明，可引入 `declare(strict_types=1)`
3. **测试覆盖**：目前无自动化测试
4. **MVC 重构版**：`routes.php` + Controllers 框架已搭建但未完成迁移，可作为后续演进方向
