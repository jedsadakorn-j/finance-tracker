-- Seed data: default categories + demo transactions.
-- Safe to re-run: uses INSERT OR IGNORE / fixed ids.
-- Local:  npm run db:seed:local
-- Remote: npm run db:seed:remote

----------------------------------------------------------------------
-- Default categories
----------------------------------------------------------------------
INSERT OR IGNORE INTO categories (id, type, name, icon, sort_order, created_at, updated_at) VALUES
  ('cat-inc-salary',       'income',  'salary',        '💼', 1, 1749000000000, 1749000000000),
  ('cat-inc-bonus',        'income',  'bonus',         '🎁', 2, 1749000000000, 1749000000000),
  ('cat-inc-freelance',    'income',  'freelance',     '🧑‍💻', 3, 1749000000000, 1749000000000),
  ('cat-inc-investment',   'income',  'investment',    '📈', 4, 1749000000000, 1749000000000),
  ('cat-inc-gift',         'income',  'gift',          '🎀', 5, 1749000000000, 1749000000000),
  ('cat-inc-other',        'income',  'other_income',  '➕', 6, 1749000000000, 1749000000000),
  ('cat-exp-food',         'expense', 'food',          '🍜', 1, 1749000000000, 1749000000000),
  ('cat-exp-transport',    'expense', 'transport',     '🚌', 2, 1749000000000, 1749000000000),
  ('cat-exp-shopping',     'expense', 'shopping',      '🛍️', 3, 1749000000000, 1749000000000),
  ('cat-exp-rent',         'expense', 'rent',          '🏠', 4, 1749000000000, 1749000000000),
  ('cat-exp-utility',      'expense', 'utility',       '💡', 5, 1749000000000, 1749000000000),
  ('cat-exp-entertainment','expense', 'entertainment', '🎬', 6, 1749000000000, 1749000000000),
  ('cat-exp-health',       'expense', 'health',        '🏥', 7, 1749000000000, 1749000000000),
  ('cat-exp-education',    'expense', 'education',     '📚', 8, 1749000000000, 1749000000000),
  ('cat-exp-travel',       'expense', 'travel',        '✈️', 9, 1749000000000, 1749000000000),
  ('cat-exp-other',        'expense', 'other_expense', '➖', 10, 1749000000000, 1749000000000);

----------------------------------------------------------------------
-- Demo transactions (April, May, June 2026)
----------------------------------------------------------------------
INSERT OR IGNORE INTO transactions (id, type, amount, category, description, transaction_date, created_at, updated_at) VALUES
  -- April 2026
  ('seed-001', 'income',  48000, 'salary',        'เงินเดือน',           '2026-04-25', 1749000000000, 1749000000000),
  ('seed-002', 'expense', 12000, 'rent',          'ค่าเช่าห้อง',          '2026-04-01', 1749000000000, 1749000000000),
  ('seed-003', 'expense', 3200,  'food',          'ค่าอาหารทั้งเดือน',     '2026-04-10', 1749000000000, 1749000000000),
  ('seed-004', 'expense', 1500,  'transport',     'ค่าเดินทาง',           '2026-04-12', 1749000000000, 1749000000000),
  ('seed-005', 'expense', 2200,  'shopping',      'เสื้อผ้า',             '2026-04-18', 1749000000000, 1749000000000),
  ('seed-006', 'income',  5000,  'freelance',     'งานเสริม',            '2026-04-20', 1749000000000, 1749000000000),

  -- May 2026
  ('seed-010', 'income',  50000, 'salary',        'เงินเดือน',           '2026-05-25', 1749000000000, 1749000000000),
  ('seed-011', 'income',  8000,  'bonus',         'โบนัสกลางปี',          '2026-05-28', 1749000000000, 1749000000000),
  ('seed-012', 'expense', 12000, 'rent',          'ค่าเช่าห้อง',          '2026-05-01', 1749000000000, 1749000000000),
  ('seed-013', 'expense', 4800,  'food',          'ค่าอาหาร',            '2026-05-05', 1749000000000, 1749000000000),
  ('seed-014', 'expense', 1800,  'transport',     'ค่าน้ำมัน',            '2026-05-08', 1749000000000, 1749000000000),
  ('seed-015', 'expense', 1200,  'utility',       'ค่าไฟ + ค่าน้ำ',       '2026-05-10', 1749000000000, 1749000000000),
  ('seed-016', 'expense', 3500,  'entertainment', 'ดูหนัง + คาเฟ่',        '2026-05-15', 1749000000000, 1749000000000),
  ('seed-017', 'expense', 2500,  'health',        'หาหมอ',               '2026-05-20', 1749000000000, 1749000000000),

  -- June 2026 (current month)
  ('seed-020', 'income',  50000, 'salary',        'เงินเดือน',           '2026-06-25', 1749000000000, 1749000000000),
  ('seed-021', 'expense', 12000, 'rent',          'ค่าเช่าห้อง',          '2026-06-01', 1749000000000, 1749000000000),
  ('seed-022', 'expense', 250,   'food',          'ข้าวกลางวัน',          '2026-06-02', 1749000000000, 1749000000000),
  ('seed-023', 'expense', 180,   'food',          'กาแฟ + ขนม',          '2026-06-03', 1749000000000, 1749000000000),
  ('seed-024', 'expense', 1500,  'transport',     'เติมน้ำมัน',           '2026-06-05', 1749000000000, 1749000000000),
  ('seed-025', 'expense', 3200,  'shopping',      'ของใช้ในบ้าน',         '2026-06-07', 1749000000000, 1749000000000),
  ('seed-026', 'expense', 1100,  'utility',       'ค่าอินเทอร์เน็ต',       '2026-06-08', 1749000000000, 1749000000000),
  ('seed-027', 'income',  6500,  'freelance',     'งานออกแบบ',           '2026-06-10', 1749000000000, 1749000000000),
  ('seed-028', 'expense', 600,   'entertainment', 'Netflix + Spotify',   '2026-06-11', 1749000000000, 1749000000000);
