# Red-Star 阳光学情分析系统 - 开发文档

> **版本**: V3.1 | **最后更新**: 2026-05-03
> **架构**: 纯 PHP 8.3 + SQLite 3 + 原生 JavaScript（零框架、零构建）
> **项目定位**: 面向高中生的个人学情分析与大学志愿填报辅助系统
> **大学数据**: 安徽省2025年高考录取数据（~542条记录）

---

## 一、项目概述

### 1.1 系统简介

Red-Star（阳光学情分析系统）是一个面向安徽省马鞍山市高中生的**个人学情管理 Web 应用**。学生可以录入各次考试成绩，系统自动计算排名、得分率，分析成绩趋势，并基于高考成绩数据推荐目标大学和志愿填报方案。

**目标用户**: 高中生（主要）、教师/管理员（辅助）
**使用规模**: 小规模（几十人级别）
**地域特征**: 安徽省新高考 3+1+2 模式

### 1.2 核心功能模块

| 模块 | 功能描述 |
|------|---------|
| **数据概览** | 仪表盘，展示考试次数、成绩记录数、快速操作入口 |
| **考试选择** | 按年级（高一/高二/高三）浏览预设考试，选择要录入成绩的考试 |
| **成绩录入** | 为已选考试录入各科分数、满分、年级排名、班级排名 |
| **成绩管理** | 查看/筛选/删除已录入的成绩记录，查看统计数据 |
| **考试目标** | 设定下次考试的目标（学期+类型），跟踪达成情况 |
| **成绩分析** | 成绩趋势图（Canvas 绘制）、科目雷达图、排名趋势分析 |
| **目标大学** | 搜索大学（支持科类筛选），添加/移除个人目标大学 |
| **志愿分析** | 基于成绩表现，AI 智能分析志愿填报建议 |
| **个人信息** | 修改姓名、班级，查看账号状态 |
| **数据管理（管理员）** | 大学数据管理、操作日志、备份管理 |

### 1.3 设计原则

| 原则 | 说明 |
|------|------|
| **零部署** | 无需 Node.js、Composer、npm install。复制目录到 PHP Web 根目录即可运行 |
| **零编译** | 改 PHP/JS/CSS 文件 → 刷新浏览器 → 立即生效 |
| **轻量** | 整个项目约 2-5 MB（不含数据库和备份），无 node_modules |
| **便携** | 打包 → 拷贝到新服务器 → 解压 → 配置 Nginx → 运行 |

### 1.4 权限体系

系统采用三级权限：学生(STUDENT/USER/PRO) → 管理员(ADMIN) → 超级管理员(SUPER_ADMIN)。

#### 1.4.1 角色定义

| 角色 | 说明 | 权限范围 |
|------|------|---------|
| `STUDENT`/`USER` | 普通学生 | 仅个人功能：录入成绩、查看分析、设定目标大学 |
| `PRO` | 专业版学生 | 同STUDENT，仅标识会员状态 |
| `ADMIN` | 管理员 | 查看用户/成绩/大学数据、创建备份、查看日志、导入数据。**不可删除、不可修改系统设置** |
| `SUPER_ADMIN` | 超级管理员 | 全部权限，可删除一切，唯一可管理系统设置 |

#### 1.4.2 管理员 vs 超级管理员 权限对比

| 功能 | ADMIN | SUPER_ADMIN | 说明 |
|------|:-----:|:-----------:|------|
| 查看用户列表 | ✅ | ✅ | 查看所有用户 |
| 修改用户角色 | ❌ | ✅ | ADMIN不可修改任何角色 |
| 重置用户密码 | ❌ | ✅ | |
| 禁用/启用用户 | ❌ | ✅ | |
| 创建考试 | ✅ | ✅ | 添加/启用/禁用考试 |
| 添加学校 | ✅ | ✅ | |
| 删除学校 | ❌ | ✅ | |
| 添加选科组合 | ❌ | ✅ | |
| 删除选科组合 | ❌ | ✅ | |
| 年级升级 | ✅ | ✅ | 批量升级所有用户年级 |
| 查看大学数据 | ✅ | ✅ | |
| 导入大学数据 | ✅ | ✅ | CSV批量导入 |
| 删除大学数据 | ❌ | ✅ | |
| 创建备份 | ✅ | ✅ | |
| 查看备份列表 | ✅ | ✅ | |
| 下载备份 | ✅ | ✅ | |
| 删除备份 | ❌ | ✅ | |
| 查看操作日志 | ✅ | ✅ | |
| 修改系统设置 | ❌ | ✅ | settings表 |

#### 1.4.3 超级管理员保护机制

- ADMIN 不可修改/删除/重置 SUPER_ADMIN 账号（`protectSuperAdmin()` 函数拦截）
- ADMIN 不可将用户角色设置为 `SUPER_ADMIN`（仅 SUPER_ADMIN 可分配）
- `needAdmin()` 函数仅允许 SUPER_ADMIN 通过（ADMIN 被拒绝）
- `needAdminOrViewer()` 函数允许 ADMIN 和 SUPER_ADMIN 通过（只读查看类接口）

#### 1.4.4 核心函数说明

```php
// 仅超级管理员可调用
needAdmin();

// 管理员或超级管理员均可调用（查看类接口）
needAdminOrViewer();

// 保护超级管理员用户不被修改
protectSuperAdmin($userId);
```

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本要求 | 说明 |
|------|------|---------|------|
| **后端语言** | PHP | 8.3+ | 使用 PDO 扩展操作 SQLite |
| **数据库** | SQLite | 3.35+ | 单文件数据库，WAL 模式，自动创建 |
| **前端** | 原生 JavaScript | ES5+ | 无框架，直接操作 DOM |
| **样式** | 原生 CSS | CSS3 | 使用 CSS 变量，无预处理器 |
| **认证** | JWT (HS256) | - | 无状态认证，Token 存 Cookie |
| **Web 服务器** | Nginx | 任意 | 仅需配置伪静态转发 API |

### 2.2 架构图

```
用户浏览器
    │
    ├─ 访问 / → index.php（PHP 渲染 HTML，内嵌用户数据）
    │             └─ 加载 assets/style.css（样式）
    │             └─ 加载 assets/app.js（纯 JS 逻辑）
    │
    ├─ 访问 /api/* → api/index.php（PHP 路由 + 业务逻辑）
    │                  └─ api/config.php（配置、数据库连接、认证）
    │                  └─ data/redstar.db（SQLite 数据库）
    │
    └─ 访问 /login.php → 登录页（纯 PHP + 内联 JS）
```

### 2.3 请求流程

```
1. 用户访问 http://rs.cn
2. Nginx 返回 index.php（PHP 执行，检查登录状态，未登录则跳转 login.php）
3. index.php 渲染 HTML 框架，用 PHP 注入用户信息到 JS 变量 currentUser
4. 浏览器加载 app.js，调用 initApp() 初始化页面
5. 用户点击菜单 → app.js 调用 navigate() 切换页面内容
6. 需要数据时 → app.js 用 fetch() 调用 /api/* 接口
7. Nginx 将 /api/* 转发给 api/index.php 处理
8. api/index.php 执行 SQL 查询，返回 JSON
```

---

## 三、项目目录结构

```
rs.cn/                          ← 项目根目录（整个目录可打包迁移）
│
├── api/                        ← PHP 后端（核心业务逻辑）
│   ├── index.php               ← API 路由入口（所有接口在此处理）
│   ├── config.php              ← 配置中心（数据库、JWT、认证函数）
│   └── schema.sql              ← 数据库表结构（首次访问自动执行）
│
├── assets/                     ← 前端静态资源
│   ├── style.css               ← 全局样式文件
│   └── app.js                  ← 前端主逻辑（纯 JS，无框架）
│
├── data/                       ← 数据目录（运行时自动创建，需写入权限）
│   └── redstar.db              ← SQLite 数据库文件
│
├── backups/                    ← 备份目录（运行时自动创建，需写入权限）
│   └── backup_YYYYMMDD_HHMMSS.db  ← 自动备份文件
│
├── index.php                   ← 主页面（登录后看到的页面，包含所有视图模板）
├── login.php                   ← 登录页
└── （Nginx 伪静态配置在宝塔面板中）

```

### 3.1 文件说明

| 文件 | 大小 | 职责 |
|------|------|------|
| **api/index.php** | ~50KB | 所有 API 路由。用 `if ($routePath === '/xxx' && $method === 'GET')` 匹配路由 |
| **api/config.php** | ~8KB | 配置中心。数据库连接、JWT 签发/验证、认证中间件、日志记录 |
| **api/schema.sql** | ~6KB | 数据库表结构。14 张表的 CREATE TABLE 语句 |
| **index.php** | ~15KB | 主页面 HTML。PHP 渲染框架，用户信息注入 JS，所有页面模板在此 |
| **login.php** | ~3KB | 登录页 HTML。简单表单 + 内联 JS 调用登录 API |
| **assets/style.css** | ~6KB | 全局样式。CSS 变量定义颜色/尺寸，侧边栏/卡片/表格等组件样式 |
| **assets/app.js** | ~20KB | 前端逻辑。页面路由、API 调用、DOM 操作、数据渲染 |

---

## 四、数据库设计

### 4.1 表结构总览

| 表名 | 说明 | 核心字段 |
|------|------|---------|
| `accounts` | 用户账号 | id, email, password_hash, name, role, class_name, subject_type |
| `exams` | 考试记录 | id, user_id, name, date, type, total_score, grade_rank, class_rank |
| `scores` | 成绩明细 | id, exam_id, user_id, subject, score, full_score, grade_rank, class_rank |
| `universities` | 大学数据 | id, name, province, university_level, subject_type, admission_score, admission_rank, data_year |
| `university_goals` | 用户目标大学 | id, user_id, university_id |
| `goals` | 学习目标 | id, user_id, name, target_type, target_value, is_achieved |
| `goal_results` | 目标达成记录 | id, goal_id, actual_value, achieved_at |
| `operation_logs` | 操作日志 | id, user_id, user_name, action, description, ip, created_at |
| `settings` | 系统设置 | id, key, value, description |
| `db_meta` | 数据库元数据 | key, value |

### 4.2 关键表详细设计

#### accounts（用户表）

```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT',  -- STUDENT | ADMIN | SUPER_ADMIN
    is_email_verified INTEGER DEFAULT 0,
    membership_type TEXT DEFAULT 'free',    -- free | pro
    membership_expires_at TEXT,
    school_id INTEGER,
    grade TEXT,                             -- g1 | g2 | g3
    class_name TEXT,
    subject_type TEXT,                      -- physics | history（3+1+2 选科）
    subjects TEXT,                          -- JSON: ["物理","化学","生物"]
    graduation_status TEXT DEFAULT 'in_progress',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

#### exams（考试表）

```sql
CREATE TABLE exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES accounts(id),
    name TEXT NOT NULL,                     -- 考试名称，如"高一上学期期中"
    date TEXT NOT NULL,                     -- 考试日期
    type TEXT,                              -- term | monthly
    total_score REAL,
    grade_rank INTEGER,
    class_rank INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);
```

#### scores（成绩表）

```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    user_id INTEGER NOT NULL REFERENCES accounts(id),
    subject TEXT NOT NULL,                  -- 科目: 语文/数学/英语/物理/化学/生物/政治/历史/地理
    score REAL NOT NULL,
    full_score REAL DEFAULT 100,
    grade_rank INTEGER,
    class_rank INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);
```

#### universities（大学数据表）

```sql
CREATE TABLE universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- 大学名称
    province TEXT NOT NULL,                 -- 省份
    university_level TEXT,                  -- 985/211/双一流/普通
    subject_type TEXT NOT NULL,             -- physics | history | art | 军校 | 警校
    admission_score INTEGER,                -- 最低录取分数
    admission_rank INTEGER,                 -- 最低录取位次
    data_year INTEGER NOT NULL DEFAULT 2025,
    UNIQUE(name, subject_type, data_year)
);
```

### 4.3 数据说明

**大学数据已预置**: 约 576 条记录
- 物理类: 261 条
- 历史类: 201 条
- 美术类: 85 条
- 军校: 22 条
- 警校: 7 条

数据来源于安徽省教育考试院 2025 年高考录取数据。

### 4.4 大学目标库数据来源与整理说明

#### 4.4.1 数据来源

大学数据来源于**安徽省教育招生考试院**官方发布的 2025 年普通高校在皖招生录取数据，具体包括：

- **安徽省2025年普通高校招生录取最低控制分数线**
- **安徽省2025年普通高校招生投档分数及位次**
- **安徽省2025年普通高校招生艺术类专业录取数据**
- **安徽省2025年军队院校在皖招生录取数据**
- **安徽省2025年公安院校在皖招生录取数据**

数据年份统一为 **2025年**（最新可用数据），字段 `data_year` 固定为 `2025`。

#### 4.4.2 科类分类体系

安徽省新高考"3+1+2"模式下，大学数据按以下科类进行分类：

| 科类代码 | 科类名称 | 对应旧高考 | 数据量 | 说明 |
|---------|---------|-----------|-------|------|
| `physics` | 物理类 | 理科 | ~230条 | 首选科目为物理的本科批次录取数据（省内+省外重点） |
| `history` | 历史类 | 文科 | ~133条 | 首选科目为历史的本科批次录取数据（省内+省外重点） |
| `art` | 美术类 | 艺术文/理 | ~53条 | 美术与设计类艺术类第二批（综合分） |
| `军校` | 军校 | 军校 | ~29条 | 军队院校（含国防科技大学等25所院校多专业组） |
| `警校` | 警校 | 警校 | ~39条 | 公安院校（含中国人民公安大学等6所院校多专业组） |

**数据文件**: `rs.cn/api/import_universities_2025.sql`（~542条记录）

**科类说明**：
- 新高考下，`physics`（物理类）对应旧高考的理科，`history`（历史类）对应旧高考的文科
- 美术类独立分类，因为艺术类专业的录取分数计算方式与普通文理不同（综合分 = 文化课×50% + 专业课×50%）
- 军校和警校单列，因为其招生有特殊要求（政审、体检、面试等），且录取分数线与普通批次独立

#### 4.4.3 数据整理规则

**筛选规则**：
1. 仅保留**本科批次**录取数据（不含高职专科）
2. 剔除**民办院校**和**独立学院**（保留公办为主）
3. 剔除**中外合作办学**特殊类型（普通专业与中外合作分开）
4. 保留**985、211、双一流**重点院校全部数据
5. 普通院校按录取位次筛选（理科/物理类位次 15万以内，文科/历史类位次 6万以内）

**字段处理**：
- `admission_score`: 最低录取分数（整数）
- `admission_rank`: 最低录取位次（整数，用于位次法志愿填报）
- `university_level`: 院校层次，按以下规则标注
  - 同时为985和211 → `985`
  - 仅211 → `211`
  - 双一流但非211 → `双一流`
  - 其他 → `普通`

#### 4.4.4 数据录入方式

**方式一：SQL 直接导入（推荐）**
```sql
INSERT INTO universities (name, province, university_level, subject_type, admission_score, admission_rank, data_year) VALUES
('安徽大学', '安徽', '211', 'physics', 580, 28000, 2025),
('合肥工业大学', '安徽', '211', 'physics', 590, 22000, 2025),
...
```

**方式二：管理后台录入**
管理员通过"数据管理 → 大学数据管理"页面，可逐条添加/修改/删除大学数据。

**方式三：批量导入脚本**
可自行编写 PHP 脚本读取 Excel/CSV 文件并批量插入数据库：
```php
<?php
require_once __DIR__ . '/api/config.php';
$db = getDB();

// 读取 CSV
$file = fopen('universities_2025.csv', 'r');
while (($row = fgetcsv($file)) !== false) {
    list($name, $province, $level, $subject, $score, $rank) = $row;
    $stmt = $db->prepare(
        "INSERT OR REPLACE INTO universities (name, province, university_level, subject_type, admission_score, admission_rank, data_year) VALUES (?, ?, ?, ?, ?, ?, 2025)"
    );
    $stmt->execute([$name, $province, $level, $subject, (int)$score, (int)$rank]);
}
fclose($file);
echo "导入完成\n";
?>
```

#### 4.4.5 数据更新建议

- **每年更新**: 高考录取数据每年变化，建议在每年7-8月（录取结束后）更新最新数据
- **数据备份**: 更新前备份数据库文件 `data/redstar.db`
- **保留历史**: 可通过修改 `data_year` 字段保留多年数据，实现历年趋势分析
- **数据来源**: 安徽省教育招生考试院官网（https://www.ahzsks.cn/）每年会发布最新的投档数据

#### 4.4.6 文科/理科/美术/军校/警校数据获取渠道

| 科类 | 数据获取渠道 | 发布时间 |
|------|------------|---------|
| 理科(物理类) | 安徽省教育招生考试院 → 普通高校招生投档情况统计（理工类） | 7-8月 |
| 文科(历史类) | 安徽省教育招生考试院 → 普通高校招生投档情况统计（文史类） | 7-8月 |
| 美术类 | 安徽省教育招生考试院 → 艺术类录取分数及综合分统计表 | 7月 |
| 军校 | 安徽省教育招生考试院 → 军队院校投档分数线 | 7月上旬（提前批） |
| 警校 | 安徽省教育招生考试院 → 公安院校投档分数线 | 7月中旬（提前批） |

**数据获取步骤**：
1. 访问安徽省教育招生考试院官网
2. 进入"普通高校招生"栏目
3. 查找"投档情况"或"录取分数"公告
4. 下载 Excel/PDF 文件（部分为网页表格）
5. 整理为 CSV 格式
6. 导入系统数据库

**注意事项**：
- 部分年份数据可能以 PDF 格式发布，需手动整理
- 提前批（军校/警校）数据在普通本科批次之前发布
- 艺术类综合分计算方式可能因年份调整（文化课成绩×比例 + 专业课成绩×比例），需关注当年公式

---

## 五、API 接口文档

### 5.1 通用说明

**基础路径**: `/api`
**认证方式**: Cookie 中存储 JWT Token（`token`）
**响应格式**:
```json
{
    "success": true,
    "data": { ... },
    "message": "操作成功"
}
```
错误响应:
```json
{
    "success": false,
    "error": "错误信息",
    "code": 401
}
```

### 5.2 认证接口

#### POST /api/auth/login
登录
```json
请求: { "email": "user@example.com", "password": "password123" }
响应: { "success": true, "data": { "token": "xxx", "user": { "id": 1, "name": "...", "role": "STUDENT" } } }
```

#### POST /api/auth/register
注册
```json
请求: { "name": "张三", "email": "user@example.com", "password": "password123", "confirmPassword": "password123" }
```

#### POST /api/auth/logout
退出登录（清除 Cookie）

### 5.3 考试与成绩接口

#### GET /api/exams
获取当前用户的考试列表
```
参数: 无
响应: { "list": [ { "id": 1, "name": "高一上学期期中", "date": "2025-09-15", "type": "term", ... } ] }
```

#### POST /api/exams
创建新考试
```json
请求: { "name": "高一下学期期中", "date": "2026-04-20", "type": "term" }
```

#### GET /api/scores
获取成绩列表
```
参数: page=1, examId=1, subject=数学
响应: { "list": [ { "id": 1, "exam_id": 1, "subject": "数学", "score": 118, "full_score": 150, "grade_rank": 5, "class_rank": 1 } ], "total": 20, "page": 1 }
```

#### POST /api/scores
批量录入成绩
```json
请求: { "examId": 1, "scores": [ { "subject": "语文", "score": 118, "fullScore": 150, "gradeRank": 3, "classRank": 1 } ] }
```

#### DELETE /api/scores/{id}
删除单条成绩记录

#### GET /api/scores/trend
获取成绩趋势数据（用于图表）
```
响应: { "list": [ { "exam_name": "高一上学期期中", "avg_rate": 78.5, "subjects": [ { "subject": "数学", "score": 118, "full_score": 150 } ] } ] }
```

#### GET /api/scores/stats
获取成绩统计
```
响应: { "avg_score": 85.2, "total_exams": 5, "best_subject": "数学", "worst_subject": "物理" }
```

### 5.4 大学相关接口

#### GET /api/universities
获取大学列表（支持搜索和筛选）
```
参数: page=1, search=清华, subject_type=physics
响应: { "list": [ { "id": 1, "name": "清华大学", "province": "北京", "university_level": "985", "subject_type": "physics", "admission_score": 688, "admission_rank": 85, "linked": false } ], "total": 261, "page": 1 }
```

#### GET /api/university-goals
获取当前用户的目标大学
```
响应: { "list": [ { "id": 1, "university_id": 5, "name": "清华大学", "province": "北京", ... } ] }
```

#### POST /api/university-goals
添加目标大学
```json
请求: { "universityId": 5 }
```

#### DELETE /api/university-goals/{id}
移除目标大学

### 5.5 目标管理接口

#### GET /api/goals
获取目标列表
#### POST /api/goals
添加目标
#### DELETE /api/goals/{id}
删除目标

### 5.6 仪表盘

#### GET /api/dashboard
获取仪表盘数据
```
响应: {
    "examCount": 5,
    "scoreCount": 45,
    "goalCount": 3,
    "trend": [ { "exam_name": "高一上学期期中", "avg_rate": 78.5 } ],
    "recentExams": [ ... ]
}
```

### 5.7 管理员接口

需要 `ADMIN` 或 `SUPER_ADMIN` 角色。

#### GET /api/admin/universities
大学数据管理（分页 + 搜索 + 筛选）
#### DELETE /api/admin/universities/{id}
删除大学数据
#### GET /api/admin/logs
操作日志（分页）
#### GET /api/admin/backups
备份列表
#### POST /api/admin/backups
创建数据库备份
#### GET /api/admin/backups/{file}/download
下载备份文件
#### DELETE /api/admin/backups/{file}
删除备份

### 5.8 个人设置

#### GET /api/me
获取当前用户信息
#### PUT /api/me
修改个人信息
```json
请求: { "name": "张三", "className": "高一(3)班" }
```

---

## 六、前端架构说明

### 6.1 页面路由机制

前端使用**简单的页面切换机制**（非 Vue Router）：

```javascript
var page = 'dashboard';  // 当前页面标识

function navigate(p) {
    page = p;
    renderMenu();        // 更新菜单高亮
    var pages = {
        'dashboard': renderDashboard,
        'exam-select': renderExamSelect,
        // ...
    };
    if (pages[p]) pages[p]();  // 调用对应的渲染函数
}
```

每个页面对应一个 `renderXxx()` 函数，负责生成 HTML 并插入 `#content` 容器。

### 6.2 API 调用封装

```javascript
function api(method, url, data) {
    return fetch('/api' + url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : null
    }).then(function(r) { return r.json(); });
}

// 使用示例:
api('GET', '/universities?page=1').then(function(res) {
    var list = res.data.list;
    // 渲染数据...
});
```

### 6.3 用户数据传递

`index.php` 中用 PHP 将用户信息注入全局 JS 变量：

```php
<!-- index.php 中 -->
<script>
    var currentUser = <?php echo json_encode($user); ?>;
    initApp();
</script>
```

`app.js` 中使用 `currentUser` 获取用户信息。

### 6.4 DOM 操作约定

```javascript
// 获取元素
function $(id) { return document.getElementById(id); }

// 设置内容区 HTML
function h(html) { $('content').innerHTML = html; }

// 页面渲染函数模板
function renderDashboard() {
    h('<div class="page-title">数据概览</div>' +
        '<div class="stats-row">...</div>');
}
```

### 6.5 样式变量

`assets/style.css` 中定义了 CSS 变量：

```css
:root {
    --primary: #e74c5c;        /* 主题色（红色） */
    --bg: #f5f7fb;             /* 背景色 */
    --card: #ffffff;           /* 卡片背景 */
    --text: #333333;           /* 主文字色 */
    --text-secondary: #888888; /* 次要文字色 */
    --border: #ebeef5;         /* 边框色 */
    --sidebar-w: 200px;        /* 侧边栏宽度 */
}
```

修改主题色只需改 `--primary` 变量。

---

## 七、开发指南

### 7.1 如何修改页面

#### 修改样式
编辑 `assets/style.css`，保存 → 刷新浏览器 → 立即生效。

#### 修改前端逻辑
编辑 `assets/app.js`，保存 → 刷新浏览器 → 立即生效。

#### 修改页面布局/HTML
编辑 `index.php` 中对应的 `renderXxx()` 函数，保存 → 刷新浏览器 → 立即生效。

#### 修改后端 API
编辑 `api/index.php`，保存 → 刷新浏览器 → 立即生效。

#### 添加新页面
1. 在 `index.php` 的 `menuItems` 数组中添加菜单项
2. 添加对应的 `renderXxxPage()` 函数
3. 在 `navigate()` 的 `pages` 对象中注册路由

### 7.2 添加新 API 接口

在 `api/index.php` 中添加路由处理：

```php
if ($routePath === '/new-endpoint' && $method === 'GET') {
    $user = needAuth();  // 需要登录
    // 业务逻辑...
    ok(['data' => $result]);
}
```

### 7.3 数据库操作

使用 PDO 预处理语句：

```php
// 查询
$stmt = getDB()->prepare("SELECT * FROM scores WHERE user_id = ?");
$stmt->execute([$user['id']]);
$scores = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 插入
$stmt = getDB()->prepare("INSERT INTO scores (exam_id, user_id, subject, score) VALUES (?, ?, ?, ?)");
$stmt->execute([$examId, $user['id'], '数学', 118]);
```

### 7.4 认证检查

```php
// 需要登录的接口
$user = needAuth();

// 需要管理员权限
needAdmin();

// 可选登录（不强制）
try {
    $user = needAuth();
} catch (Exception $e) {
    $user = null;
}
```

---

## 八、部署指南

### 8.1 环境要求

- PHP 8.3+（需启用 PDO SQLite 扩展）
- Nginx（或其他支持伪静态的 Web 服务器）
- SQLite 3.35+

### 8.2 部署步骤

1. **复制项目目录**到服务器 Web 根目录
2. **确保 `data/` 和 `backups/` 目录可写**
3. **配置 Nginx 伪静态**（见 8.3）
4. **首次访问** `http://你的域名/`，系统自动创建数据库
5. **注册管理员账号**（通过 API 或直接在数据库中插入）

### 8.3 Nginx 伪静态配置

在宝塔面板的"网站 → 设置 → 伪静态"中添加：

```nginx
# API 路由转发
location /api/ {
    fastcgi_pass 127.0.0.1:20083;
    fastcgi_param SCRIPT_FILENAME $document_root/api/index.php;
    fastcgi_param PATH_INFO $fastcgi_path_info;
    include fastcgi_params;
    fastcgi_connect_timeout 60s;
    fastcgi_read_timeout 60s;
    fastcgi_send_timeout 60s;
}

# 禁止访问数据目录
location ~* ^/(data|backups)/ {
    deny all;
    return 404;
}

# 禁止下载敏感文件
location ~* \.(db|sql|bak|sqlite|env|log)$ {
    deny all;
    return 404;
}

# 禁止访问隐藏文件
location ~ /\. {
    deny all;
    return 404;
}
```

### 8.4 迁移到新服务器

1. 打包整个 `rs.cn/` 目录
2. 复制到新服务器
3. 配置 Nginx root 指向该目录
4. 配置伪静态
5. 确保 PHP-FPM 正常运行
6. 访问即可（数据库自动携带）

---

## 九、常见问题

### Q1: 页面空白/白屏
- 检查浏览器控制台是否有 JS 错误
- 确认 `currentUser` 变量已正确注入（`index.php` 中 PHP 输出）
- 确认 `assets/app.js` 和 `assets/style.css` 路径正确

### Q2: API 返回 404
- 检查 Nginx 伪静态配置是否正确
- 确认 `api/index.php` 存在且有执行权限

### Q3: 数据库不存在
- 首次访问会自动创建
- 检查 `data/` 目录是否有写入权限

### Q4: 修改代码后不生效
- 强制刷新浏览器（Ctrl+F5）
- 清除浏览器缓存

---

## 十、项目文件清单

| 文件 | 行数 | 说明 |
|------|------|------|
| `api/index.php` | ~1000 | API 路由和业务逻辑 |
| `api/config.php` | ~250 | 配置和工具函数 |
| `api/schema.sql` | ~200 | 数据库结构 |
| `index.php` | ~300 | 主页面模板 |
| `login.php` | ~80 | 登录页 |
| `assets/style.css` | ~200 | 样式 |
| `assets/app.js` | ~550 | 前端逻辑 |
| **总计** | **~2580** | 约 2-5 MB |

---

## 十一、后续开发建议

### 已完成功能
- [x] 用户注册/登录
- [x] 数据概览（仪表盘）
- [x] 考试选择
- [x] 成绩录入
- [x] 成绩管理
- [x] 考试目标
- [x] 目标大学（搜索、添加、移除）
- [x] 个人信息
- [x] 管理员数据管理
- [x] 操作日志
- [x] 备份管理

### 待开发功能
- [ ] 成绩分析（趋势图、雷达图完善）
- [ ] 志愿分析（AI 推荐算法）
- [ ] 成绩导出/导入
- [ ] 班级/学校数据对比
- [ ] 数据可视化优化
- [ ] 移动端适配

---

*文档版本: V3.0 | 最后更新: 2026-05-02 | 维护者: Red-Star 开发团队*
