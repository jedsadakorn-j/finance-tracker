-- Seed data: demo user + their default categories + demo transactions.
-- Safe to re-run: uses INSERT OR IGNORE / fixed ids.
-- Run AFTER migrations. Local: npm run db:seed:local | Remote: npm run db:seed:remote
--
-- Demo login →  email: demo@example.com   password: demo1234

----------------------------------------------------------------------
-- Demo user (matches the demo account created in migration 0002)
----------------------------------------------------------------------
INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
VALUES (
  'demo-user',
  'demo@example.com',
  'pbkdf2$100000$nDQMlUvAU_Vc38V0uIqKPw$yuw2fcqOo9xZK558tu_BY9zhl6wzPCEH22uToRPEms4',
  1749000000000,
  1749000000000
);

----------------------------------------------------------------------
-- Default categories (owned by the demo user)
----------------------------------------------------------------------
INSERT OR IGNORE INTO categories (id, user_id, type, name, icon, sort_order, created_at, updated_at) VALUES
  ('cat-inc-salary',       'demo-user', 'income',  'salary',        '💼', 1, 1749000000000, 1749000000000),
  ('cat-inc-bonus',        'demo-user', 'income',  'bonus',         '🎁', 2, 1749000000000, 1749000000000),
  ('cat-inc-freelance',    'demo-user', 'income',  'freelance',     '🧑‍💻', 3, 1749000000000, 1749000000000),
  ('cat-inc-investment',   'demo-user', 'income',  'investment',    '📈', 4, 1749000000000, 1749000000000),
  ('cat-inc-gift',         'demo-user', 'income',  'gift',          '🎀', 5, 1749000000000, 1749000000000),
  ('cat-inc-other',        'demo-user', 'income',  'other_income',  '➕', 6, 1749000000000, 1749000000000),
  ('cat-exp-food',         'demo-user', 'expense', 'food',          '🍜', 1, 1749000000000, 1749000000000),
  ('cat-exp-transport',    'demo-user', 'expense', 'transport',     '🚌', 2, 1749000000000, 1749000000000),
  ('cat-exp-shopping',     'demo-user', 'expense', 'shopping',      '🛍️', 3, 1749000000000, 1749000000000),
  ('cat-exp-rent',         'demo-user', 'expense', 'rent',          '🏠', 4, 1749000000000, 1749000000000),
  ('cat-exp-utility',      'demo-user', 'expense', 'utility',       '💡', 5, 1749000000000, 1749000000000),
  ('cat-exp-entertainment','demo-user', 'expense', 'entertainment', '🎬', 6, 1749000000000, 1749000000000),
  ('cat-exp-health',       'demo-user', 'expense', 'health',        '🏥', 7, 1749000000000, 1749000000000),
  ('cat-exp-education',    'demo-user', 'expense', 'education',     '📚', 8, 1749000000000, 1749000000000),
  ('cat-exp-travel',       'demo-user', 'expense', 'travel',        '✈️', 9, 1749000000000, 1749000000000),
  ('cat-exp-other',        'demo-user', 'expense', 'other_expense', '➖', 10, 1749000000000, 1749000000000);

----------------------------------------------------------------------
-- Demo transactions (April, May, June 2026) — owned by the demo user
----------------------------------------------------------------------
INSERT OR IGNORE INTO transactions (id, user_id, type, amount, category, description, transaction_date, created_at, updated_at) VALUES
  -- April 2026
  ('seed-001', 'demo-user', 'income',  48000, 'salary',        'เงินเดือน',           '2026-04-25', 1749000000000, 1749000000000),
  ('seed-002', 'demo-user', 'expense', 12000, 'rent',          'ค่าเช่าห้อง',          '2026-04-01', 1749000000000, 1749000000000),
  ('seed-003', 'demo-user', 'expense', 3200,  'food',          'ค่าอาหารทั้งเดือน',     '2026-04-10', 1749000000000, 1749000000000),
  ('seed-004', 'demo-user', 'expense', 1500,  'transport',     'ค่าเดินทาง',           '2026-04-12', 1749000000000, 1749000000000),
  ('seed-005', 'demo-user', 'expense', 2200,  'shopping',      'เสื้อผ้า',             '2026-04-18', 1749000000000, 1749000000000),
  ('seed-006', 'demo-user', 'income',  5000,  'freelance',     'งานเสริม',            '2026-04-20', 1749000000000, 1749000000000),

  -- May 2026
  ('seed-010', 'demo-user', 'income',  50000, 'salary',        'เงินเดือน',           '2026-05-25', 1749000000000, 1749000000000),
  ('seed-011', 'demo-user', 'income',  8000,  'bonus',         'โบนัสกลางปี',          '2026-05-28', 1749000000000, 1749000000000),
  ('seed-012', 'demo-user', 'expense', 12000, 'rent',          'ค่าเช่าห้อง',          '2026-05-01', 1749000000000, 1749000000000),
  ('seed-013', 'demo-user', 'expense', 4800,  'food',          'ค่าอาหาร',            '2026-05-05', 1749000000000, 1749000000000),
  ('seed-014', 'demo-user', 'expense', 1800,  'transport',     'ค่าน้ำมัน',            '2026-05-08', 1749000000000, 1749000000000),
  ('seed-015', 'demo-user', 'expense', 1200,  'utility',       'ค่าไฟ + ค่าน้ำ',       '2026-05-10', 1749000000000, 1749000000000),
  ('seed-016', 'demo-user', 'expense', 3500,  'entertainment', 'ดูหนัง + คาเฟ่',        '2026-05-15', 1749000000000, 1749000000000),
  ('seed-017', 'demo-user', 'expense', 2500,  'health',        'หาหมอ',               '2026-05-20', 1749000000000, 1749000000000),

  -- June 2026 (current month)
  ('seed-020', 'demo-user', 'income',  50000, 'salary',        'เงินเดือน',           '2026-06-25', 1749000000000, 1749000000000),
  ('seed-021', 'demo-user', 'expense', 12000, 'rent',          'ค่าเช่าห้อง',          '2026-06-01', 1749000000000, 1749000000000),
  ('seed-022', 'demo-user', 'expense', 250,   'food',          'ข้าวกลางวัน',          '2026-06-02', 1749000000000, 1749000000000),
  ('seed-023', 'demo-user', 'expense', 180,   'food',          'กาแฟ + ขนม',          '2026-06-03', 1749000000000, 1749000000000),
  ('seed-024', 'demo-user', 'expense', 1500,  'transport',     'เติมน้ำมัน',           '2026-06-05', 1749000000000, 1749000000000),
  ('seed-025', 'demo-user', 'expense', 3200,  'shopping',      'ของใช้ในบ้าน',         '2026-06-07', 1749000000000, 1749000000000),
  ('seed-026', 'demo-user', 'expense', 1100,  'utility',       'ค่าอินเทอร์เน็ต',       '2026-06-08', 1749000000000, 1749000000000),
  ('seed-027', 'demo-user', 'income',  6500,  'freelance',     'งานออกแบบ',           '2026-06-10', 1749000000000, 1749000000000),
  ('seed-028', 'demo-user', 'expense', 600,   'entertainment', 'Netflix + Spotify',   '2026-06-11', 1749000000000, 1749000000000);