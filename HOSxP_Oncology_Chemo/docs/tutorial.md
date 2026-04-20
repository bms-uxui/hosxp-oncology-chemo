# HOSxP Oncology Chemo CPOE — Tutorial Document

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [บทบาทผู้ใช้งาน](#2-บทบาทผู้ใช้งาน)
3. [Workflow ภาพรวม](#3-workflow-ภาพรวม)
4. [คู่มือการใช้งานแต่ละหน้า](#4-คู่มือการใช้งานแต่ละหน้า)
5. [Data Flow สำหรับ Developer](#5-data-flow-สำหรับ-developer)
6. [โครงสร้างโค้ด](#6-โครงสร้างโค้ด)
7. [ข้อมูล Mock Data](#7-ข้อมูล-mock-data)

---

## 1. ภาพรวมระบบ

**HOSxP Oncology Chemo CPOE** คือระบบ Computerized Physician Order Entry สำหรับการสั่งยาเคมีบำบัด (Chemotherapy) ครอบคลุมกระบวนการทำงานตั้งแต่การลงทะเบียนผู้ป่วยจนถึงการออกใบแจ้งหนี้

### เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|-----------|---------|--------|
| React | 19 | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 7.x | Build Tool |
| Tailwind CSS | 4.x | Styling |
| HeroUI | 2.x | UI Components (Select, Tabs, Breadcrumbs, DatePicker) |
| MUI | 6.x | Stepper Component |
| Lucide React | - | Icons |
| React Router | 7.x | Routing (HashRouter) |

### Base URL
```
Production: /hosxp-oncology-chemo/
Dev: http://localhost:5173/hosxp-oncology-chemo/
```

---

## 2. บทบาทผู้ใช้งาน

ระบบรองรับ 5 บทบาท โดยแต่ละบทบาทจะเห็นเมนูและเข้าถึงฟีเจอร์ที่แตกต่างกัน

| บทบาท | ชื่อแสดง | สิ่งที่ทำได้ |
|-------|---------|-------------|
| **ONC_DOCTOR** | นพ.สมชาย รักษาดี (Oncologist) | ลงทะเบียนผู้ป่วย, สั่งยาเคมีบำบัด, ดูประวัติ, วางแผนการรักษา |
| **ONC_PHARMACIST** | ภก.วิไล ใจดี (Pharmacist) | ตรวจสอบคำสั่งยา, เตรียมยา, จัดการสูตรยา (Regimen Master) |
| **CHEMO_NURSE** | พว.อรุณ แสงทอง (Chemo Nurse) | บันทึกการให้ยา, ติดตามสถานะผู้ป่วย |
| **BILLING_OFFICER** | คุณสมศรี บัญชี (Billing Officer) | ตรวจสอบค่าใช้จ่าย, ออกใบแจ้งหนี้ |
| **ADMIN** | Admin ระบบ (System Admin) | จัดการค่าใช้จ่าย, ตั้งค่าระบบ |

### การเปลี่ยน Role (Prototype)
คลิกที่ชื่อผู้ใช้ด้านล่างซ้ายของ Sidebar → เลือก Role ที่ต้องการ

### PIN Code
ทุก Role ใช้ PIN: **`123456`** สำหรับการลงนาม/ยืนยัน

---

## 3. Workflow ภาพรวม

```
┌──────────────────────────────────────────────────────────────────┐
│                     CHEMOTHERAPY WORKFLOW                         │
│                                                                   │
│  ① ลงทะเบียน    ② สั่งยา      ③ ตรวจสอบ/เตรียมยา   ④ ให้ยา     │
│  (Doctor)      (Doctor)     (Pharmacist)         (Nurse)       │
│                                                                   │
│  ┌─────────┐   ┌─────────┐   ┌──────────────┐   ┌───────────┐   │
│  │ Register│──▶│ Order   │──▶│ Pharm Verify │──▶│ Administer│   │
│  │ Patient │   │ Entry   │   │ + Compound   │   │ Drug      │   │
│  └─────────┘   └─────────┘   └──────┬───────┘   └─────┬─────┘   │
│                                      │                  │         │
│                                      ▼                  ▼         │
│                               ┌──────────┐       ┌──────────┐    │
│                               │ QR Label │       │ Billing  │    │
│                               │ (Print)  │       │ (Invoice)│    │
│                               └──────────┘       └──────────┘    │
│                                                   (Billing Officer)│
└──────────────────────────────────────────────────────────────────┘
```

### รายละเอียดแต่ละขั้นตอน

#### ① ลงทะเบียนผู้ป่วย (Patient Registration)
- **ผู้ดำเนินการ**: แพทย์ (ONC_DOCTOR)
- **ขั้นตอน**: กรอก HN หรือเลขบัตรประชาชน → ดึงข้อมูลจาก HOSxP → กรอกข้อมูลการวินิจฉัย (Diagnosis, Stage, TNM) → ลงทะเบียน
- **ผลลัพธ์**: ผู้ป่วยเข้าสู่ระบบ Oncology พร้อมข้อมูล Cancer Profile

#### ② สั่งยาเคมีบำบัด (Order Entry)
- **ผู้ดำเนินการ**: แพทย์ (ONC_DOCTOR)
- **ขั้นตอน**: 5 Steps
  1. ประเมิน ECOG (Performance Status)
  2. เลือก Protocol (CAF, FOLFOX6, GEM, CARBO-PAC, etc.)
  3. คำนวณขนาดยา (BSA-based, AUC, Weight-based, Fixed)
  4. กำหนดการให้ยา (วันนัด, Cycle, Clinical Notes)
  5. ตรวจสอบ + ลงนาม (Preview A4 → PIN)
- **ผลลัพธ์**: สร้าง Order ID → ส่ง Notification ไปเภสัชกร

#### ③ ตรวจสอบ/เตรียมยา (Pharmacist Verify + Compounding)
- **ผู้ดำเนินการ**: เภสัชกร (ONC_PHARMACIST)
- **ขั้นตอน**: 2 Steps
  1. **เตรียมยา**: ตรวจสอบคำสั่งยา, Lab Safety (ANC, PLT, Cr), กรอก Lot/Expiry/Qty → ลงนาม
  2. **ยาพร้อม**: พิมพ์ QR Sticker ติดถุงยา
- **การตัดสินใจ**:
  - ✅ อนุมัติ → เข้าสู่ขั้นตอนเตรียมยา → สร้าง Billing Record อัตโนมัติ
  - ❌ ปฏิเสธ → กรอกเหตุผล → ส่ง Notification กลับแพทย์

#### ④ ให้ยา (Administration)
- **ผู้ดำเนินการ**: พยาบาล (CHEMO_NURSE)
- **ขั้นตอน**: บันทึกการให้ยาข้างเตียง (หน้าจอเต็ม, ออกจาก Sidebar Layout)
- **ผลลัพธ์**: บันทึกเข้า Order History

#### ⑤ ค่าใช้จ่าย (Billing)
- **ผู้ดำเนินการ**: เจ้าหน้าที่การเงิน (BILLING_OFFICER)
- **ขั้นตอน**: ตรวจสอบรายการ → ยืนยันและออกใบแจ้งหนี้ (PIN) → พิมพ์ใบแจ้งหนี้
- **การสร้าง Billing**: อัตโนมัติเมื่อเภสัชกรเตรียมยาเสร็จ

---

## 4. คู่มือการใช้งานแต่ละหน้า

### 4.1 หน้า Login
- เปิดระบบ → กดปุ่ม "เข้าสู่ระบบ"
- ระบบจะ login เป็น ONC_DOCTOR โดยอัตโนมัติ
- เปลี่ยน Role ได้จาก Sidebar ด้านล่างซ้าย

### 4.2 หน้าหลัก (Overview)
- **Banner**: แสดงชื่อ Role + ปุ่มลงทะเบียนผู้ป่วยใหม่
- **Pipeline Stats**: แสดงจำนวนผู้ป่วยในแต่ละสถานะ (5 ช่อง)
- **ตารางผู้ป่วย**: ค้นหา/กรองสถานะ → คลิกเพื่อเข้าดูรายละเอียด

### 4.3 ลงทะเบียนผู้ป่วย
- **Step 1**: กรอก HN (ทดลอง: 550123, 660234, 770345) → กดค้นหา
- **Step 2**: ตรวจสอบข้อมูลซ้าย + กรอก Diagnosis/Stage/TNM ขวา → กดลงทะเบียน
- ระบบจะแสดง Skeleton Animation แล้ว Redirect ไปหน้าผู้ป่วย

### 4.4 ข้อมูลผู้ป่วย (Patient Summary)
- **Left Panel**: ข้อมูลส่วนตัว, Clinical Parameters (BW, HT, BSA, CrCl, ECOG), การแพ้ยา
- **Right Panel (Tabs)**:
  - ภาพรวม: Cancer Profile Banner, Vital Cards, Lab Trends, Regimen
  - สั่งยาเคมีบำบัด (Doctor only): 5-Step Wizard
  - ตรวจสอบ/เตรียมยา (Pharmacist only)
  - ประวัติการรักษา

### 4.5 สูตรยาเคมีบำบัด (Regimen Master)
- **List View**: Banner, Stat Cards, ตาราง Regimen ทั้งหมด
- **Detail View**: 2-column (ข้อมูล Protocol ซ้าย / รายการยาขวา)
  - Day Tabs: แยกยาตาม Day ให้ยา
  - Edit Mode: Inline editable table, เพิ่ม/ลบยา, เพิ่ม Day, ตั้งค่า Regimen
  - Validation: ตรวจสอบชื่อยา, ขนาดยา, ต้องมีเคมีบำบัดอย่างน้อย 1 ตัว
  - Confirmation Modal: ยืนยัน/ยกเลิก/ปิดใช้งาน

### 4.6 ค่าใช้จ่าย (Billing)
- **List View**: Banner, Stat Cards, ตาราง Billing Records
- **Detail View**: ข้อมูลผู้ป่วย + สิทธิการรักษา + รายการค่าใช้จ่าย
- กด "ยืนยันและออกใบแจ้งหนี้" → PIN → พิมพ์ใบแจ้งหนี้อัตโนมัติ

---

## 5. Data Flow สำหรับ Developer

### 5.1 State Management

ระบบใช้ **React Context** (`OncContext`) เป็น Global State ไม่มี Backend

```typescript
interface OncContextType {
  // Auth
  role: OncRole;
  setRole: (r: OncRole) => void;
  verifyPin: (pin: string) => boolean;  // accepts "1234" or "123456"

  // Search
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;

  // Order History
  orderHistory: OrderHistoryEntry[];
  addOrderHistory: (entry: OrderHistoryEntry) => void;

  // Notifications
  notifications: OncNotification[];
  addNotification: (n: Omit<OncNotification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  unreadCount: number;

  // Billing
  billingRecords: BillingRecord[];
  addBillingRecord: (r: BillingRecord) => void;
  updateBillingStatus: (id: string, status: BillingStatus, confirmedBy?: string) => void;
}
```

### 5.2 Notification Flow

```
Doctor สั่งยา
    │
    ▼
addNotification({
  type: "approval",
  title: "คำสั่งยาใหม่: ...",
  targetRole: "ONC_PHARMACIST",
  from: "นพ.สมชาย รักษาดี"
})
    │
    ▼
Pharmacist เห็น Notification Bell (unread count)
    │
    ├── อนุมัติ → addNotification({ type: "prepared", targetRole: "CHEMO_NURSE" })
    │             + addBillingRecord(...)
    │
    └── ปฏิเสธ → addNotification({ type: "rejection", targetRole: "ONC_DOCTOR" })
```

### 5.3 Billing Auto-Generation

เมื่อเภสัชกรลงนามเตรียมยา (PharmVerify.tsx):

```typescript
// 1. คำนวณราคายาจาก DRUG_PRICES lookup
const drugItems = chemoDrugs.map(d => ({
  code: `DRG-${idx}`,
  description: `${d.name} ${d.finalDose}mg`,
  category: "drug",
  unitPrice: DRUG_PRICES[d.name] || 0,
  totalPrice: DRUG_PRICES[d.name] || 0,
}));

// 2. รวม SERVICE_ITEMS (ค่าผสมยา 1,500฿, ค่าให้ยา 800฿, ค่าพยาบาล 1,200฿)
const items = [...drugItems, ...diluentItems, ...SERVICE_ITEMS];

// 3. สร้าง BillingRecord
addBillingRecord({ id, orderId, hn, items, totalAmount, status: "PENDING" });

// 4. ส่ง Notification ไป BILLING_OFFICER
addNotification({ type: "billing", targetRole: "BILLING_OFFICER" });
```

### 5.4 Key Data Types

```typescript
// ผู้ป่วย (hardcoded in PatientSummary.tsx)
interface Patient {
  hn: string;           // Hospital Number
  name: string;         // ชื่อ-สกุล
  diagnosis: string;    // เช่น "Breast Cancer"
  icd10: string;        // เช่น "C50.9"
  stage: string;        // เช่น "IIIA"
  t, n, m: string;      // TNM staging
  ecog: number;         // 0-4
  weight, height: number;
  bsa: number;          // Body Surface Area (m²)
  creatinine: number;   // mg/dL
  crcl: number;         // Creatinine Clearance (mL/min)
  regimen: string;      // เช่น "CAF"
  currentCycle: number;
  totalCycles: number;
}

// คำสั่งยา
interface OrderHistoryEntry {
  orderNo: string;      // "ONC-2569-0045"
  hn: string;
  date: string;         // "DD/MM/YYYY"
  cycle: string;        // "C2D1"
  regimen: string;
  drugs: { name, dose, route, duration }[];
  doseReduction: number; // 0-100%
}

// การแจ้งเตือน
interface OncNotification {
  id: string;
  type: "rejection" | "approval" | "prepared" | "info" | "billing";
  title: string;
  message: string;
  targetRole: OncRole;  // ใครเห็น
  from: string;         // ส่งจากใคร
  read: boolean;
  hn?: string;          // link ไปหน้าผู้ป่วย
}

// ค่าใช้จ่าย
interface BillingRecord {
  id: string;           // "BIL-001"
  orderId: string;
  status: "PENDING" | "INVOICED";
  items: BillingItem[];
  totalAmount: number;
  coverageType?: string; // "UC" | "SSO" | "GOV" | "CASH" | "INS"
}
```

---

## 6. โครงสร้างโค้ด

```
app/src/
├── main.tsx                          # Routes, RoleGuard, Providers
├── index.css                         # Tailwind config, Print CSS, Animations
│
├── components/onc/
│   ├── OncContext.tsx                 # Global State (roles, orders, notifications, billing)
│   ├── OncLayout.tsx                 # Sidebar + Notification Panel
│   ├── PatientAvatar.tsx             # Avatar component (color from HN hash)
│   ├── CancerProfileBanner.tsx       # Purple gradient cancer info banner
│   ├── ProtocolCard.tsx              # Protocol selection card (OrderEntry step 2)
│   ├── RegimenCard.tsx               # Regimen info display
│   ├── LabTrendCard.tsx              # Lab trend chart
│   ├── LabResultsTable.tsx           # Lab results with CTCAE grading
│   ├── LabSafetyPanel.tsx            # Lab safety check panel
│   ├── TreatmentHistory.tsx          # Treatment timeline
│   └── Toast.tsx                     # Toast notification provider
│
├── pages/onc/
│   ├── Login.tsx                     # Login page (split layout + hero animation)
│   ├── Overview.tsx                  # Home / Dashboard
│   ├── PatientRegister.tsx           # 2-step patient registration
│   ├── PatientSummary.tsx            # Patient detail (tabs: overview, order, pharm, history)
│   ├── OrderEntry.tsx                # 5-step chemo order wizard
│   ├── PharmVerify.tsx               # Pharmacist verify + compounding + QR sticker
│   ├── Administration.tsx            # Nurse drug administration (full screen)
│   ├── RegimenMaster.tsx             # Protocol template builder
│   ├── Billing.tsx                   # Billing & invoicing
│   ├── PlanCreator.tsx               # Treatment plan calendar
│   ├── OrderList.tsx                 # Order list view
│   ├── Dashboard.tsx                 # Analytics dashboard
│   └── Placeholder.tsx               # Placeholder for unimplemented pages
│
└── public/onc/                       # Static assets (SVGs, PNGs, avatars)
```

### Route Structure

| Route | Component | Role Guard |
|-------|-----------|------------|
| `/` | Redirect → `/onc/login` | — |
| `/onc/login` | Login | — |
| `/onc` | Overview | All |
| `/onc/register` | PatientRegister | ONC_DOCTOR |
| `/onc/patients/:hn` | PatientSummary | All |
| `/onc/order-entry` | OrderEntry | ONC_DOCTOR |
| `/onc/pharm-verify` | PharmVerify | ONC_PHARMACIST |
| `/onc/administration` | Administration | CHEMO_NURSE, ONC_DOCTOR |
| `/onc/regimen` | RegimenMaster | ONC_PHARMACIST |
| `/onc/billing` | Billing | BILLING_OFFICER, ADMIN |
| `/onc/settings` | Placeholder | ADMIN |

---

## 7. ข้อมูล Mock Data

### ผู้ป่วยตัวอย่าง (12 คน)

| HN | ชื่อ | Diagnosis | Regimen | Cycle |
|----|------|-----------|---------|-------|
| 104365 | นางคำปุ่น เสนาหอย | Breast Cancer | CAF | C2/6 |
| 205471 | นายบุญมี ดีใจ | Colorectal Cancer | FOLFOX6 | C5/12 |
| 308892 | นางเพ็ญ ใจสว่าง | Ovarian Cancer | CARBO-PAC | C1/6 |
| 412230 | นายสมศักดิ์ ชัยมงคล | Lung Cancer | GEM | C4/6 |
| 519087 | นางสาวมาลี สุขใจ | Breast Cancer | AC-T | C3/8 |
| 620145 | นายอุดม พัฒนา | Lymphoma | R-CHOP | C2/6 |

### ผู้ป่วยลงทะเบียนใหม่ (HOSxP Mock)

| HN | ชื่อ | ทดลองค้นหาด้วย |
|----|------|----------------|
| 550123 | นางสมศรี รักสุข | HN: 550123 |
| 660234 | นายวิชัย มั่นคง | HN: 660234 |
| 770345 | นางสาวพิมพ์ใจ แสงทอง | HN: 770345 |

### Protocol Templates (5 สูตร)

| Code | Cancer | Drugs | Cycle |
|------|--------|-------|-------|
| CAF | Breast | Cyclophosphamide + Doxorubicin + 5-FU | q21d × 6 |
| FOLFOX6 | Colorectal | Oxaliplatin + Leucovorin + 5-FU | q14d × 12 |
| GEM | Lung/Pancreas | Gemcitabine | q28d × 6 (D1,8,15) |
| CARBO-PAC | Ovarian/NSCLC | Carboplatin + Paclitaxel | q21d × 6 |
| R-CHOP | DLBCL/NHL | Rituximab + CHOP | q21d × 6 |

### ราคายา (DRUG_PRICES)

| ยา | ราคา (฿) |
|----|---------|
| Cyclophosphamide | 850 |
| Doxorubicin | 4,200 |
| 5-FU | 320 |
| Oxaliplatin | 12,500 |
| Paclitaxel | 8,900 |
| Carboplatin | 5,200 |
| Rituximab | 28,000 |
| Gemcitabine | 3,500 |

### ค่าบริการคงที่ (SERVICE_ITEMS)

| รหัส | รายการ | ราคา (฿) |
|------|--------|---------|
| SVC-001 | ค่าผสมยาเคมีบำบัด | 1,500 |
| SVC-002 | ค่าบริการให้ยาเคมีบำบัด (เก้าอี้/เตียง) | 800 |
| SVC-003 | ค่าพยาบาลดูแลขณะให้ยา | 1,200 |

---

## หมายเหตุ

- ระบบนี้เป็น **Prototype / Frontend MVP** — ไม่มี Backend หรือ Database จริง
- ข้อมูลทั้งหมดเก็บใน React State และจะหายเมื่อ Refresh หน้า
- PIN Code สำหรับทุก Role: **`123456`**
- สร้างด้วย React + TypeScript + Vite + Tailwind CSS v4
- Deploy บน GitHub Pages: `https://[username].github.io/hosxp-oncology-chemo/`
