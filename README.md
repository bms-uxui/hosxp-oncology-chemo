# HOSxP Oncology Chemo CPOE

> ระบบ Computerized Physician Order Entry สำหรับการสั่งยาเคมีบำบัด — Prototype / Frontend MVP

**Live Demo**: [https://bms-uxui.github.io/hosxp-oncology-chemo/](https://bms-uxui.github.io/hosxp-oncology-chemo/)

**Tutorial**: [https://bms-uxui.github.io/hosxp-oncology-chemo/docs/tutorial.html](https://bms-uxui.github.io/hosxp-oncology-chemo/docs/tutorial.html)

**Repository**: [https://github.com/bms-uxui/hosxp-oncology-chemo](https://github.com/bms-uxui/hosxp-oncology-chemo)

## ภาพรวม

ระบบจัดการยาเคมีบำบัดแบบครบวงจร ครอบคลุมกระบวนการทำงานตั้งแต่การลงทะเบียนผู้ป่วยจนถึงการออกใบแจ้งหนี้ รองรับการทำงานของทีมสหสาขาวิชาชีพ 5 บทบาท

```
ลงทะเบียน → สั่งยา → ตรวจสอบ/เตรียมยา → ให้ยา → ออกใบแจ้งหนี้
 (Doctor)   (Doctor)    (Pharmacist)      (Nurse)   (Billing)
```

## เทคโนโลยี

| Stack | Version |
|-------|---------|
| React | 19 |
| TypeScript | 5.x |
| Vite | 7.x |
| Tailwind CSS | 4.x |
| HeroUI | 2.x |
| MUI (Stepper) | 6.x |
| React Router | 7.x (HashRouter) |

## เริ่มต้นใช้งาน

```bash
cd HOSxP_Oncology_Chemo/app
npm install
npm run dev
```

เปิด http://localhost:5173/hosxp-oncology-chemo/

## บทบาทผู้ใช้งาน

| บทบาท | ชื่อ | สิ่งที่ทำได้ |
|-------|------|-------------|
| ONC_DOCTOR | นพ.สมชาย รักษาดี | ลงทะเบียนผู้ป่วย, สั่งยา 5-step wizard |
| ONC_PHARMACIST | ภก.วิไล ใจดี | ตรวจสอบ/เตรียมยา, จัดการ Regimen Master |
| CHEMO_NURSE | พว.อรุณ แสงทอง | บันทึกการให้ยา |
| BILLING_OFFICER | คุณสมศรี บัญชี | ตรวจสอบค่าใช้จ่าย, ออกใบแจ้งหนี้ |
| ADMIN | Admin ระบบ | ตั้งค่าระบบ |

**PIN Code**: `123456` (ใช้ได้ทุก Role)

## ฟีเจอร์หลัก

### ลงทะเบียนผู้ป่วย
- ค้นหา HN / เลขบัตรประชาชน → ดึงข้อมูลจาก HOSxP (mock)
- กรอก Diagnosis, ICD-10, Morphology, Stage (pill buttons), TNM (card buttons)
- Skeleton animation → redirect to patient details
- **ทดสอบ HN**: `550123`, `660234`, `770345`

### สั่งยาเคมีบำบัด (5 Steps)
1. ประเมิน ECOG (0-4)
2. เลือก Protocol (CAF, FOLFOX6, GEM, CARBO-PAC, R-CHOP)
3. คำนวณขนาดยา (BSA/AUC/Weight-based + Dose Reduction)
4. กำหนดการให้ยา (DatePicker + Cycle + Notes)
5. ตรวจสอบ + ลงนาม (Preview A4 + PIN)

### เภสัชกรตรวจสอบ/เตรียมยา
- ตรวจสอบ Lab Safety (ANC, PLT, Cr)
- อนุมัติ: กรอก Lot/Expiry/ปริมาณ → ลงนาม → พิมพ์ QR Sticker
- ปฏิเสธ: กรอกเหตุผล → แจ้ง Doctor กลับ
- Auto-generate Billing Record เมื่อเตรียมยาเสร็จ

### สูตรยาเคมีบำบัด (Regimen Master)
- List view: Banner + Stats + Table (search/filter)
- Detail view: Stacked banner + 2-column layout
- Day Tabs: แยกยาตาม Day, เพิ่ม Day ได้
- Edit mode: Inline editable table + Validation + Confirmation Modal + Version Log
- Copy/Create protocol

### ค่าใช้จ่าย (Billing)
- List view: Banner + Stats + Table
- Detail view: Summary + Coverage Type + Itemized Table
- ยืนยัน PIN → ออกใบแจ้งหนี้ → พิมพ์ A4 อัตโนมัติ

### ระบบเพิ่มเติม
- **Notification**: แจ้งเตือนข้ามบทบาท (Doctor ↔ Pharmacist ↔ Nurse ↔ Billing)
- **Toast**: Slide-in animation สำหรับทุกการดำเนินการ (success/error/warning)
- **Print**: A4 documents (order, invoice) + Label sticker (QR)
- **Role switching**: เปลี่ยน Role ได้จาก Sidebar

## โครงสร้างโค้ด

```
app/src/
├── main.tsx                        # Routes, RoleGuard, Providers
├── index.css                       # Tailwind, Print CSS, Animations
├── components/onc/
│   ├── OncContext.tsx               # Global State
│   ├── OncLayout.tsx               # Sidebar + Notifications
│   ├── Toast.tsx                   # Toast system (slide-in/out)
│   ├── CancerProfileBanner.tsx     # Cancer info banner
│   ├── ProtocolCard.tsx            # Protocol selection card
│   └── ...
├── pages/onc/
│   ├── Login.tsx                   # Split layout + hero animation
│   ├── Overview.tsx                # Home dashboard
│   ├── PatientRegister.tsx         # 2-step registration
│   ├── PatientSummary.tsx          # Patient detail (tabs)
│   ├── OrderEntry.tsx              # 5-step chemo order wizard
│   ├── PharmVerify.tsx             # Verify + compound + QR sticker
│   ├── Administration.tsx          # Nurse drug administration
│   ├── RegimenMaster.tsx           # Protocol template builder
│   ├── Billing.tsx                 # Billing & invoicing
│   └── ...
└── public/onc/                     # Static assets
```

## Routes

| Route | Component | Role |
|-------|-----------|------|
| `/onc/login` | Login | — |
| `/onc` | Overview | All |
| `/onc/register` | PatientRegister | Doctor |
| `/onc/patients/:hn` | PatientSummary | All |
| `/onc/order-entry` | OrderEntry | Doctor |
| `/onc/pharm-verify` | PharmVerify | Pharmacist |
| `/onc/administration` | Administration | Nurse, Doctor |
| `/onc/regimen` | RegimenMaster | Pharmacist |
| `/onc/billing` | Billing | Billing, Admin |

## เอกสาร

| เอกสาร | ลิงก์ | คำอธิบาย |
|--------|------|---------|
| Tutorial (HTML) | [เปิดออนไลน์](https://bms-uxui.github.io/hosxp-oncology-chemo/docs/tutorial.html) | Interactive tutorial พร้อม sidebar, wireframes, flow diagrams |
| PM Guide | [`docs/pm-guide.md`](docs/pm-guide.md) | คู่มือทดสอบ step-by-step ทุก flow |
| Tutorial (MD) | [`docs/tutorial.md`](docs/tutorial.md) | เอกสาร Markdown สำหรับ developer |

## ข้อจำกัด

- **Frontend MVP** — ไม่มี Backend/Database จริง ข้อมูลเก็บใน React State
- ข้อมูลหายเมื่อ Refresh หน้า
- Mock data: ผู้ป่วย 12 คน, Protocol 5 สูตร, Billing 1 รายการ
- PIN ไม่ปลอดภัย (`123456`)

## License

Prototype — Internal use only
