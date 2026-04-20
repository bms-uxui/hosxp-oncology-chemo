import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Tabs, Tab, Breadcrumbs, BreadcrumbItem, Tooltip as HeroTooltip } from "@heroui/react";
import { Activity, Weight, HeartPulse, Wind, Calendar, Printer, X, Download } from "lucide-react";
import PatientAvatar from "../../components/onc/PatientAvatar";
import CancerProfileBanner from "../../components/onc/CancerProfileBanner";
import RegimenCard from "../../components/onc/RegimenCard";
import LabTrendCard from "../../components/onc/LabTrendCard";
import LabResultsTable from "../../components/onc/LabResultsTable";
import TreatmentHistory from "../../components/onc/TreatmentHistory";
import type { HistoryEvent } from "../../components/onc/TreatmentHistory";
import OrderEntry from "./OrderEntry";
import PharmVerify from "./PharmVerify";
import { useOnc } from "../../components/onc/OncContext";

/* ══════════════════════════════════════════════
   Patient Summary — Clean card-based layout
   Left profile panel + Right tabbed content
   ══════════════════════════════════════════════ */

function formatAge(dobStr: string): string {
  const parts = dobStr.split("/");
  const bYear = parseInt(parts[2]) - 543; // Thai BE to CE
  const birth = new Date(bYear, parseInt(parts[1]) - 1, parseInt(parts[0]));
  const now = new Date();
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return `${y} ปี ${m} เดือน ${d} วัน`;
}

const allPatients = [
  { hn: "104365", orderId: "ONC-2569-0001", name: "นางคำปุ่น เสนาหอย", age: 54, gender: "หญิง", dob: "15/01/2512", bloodType: "O+", allergy: "Penicillin", allergyLevel: "severe" as const, diagnosis: "Breast Cancer", icd10: "C50.9", morphology: "Invasive ductal carcinoma, NOS", t: "3", n: "1", m: "0", stage: "IIIA", ecog: 1, her2: "Positive", er: "Positive", pr: "Negative", weight: 48, height: 146, bsa: 1.40, creatinine: 0.8, crcl: 72, doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", regimen: "CAF", currentCycle: 2, totalCycles: 6 },
  { hn: "205471", orderId: "ONC-2569-0002", name: "นายบุญมี ดีใจ", age: 68, gender: "ชาย", dob: "03/05/2501", bloodType: "A+", allergy: "Sulfa", allergyLevel: "moderate" as const, diagnosis: "Colorectal Cancer", icd10: "C18.2", morphology: "Adenocarcinoma, NOS", t: "3", n: "2", m: "0", stage: "IV", ecog: 2, her2: "Negative", er: "N/A", pr: "N/A", weight: 65, height: 168, bsa: 1.74, creatinine: 1.1, crcl: 58, doctor: "พญ.วิภา ศรีสุข", ward: "หอผู้ป่วย 4A", regimen: "FOLFOX6", currentCycle: 5, totalCycles: 12 },
  { hn: "308892", orderId: "ONC-2569-0003", name: "นางเพ็ญ ใจสว่าง", age: 61, gender: "หญิง", dob: "22/08/2507", bloodType: "B+", allergy: "—", allergyLevel: "none" as const, diagnosis: "Ovarian Cancer", icd10: "C56.9", morphology: "Serous carcinoma, high grade", t: "3", n: "0", m: "0", stage: "IIB", ecog: 1, her2: "N/A", er: "N/A", pr: "N/A", weight: 55, height: 158, bsa: 1.55, creatinine: 0.9, crcl: 85, doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", regimen: "CARBO-PAC", currentCycle: 1, totalCycles: 6 },
  { hn: "412230", orderId: "ONC-2569-0004", name: "นายสมศักดิ์ ชัยมงคล", age: 72, gender: "ชาย", dob: "10/11/2496", bloodType: "AB+", allergy: "Aspirin", allergyLevel: "mild" as const, diagnosis: "Lung Cancer", icd10: "C34.1", morphology: "Squamous cell carcinoma", t: "2", n: "1", m: "0", stage: "III", ecog: 2, her2: "N/A", er: "N/A", pr: "N/A", weight: 58, height: 162, bsa: 1.62, creatinine: 1.2, crcl: 52, doctor: "พญ.วิภา ศรีสุข", ward: "หอผู้ป่วย 4A", regimen: "GEM", currentCycle: 4, totalCycles: 6 },
  { hn: "519087", orderId: "ONC-2569-0005", name: "นางสาวมาลี สุขใจ", age: 52, gender: "หญิง", dob: "28/03/2516", bloodType: "O-", allergy: "Iodine", allergyLevel: "moderate" as const, diagnosis: "Breast Cancer", icd10: "C50.4", morphology: "Invasive lobular carcinoma", t: "2", n: "0", m: "0", stage: "IIA", ecog: 0, her2: "Negative", er: "Positive", pr: "Positive", weight: 52, height: 155, bsa: 1.50, creatinine: 0.7, crcl: 95, doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", regimen: "AC-T", currentCycle: 3, totalCycles: 8 },
  { hn: "620145", orderId: "ONC-2569-0006", name: "นายอุดม พัฒนา", age: 45, gender: "ชาย", dob: "14/07/2523", bloodType: "B-", allergy: "—", allergyLevel: "none" as const, diagnosis: "Lymphoma", icd10: "C83.3", morphology: "Diffuse large B-cell lymphoma", t: "—", n: "—", m: "—", stage: "II", ecog: 1, her2: "N/A", er: "N/A", pr: "N/A", weight: 70, height: 175, bsa: 1.85, creatinine: 0.9, crcl: 90, doctor: "นพ.ประยุทธ์ จันทร์ดี", ward: "OPD เคมีบำบัด", regimen: "R-CHOP", currentCycle: 2, totalCycles: 6 },
  { hn: "731256", orderId: "ONC-2569-0007", name: "นางอรุณ เรืองศรี", age: 59, gender: "หญิง", dob: "05/12/2509", bloodType: "A-", allergy: "—", allergyLevel: "none" as const, diagnosis: "Breast Cancer", icd10: "C50.9", morphology: "Invasive ductal carcinoma, NOS", t: "2", n: "1", m: "0", stage: "IIB", ecog: 1, her2: "Positive", er: "Negative", pr: "Negative", weight: 50, height: 152, bsa: 1.45, creatinine: 0.8, crcl: 70, doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", regimen: "CAF", currentCycle: 5, totalCycles: 6 },
  { hn: "842367", orderId: "ONC-2569-0008", name: "นายสุรชัย วงศ์วาน", age: 63, gender: "ชาย", dob: "19/09/2505", bloodType: "O+", allergy: "—", allergyLevel: "none" as const, diagnosis: "Colorectal Cancer", icd10: "C20.0", morphology: "Adenocarcinoma, moderately diff.", t: "3", n: "1", m: "0", stage: "IIIB", ecog: 1, her2: "N/A", er: "N/A", pr: "N/A", weight: 62, height: 170, bsa: 1.73, creatinine: 1.0, crcl: 65, doctor: "พญ.วิภา ศรีสุข", ward: "หอผู้ป่วย 4A", regimen: "FOLFOX6", currentCycle: 8, totalCycles: 12 },
  { hn: "953478", orderId: "ONC-2569-0009", name: "นางสุภา รักษ์ดี", age: 50, gender: "หญิง", dob: "30/06/2518", bloodType: "AB-", allergy: "—", allergyLevel: "none" as const, diagnosis: "Ovarian Cancer", icd10: "C56.9", morphology: "Serous carcinoma", t: "3", n: "0", m: "0", stage: "IIIA", ecog: 1, her2: "N/A", er: "N/A", pr: "N/A", weight: 58, height: 160, bsa: 1.60, creatinine: 0.8, crcl: 80, doctor: "นพ.ประยุทธ์ จันทร์ดี", ward: "OPD เคมีบำบัด", regimen: "CARBO-PAC", currentCycle: 3, totalCycles: 6 },
  { hn: "164589", orderId: "ONC-2569-0010", name: "นายวิชัย ใจดี", age: 70, gender: "ชาย", dob: "11/02/2498", bloodType: "A+", allergy: "—", allergyLevel: "none" as const, diagnosis: "Lung Cancer", icd10: "C34.9", morphology: "Adenocarcinoma", t: "2", n: "2", m: "0", stage: "IIIA", ecog: 2, her2: "N/A", er: "N/A", pr: "N/A", weight: 55, height: 165, bsa: 1.60, creatinine: 1.3, crcl: 45, doctor: "พญ.วิภา ศรีสุข", ward: "หอผู้ป่วย 4A", regimen: "GEM", currentCycle: 2, totalCycles: 4 },
  { hn: "275690", orderId: "ONC-2569-0011", name: "นางนภา แก้วใส", age: 48, gender: "หญิง", dob: "17/04/2520", bloodType: "B+", allergy: "—", allergyLevel: "none" as const, diagnosis: "Breast Cancer", icd10: "C50.9", morphology: "Invasive ductal carcinoma", t: "1", n: "0", m: "0", stage: "IA", ecog: 0, her2: "Negative", er: "Positive", pr: "Positive", weight: 53, height: 157, bsa: 1.52, creatinine: 0.6, crcl: 100, doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", regimen: "AC-T", currentCycle: 1, totalCycles: 4 },
  { hn: "386701", orderId: "ONC-2569-0012", name: "นายประสิทธิ์ ทองคำ", age: 66, gender: "ชาย", dob: "25/01/2502", bloodType: "O+", allergy: "—", allergyLevel: "none" as const, diagnosis: "Colorectal Cancer", icd10: "C18.7", morphology: "Adenocarcinoma, well diff.", t: "2", n: "1", m: "0", stage: "IIIA", ecog: 1, her2: "N/A", er: "N/A", pr: "N/A", weight: 68, height: 172, bsa: 1.80, creatinine: 1.0, crcl: 70, doctor: "พญ.วิภา ศรีสุข", ward: "หอผู้ป่วย 4A", regimen: "FOLFOX6", currentCycle: 3, totalCycles: 12 },
];

const labData = [
  /* ── CBC (Complete Blood Count) ── */
  { name: "White Blood Cell (WBC)",           value: 4.8,  prev: 6.1,  low: 4.0,  high: 11.0,  critLow: 2.0,       unit: "×10³/µL", ctcae: [3, 2, 1] },
  { name: "Absolute Neutrophil Count (ANC)",  value: 2.1,  prev: 2.8,  low: 1.5,  high: 7.5,   critLow: 1.0,       unit: "×10³/µL", ctcae: [1.5, 1.0, 0.5] },
  { name: "Hemoglobin (Hb)",                  value: 10.8, prev: 11.8, low: 12.0, high: 16.0,  critLow: 8.0,       unit: "g/dL",    ctcae: [10, 8, 6.5] },
  { name: "Hematocrit (Hct)",                 value: 33.2, prev: 35.4, low: 36.0, high: 46.0,  critLow: 25.0,      unit: "%",       ctcae: undefined },
  { name: "Platelet Count (PLT)",             value: 168,  prev: 195,  low: 150,  high: 400,   critLow: 75,        unit: "×10³/µL", ctcae: [75, 50, 25] },
  /* ── Renal Function ── */
  { name: "Creatinine (Cr)",                  value: 0.82, prev: 0.78, low: 0.6,  high: 1.2,   critLow: undefined, unit: "mg/dL",   ctcae: undefined },
  { name: "BUN",                              value: 14,   prev: 12,   low: 7,    high: 20,    critLow: undefined, unit: "mg/dL",   ctcae: undefined },
  { name: "eGFR (CKD-EPI)",                   value: 72,   prev: 78,   low: 60,   high: 120,   critLow: 30,        unit: "mL/min",  ctcae: undefined },
  /* ── Liver Function ── */
  { name: "ALT (SGPT)",                       value: 38,   prev: 22,   low: 0,    high: 40,    critLow: undefined, unit: "U/L",     ctcae: undefined },
  { name: "AST (SGOT)",                       value: 32,   prev: 20,   low: 0,    high: 40,    critLow: undefined, unit: "U/L",     ctcae: undefined },
  { name: "Alkaline Phosphatase (ALP)",       value: 78,   prev: 65,   low: 44,   high: 147,   critLow: undefined, unit: "U/L",     ctcae: undefined },
  { name: "Total Bilirubin",                  value: 0.7,  prev: 0.5,  low: 0.1,  high: 1.2,   critLow: undefined, unit: "mg/dL",   ctcae: undefined },
  { name: "Albumin",                          value: 3.4,  prev: 3.8,  low: 3.5,  high: 5.0,   critLow: 2.5,       unit: "g/dL",    ctcae: undefined },
  /* ── Electrolytes ── */
  { name: "Sodium (Na)",                      value: 139,  prev: 140,  low: 136,  high: 145,   critLow: 130,       unit: "mEq/L",   ctcae: undefined },
  { name: "Potassium (K)",                    value: 3.9,  prev: 4.1,  low: 3.5,  high: 5.0,   critLow: 3.0,       unit: "mEq/L",   ctcae: undefined },
];


const labTrendData = [
  { cycle: "C1", wbc: 7.2, anc: 3.2, hb: 12.1, hct: 37.5, plt: 210, cr: 0.72, bun: 11, egfr: 85, alt: 20, ast: 18, alp: 60, tbili: 0.4, alb: 4.0, na: 141, k: 4.2 },
  { cycle: "C2", wbc: 6.5, anc: 2.8, hb: 11.8, hct: 36.1, plt: 195, cr: 0.78, bun: 12, egfr: 80, alt: 22, ast: 20, alp: 62, tbili: 0.5, alb: 3.8, na: 140, k: 4.1 },
  { cycle: "C3", wbc: 5.8, anc: 2.1, hb: 11.2, hct: 34.8, plt: 185, cr: 0.80, bun: 13, egfr: 76, alt: 25, ast: 22, alp: 68, tbili: 0.5, alb: 3.6, na: 139, k: 4.0 },
  { cycle: "C4", wbc: 5.2, anc: 1.9, hb: 10.8, hct: 33.0, plt: 170, cr: 0.85, bun: 14, egfr: 74, alt: 30, ast: 26, alp: 72, tbili: 0.6, alb: 3.5, na: 138, k: 3.8 },
  { cycle: "C5", wbc: 4.8, anc: 2.1, hb: 10.8, hct: 33.2, plt: 168, cr: 0.82, bun: 14, egfr: 72, alt: 38, ast: 32, alp: 78, tbili: 0.7, alb: 3.4, na: 139, k: 3.9 },
];



const sideCard = "bg-white rounded-2xl p-5";

type PageTab = "overview" | "treatment" | "order" | "pharm";
type OrderStep = "step1" | "step2" | "step3" | "step4" | "step5";

export default function PatientSummary() {
  const navigate = useNavigate();
  const { hn } = useParams<{ hn: string }>();
  const { orderHistory, role } = useOnc();
  const pt = allPatients.find(p => p.hn === hn) ?? allPatients[0];
  const [tab, setTab] = useState<PageTab>("overview");
  const [orderStep, setOrderStep] = useState<OrderStep>("step1");
  const [viewEvent, setViewEvent] = useState<HistoryEvent | null>(null);
  const orderNavRef = useRef<{ next: () => void; back: () => void; canProceed: boolean; step: number } | null>(null);
  const [, forceUpdate] = useState(0);

  const vitalCards = [
    { icon: Weight, label: "น้ำหนัก", value: pt.weight, unit: "kg", change: "-2.1%", changeColor: "#10b981" },
    { icon: HeartPulse, label: "ส่วนสูง", value: pt.height, unit: "cm", change: "", changeColor: "#898989" },
    { icon: Wind, label: "BSA", value: pt.bsa, unit: "m²", change: "DuBois", changeColor: "#674BB3" },
    { icon: Activity, label: "ECOG", value: pt.ecog, unit: "คะแนน", change: pt.ecog <= 1 ? "ดี" : "เฝ้าระวัง", changeColor: pt.ecog <= 1 ? "#10b981" : "#f59e0b" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden pt-2">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <Breadcrumbs size="sm" separator="›" className="text-[13px]" classNames={{
          list: "gap-1",
          separator: "text-[#898989] mx-1",
        }}>
          <BreadcrumbItem onPress={() => navigate("/onc")} classNames={{ item: "text-[#898989] hover:text-[#674BB3]" }}>หน้าหลัก</BreadcrumbItem>
          <BreadcrumbItem isCurrent classNames={{ item: "text-[#674BB3] font-semibold" }}>{pt.name}</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      {/* ── Main Content ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ════════ LEFT PANEL — Profile ════════ */}
        <div className="w-80 min-w-[320px] max-w-[320px] shrink-0 overflow-y-auto overflow-x-hidden space-y-4 rounded-2xl">
          {/* Profile header */}
          <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3">
              <PatientAvatar hn={pt.hn} size={56} />
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#404040] leading-tight">{pt.name}</h2>
                <p className="text-sm text-[#898989] mt-0.5">{pt.gender} · {formatAge(pt.dob)}</p>
              </div>
            </div>

            {/* Info rows */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#898989]">HN</span>
                <span className="font-semibold text-[#404040]">{pt.hn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">Order ID</span>
                <span className="font-semibold text-[#404040]">{pt.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">หมู่เลือด</span>
                <span className="font-semibold text-[#404040]">{pt.bloodType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">แพทย์ผู้ดูแล</span>
                <span className="font-semibold text-[#404040]">{pt.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">หอผู้ป่วย</span>
                <span className="font-semibold text-[#404040]">{pt.ward}</span>
              </div>
            </div>

            {/* Clinical parameters */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#898989]">BW / HT</span>
                <span className="font-semibold text-[#404040]">{pt.weight} kg / {pt.height} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">BSA</span>
                <span className="font-bold text-onc">{pt.bsa} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">CrCl</span>
                <span className="font-semibold text-[#404040]">{pt.crcl} mL/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">ECOG</span>
                <span className="font-semibold text-[#404040]">{pt.ecog}</span>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h3 className="text-sm font-bold text-[#404040] mb-2">การแพ้ยา</h3>
            {pt.allergy === "—" ? (
              <div className="bg-gray-50 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                <p className="text-sm text-[#898989]">ไม่มีประวัติแพ้ยา</p>
              </div>
            ) : (
              <div className="bg-[#CE364C]/5 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.5" d="M12.7574 5.12132C13.9289 6.29289 15.8284 6.29289 17 5.12132C17.5858 4.53553 17.8787 3.76777 17.8787 3C17.8787 2.23223 17.5858 1.46447 17 0.878677C15.8284-.292892 13.9289-.292892 12.7574.878677 12.1716 1.46447 11.8787 2.23223 11.8787 3C11.8787 3.76777 12.1716 4.53553 12.7574 5.12132Z" fill="#CE364C"/>
                  <path opacity="0.5" d="M18.9052 15.381C20.3649 13.9213 20.3649 11.5546 18.9052 10.0948 17.4454 8.6351 15.0787 8.6351 13.619 10.0948L10.0948 13.619C8.6351 15.0787 8.6351 17.4454 10.0948 18.9052 11.5546 20.3649 13.9213 20.3649 15.381 18.9052L18.9052 15.381Z" fill="#CE364C"/>
                  <path d="M17.8779 16.4084L17.8784 16.4054 17.1465 16.2644C17.1424 16.2635 17.132 16.2611 17.1177 16.2575 17.089 16.2503 17.0405 16.2371 16.9748 16.2161 16.8432 16.1741 16.6427 16.1007 16.3923 15.9801 15.8925 15.7392 15.1913 15.3087 14.4415 14.5589 13.6916 13.8091 13.2611 13.1078 13.0201 12.6078 12.8994 12.3575 12.826 12.1569 12.784 12.0253 12.763 11.9595 12.7431 11.8831 12.7359 11.8544L12.5946 11.1216 12.5916 11.1222 11.3262 12.3876C11.3348 12.4167 11.3444 12.4481 11.3551 12.4817 11.4168 12.6747 11.5155 12.9409 11.6689 13.2591 11.976 13.8964 12.501 14.7397 13.3808 15.6195 14.2606 16.4994 15.1039 17.0243 15.7412 17.3314 16.0593 17.4847 16.3255 17.5834 16.5185 17.6451 16.552 17.6558 16.5833 17.6653 16.6123 17.6739L17.8779 16.4084Z" fill="#CE364C"/>
                  <path d="M7.72685 10.682C5.94471 12.4393 3.05529 12.4393 1.27315 10.682.57624 9.9948.15185 9.1406 0 8.25H9C8.8481 9.1406 8.4238 9.9948 7.72685 10.682Z" fill="#CE364C"/>
                  <path d="M9 6.75H0C.15185 5.85943.57624 5.00524 1.27315 4.31802 3.05529 2.56066 5.94471 2.56066 7.72685 4.31802 8.4238 5.00524 8.8481 5.85943 9 6.75Z" fill="#CE364C"/>
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#404040] leading-normal">{pt.allergy}</p>
                  <p className="text-xs text-[#404040]/60 leading-normal">หน้าบวม ริมฝีปากบวม หนังตาบวม</p>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Appointment — hidden in order mode */}
          {tab !== "order" && (
          <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#674BB3]" />
              <h3 className="text-sm font-bold text-[#404040]">นัดหมายครั้งถัดไป</h3>
            </div>

            {/* Title */}
            <p className="text-base font-bold text-[#404040]">{pt.regimen} C{pt.currentCycle + 1}D1 — ให้ยาเคมีบำบัด</p>

            {/* Status / Physician / Date */}
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#898989]">สถานะ</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">ยืนยันแล้ว</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#898989]">แพทย์ผู้ดูแล</span>
                <span className="text-sm font-semibold text-[#404040]">{pt.doctor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#898989]">วันที่</span>
                <span className="text-sm font-semibold text-[#404040]">10 เม.ย. 2569</span>
              </div>
            </div>

            {/* Timeline schedule */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {[
                { time: "09:00 – 09:30", label: "ตรวจเลือด & Vital Signs" },
                { time: "09:30 – 10:00", label: "พบแพทย์" },
                { time: "10:00 – 12:00", label: "ให้ยาเคมีบำบัด" },
              ].map((item, i, arr) => (
                <div key={i} className="flex gap-3">
                  {/* Vertical timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#898989] shrink-0 mt-1.5" />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className={`pb-4 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                    <p className="text-sm text-[#404040]">
                      <span className="text-[#898989]">{item.time}</span>{" "}{item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Clinical data — shown in order mode */}
          {tab === "order" && (
          <>
            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-3">ข้อมูลทางคลินิก</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#898989]">Diagnosis</span>
                  <span className="font-semibold text-[#404040]">{pt.diagnosis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">ICD-10</span>
                  <span className="font-semibold text-[#404040]">{pt.icd10}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">Stage</span>
                  <span className="font-semibold text-[#674BB3]">{pt.stage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">ECOG</span>
                  <span className="font-semibold text-[#404040]">{pt.ecog}</span>
                </div>
              </div>
            </div>

            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-3">ข้อมูลคำนวณขนาดยา</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#898989]">น้ำหนัก</span>
                  <span className="font-semibold text-[#404040]">{pt.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">ส่วนสูง</span>
                  <span className="font-semibold text-[#404040]">{pt.height} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">BSA</span>
                  <span className="font-semibold text-[#674BB3]">{pt.bsa} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">Creatinine</span>
                  <span className="font-semibold text-[#404040]">{pt.creatinine} mg/dL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">CrCl</span>
                  <span className="font-semibold text-[#404040]">{pt.crcl} mL/min</span>
                </div>
              </div>
            </div>

            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-3">สูตรยาปัจจุบัน</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#898989]">Regimen</span>
                  <span className="font-semibold text-[#674BB3]">{pt.regimen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#898989]">Cycle</span>
                  <span className="font-semibold text-[#404040]">{pt.currentCycle} / {pt.totalCycles}</span>
                </div>
              </div>
            </div>
          </>
          )}

        </div>

        {/* ════════ RIGHT PANEL — Content ════════ */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="shrink-0 flex items-center justify-between">
            <div className="bg-white rounded-t-2xl px-4 py-1 self-start" style={{ boxShadow: "0 -1px 4px rgba(0,0,0,0.04)" }}>
              <Tabs selectedKey={tab} onSelectionChange={(k) => { setTab(k as PageTab); if (k === "order") setOrderStep("step1"); }} variant="underlined" size="lg"
                classNames={{ tabList: "gap-6", tab: "px-1 text-sm font-semibold", cursor: "bg-[#674BB3] h-[2px]" }}>
                <Tab key="overview" title="ภาพรวม" />
                {role === "ONC_DOCTOR" && <Tab key="order" title="สั่งยาเคมีบำบัด" />}
                {role === "ONC_PHARMACIST" && <Tab key="pharm" title="ตรวจสอบ/เตรียมยา" />}
                <Tab key="treatment" title="ประวัติการรักษา" />
              </Tabs>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden bg-white rounded-b-2xl rounded-tr-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

          {/* ══ TAB: ภาพรวม ══ */}
          {tab === "overview" && (<>
            <CancerProfileBanner pt={pt} />

            {/* Vital Stat Cards */}
            <div className="flex gap-3">
              {vitalCards.filter(v => v.label !== "ECOG").map((v) => {
                const cardContent = (
                  <div key={v.label} className="flex-1 min-w-0 bg-white rounded-2xl p-4 border-[0.1px] border-[#d9d9d9]/25" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <span className="text-xs font-semibold text-[#898989] truncate block mb-3">{v.label}</span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-[#404040]">{v.value}</span>
                      <span className="text-[10px] text-[#898989] mb-0.5">{v.unit}</span>
                    </div>
                  </div>
                );
                if (v.label === "BSA") {
                  return (
                    <HeroTooltip key={v.label} placement="left" className="bg-white shadow-lg rounded-lg border border-gray-100"
                      content={
                        <div className="px-1.5 py-1 text-[11px]">
                          <p className="font-bold mb-1">DuBois Formula</p>
                          <p className="text-[#898989]">W: <span className="text-[#404040] font-bold">{pt.weight} kg</span></p>
                          <p className="text-[#898989]">H: <span className="text-[#404040] font-bold">{pt.height} cm</span></p>
                          <p className="text-[#898989]">Cr: <span className="text-[#404040] font-bold">{pt.creatinine} mg/dL</span></p>
                          <p className="text-[#898989]">CrCl: <span className="text-[#404040] font-bold">{pt.crcl} mL/min</span></p>
                        </div>
                      }>
                      {cardContent}
                    </HeroTooltip>
                  );
                }
                return cardContent;
              })}
            </div>

            {/* Lab Section */}
            <div className="grid grid-cols-2 gap-4">

            <LabTrendCard trendData={labTrendData} className="order-2" />

            <RegimenCard className="order-1" regimen={pt.regimen} diagnosis={pt.diagnosis}
              currentCycle={pt.currentCycle} totalCycles={pt.totalCycles} cumulativeDose={[]} />

            <LabResultsTable labData={labData} className="col-span-2 order-3" />

            </div>
          </>)}

          {/* ══ TAB: ประวัติการรักษา ══ */}
          {tab === "treatment" && (<>
            <TreatmentHistory events={[
              /* ── Dynamic entries from signed orders ── */
              ...orderHistory
                .filter(o => o.hn === pt.hn)
                .map(o => ({
                  date: o.date,
                  cycle: o.cycle,
                  regimen: o.regimen,
                  status: "current" as const,
                  doctor: o.doctor,
                  drugs: o.drugs,
                  labs: { anc: 0, plt: 0, hb: 0 },
                  note: `สั่งยาสำเร็จ — รอเภสัชกรตรวจสอบ`,
                  orderNo: o.orderNo,
                  doseReduction: o.doseReduction,
                  sideEffects: [],
                  workflow: [
                    { key: "order" as const, label: "แพทย์สั่งยา", status: "done" as const, date: o.date, by: o.doctor },
                    { key: "verify" as const, label: "เภสัชตรวจสอบ", status: "active" as const, note: "รอตรวจสอบ" },
                    { key: "compound" as const, label: "เตรียมยา", status: "pending" as const },
                    { key: "administer" as const, label: "ให้ยา", status: "pending" as const },
                    { key: "done" as const, label: "เสร็จสิ้น", status: "pending" as const },
                  ],
                })),
              /* ── Static: current cycle awaiting chemo ── */
              { date: "16/03/2569", cycle: "C3D1", regimen: pt.regimen, status: "current" as const, doctor: pt.doctor,
                orderNo: "ONC-2569-0045",
                drugs: [{ name: "Cyclophosphamide", dose: "840 mg", route: "IV", duration: "30 นาที" }, { name: "Doxorubicin", dose: "66 mg", route: "IV push", duration: "15 นาที" }, { name: "5-Fluorouracil", dose: "840 mg", route: "IV", duration: "60 นาที" }],
                labs: { anc: 2.1, plt: 185, hb: 11.2 }, note: "Lab ผ่านเกณฑ์ — กำลังเตรียมยา", sideEffects: [],
                workflow: [
                  { key: "order" as const, label: "แพทย์สั่งยา", status: "done" as const, date: "16/03", by: pt.doctor },
                  { key: "verify" as const, label: "เภสัชตรวจสอบ", status: "done" as const, date: "16/03", by: "ภก.วิไล ใจดี" },
                  { key: "compound" as const, label: "เตรียมยา", status: "active" as const, note: "กำลังเตรียมผสม" },
                  { key: "administer" as const, label: "ให้ยา", status: "pending" as const },
                  { key: "done" as const, label: "เสร็จสิ้น", status: "pending" as const },
                ],
              },
              /* ── Static: completed C2 ── */
              { date: "23/02/2569", cycle: "C2D1", regimen: pt.regimen, status: "done" as const, doctor: pt.doctor,
                orderNo: "ONC-2569-0032",
                drugs: [{ name: "Cyclophosphamide", dose: "840 mg", route: "IV", duration: "30 นาที" }, { name: "Doxorubicin", dose: "66 mg", route: "IV push", duration: "15 นาที" }, { name: "5-Fluorouracil", dose: "840 mg", route: "IV", duration: "60 นาที" }],
                labs: { anc: 2.8, plt: 195, hb: 11.8 }, note: "ให้ยาครบ ไม่มีภาวะแทรกซ้อน", sideEffects: ["คลื่นไส้ G1", "เหนื่อยเพลีย G1"],
                workflow: [
                  { key: "order" as const, label: "แพทย์สั่งยา", status: "done" as const, date: "23/02", by: pt.doctor },
                  { key: "verify" as const, label: "เภสัชตรวจสอบ", status: "done" as const, date: "23/02", by: "ภก.วิไล ใจดี" },
                  { key: "compound" as const, label: "เตรียมยา", status: "done" as const, date: "23/02", by: "ชนม์ วงษ์ดี" },
                  { key: "administer" as const, label: "ให้ยา", status: "done" as const, date: "23/02", by: "พว.อรุณ แสงทอง" },
                  { key: "done" as const, label: "เสร็จสิ้น", status: "done" as const, date: "23/02" },
                ],
              },
              /* ── Static: follow-up lab ── */
              { date: "08/02/2569", cycle: "C2D1", regimen: pt.regimen, status: "done" as const, doctor: pt.doctor,
                drugs: [], labs: { anc: 2.5, plt: 190, hb: 11.5 }, note: "Follow-up Lab — ผลปกติ พร้อมให้ยา C2", sideEffects: [] },
              /* ── Static: completed C1 ── */
              { date: "02/02/2569", cycle: "C1D1", regimen: pt.regimen, status: "done" as const, doctor: pt.doctor,
                orderNo: "ONC-2569-0018",
                drugs: [{ name: "Cyclophosphamide", dose: "840 mg", route: "IV", duration: "30 นาที" }, { name: "Doxorubicin", dose: "66 mg", route: "IV push", duration: "15 นาที" }, { name: "5-Fluorouracil", dose: "840 mg", route: "IV", duration: "60 นาที" }],
                labs: { anc: 3.2, plt: 210, hb: 12.1 }, note: "เริ่มให้ยาเคมีบำบัดครั้งแรก ไม่มี Reaction", sideEffects: ["ผมร่วง G1"],
                workflow: [
                  { key: "order" as const, label: "แพทย์สั่งยา", status: "done" as const, date: "02/02", by: pt.doctor },
                  { key: "verify" as const, label: "เภสัชตรวจสอบ", status: "done" as const, date: "02/02", by: "ภก.วิไล ใจดี" },
                  { key: "compound" as const, label: "เตรียมยา", status: "done" as const, date: "02/02", by: "ชนม์ วงษ์ดี" },
                  { key: "administer" as const, label: "ให้ยา", status: "done" as const, date: "02/02", by: "พว.อรุณ แสงทอง" },
                  { key: "done" as const, label: "เสร็จสิ้น", status: "done" as const, date: "02/02" },
                ],
              },
              /* ── Static: baseline ── */
              { date: "25/01/2569", cycle: "—", regimen: "—", status: "done" as const, doctor: pt.doctor,
                drugs: [], labs: { anc: 3.5, plt: 220, hb: 12.5 }, note: "Baseline Lab & ประเมิน ECOG ก่อนเริ่ม Chemo", sideEffects: [] },
            ]} onViewOrder={(evt) => setViewEvent(evt)} />
          </>)}

          {/* ══ Pharm Mode ══ */}
          {tab === "pharm" && (
            <PharmVerify embedded patientHN={pt.hn} patientData={pt} />
          )}

          {/* ══ Order Mode ══ */}
          {tab === "order" && (
            <OrderEntry embedded
              patientHN={pt.hn}
              navRef={orderNavRef}
              onNavUpdate={() => forceUpdate(n => n + 1)}
              controlledStep={parseInt(orderStep.replace("step", ""))}
              onStepChange={(s) => {
                const map: Record<number, OrderStep> = { 1: "step1", 2: "step2", 3: "step3", 4: "step4", 5: "step5" };
                setOrderStep(map[s] ?? "step1");
              }} />
          )}
          </div>
        </div>
      </div>

      {/* ══ Order Document Modal ══ */}
      {viewEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b shrink-0">
              <div>
                <p className="font-bold text-text">ใบสั่งยาเคมีบำบัด</p>
                <p className="text-xs text-text-secondary">{pt.name} · {viewEvent.orderNo}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()}
                  className="text-sm font-semibold text-onc border border-onc/30 rounded-full px-4 py-1.5 hover:bg-onc/5 transition-colors flex items-center gap-1.5">
                  <Printer size={14} /> พิมพ์
                </button>
                <button onClick={() => window.print()}
                  className="text-sm font-semibold text-text bg-gray-100 rounded-full px-4 py-1.5 hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                  <Download size={14} /> บันทึก PDF
                </button>
                <button onClick={() => setViewEvent(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
              <div className="mx-auto bg-white shadow-lg p-8" style={{ width: 595, minHeight: 842, aspectRatio: "1 / 1.4142" }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b-2 border-onc pb-3">
                  <div>
                    <h1 className="text-sm font-bold text-onc">โรงพยาบาลตัวอย่าง</h1>
                    <p className="text-[10px] text-text-secondary">คลินิกเคมีบำบัด / Chemotherapy Clinic</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-red-600">ใบสั่งยาเคมีบำบัด</p>
                    <p className="text-[10px] text-text-secondary">เลขที่: <span className="font-mono font-bold text-text">{viewEvent.orderNo}</span></p>
                  </div>
                </div>
                {/* Patient */}
                <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="col-span-2"><span className="text-text-secondary">ชื่อ-สกุล: </span><span className="font-bold">{pt.name}</span></div>
                    <div><span className="text-text-secondary">HN: </span><span className="font-bold">{pt.hn}</span></div>
                    <div><span className="text-text-secondary">เพศ: </span><span className="font-bold">{pt.gender === "ชาย" ? "ชาย" : "หญิง"}</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    <div><span className="text-text-secondary">BW: </span><span className="font-bold">{pt.weight} kg</span></div>
                    <div><span className="text-text-secondary">HT: </span><span className="font-bold">{pt.height} cm</span></div>
                    <div><span className="text-text-secondary">BSA: </span><span className="font-bold">{pt.bsa} m²</span></div>
                    <div><span className="text-text-secondary">ECOG: </span><span className="font-bold">{pt.ecog}</span></div>
                  </div>
                </div>
                {/* Diagnosis */}
                <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                  <div className="grid grid-cols-3 gap-1">
                    <div><span className="text-text-secondary">Diagnosis: </span><span className="font-bold">{pt.diagnosis}</span></div>
                    <div><span className="text-text-secondary">ICD-10: </span><span className="font-bold">{pt.icd10}</span></div>
                    <div><span className="text-text-secondary">Stage: </span><span className="font-bold text-onc">{pt.stage}</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <div><span className="text-text-secondary">Regimen: </span><span className="font-bold">{pt.regimen}</span></div>
                    <div><span className="text-text-secondary">แพทย์: </span><span className="font-bold">{pt.doctor}</span></div>
                    {pt.allergy !== "—" && pt.allergy !== "NKDA" && (
                      <div><span className="text-text-secondary">แพ้ยา: </span><span className="font-bold text-red-600">{pt.allergy}</span></div>
                    )}
                  </div>
                </div>
                {/* Protocol */}
                <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                  <div className="grid grid-cols-3 gap-1">
                    <div><span className="text-text-secondary">Protocol: </span><span className="font-bold text-onc">{pt.regimen}</span></div>
                    <div><span className="text-text-secondary">Cycle: </span><span className="font-bold">{pt.currentCycle}/{pt.totalCycles}</span></div>
                    <div><span className="text-text-secondary">Order No: </span><span className="font-bold">{viewEvent.orderNo}</span></div>
                  </div>
                </div>
                {/* Drug table */}
                {viewEvent.drugs.length > 0 && (
                  <table className="w-full text-[10px] border border-gray-300 mb-3">
                    <thead>
                      <tr className="bg-gray-50 text-text-secondary">
                        <th className="border border-gray-300 px-2 py-1 text-left">ลำดับ</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">ชื่อยา</th>
                        <th className="border border-gray-300 px-2 py-1 text-right">ขนาด</th>
                        <th className="border border-gray-300 px-2 py-1 text-center">Route</th>
                        <th className="border border-gray-300 px-2 py-1 text-center">เวลาให้ยา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEvent.drugs.map((d, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                          <td className="border border-gray-300 px-2 py-1.5 font-bold">{d.name}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{d.dose}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">{d.route}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">{d.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {/* Labs */}
                {(viewEvent.labs.anc > 0 || viewEvent.labs.plt > 0 || viewEvent.labs.hb > 0) && (
                  <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                    <span className="text-text-secondary">Lab: </span>
                    <span className="font-bold">ANC {viewEvent.labs.anc}</span> · <span className="font-bold">PLT {viewEvent.labs.plt}</span> · <span className="font-bold">Hb {viewEvent.labs.hb}</span>
                  </div>
                )}
                {/* Note */}
                {viewEvent.note && (
                  <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                    <span className="text-text-secondary">บันทึก: </span>
                    <span className="font-bold">{viewEvent.note}</span>
                  </div>
                )}
                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 text-center text-[10px] border-t-2 border-gray-400 pt-4 mt-8">
                  <div>
                    <p className="font-bold">แพทย์ผู้สั่งยา</p>
                    <p className="font-semibold text-onc">{pt.doctor}</p>
                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-1 mb-1" />
                    <p className="text-text-secondary">วันที่: ................</p>
                  </div>
                  <div>
                    <p className="font-bold">เภสัชกรผู้ตรวจสอบ</p>
                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                    <p className="text-text-secondary">วันที่: ............... เวลา: ........ น.</p>
                  </div>
                  <div>
                    <p className="font-bold">พยาบาลผู้ให้ยา</p>
                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                    <p className="text-text-secondary">วันที่: ............... เวลา: ........ น.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
