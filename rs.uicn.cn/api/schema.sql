-- ===== 元数据 =====
CREATE TABLE IF NOT EXISTS db_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO db_meta (key, value) VALUES ('version', '0');

-- ===== 学校 =====
CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ===== 用户 =====
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'USER',
    is_email_verified INTEGER NOT NULL DEFAULT 0,
    verification_code TEXT,
    membership_type TEXT NOT NULL DEFAULT 'FREE',
    membership_expires_at TEXT NOT NULL DEFAULT '2028-06-06 23:59:59',
    school_id INTEGER,
    grade TEXT NOT NULL DEFAULT '',
    class_name TEXT NOT NULL DEFAULT '',
    subject_type TEXT NOT NULL DEFAULT 'physics',
    subjects TEXT NOT NULL DEFAULT '[]',
    subject_preset_id INTEGER,
    graduation_status INTEGER NOT NULL DEFAULT 0,
    graduation_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- ===== 选科预设 =====
CREATE TABLE IF NOT EXISTS subject_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    first_choice TEXT NOT NULL,
    re_choices TEXT NOT NULL,
    subjects TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ===== 年级 =====
CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- ===== 班级 =====
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- ===== 考试 =====
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    semester TEXT NOT NULL DEFAULT '',
    grade_range TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (created_by) REFERENCES accounts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);

-- ===== 成绩 =====
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    full_score REAL NOT NULL DEFAULT 100,
    grade_rank INTEGER,
    class_rank INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE(exam_id, user_id, subject)
);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_exam ON scores(exam_id);

-- ===== 成绩编辑日志 =====
CREATE TABLE IF NOT EXISTS score_edit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edited_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE,
    FOREIGN KEY (editor_id) REFERENCES accounts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_edit_logs_score ON score_edit_logs(score_id);

-- ===== 排名目标 =====
CREATE TABLE IF NOT EXISTS rank_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'grade_rank',
    target_value INTEGER NOT NULL,
    target_grade_rank INTEGER DEFAULT NULL,
    target_class_rank INTEGER DEFAULT NULL,
    subject_scores TEXT NOT NULL DEFAULT '{}',
    exam_id INTEGER DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON rank_goals(user_id);

-- ===== 目标达成 =====
CREATE TABLE IF NOT EXISTS goal_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    actual_class_rank INTEGER,
    actual_grade_rank INTEGER,
    is_achieved INTEGER NOT NULL DEFAULT 0,
    gap_value INTEGER,
    analyzed_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (goal_id) REFERENCES rank_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE(goal_id, exam_id)
);

-- ===== 大学库 =====
CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    university_level TEXT NOT NULL DEFAULT '',
    province TEXT NOT NULL DEFAULT '',
    subject_type TEXT NOT NULL DEFAULT 'physics',
    data_year INTEGER NOT NULL DEFAULT 2025,
    admission_score INTEGER,
    admission_rank INTEGER,
    student_quota INTEGER,
    subject_requirements TEXT,
    official_url TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(name, subject_type, data_year)
);
CREATE INDEX IF NOT EXISTS idx_uni_level ON universities(university_level, subject_type);
CREATE INDEX IF NOT EXISTS idx_uni_year ON universities(data_year);

-- ===== 大学目标 =====
CREATE TABLE IF NOT EXISTS university_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    university_id INTEGER NOT NULL,
    target_rank INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    UNIQUE(user_id, university_id)
);

-- ===== 通知 =====
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- ===== 密码重置 =====
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_resets(token, used, expires_at);

-- ===== 邮箱验证码（忘记密码） =====
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_email_code ON email_verification_codes(email, used, expires_at);

-- ===== 工单 =====
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    captcha TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    admin_reply TEXT NOT NULL DEFAULT '',
    replied_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ===== 更新日志 =====
CREATE TABLE IF NOT EXISTS changelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog(version);

-- ===== 操作日志 =====
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(created_at DESC);

-- ===== 系统设置 =====
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ===== 志愿分析记录 =====
CREATE TABLE IF NOT EXISTS preference_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    avg_score INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    max_score INTEGER,
    volatility INTEGER,
    trend TEXT DEFAULT '稳定',
    exam_count INTEGER DEFAULT 1,
    subject_type TEXT NOT NULL DEFAULT 'physics',
    subject_avg_scores TEXT,
    subject_min_scores TEXT,
    subject_max_scores TEXT,
    school_data TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ===== 初始数据 =====
INSERT OR IGNORE INTO accounts (id, email, name, password_hash, role, is_email_verified, membership_type, membership_expires_at, status)
VALUES (1, 'hy@chge.cn', '超级管理员', '$2y$10$fxmfd./DH8bkOc0BJiIjZunRWhKnk32KpImzeFPjbmfJLCb9Rs4Ba', 'SUPER_ADMIN', 1, 'SUPER_ADMIN', '9999-12-31 23:59:59', 'active');

INSERT OR IGNORE INTO accounts (id, email, name, password_hash, role, is_email_verified, membership_type, membership_expires_at, status)
VALUES (2, 'hy@uicn.cn', '管理员', '$2y$10$fxmfd./DH8bkOc0BJiIjZunRWhKnk32KpImzeFPjbmfJLCb9Rs4Ba', 'ADMIN', 1, 'ADMIN', '9999-12-31 23:59:59', 'active');

-- 密码：211985316

INSERT OR IGNORE INTO schools (id, name, address, contact) VALUES
(1, '马鞍山第二中学', '', '省示范高中'),
(2, '马鞍山中加双语学校', '', '民办双语'),
(3, '马鞍山红星中学', '', '省示范高中'),
(4, '马鞍山第八高级中学', '', '省示范高中'),
(5, '马鞍山第二十二中学', '', '省示范高中');

INSERT OR IGNORE INTO grades (id, name, sort_order) VALUES
(1, '高一', 1),
(2, '高二', 2),
(3, '高三', 3);

INSERT OR IGNORE INTO classes (id, name, sort_order) VALUES
(1, '1班', 1),
(2, '2班', 2),
(3, '3班', 3),
(4, '4班', 4),
(5, '5班', 5),
(6, '6班', 6),
(7, '7班', 7),
(8, '8班', 8),
(9, '9班', 9),
(10, '10班', 10),
(11, '11班', 11),
(12, '12班', 12),
(13, '13班', 13),
(14, '14班', 14),
(15, '15班', 15),
(16, '16班', 16),
(17, '17班', 17),
(18, '18班', 18),
(19, '19班', 19),
(20, '20班', 20);

INSERT OR IGNORE INTO subject_presets (id, name, first_choice, re_choices, subjects) VALUES
(1, '物化生', '物理', '化学,生物', '["物理","化学","生物"]'),
(2, '历政地', '历史', '政治,地理', '["历史","政治","地理"]'),
(3, '物化地', '物理', '化学,地理', '["物理","化学","地理"]'),
(4, '物化政', '物理', '化学,政治', '["物理","化学","政治"]'),
(5, '自由组合', '', '', '[]');

INSERT OR IGNORE INTO settings (key, value) VALUES
('site_name', '阳光学情报告'),
('items_per_page', '20'),
('default_grade', '高一'),
('maintenance_mode', '0'),
('allow_register', '1'),
('email_verify_required', '1'),
('membership_default_expires', '2028-06-06 23:59:59'),
('site_notice', ''),
('exam_full_score_chinese', '150'),
('exam_full_score_math', '150'),
('exam_full_score_english', '150'),
('exam_full_score_default', '100'),
('data_year', '2025'),
('province', '安徽');

INSERT OR IGNORE INTO changelog (version, title, content) VALUES
('7.0.0', 'V7.0.0 重大更新', '1. 系统更名为"阳光学情报告"\n2. 密码最低6位\n3. 注册需邮箱验证码激活\n4. 会员有效期统一到2028-06-06\n5. 完善个人信息页面\n6. 新增技术支持工单系统\n7. 目标大学显示多科类分数\n8. 新增版本号显示\n9. 新增更新记录功能');
