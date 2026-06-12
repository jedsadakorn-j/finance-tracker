# Developer Assignment: AI-assisted Personal Finance Tracker on Cloudflare Free Tier

## เป้าหมายของโจทย์

ให้ Developer สร้างเว็บแอปสำหรับบันทึกและวิเคราะห์ **รายรับ-รายจ่ายส่วนตัว** ที่สามารถใช้งานออนไลน์ได้จริง โดยใช้ AI เป็นผู้ช่วยในกระบวนการพัฒนา และ Deploy บน Cloudflare เพื่อควบคุมต้นทุนให้อยู่ในระดับต่ำที่สุด หรือใช้ Free Tier ให้มากที่สุด

Project นี้ต้องไม่ใช่แค่หน้าเว็บ demo แต่ต้องเป็นระบบที่สามารถใช้งานจริงได้ มี database, API, dashboard, report และ documentation ที่อธิบายการใช้ AI ในการทำงาน

---

## ชื่อ Project

**AI-assisted Personal Finance Tracker using Cloudflare Free Tier**

---

## Scope ของงาน

สร้างเว็บแอปสำหรับจัดการรายรับ-รายจ่ายส่วนตัว โดยมีความสามารถหลักดังนี้:

1. บันทึกรายรับ
2. บันทึกรายจ่าย
3. ดูรายการย้อนหลัง
4. แก้ไข / ลบรายการ
5. Dashboard สรุปยอด
6. Report รายเดือน
7. กราฟแสดงข้อมูล
8. Export ข้อมูลเป็น CSV
9. Deploy ใช้งานออนไลน์ได้จริง

---

## Tech Stack ที่แนะนำ

| ส่วน | Technology |
|---|---|
| Frontend | Next.js / React / Astro / Remix |
| Hosting | Cloudflare Pages |
| Backend API | Cloudflare Workers |
| Database | Cloudflare D1 |
| Config / Session / Cache | Cloudflare KV ถ้าจำเป็น |
| Chart | Recharts / Chart.js |
| Deploy | GitHub + Cloudflare Pages CI/CD |
| AI Tools | ChatGPT / Cursor / GitHub Copilot / Claude Code หรือเครื่องมืออื่น ๆ |

Developer สามารถเลือก stack อื่นได้ แต่ต้องอธิบายเหตุผลใน README.md

---

## Functional Requirements

### 1. Authentication แบบง่าย

ระบบต้องมีการป้องกันไม่ให้คนทั่วไปเข้ามาดูข้อมูลได้

ขั้นต่ำต้องมีอย่างใดอย่างหนึ่ง:

- Login ด้วย password
- Login ด้วย PIN
- Basic Auth
- Magic link
- หรือระบบ auth แบบอื่นที่เหมาะสม

ข้อกำหนดสำคัญ:

- ห้าม hardcode password หรือ secret ลง source code
- ต้องใช้ environment variable สำหรับ secret
- ต้องมีการอธิบายวิธีตั้งค่าใน README.md

---

### 2. Dashboard

หน้า Dashboard ต้องแสดงข้อมูลสรุปอย่างน้อยดังนี้:

| รายการ | ตัวอย่าง |
|---|---:|
| รายรับเดือนนี้ | 50,000 บาท |
| รายจ่ายเดือนนี้ | 32,500 บาท |
| คงเหลือเดือนนี้ | 17,500 บาท |
| รายจ่ายเฉลี่ยต่อวัน | 1,083 บาท |
| หมวดที่ใช้เงินเยอะที่สุด | Food |
| จำนวนรายการทั้งหมด | 120 รายการ |

Dashboard ควรอ่านง่าย ใช้งานบนมือถือได้ดี และเห็นภาพรวมการเงินได้ทันที

---

### 3. Add Transaction

ต้องมีหน้าหรือ modal สำหรับเพิ่มรายการรายรับ-รายจ่าย

ข้อมูลขั้นต่ำที่ต้องบันทึก:

| Field | Required | ตัวอย่าง |
|---|---|---|
| type | Yes | income / expense |
| amount | Yes | 250.00 |
| category | Yes | food |
| description | No | ข้าวกลางวัน |
| transaction_date | Yes | 2026-05-14 |

ตัวอย่าง payload:

```json
{
  "type": "expense",
  "amount": 250,
  "category": "food",
  "description": "ข้าวกลางวัน",
  "transaction_date": "2026-05-14"
}
```

---

### 4. Transaction List

ต้องมีหน้ารายการย้อนหลังที่สามารถดูรายการทั้งหมดได้

ต้องรองรับ:

- แสดงรายการล่าสุดขึ้นก่อน
- Filter ตามวันที่เริ่มต้น / วันที่สิ้นสุด
- Filter ตาม type: income / expense
- Filter ตาม category
- Search จาก description
- แก้ไขรายการ
- ลบรายการ

ตัวอย่าง column ที่ควรแสดง:

| Date | Type | Category | Description | Amount | Action |
|---|---|---|---|---:|---|
| 2026-05-14 | expense | food | ข้าวกลางวัน | 250 | Edit / Delete |

---

### 5. Categories

ระบบต้องมีหมวดหมู่เริ่มต้น

รายรับ:

- salary
- bonus
- freelance
- investment
- gift
- other_income

รายจ่าย:

- food
- transport
- shopping
- rent
- utility
- entertainment
- health
- education
- travel
- other_expense

Bonus ถ้าสามารถเพิ่ม / แก้ไข / ลบ category เองได้

---

### 6. Monthly Report

ต้องมีหน้ารายงานรายเดือน

ข้อมูลขั้นต่ำ:

| Month | Income | Expense | Balance |
|---|---:|---:|---:|
| 2026-05 | 50,000 | 32,500 | 17,500 |
| 2026-04 | 48,000 | 29,000 | 19,000 |

ต้องสามารถคำนวณยอดรวมจากรายการจริงใน database ได้ ไม่ใช่ mock data

---

### 7. Charts

ต้องมีกราฟอย่างน้อย 2 แบบ:

1. กราฟเปรียบเทียบรายรับ vs รายจ่ายรายเดือน
2. กราฟสัดส่วนรายจ่ายแยกตาม category

ตัวอย่าง:

- Bar chart รายเดือน
- Pie chart / Donut chart ตามหมวดหมู่
- Line chart แนวโน้มรายรับ-รายจ่าย

---

### 8. Export CSV

ระบบต้องสามารถ export transaction list เป็น CSV ได้

CSV ควรมี column อย่างน้อย:

```csv
date,type,category,description,amount
2026-05-14,expense,food,ข้าวกลางวัน,250
2026-05-14,income,salary,เงินเดือน,50000
```

---

## API Requirements

ควรมี API ขั้นต่ำดังนี้:

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/transactions | ดึงรายการรายรับ-รายจ่าย |
| POST | /api/transactions | เพิ่มรายการ |
| PUT/PATCH | /api/transactions/:id | แก้ไขรายการ |
| DELETE | /api/transactions/:id | ลบรายการ |
| GET | /api/dashboard | ดึงข้อมูลสรุป dashboard |
| GET | /api/reports/monthly | ดึงรายงานรายเดือน |
| GET | /api/export.csv | export CSV |

---

## Database Requirement

ใช้ Cloudflare D1 หรือ database อื่นที่เหมาะสมกับ Cloudflare

Schema ขั้นต่ำ:

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount REAL NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  transaction_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category);
```

Optional schema สำหรับ category:

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## UI/UX Requirements

เว็บต้องใช้งานง่ายและ responsive

ต้องรองรับ:

- Desktop
- Tablet
- Mobile

หน้าหลักที่ต้องมี:

1. Login
2. Dashboard
3. Add Transaction
4. Transaction List
5. Monthly Report
6. Settings หรือ Category Management ถ้าทำเพิ่ม

ข้อกำหนด UI:

- อ่านยอดเงินง่าย
- แยกสีหรือ icon ระหว่างรายรับกับรายจ่าย
- Form validation ชัดเจน
- Loading state
- Empty state เช่น “ยังไม่มีรายการ”
- Error state เช่น “ไม่สามารถบันทึกข้อมูลได้”

---

## AI Usage Requirement

Developer ต้องใช้ AI ช่วยในการทำงาน และต้องมีไฟล์ `AI_USAGE.md`

ไฟล์นี้ต้องมีเนื้อหาอย่างน้อย:

```md
# AI Usage

## AI Tools Used

- ChatGPT
- Cursor
- GitHub Copilot
- Claude Code
- อื่น ๆ

## What AI Helped With

- ออกแบบ database schema
- ออกแบบ API
- สร้าง UI component
- เขียน SQL query สำหรับ report
- Generate test cases
- Refactor code
- Review security issue
- เขียน README
- เขียน deployment guide

## Example Prompts

1. ช่วยออกแบบ database schema สำหรับเว็บรายรับรายจ่ายที่ใช้ Cloudflare D1
2. ช่วยออกแบบ API สำหรับ CRUD transactions และ monthly report
3. ช่วย review code ส่วน contact/auth ว่ามี security issue อะไรบ้าง
4. ช่วยสร้าง UI dashboard สำหรับดูรายรับรายจ่ายแบบ mobile-first
5. ช่วยเขียน SQL query สรุปรายรับรายจ่ายรายเดือน

## Human Review

อธิบายว่าส่วนไหนที่ Developer ตรวจเอง แก้เอง หรือไม่ใช้ตาม AI เพราะเหตุผลด้าน business logic, security หรือ performance

## Mistakes Found From AI

ระบุอย่างน้อย 1 ตัวอย่างที่ AI แนะนำผิด หรือยังไม่เหมาะสม และ Developer แก้ไขอย่างไร
```

---

## README.md Requirement

ต้องมีไฟล์ `README.md` ที่อธิบายครบถ้วน

หัวข้อขั้นต่ำ:

```md
# AI-assisted Personal Finance Tracker

## Live Demo

URL ของเว็บที่ deploy แล้ว

## Features

- Login
- Dashboard
- Add income / expense
- Transaction list
- Monthly report
- Charts
- CSV export

## Tech Stack

- Frontend:
- Backend:
- Database:
- Hosting:
- AI Tools:

## Local Development

วิธีติดตั้งและ run local

## Environment Variables

ตัวแปรที่ต้องตั้งค่า เช่น

- ADMIN_PASSWORD
- SESSION_SECRET
- DATABASE_BINDING

## Database Migration

วิธีสร้าง table และ run migration

## Deploy to Cloudflare

ขั้นตอน deploy ไป Cloudflare Pages / Workers

## Cost Summary

อธิบายว่าใช้ Cloudflare service อะไรบ้าง และออกแบบอย่างไรให้ cost ต่ำ

## AI Usage

Link ไปที่ AI_USAGE.md
```

---

## Deployment Requirement

Developer ต้อง Deploy project ให้ใช้งานออนไลน์ได้จริง

ต้องส่ง:

- Live URL
- GitHub Repository
- วิธี deploy ซ้ำ
- Screenshot หลักฐานว่าใช้งานได้จริง

แนะนำให้ใช้:

- Cloudflare Pages สำหรับ frontend
- Cloudflare Workers สำหรับ API
- Cloudflare D1 สำหรับ database
- GitHub สำหรับ source code และ auto deploy

---

## Deliverables

Developer ต้องส่งมอบสิ่งต่อไปนี้:

| Deliverable | รายละเอียด |
|---|---|
| Live URL | เว็บที่ใช้งานออนไลน์ได้จริง |
| GitHub Repository | Source code ทั้งหมด |
| README.md | วิธี run, setup, deploy |
| AI_USAGE.md | อธิบายการใช้ AI |
| Database Migration | SQL หรือ migration file |
| Screenshots | Login, Dashboard, Add Transaction, Report |
| Cost Summary | อธิบาย Cloudflare service ที่ใช้และเหตุผล |
| Demo Data | ข้อมูลตัวอย่างสำหรับทดสอบ |

---

## Evaluation Criteria

| หมวด | คะแนน |
|---|---:|
| ใช้งานจริงได้ครบ flow | 20 |
| CRUD รายรับรายจ่ายถูกต้อง | 15 |
| Dashboard และ Report คำนวณถูกต้อง | 15 |
| UI/UX ใช้งานง่ายและ responsive | 15 |
| Database design และ query เหมาะสม | 10 |
| Deploy บน Cloudflare สำเร็จ | 10 |
| AI_USAGE.md ชัดเจนและมีตัวอย่างจริง | 10 |
| README.md ครบถ้วน | 5 |
| รวม | 100 |

---

## Bonus Features

ได้คะแนนเพิ่มถ้ามี feature ต่อไปนี้:

- Dark mode
- Budget รายเดือน
- แจ้งเตือนเมื่อใช้เงินเกิน budget
- Recurring transaction เช่น เงินเดือน ค่าเช่า ค่าสมัครสมาชิก
- Import CSV
- Multi-user
- PWA ติดตั้งบนมือถือได้
- Custom category
- Tag เช่น personal, business, tax
- รองรับหลาย currency
- แนบรูปสลิป
- Rate limit API
- Backup / restore data
- Lighthouse score 90+
- Custom domain
- Unit test / integration test

---

## ข้อจำกัดสำคัญ

- ห้ามใช้ paid service โดยไม่จำเป็น
- ห้าม hardcode secret, password, API key
- ห้ามใช้ mock data แทน report จริง
- ห้ามใช้ template สำเร็จรูปทั้งก้อนโดยไม่ปรับแต่ง
- ต้องมี commit history ที่แสดงพัฒนาการจริง
- ต้อง deploy online ได้จริง
- ต้องอธิบายการใช้ AI อย่างโปร่งใส
- ต้องระบุส่วนที่ AI ช่วยและส่วนที่มนุษย์ตรวจเอง

---

## Expected Outcome

หลังทำเสร็จ Developer ควรมีผลงานออนไลน์ 1 project ที่สามารถใช้งานจริงและใช้เป็น portfolio ได้ โดยแสดง skill ดังนี้:

- Frontend development
- Backend API development
- Database design
- SQL query
- Dashboard/report logic
- Cloudflare deployment
- Cost-aware architecture
- AI-assisted development workflow
- Documentation
- Basic security

---

## สรุปโจทย์แบบสั้น

สร้างเว็บรายรับรายจ่ายที่ใช้งานได้จริง มี Dashboard, CRUD, Report, Chart, Export CSV, Auth แบบง่าย และ Deploy บน Cloudflare โดยใช้ AI ช่วยพัฒนา พร้อมเอกสาร AI_USAGE.md และ README.md

เป้าหมายคือให้ Developer ได้ผลงานออนไลน์ 1 ชิ้นที่ใช้จริงได้ และสามารถใช้โชว์เป็น portfolio ได้
