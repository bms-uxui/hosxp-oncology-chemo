import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, CheckCircle2,
  ArrowRight, ArrowLeft,
  Pill, AlertOctagon, Info, Eye,
  Heart, Check, ClipboardCheck, Printer,
  Bike, PersonStanding, Armchair, BedDouble, Hospital,
  Syringe, Calendar, ChevronUp, ChevronDown, Download,
} from "lucide-react";
import { useOnc, roleLabels } from "../../components/onc/OncContext";
import { Tooltip as HeroTooltip, DatePicker } from "@heroui/react";
import { parseZonedDateTime, now, today, getLocalTimeZone } from "@internationalized/date";
import type { ZonedDateTime } from "@internationalized/date";
import { useNavigate } from "react-router";
import PatientAvatar from "../../components/onc/PatientAvatar";
import ProtocolCard from "../../components/onc/ProtocolCard";
import LabSafetyPanel from "../../components/onc/LabSafetyPanel";
import { Stepper as MuiStepper, Step, StepLabel, StepConnector, stepConnectorClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useToast } from "../../components/onc/Toast";

/* ── MUI Qonto-style Stepper overrides ── */
const QontoConnector = styled(StepConnector)({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: "calc(-50% + 16px)", right: "calc(50% + 16px)" },
  [`&.${stepConnectorClasses.active}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3", animation: "connectorFill 0.4s ease-in-out" } },
  [`&.${stepConnectorClasses.completed}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3" } },
  [`& .${stepConnectorClasses.line}`]: { borderColor: "#c4c4c4", borderTopWidth: 3, borderRadius: 1, transition: "border-color 0.4s ease" },
  "@keyframes connectorFill": {
    "0%": { transform: "scaleX(0)", transformOrigin: "left" },
    "100%": { transform: "scaleX(1)", transformOrigin: "left" },
  },
});

function QontoStepIcon({ active, completed }: { active?: boolean; completed?: boolean }) {
  return (
    <div style={{ color: active ? "#674BB3" : completed ? "#674BB3" : "#e5e7eb", display: "flex", height: 22, alignItems: "center", transition: "color 0.3s ease" }}>
      {completed ? (
        <Check size={18} style={{ color: "#674BB3" }} />
      ) : (
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "currentColor", transition: "background-color 0.3s ease, transform 0.3s ease", transform: active ? "scale(1.3)" : "scale(1)" }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   CPOE Order Entry — 6-Step Wizard
   ══════════════════════════════════════════════ */

type DoseMethod = "BSA" | "WEIGHT" | "AUC" | "FIXED";
type DrugClass = "premedication" | "chemotherapy" | "post-medication";
type WarnLevel = "INFO" | "WARN" | "HARD_STOP";

type ProtocolDrug = {
  name: string; baseDose: number; unit: string; method: DoseMethod;
  route: string; diluent: string; rate: string; day: number;
  classification: DrugClass; seq: number;
};

type OrderLine = ProtocolDrug & {
  calcDose: number; finalDose: number; adjustPct: number;
  edited: boolean;
};

/* ── Protocols ── */
const protocols = [
  {
    id: "CAF", code: "CAF", name: "CAF", cancer: "Breast Cancer", line: "1st Line",
    cycleDays: 21, totalCycles: 6, treatmentDays: [1],
    emetogenicRisk: "High" as const, estimatedDuration: "~5 ชม.", doseMethod: "BSA",
    reference: "NCCN Breast Cancer v4.2025",
    keyMonitoring: ["LVEF ก่อนเริ่มยา", "CBC ทุก cycle", "Doxorubicin cumulative dose ≤550 mg/m²"],
    commonSideEffects: ["คลื่นไส้อาเจียน", "ผมร่วง", "เม็ดเลือดขาวต่ำ", "Mucositis"],
    drugs: [
      { name: "Ondansetron", baseDose: 8, unit: "mg", method: "FIXED" as DoseMethod, route: "IV", diluent: "NSS 50 ml", rate: "15 min", day: 1, classification: "premedication" as DrugClass, seq: 0 },
      { name: "Dexamethasone", baseDose: 20, unit: "mg", method: "FIXED" as DoseMethod, route: "IV", diluent: "NSS 50 ml", rate: "15 min", day: 1, classification: "premedication" as DrugClass, seq: 0 },
      { name: "Cyclophosphamide", baseDose: 500, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 100 ml", rate: "30 min", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
      { name: "Doxorubicin", baseDose: 50, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Push", diluent: "D-5-W 50 ml", rate: "—", day: 1, classification: "chemotherapy" as DrugClass, seq: 2 },
      { name: "5-FU", baseDose: 500, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 500 ml", rate: "4 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 3 },
    ],
  },
  {
    id: "FOLFOX6", code: "FOLFOX6", name: "FOLFOX6", cancer: "Colorectal Cancer", line: "1st Line",
    cycleDays: 14, totalCycles: 12, treatmentDays: [1],
    emetogenicRisk: "Moderate" as const, estimatedDuration: "~48 ชม.", doseMethod: "BSA",
    reference: "NCCN Colon Cancer v3.2025",
    keyMonitoring: ["CBC ทุก cycle", "Peripheral neuropathy assessment", "LFT ทุก 2 cycles"],
    commonSideEffects: ["ชาปลายมือปลายเท้า", "คลื่นไส้", "เม็ดเลือดขาวต่ำ", "ท้องเสีย"],
    drugs: [
      { name: "Oxaliplatin", baseDose: 85, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 500 ml", rate: "2 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
      { name: "Leucovorin", baseDose: 200, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 100 ml", rate: "2 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 2 },
      { name: "5-FU (bolus)", baseDose: 400, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Push", diluent: "—", rate: "—", day: 1, classification: "chemotherapy" as DrugClass, seq: 3 },
      { name: "5-FU (infusion)", baseDose: 2400, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 500 ml", rate: "46 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 4 },
    ],
  },
  {
    id: "CARBO-PAC", code: "CARBO-PAC", name: "Carboplatin/Paclitaxel", cancer: "Lung Cancer", line: "1st Line",
    cycleDays: 21, totalCycles: 6, treatmentDays: [1],
    emetogenicRisk: "Moderate" as const, estimatedDuration: "~5 ชม.", doseMethod: "BSA + AUC",
    reference: "NCCN NSCLC v5.2025",
    keyMonitoring: ["CBC ทุก cycle", "Renal function (CrCl) สำหรับ Carboplatin", "Hypersensitivity reaction"],
    commonSideEffects: ["เม็ดเลือดขาวต่ำ", "ชาปลายมือปลายเท้า", "ปวดข้อ/กล้ามเนื้อ", "คลื่นไส้"],
    drugs: [
      { name: "Dexamethasone", baseDose: 20, unit: "mg", method: "FIXED" as DoseMethod, route: "IV", diluent: "—", rate: "—", day: 1, classification: "premedication" as DrugClass, seq: 0 },
      { name: "Paclitaxel", baseDose: 175, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "NSS 500 ml", rate: "3 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
      { name: "Carboplatin (AUC5)", baseDose: 5, unit: "AUC", method: "AUC" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 250 ml", rate: "1 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 2 },
    ],
  },
  {
    id: "GEM", code: "GEM", name: "Gemcitabine", cancer: "Lung Cancer", line: "2nd Line",
    cycleDays: 28, totalCycles: 6, treatmentDays: [1, 8, 15],
    emetogenicRisk: "Low" as const, estimatedDuration: "~1 ชม.", doseMethod: "BSA",
    reference: "NCCN NSCLC v5.2025",
    keyMonitoring: ["CBC ทุก week (D1, D8, D15)", "LFT ทุก cycle", "Pulmonary toxicity"],
    commonSideEffects: ["เม็ดเลือดขาวต่ำ", "เกล็ดเลือดต่ำ", "อ่อนเพลีย", "ไข้"],
    drugs: [
      { name: "Gemcitabine", baseDose: 1000, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "NSS 250 ml", rate: "30 min", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
    ],
  },
];

/* ── Age formatter ── */
function formatAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return `${y} ปี ${m} เดือน ${d} วัน`;
}

/* ── Patients (aligned with PatientSummary data) ── */
const patientList = [
  { hn: "104365", name: "นางคำปุ่น เสนาหอย", gender: "หญิง", dob: "1969-01-15", weight: 48, height: 146, icd10: "C50.9", diagnosis: "Breast Cancer", stage: "IIIA", t: "3", n: "1", m: "0", morphology: "Invasive ductal carcinoma, NOS", ecog: 1, allergy: "Penicillin", creatinine: 0.8, crcl: 72, bsa: 1.40, currentCycle: 2 },
  { hn: "205471", name: "นายบุญมี ดีใจ", gender: "ชาย", dob: "1958-05-03", weight: 65, height: 168, icd10: "C18.2", diagnosis: "Colorectal Cancer", stage: "IV", t: "3", n: "2", m: "0", morphology: "Adenocarcinoma, NOS", ecog: 2, allergy: "Sulfa", creatinine: 1.1, crcl: 58, bsa: 1.74, currentCycle: 5 },
  { hn: "308892", name: "นางเพ็ญ ใจสว่าง", gender: "หญิง", dob: "1964-08-22", weight: 55, height: 158, icd10: "C56.9", diagnosis: "Ovarian Cancer", stage: "IIB", t: "3", n: "0", m: "0", morphology: "Serous carcinoma, high grade", ecog: 1, allergy: "—", creatinine: 0.9, crcl: 85, bsa: 1.55, currentCycle: 1 },
  { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", gender: "ชาย", dob: "1953-11-10", weight: 58, height: 162, icd10: "C34.1", diagnosis: "Lung Cancer", stage: "III", t: "2", n: "1", m: "0", morphology: "Squamous cell carcinoma", ecog: 2, allergy: "Aspirin", creatinine: 1.2, crcl: 52, bsa: 1.62, currentCycle: 4 },
];

type LabItem = { name: string; value: number; unit: string; ref: string; threshold: number; direction: "above" | "below"; date: string };

const baseLabs = (date: string): LabItem[] => [
  { name: "WBC", value: 0, unit: "×10³/µL", ref: "4.0-11.0", threshold: 4.0, direction: "above", date },
  { name: "ANC", value: 0, unit: "×10³/µL", ref: "≥ 1.5", threshold: 1.5, direction: "above", date },
  { name: "Hemoglobin", value: 0, unit: "g/dL", ref: "≥ 8.0", threshold: 8.0, direction: "above", date },
  { name: "Hematocrit", value: 0, unit: "%", ref: "36-46", threshold: 36, direction: "above", date },
  { name: "Platelet", value: 0, unit: "×10³/µL", ref: "≥ 100", threshold: 100, direction: "above", date },
  { name: "Creatinine", value: 0, unit: "mg/dL", ref: "≤ 1.2", threshold: 1.2, direction: "below", date },
  { name: "BUN", value: 0, unit: "mg/dL", ref: "7-20", threshold: 20, direction: "below", date },
  { name: "eGFR", value: 0, unit: "mL/min", ref: "≥ 60", threshold: 60, direction: "above", date },
  { name: "ALT", value: 0, unit: "U/L", ref: "≤ 40", threshold: 40, direction: "below", date },
  { name: "AST", value: 0, unit: "U/L", ref: "≤ 40", threshold: 40, direction: "below", date },
  { name: "T.Bilirubin", value: 0, unit: "mg/dL", ref: "≤ 1.2", threshold: 1.2, direction: "below", date },
  { name: "Albumin", value: 0, unit: "g/dL", ref: "≥ 3.5", threshold: 3.5, direction: "above", date },
  { name: "LVEF", value: 0, unit: "%", ref: "≥ 50", threshold: 50, direction: "above", date },
];

function withValues(date: string, vals: Record<string, number>): LabItem[] {
  return baseLabs(date).map(l => ({ ...l, value: vals[l.name] ?? l.value }));
}

const defaultLabs: Record<string, LabItem[]> = {
  "104365": withValues("2026-03-21", {
    WBC: 4.8, ANC: 2.1, Hemoglobin: 10.8, Hematocrit: 33.2, Platelet: 168,
    Creatinine: 0.82, BUN: 14, eGFR: 72, ALT: 38, AST: 32, "T.Bilirubin": 0.7, Albumin: 3.4, LVEF: 60,
  }),
  "205471": withValues("2026-03-20", {
    WBC: 5.5, ANC: 2.8, Hemoglobin: 11.5, Hematocrit: 35.0, Platelet: 195,
    Creatinine: 1.1, BUN: 18, eGFR: 58, ALT: 28, AST: 25, "T.Bilirubin": 0.6, Albumin: 3.6, LVEF: 62,
  }),
  "308892": withValues("2026-03-22", {
    WBC: 6.2, ANC: 3.5, Hemoglobin: 12.0, Hematocrit: 36.5, Platelet: 220,
    Creatinine: 0.9, BUN: 12, eGFR: 85, ALT: 18, AST: 16, "T.Bilirubin": 0.4, Albumin: 4.0, LVEF: 65,
  }),
  "412230": withValues("2026-03-19", {
    WBC: 3.8, ANC: 1.4, Hemoglobin: 10.2, Hematocrit: 31.5, Platelet: 142,
    Creatinine: 1.2, BUN: 22, eGFR: 52, ALT: 45, AST: 42, "T.Bilirubin": 0.9, Albumin: 3.1, LVEF: 55,
  }),
};

/* Cumulative dose per patient (varies by regimen/cycle history) */
const cumulativeHistoryByHN: Record<string, { drug: string; totalMg: number; maxPerM2: number }[]> = {
  "104365": [ // CAF C2 done, BSA 1.40
    { drug: "Doxorubicin", totalMg: 140, maxPerM2: 550 },
    { drug: "Cyclophosphamide", totalMg: 1400, maxPerM2: 0 },
  ],
  "205471": [ // FOLFOX6 C5 done, BSA 1.74 — Oxaliplatin has cumulative neurotoxicity limit
    { drug: "Oxaliplatin", totalMg: 740, maxPerM2: 850 },
  ],
  "308892": [], // CARBO-PAC C1 — no prior cumulative
  "412230": [], // GEM C4 — gemcitabine has no lifetime max
};

/* ── Helpers ── */
function calcDose(base: number, method: DoseMethod, bsa: number, wt: number, crcl: number): number {
  switch (method) {
    case "BSA": return Math.round(base * bsa * 10) / 10;
    case "WEIGHT": return Math.round(base * wt * 10) / 10;
    case "AUC": return Math.round(base * (crcl + 25));
    case "FIXED": return base;
  }
}

function calcBSA(wt: number, ht: number) {
  return Math.round(0.007184 * Math.pow(wt, 0.425) * Math.pow(ht, 0.725) * 100) / 100;
}

/* Hard stop thresholds per user story */
const HARD_STOP_RULES: Record<string, { threshold: number; direction: "below" | "above" }> = {
  "ANC": { threshold: 1.0, direction: "below" },
  "Platelet": { threshold: 50, direction: "below" },
};

function labStatus(lab: LabItem): "safe" | "warn" | "danger" {
  const hardStop = HARD_STOP_RULES[lab.name];
  if (hardStop) {
    if (hardStop.direction === "below" && lab.value < hardStop.threshold) return "danger";
  }
  if (lab.direction === "above" && lab.value < lab.threshold) return lab.value < lab.threshold * 0.8 ? "danger" : "warn";
  if (lab.direction === "below" && lab.value > lab.threshold) return "danger";
  return "safe";
}

const todayStr = new Date().toISOString().slice(0, 10);
const tz = getLocalTimeZone();
const defaultAppointDT = parseZonedDateTime(`${todayStr}T09:00:00[${tz}]`);

const STEP_LABELS = [
  "ประเมิน ECOG",
  "เลือก Protocol",
  "คำนวณขนาดยา",
  "กำหนดการให้ยา",
  "ตรวจสอบ",
];

const STEP_DESCRIPTIONS = [
  "ประเมินสมรรถภาพร่างกาย",
  "เลือกสูตรเคมีบำบัด",
  "ตรวจสอบและปรับขนาดยา",
  "กำหนดวันนัดและบันทึก",
  "ตรวจสอบและลงนามคำสั่งยา",
];

const cancerFilters = ["ทั้งหมด", "Breast Cancer", "Colorectal Cancer", "Lung Cancer", "Lymphoma"];

const ecogDescriptions = [
  "ทำกิจกรรมปกติได้ตามปกติ",
  "ทำกิจกรรมเบาๆ ได้ แต่จำกัดงานหนัก",
  "ดูแลตัวเองได้ นอนพัก <50% ของเวลาตื่น",
  "ดูแลตัวเองได้จำกัด นอนพัก >50% ของเวลาตื่น",
  "ช่วยตัวเองไม่ได้เลย ต้องนอนพักตลอด",
];

const ecogDefinitions = [
  "ทำกิจกรรมได้ตามปกติโดยไม่มีข้อจำกัด สามารถดำเนินชีวิตได้เหมือนก่อนเจ็บป่วย",
  "จำกัดกิจกรรมที่ต้องออกแรงมาก แต่ยังเดินไปมาได้ ทำงานเบาหรืองานนั่งโต๊ะได้",
  "เดินไปมาได้และดูแลตัวเองได้ทั้งหมด แต่ไม่สามารถทำงานใดๆ ได้ ลุกนั่งมากกว่า 50% ของเวลาตื่น",
  "ดูแลตัวเองได้จำกัด ต้องนอนพักบนเตียงหรือเก้าอี้มากกว่า 50% ของเวลาตื่น",
  "ช่วยเหลือตัวเองไม่ได้เลย ต้องนอนพักบนเตียงหรือเก้าอี้ตลอดเวลา",
];

/* ── Stepper (MUI Qonto-style) ── */
export function OrderStepper({ step, onStepClick }: { step: number; onStepClick?: (s: number) => void }) {
  return (
    <MuiStepper activeStep={step - 1} alternativeLabel connector={<QontoConnector />}
      sx={{ "& .MuiStep-root": { p: 0 } }}>
      {STEP_LABELS.map((label, i) => (
        <Step key={i} completed={i < step - 1}>
          <StepLabel
            slots={{ stepIcon: () => <QontoStepIcon active={i === step - 1} completed={i < step - 1} /> }}
            onClick={() => { if (i < step && onStepClick) onStepClick(i + 1); }}
            sx={{
              cursor: i < step ? "pointer" : "default",
              p: 0,
              "& .MuiStepLabel-iconContainer": { p: 0 },
              "& .MuiStepLabel-labelContainer": { p: 0 },
              "& .MuiStepLabel-label, & .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
                fontFamily: '"Google Sans", "Google Sans Text", "Noto Sans Thai", sans-serif',
                fontSize: "12px !important", fontWeight: "600 !important", mt: 0.5, whiteSpace: "nowrap", p: 0,
                color: "#404040",
              },
            }}
          >{label}</StepLabel>
        </Step>
      ))}
    </MuiStepper>
  );
}

/* ══════════════════════════════════════════════ */
export default function OrderEntry({ embedded = false, patientHN, onStepChange, controlledStep, navRef, onNavUpdate }: { embedded?: boolean; patientHN?: string; onStepChange?: (step: number) => void; controlledStep?: number; navRef?: React.MutableRefObject<{ next: () => void; back: () => void; canProceed: boolean; step: number } | null>; onNavUpdate?: () => void }) {
  const { verifyPin, role, addOrderHistory } = useOnc();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStepRaw] = useState(controlledStep ?? 1);
  const setStep = (s: number) => { setStepRaw(s); onStepChange?.(s); };

  // Sync with controlled step from parent
  useEffect(() => {
    if (controlledStep !== undefined && controlledStep !== step) setStepRaw(controlledStep);
  }, [controlledStep]);

  // Patient — from parent or default
  const selectedHN = patientHN ?? "104365";

  // Patient data (pre-loaded)
  const [labValues, setLabValues] = useState<Record<string, number>>({});
  const [ecog, setEcog] = useState(1);
  const [wt, setWt] = useState(0);
  const [ht, setHt] = useState(0);
  const [bsa, setBsa] = useState(0);

  // Step 1: Protocol
  const [cancerFilter, setCancerFilter] = useState("ทั้งหมด");
  const [selProtoId, setSelProtoId] = useState("");

  // Step 2: Dose Calculation
  const [doseReduction, setDoseReduction] = useState(100);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [gfrCr, setGfrCr] = useState(0);
  const [gfrCrCl, setGfrCrCl] = useState(0);
  const [gfrAUC, setGfrAUC] = useState(5);

  // Step 3: Review
  const [appointDT, setAppointDT] = useState<ZonedDateTime>(defaultAppointDT);
  const [clinicalNote, setClinicalNote] = useState("");
  const [cycle, setCycle] = useState(1);

  // Step 4: Sign
  const [showPreview, setShowPreview] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [orderNo, setOrderNo] = useState("");

  const patient = patientList.find(p => p.hn === selectedHN);
  const protocol = protocols.find(p => p.id === selProtoId);
  const cumulativeHistory = cumulativeHistoryByHN[selectedHN] ?? [];

  // Auto BSA
  useEffect(() => {
    if (wt > 0 && ht > 0) setBsa(calcBSA(wt, ht));
  }, [wt, ht]);

  // Pre-fill on patient select
  useEffect(() => {
    if (!patient) return;
    setWt(patient.weight);
    setHt(patient.height);
    setBsa(calcBSA(patient.weight, patient.height));
    setEcog(patient.ecog);
    setGfrCr(patient.creatinine);
    setGfrCrCl(patient.crcl);
    const labs = defaultLabs[patient.hn] ?? defaultLabs["104365"]!;
    const vals: Record<string, number> = {};
    labs.forEach(l => { vals[l.name] = l.value; });
    setLabValues(vals);
  }, [selectedHN]);

  // Build order lines when protocol selected or dose reduction changes
  useEffect(() => {
    if (!protocol || !patient) return;
    const crcl = gfrCrCl || patient.crcl;
    const lines: OrderLine[] = protocol.drugs.map(d => {
      const cd = calcDose(d.baseDose, d.method, bsa, wt, crcl);
      const reductionFactor = d.classification === "premedication" ? 1 : doseReduction / 100;
      const fd = Math.round(cd * reductionFactor * 10) / 10;
      return { ...d, calcDose: cd, finalDose: fd, adjustPct: d.classification === "premedication" ? 0 : (doseReduction - 100), edited: false };
    });
    setOrderLines(lines);
  }, [selProtoId, bsa, wt, doseReduction, gfrCrCl]);

  // Labs for current patient
  const labs: LabItem[] = useMemo(() => {
    const base = defaultLabs[selectedHN] ?? defaultLabs["104365"]!;
    return base.map(l => ({ ...l, value: labValues[l.name] ?? l.value }));
  }, [selectedHN, labValues]);

  // Warnings
  const warnings = useMemo(() => {
    const w: { level: WarnLevel; msg: string }[] = [];
    if (!patient) return w;
    labs.forEach(l => {
      const s = labStatus(l);
      if (s === "danger") w.push({ level: "HARD_STOP", msg: `${l.name} = ${l.value} ${l.unit} — ค่าผิดปกติวิกฤต (${l.ref})` });
      else if (s === "warn") w.push({ level: "WARN", msg: `${l.name} = ${l.value} ${l.unit} — ใกล้เกณฑ์ (${l.ref})` });
    });
    if (patient.allergy && patient.allergy !== "—") {
      orderLines.forEach(d => {
        if (d.name.toLowerCase().includes(patient.allergy.toLowerCase()))
          w.push({ level: "HARD_STOP", msg: `ผู้ป่วยแพ้ "${patient.allergy}" — ยา ${d.name} อาจเกี่ยวข้อง` });
      });
    }
    orderLines.forEach(d => {
      const h = cumulativeHistory.find(c => c.drug === d.name);
      if (h && h.maxPerM2 > 0) {
        const after = h.totalMg + d.finalDose;
        const max = h.maxPerM2 * bsa;
        const pct = after / max;
        if (pct >= 1) w.push({ level: "HARD_STOP", msg: `${d.name} cumulative ${Math.round(after)} mg — เกินขีดจำกัด ${h.maxPerM2} mg/m²` });
        else if (pct >= 0.8) w.push({ level: "WARN", msg: `${d.name} cumulative ${Math.round(after)} mg (${Math.round(pct * 100)}%) — ใกล้ขีดจำกัด` });
      }
    });
    return w;
  }, [orderLines, labs, bsa, patient]);

  const hasHardStop = warnings.some(w => w.level === "HARD_STOP");

  const hasAUCDrug = protocol?.drugs.some(d => d.method === "AUC");

  // Step validation
  function canProceed(): boolean {
    switch (step) {
      case 1: return true; // ECOG always valid
      case 2: return !!selProtoId;
      case 3: return orderLines.length > 0;
      case 4: return !!appointDT;
      default: return true;
    }
  }

  function handleNext() {
    if (step < 5 && canProceed()) setStep(step + 1);
  }

  // Expose nav actions to parent via ref
  const canProceedNow = canProceed();
  useEffect(() => {
    if (navRef) {
      navRef.current = { next: handleNext, back: handleBack, canProceed: canProceedNow, step };
      onNavUpdate?.();
    }
  }, [step, canProceedNow, selProtoId]);
  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function generateOrderNo() {
    const d = new Date();
    const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const r = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `CHEMO-${ds}-${r}`;
  }

  function handleSign() {
    if (pin.length < 6) return;
    if (verifyPin(pin)) {
      const no = generateOrderNo();
      setOrderNo(no);
      setShowSignModal(false);
      setPinError(false);
      setGenerating(true);
      setGenStep(0);

      // Simulate document generation steps
      const steps = [600, 800, 700, 900];
      let i = 0;
      const next = () => {
        i++;
        setGenStep(i);
        if (i < steps.length) { setTimeout(next, steps[i]); }
        else {
          setTimeout(() => {
            setGenerating(false);
            setSubmitted(true);
            toast("success", `สร้างคำสั่งยา ${no} สำเร็จ`);
            if (patient && protocol) {
              addOrderHistory({
                orderNo: no,
                hn: patient.hn,
                patientName: patient.name,
                date: new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }),
                cycle: `C${cycle}D1`,
                regimen: protocol.code,
                doctor: "นพ.สมชาย รักษาดี",
                drugs: orderLines.map(d => ({ name: d.name, dose: `${d.finalDose} ${d.unit}`, route: d.route, duration: d.rate })),
                doseReduction,
              });
            }
          }, 500);
        }
      };
      setTimeout(next, steps[0]);
    } else {
      setPinError(true);
      setPin("");
    }
  }

  function handleReset() {
    setStep(1); setSelProtoId("");
    setOrderLines([]); setPin(""); setSubmitted(false); setDoseReduction(100);
    setClinicalNote(""); setAppointDT(defaultAppointDT); setCycle(1);
  }

  const inputCls = "border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-onc focus:ring-1 focus:ring-onc outline-none w-full";
  const cardCls = "bg-white rounded-2xl border-[0.1px] border-border-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out";
  const fmtDateTime = `${appointDT.toDate().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} ${String(appointDT.hour).padStart(2, "0")}:${String(appointDT.minute).padStart(2, "0")} น.`;
  const doctorName = roleLabels[role];

  /* ── Shared A4 Preview Modal ── */
  const previewModal = showPreview && patient && protocol && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b shrink-0">
          <div>
            <p className="font-bold text-[#404040]">ใบสั่งยาเคมีบำบัด</p>
            <p className="text-xs text-[#898989]">{patient.name} · {protocol.code} · Cycle {cycle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { const t = document.title; document.title = orderNo || "CHEMO-ORDER"; window.print(); document.title = t; }}
              className="text-sm font-semibold text-onc border border-onc/30 rounded-full px-4 py-1.5 hover:bg-onc/5 transition-colors flex items-center gap-1.5">
              <Printer size={14} /> พิมพ์
            </button>
            <button onClick={() => { const t = document.title; document.title = orderNo || "CHEMO-ORDER"; window.print(); document.title = t; }}
              className="text-sm font-semibold text-text bg-gray-100 rounded-full px-4 py-1.5 hover:bg-gray-200 transition-colors flex items-center gap-1.5">
              <Download size={14} /> บันทึก PDF
            </button>
            <button onClick={() => setShowPreview(false)}
              className="text-sm font-semibold text-text-secondary hover:text-text transition-colors">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className="print-area mx-auto bg-white shadow-lg p-8" style={{ width: 595, minHeight: 842, aspectRatio: "1 / 1.4142" }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b-2 border-[#674BB3] pb-3">
              <div>
                <h1 className="text-sm font-bold text-[#674BB3]">โรงพยาบาลตัวอย่าง</h1>
                <p className="text-[10px] text-[#898989]">คลินิกเคมีบำบัด / Chemotherapy Clinic</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-red-600">ใบสั่งยาเคมีบำบัด</p>
                <p className="text-[10px] text-[#898989]">เลขที่: <span className="font-mono font-bold text-[#404040]">{orderNo || "DRAFT"}</span></p>
              </div>
            </div>

            {/* Patient info */}
            <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
              <div className="grid grid-cols-4 gap-1">
                <div className="col-span-2"><span className="text-[#898989]">ชื่อ-สกุล: </span><span className="font-bold">{patient.name}</span></div>
                <div><span className="text-[#898989]">HN: </span><span className="font-bold">{patient.hn}</span></div>
                <div><span className="text-[#898989]">เพศ: </span><span className="font-bold">{patient.gender}</span></div>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                <div><span className="text-[#898989]">อายุ: </span><span className="font-bold">{formatAge(patient.dob)}</span></div>
                <div><span className="text-[#898989]">BW: </span><span className="font-bold">{wt} kg</span></div>
                <div><span className="text-[#898989]">HT: </span><span className="font-bold">{ht} cm</span></div>
                <div><span className="text-[#898989]">BSA: </span><span className="font-bold">{bsa} m²</span></div>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                <div><span className="text-[#898989]">CrCl: </span><span className="font-bold">{patient.crcl} mL/min</span></div>
                <div><span className="text-[#898989]">ECOG: </span><span className="font-bold">{ecog}</span></div>
                <div><span className="text-[#898989]">Cr: </span><span className="font-bold">{patient.creatinine} mg/dL</span></div>
                <div />
              </div>
            </div>

            {/* Diagnosis */}
            <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
              <div className="grid grid-cols-3 gap-1">
                <div><span className="text-[#898989]">Diagnosis: </span><span className="font-bold">{patient.diagnosis}</span></div>
                <div><span className="text-[#898989]">ICD-10: </span><span className="font-bold">{patient.icd10}</span></div>
                <div><span className="text-[#898989]">Stage: </span><span className="font-bold text-[#674BB3]">{patient.stage}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <div><span className="text-[#898989]">Morphology: </span><span className="font-bold">{patient.morphology}</span></div>
                <div><span className="text-[#898989]">TNM: </span><span className="font-bold">T{patient.t}N{patient.n}M{patient.m}</span></div>
                {patient.allergy && patient.allergy !== "—" && (
                  <div><span className="text-[#898989]">แพ้ยา: </span><span className="font-bold text-red-600">{patient.allergy}</span></div>
                )}
              </div>
            </div>

            {/* Protocol & Schedule */}
            <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
              <div className="grid grid-cols-4 gap-1">
                <div><span className="text-[#898989]">Protocol: </span><span className="font-bold text-[#674BB3] text-xs">{protocol.code}</span></div>
                <div><span className="text-[#898989]">Cycle: </span><span className="font-bold text-xs">{cycle}/{protocol.totalCycles}</span></div>
                <div><span className="text-[#898989]">Schedule: </span><span className="font-bold">q{protocol.cycleDays}d</span></div>
                <div><span className="text-[#898989]">Day: </span><span className="font-bold">{protocol.treatmentDays.join(", ")}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <div><span className="text-[#898989]">วันให้ยา: </span><span className="font-bold">{fmtDateTime}</span></div>
                <div><span className="text-[#898989]">Dose: </span><span className={`font-bold ${doseReduction < 100 ? "text-amber-600" : "text-emerald-600"}`}>{doseReduction}%</span></div>
                <div><span className="text-[#898989]">Emeto Risk: </span><span className={`font-bold ${protocol.emetogenicRisk === "High" ? "text-red-600" : protocol.emetogenicRisk === "Moderate" ? "text-amber-600" : "text-emerald-600"}`}>{protocol.emetogenicRisk}</span></div>
              </div>
              <div className="mt-1">
                <span className="text-[#898989]">Reference: </span><span className="font-bold">{protocol.reference}</span>
              </div>
            </div>

            {/* Drug table */}
            <table className="w-full text-[10px] border border-gray-300 mb-3">
              <thead>
                <tr className="bg-gray-50 text-[#898989]">
                  <th className="border border-gray-300 px-2 py-1 text-left">ลำดับ</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">ประเภท</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">ชื่อยา</th>
                  <th className="border border-gray-300 px-2 py-1 text-right">ขนาดมาตรฐาน</th>
                  <th className="border border-gray-300 px-2 py-1 text-right">ขนาดที่สั่ง</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Route</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Diluent</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">เวลาให้ยา</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Day</th>
                </tr>
              </thead>
              <tbody>
                {orderLines.map((d, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <span className={d.classification === "premedication" ? "text-blue-700" : d.classification === "chemotherapy" ? "text-red-700" : "text-gray-600"}>
                        {d.classification === "premedication" ? "Pre-med" : d.classification === "chemotherapy" ? "Chemo" : "Post-med"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 font-bold">{d.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right text-[#898989]">{d.baseDose} {d.unit}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{d.finalDose} {d.unit}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{d.route}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-[#898989]">{d.diluent}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{d.rate}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">D{d.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Clinical note */}
            {clinicalNote && (
              <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                <span className="text-[#898989]">บันทึกทางคลินิก: </span>
                <span className="font-bold">{clinicalNote}</span>
              </div>
            )}

            {/* Key monitoring */}
            <div className="border border-gray-300 rounded-lg p-2 mb-6 text-[10px]">
              <p className="text-[#898989] font-semibold mb-1">การเฝ้าระวังสำคัญ:</p>
              <ul className="list-disc list-inside text-[#404040]">
                {protocol.keyMonitoring.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 text-center text-[10px] border-t-2 border-gray-400 pt-4">
              <div>
                <p className="font-bold">แพทย์ผู้สั่งยา</p>
                <p className="font-semibold text-[#674BB3]">{doctorName}</p>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-1 mb-1" />
                <p className="text-[#898989]">วันที่: {fmtDateTime}</p>
              </div>
              <div>
                <p className="font-bold">เภสัชกรผู้ตรวจสอบ</p>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                <p className="text-[#898989]">วันที่: ............... เวลา: ........ น.</p>
              </div>
              <div>
                <p className="font-bold">พยาบาลผู้ให้ยา</p>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                <p className="text-[#898989]">วันที่: ............... เวลา: ........ น.</p>
              </div>
            </div>
            <p className="text-center text-[8px] text-[#898989] mt-4">
              สั่งพิมพ์: {new Date().toLocaleDateString("th-TH")} · ระบบบริหารจัดการยาเคมีบำบัด · โรงพยาบาลตัวอย่าง · {orderNo || "DRAFT"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════ GENERATING ══════════════════ */
  if (generating) {
    const genSteps = [
      "กำลังตรวจสอบข้อมูลผู้ป่วย...",
      "กำลังคำนวณขนาดยา...",
      "กำลังสร้างใบสั่งยา...",
      "กำลังลงนามดิจิทัล...",
    ];
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-md space-y-8 flex flex-col items-center">
          {/* Skeleton A4 */}
          <div className="mx-auto bg-white rounded-xl shadow-lg p-6 space-y-4" style={{ width: 340, aspectRatio: "1 / 1.4142" }}>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="onc-skeleton h-3 w-28" />
                <div className="onc-skeleton h-2 w-20" />
              </div>
              <div className="space-y-1.5 flex flex-col items-end">
                <div className="onc-skeleton h-2.5 w-16" />
                <div className="onc-skeleton h-2 w-24" />
              </div>
            </div>
            <div className="onc-skeleton h-px w-full" />
            <div className="space-y-2">
              <div className="onc-skeleton h-2.5 w-full" />
              <div className="onc-skeleton h-2.5 w-3/4" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="onc-skeleton h-2.5 w-full" />
              <div className="onc-skeleton h-2.5 w-5/6" />
              <div className="onc-skeleton h-2.5 w-2/3" />
            </div>
            <div className="space-y-1.5 pt-2">
              {[...Array(5)].map((_, i) => <div key={i} className="onc-skeleton h-3 w-full" />)}
            </div>
            <div className="flex justify-between pt-4">
              <div className="onc-skeleton h-8 w-20" />
              <div className="onc-skeleton h-8 w-20" />
              <div className="onc-skeleton h-8 w-20" />
            </div>
          </div>

          {/* Progress steps */}
          <div className="space-y-3 max-w-xs mx-auto">
            {genSteps.map((label, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= genStep ? "opacity-100" : "opacity-30"}`}>
                {i < genStep ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : i === genStep ? (
                  <span className="w-[18px] h-[18px] border-2 border-onc/30 border-t-onc rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-200 shrink-0" />
                )}
                <span className={`text-sm ${i < genStep ? "text-emerald-600 font-semibold" : i === genStep ? "text-[#404040] font-semibold" : "text-[#898989]"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════ SUCCESS ══════════════════ */
  if (submitted && patient && protocol) {
    return (
      <div className="space-y-4">
        {/* Success banner */}
        <div className="flex items-center gap-3 bg-white rounded-2xl border-[0.1px] border-border-card px-5 py-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#404040]">สั่งคำสั่งยาสำเร็จ</p>
            <p className="text-xs text-[#898989]">{orderNo} · {patient.name} · {protocol.code} C{cycle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { const t = document.title; document.title = orderNo || "CHEMO-ORDER"; window.print(); document.title = t; }} className="text-xs font-semibold text-[#404040] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1.5">
              <Printer size={13} /> พิมพ์
            </button>
            <button onClick={() => { const t = document.title; document.title = orderNo || "CHEMO-ORDER"; window.print(); document.title = t; }} className="text-xs font-semibold text-[#404040] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1.5">
              <Download size={13} /> PDF
            </button>
            <button onClick={handleReset} className="text-xs font-semibold text-[#404040] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all">
              สั่งยาใหม่
            </button>
            <button onClick={() => navigate("/onc")} className="text-xs font-semibold text-white bg-onc rounded-lg px-4 py-1.5 hover:bg-onc-hover active:scale-95 transition-all">
              กลับหน้าหลัก
            </button>
          </div>
        </div>

        {/* Inline A4 document */}
        <div className="overflow-y-auto rounded-2xl bg-gray-100 p-8" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <div className="print-area mx-auto bg-white shadow-lg p-8" style={{ width: 595, minHeight: 842, aspectRatio: "1 / 1.4142" }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b-2 border-[#674BB3] pb-3">
              <div>
                <h1 className="text-sm font-bold text-[#674BB3]">โรงพยาบาลตัวอย่าง</h1>
                <p className="text-[10px] text-[#898989]">คลินิกเคมีบำบัด / Chemotherapy Clinic</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-red-600">ใบสั่งยาเคมีบำบัด</p>
                <p className="text-[10px] text-[#898989]">เลขที่: <span className="font-mono font-bold text-[#404040]">{orderNo}</span></p>
              </div>
            </div>

            {/* Patient info */}
            <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
              <div className="grid grid-cols-4 gap-1">
                <div className="col-span-2"><span className="text-[#898989]">ชื่อ-สกุล: </span><span className="font-bold">{patient.name}</span></div>
                <div><span className="text-[#898989]">HN: </span><span className="font-bold">{patient.hn}</span></div>
                <div><span className="text-[#898989]">เพศ: </span><span className="font-bold">{patient.gender}</span></div>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                <div><span className="text-[#898989]">อายุ: </span><span className="font-bold">{formatAge(patient.dob)}</span></div>
                <div><span className="text-[#898989]">BW: </span><span className="font-bold">{wt} kg</span></div>
                <div><span className="text-[#898989]">HT: </span><span className="font-bold">{ht} cm</span></div>
                <div><span className="text-[#898989]">BSA: </span><span className="font-bold">{bsa} m²</span></div>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                <div><span className="text-[#898989]">CrCl: </span><span className="font-bold">{patient.crcl} mL/min</span></div>
                <div><span className="text-[#898989]">ECOG: </span><span className="font-bold">{ecog}</span></div>
                <div><span className="text-[#898989]">Cr: </span><span className="font-bold">{patient.creatinine} mg/dL</span></div>
                <div />
              </div>
            </div>

            {/* Diagnosis */}
            <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
              <div className="grid grid-cols-3 gap-1">
                <div><span className="text-[#898989]">Diagnosis: </span><span className="font-bold">{patient.diagnosis}</span></div>
                <div><span className="text-[#898989]">ICD-10: </span><span className="font-bold">{patient.icd10}</span></div>
                <div><span className="text-[#898989]">Stage: </span><span className="font-bold text-[#674BB3]">{patient.stage}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <div><span className="text-[#898989]">Morphology: </span><span className="font-bold">{patient.morphology}</span></div>
                <div><span className="text-[#898989]">TNM: </span><span className="font-bold">T{patient.t}N{patient.n}M{patient.m}</span></div>
                {patient.allergy && patient.allergy !== "—" && (
                  <div><span className="text-[#898989]">แพ้ยา: </span><span className="font-bold text-red-600">{patient.allergy}</span></div>
                )}
              </div>
            </div>

            {/* Protocol & Schedule */}
            <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
              <div className="grid grid-cols-4 gap-1">
                <div><span className="text-[#898989]">Protocol: </span><span className="font-bold text-[#674BB3] text-xs">{protocol.code}</span></div>
                <div><span className="text-[#898989]">Cycle: </span><span className="font-bold text-xs">{cycle}/{protocol.totalCycles}</span></div>
                <div><span className="text-[#898989]">Schedule: </span><span className="font-bold">q{protocol.cycleDays}d</span></div>
                <div><span className="text-[#898989]">Day: </span><span className="font-bold">{protocol.treatmentDays.join(", ")}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <div><span className="text-[#898989]">วันให้ยา: </span><span className="font-bold">{fmtDateTime}</span></div>
                <div><span className="text-[#898989]">Dose: </span><span className={`font-bold ${doseReduction < 100 ? "text-amber-600" : "text-emerald-600"}`}>{doseReduction}%</span></div>
                <div><span className="text-[#898989]">Emeto Risk: </span><span className={`font-bold ${protocol.emetogenicRisk === "High" ? "text-red-600" : protocol.emetogenicRisk === "Moderate" ? "text-amber-600" : "text-emerald-600"}`}>{protocol.emetogenicRisk}</span></div>
              </div>
              <div className="mt-1">
                <span className="text-[#898989]">Reference: </span><span className="font-bold">{protocol.reference}</span>
              </div>
            </div>

            {/* Drug table */}
            <table className="w-full text-[10px] border border-gray-300 mb-3">
              <thead>
                <tr className="bg-gray-50 text-[#898989]">
                  <th className="border border-gray-300 px-2 py-1 text-left">ลำดับ</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">ประเภท</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">ชื่อยา</th>
                  <th className="border border-gray-300 px-2 py-1 text-right">ขนาดมาตรฐาน</th>
                  <th className="border border-gray-300 px-2 py-1 text-right">ขนาดที่สั่ง</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Route</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Diluent</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">เวลาให้ยา</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Day</th>
                </tr>
              </thead>
              <tbody>
                {orderLines.map((d, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <span className={d.classification === "premedication" ? "text-blue-700" : d.classification === "chemotherapy" ? "text-red-700" : "text-gray-600"}>
                        {d.classification === "premedication" ? "Pre-med" : d.classification === "chemotherapy" ? "Chemo" : "Post-med"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 font-bold">{d.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right text-[#898989]">{d.baseDose} {d.unit}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{d.finalDose} {d.unit}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{d.route}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-[#898989]">{d.diluent}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{d.rate}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">D{d.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Clinical note */}
            {clinicalNote && (
              <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                <span className="text-[#898989]">บันทึกทางคลินิก: </span>
                <span className="font-bold">{clinicalNote}</span>
              </div>
            )}

            {/* Key monitoring */}
            <div className="border border-gray-300 rounded-lg p-2 mb-6 text-[10px]">
              <p className="text-[#898989] font-semibold mb-1">การเฝ้าระวังสำคัญ:</p>
              <ul className="list-disc list-inside text-[#404040]">
                {protocol.keyMonitoring.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 text-center text-[10px] border-t-2 border-gray-400 pt-4">
              <div>
                <p className="font-bold">แพทย์ผู้สั่งยา</p>
                <p className="font-semibold text-[#674BB3]">{doctorName}</p>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-1 mb-1" />
                <p className="text-[#898989]">วันที่: {fmtDateTime}</p>
              </div>
              <div>
                <p className="font-bold">เภสัชกรผู้ตรวจสอบ</p>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                <p className="text-[#898989]">วันที่: ............... เวลา: ........ น.</p>
              </div>
              <div>
                <p className="font-bold">พยาบาลผู้ให้ยา</p>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                <p className="text-[#898989]">วันที่: ............... เวลา: ........ น.</p>
              </div>
            </div>
            <p className="text-center text-[8px] text-[#898989] mt-4">
              สั่งพิมพ์: {new Date().toLocaleDateString("th-TH")} · ระบบบริหารจัดการยาเคมีบำบัด · โรงพยาบาลตัวอย่าง · {orderNo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════ RENDER ══════════════════ */
  const sideCard = "bg-white rounded-2xl p-5";

  /* ── Wizard Steps (reused in both modes) ── */
  const wizardSteps = (<div className="wizard-step-content" key={step}>

    {/* ═══ STEP 1: ECOG Assessment ═══ */}
    {step === 1 && (
      <div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4].map(score => {
            const active = ecog === score;
            const EcogIcon = [Bike, PersonStanding, Armchair, BedDouble, Hospital][score];
            return (
              <button key={score} onClick={() => setEcog(score)}
                className={`rounded-2xl border-[0.1px] border-border-card px-6 pt-5 pb-6 text-left transition-all flex flex-col items-start min-h-[200px] ${active ? "ring-2 ring-onc/30 bg-onc/5" : "bg-white hover:bg-gray-50"
                  }`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <EcogIcon size={28} className={active ? "text-[#674BB3]" : "text-[#898989]"} />
                <p className={`text-base font-bold mt-auto ${active ? "text-[#674BB3]" : "text-[#404040]"}`}>ECOG {score}</p>
                <p className={`text-xs leading-relaxed mt-1 ${active ? "text-[#404040]/70" : "text-[#898989]"}`}>{ecogDescriptions[score]}</p>
              </button>
            );
          })}
        </div>
      </div>
    )}

    {/* ═══ STEP 2: Select Protocol ═══ */}
    {step === 2 && (
      <div className="space-y-5">
        {/* Cancer type filter */}
        <div className="flex flex-wrap gap-2">
          {cancerFilters.map(f => (
            <button key={f} onClick={() => setCancerFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${cancerFilter === f ? "bg-[#674BB3] text-white" : "bg-gray-100 text-[#898989] hover:bg-gray-200"
                }`}>{f}</button>
          ))}
        </div>

        {/* Protocol list */}
        <div className="space-y-3">
          {protocols.filter(p => cancerFilter === "ทั้งหมด" || p.cancer === cancerFilter).map(p => (
            <ProtocolCard
              key={p.id}
              code={p.code}
              drugs={p.drugs.filter(d => d.classification === "chemotherapy").map(d => d.name).join(" + ")}
              totalCycles={p.totalCycles}
              cycleDays={p.cycleDays}
              treatmentDays={p.treatmentDays}
              cancer={p.cancer}
              line={p.line}
              emetogenicRisk={p.emetogenicRisk}
              selected={selProtoId === p.id}
              onClick={() => setSelProtoId(p.id)}
            />
          ))}
        </div>
      </div>
    )}

    {/* ═══ STEP 3: Dose Calculation ═══ */}
    {step === 3 && protocol && patient && (
      <div className="space-y-4">
        {/* 2-column desktop layout */}
        <div className="flex gap-4 items-start">
          {/* ── LEFT: Drug tables + dose adjustment (primary action) ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* GFR Section */}
            {hasAUCDrug && (
              <div className={cardCls}>
                <h3 className="text-sm font-bold text-[#404040] mb-3">คำนวณ GFR (Calvert Formula)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[#898989] mb-1 block">Creatinine (mg/dL)</label>
                    <input type="number" step="0.1" value={gfrCr} onChange={e => setGfrCr(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-[#898989] mb-1 block">CrCl (mL/min)</label>
                    <input type="number" value={gfrCrCl} onChange={e => setGfrCrCl(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-[#898989] mb-1 block">Target AUC</label>
                    <input type="number" value={gfrAUC} onChange={e => setGfrAUC(Number(e.target.value))} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Chemo Drug Table (same card as dose adjustment) */}
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#404040]">ปรับขนาดยา</h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[100, 85, 75, 50].map(pct => (
                      <button key={pct} onClick={() => setDoseReduction(pct)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${doseReduction === pct ? "bg-[#674BB3] text-white" : "bg-gray-100 text-[#898989] hover:bg-gray-200"
                          }`}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <span className={`text-lg font-black ${doseReduction < 75 ? "text-red-500" : doseReduction < 100 ? "text-amber-500" : "text-[#674BB3]"}`}>
                    {doseReduction}%
                  </span>
                </div>
              </div>
              <HeroTooltip placement="top" className="bg-white shadow-lg rounded-lg border border-gray-100 max-w-xs"
                content={<p className="px-2 py-1 text-xs text-[#404040]">ปรับลดขนาดยาเคมีบำบัดทั้งหมดเป็น % ของขนาดที่คำนวณได้ ใช้ในกรณีผู้ป่วยมีผลข้างเคียงรุนแรงหรือค่า Lab ผิดปกติ</p>}>
                <input type="range" min={25} max={100} step={5} value={doseReduction}
                  onChange={e => setDoseReduction(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#674BB3]" />
              </HeroTooltip>
              <div className="flex justify-between text-[10px] text-[#898989] mt-1 mb-3">
                <span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
              <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: doseReduction < 100 ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                    <AlertTriangle size={12} /> ลดขนาดยา {100 - doseReduction}% — ยาเคมีบำบัดทั้งหมดจะถูกปรับลดอัตโนมัติ
                  </p>
                </div>
              </div>
              <h3 className="text-sm font-bold text-[#404040] mb-3 pt-3 border-t border-gray-100">รายการยาเคมีบำบัด</h3>
              <div className="overflow-x-auto">
                <table className="min-w-225 w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[#898989] uppercase border-b border-gray-200">
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">ยา</th>
                      <th className="px-2 py-2 text-left">สูตรคำนวณ</th>
                      <th className="px-2 py-2 text-right">ขนาดคำนวณ</th>
                      <th className="px-2 py-2 text-right">ขนาดจริง (MG)</th>
                      <th className="px-2 py-2 text-left">ROUTE</th>
                      <th className="px-2 py-2 text-left">DILUENT</th>
                      <th className="px-2 py-2 text-left">เวลาให้ยา</th>
                      <th className="px-2 py-2 text-center">DAY</th>
                      <th className="px-2 py-2 text-center">FLAG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orderLines.filter(d => d.classification === "chemotherapy").map((d, i) => {
                      const formula = d.method === "BSA" ? `${d.baseDose} ${d.unit} × ${bsa} m²` :
                        d.method === "WEIGHT" ? `${d.baseDose} mg/kg × ${wt} kg` :
                          d.method === "AUC" ? `AUC ${d.baseDose} × (CrCl ${gfrCrCl} + 25)` :
                            `Fixed ${d.baseDose} ${d.unit}`;
                      const reductionNote = doseReduction < 100 ? ` × ${doseReduction}%` : "";
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-[#898989]">{d.seq}</td>
                          <td className="px-2 py-2 font-semibold text-[#404040]">{d.name}</td>
                          <td className="px-2 py-2">
                            <span className="text-xs text-[#674BB3] bg-onc/5 px-2 py-1 rounded font-mono">
                              {formula}{reductionNote}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right text-[#898989]">{d.calcDose} mg</td>
                          <td className="px-2 py-2 text-right">
                            <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-onc focus-within:ring-1 focus-within:ring-onc">
                              <input type="text" inputMode="numeric" value={d.finalDose}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setOrderLines(prev => prev.map((l, idx) => {
                                    if (l.classification !== "chemotherapy") return l;
                                    const ci = prev.filter(x => x.classification === "chemotherapy").indexOf(l);
                                    if (ci !== i) return l;
                                    return { ...l, finalDose: val, edited: true, adjustPct: l.calcDose > 0 ? Math.round(((val / l.calcDose) - 1) * 100) : 0 };
                                  }));
                                }}
                                className="w-16 text-sm text-right font-bold px-2 py-1.5 outline-none" />
                              <div className="flex flex-col border-l border-gray-300">
                                <button type="button" onClick={() => {
                                  setOrderLines(prev => prev.map((l) => {
                                    if (l.classification !== "chemotherapy") return l;
                                    const ci = prev.filter(x => x.classification === "chemotherapy").indexOf(l);
                                    if (ci !== i) return l;
                                    const val = l.finalDose + 1;
                                    return { ...l, finalDose: val, edited: true, adjustPct: l.calcDose > 0 ? Math.round(((val / l.calcDose) - 1) * 100) : 0 };
                                  }));
                                }} className="px-1 py-0.5 hover:bg-gray-100 transition-colors">
                                  <ChevronUp size={12} className="text-[#898989]" />
                                </button>
                                <button type="button" onClick={() => {
                                  setOrderLines(prev => prev.map((l) => {
                                    if (l.classification !== "chemotherapy") return l;
                                    const ci = prev.filter(x => x.classification === "chemotherapy").indexOf(l);
                                    if (ci !== i) return l;
                                    const val = Math.max(0, l.finalDose - 1);
                                    return { ...l, finalDose: val, edited: true, adjustPct: l.calcDose > 0 ? Math.round(((val / l.calcDose) - 1) * 100) : 0 };
                                  }));
                                }} className="px-1 py-0.5 hover:bg-gray-100 transition-colors border-t border-gray-300">
                                  <ChevronDown size={12} className="text-[#898989]" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-[#898989]">{d.route}</td>
                          <td className="px-2 py-2 text-[#898989]">{d.diluent}</td>
                          <td className="px-2 py-2 text-[#898989]">{d.rate}</td>
                          <td className="px-2 py-2 text-center text-[#898989]">{d.day}</td>
                          <td className="px-2 py-2 text-center">
                            {d.edited && <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">Edited</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cumulative Dose — inside drug card */}
              {cumulativeHistory.some(c => c.maxPerM2 > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-[#404040] mb-3">ขนาดยาสะสม</h3>
                  <div className="space-y-3">
                    {cumulativeHistory.filter(c => c.maxPerM2 > 0).map(c => {
                      const line = orderLines.find(d => d.name === c.drug);
                      const afterDose = c.totalMg + (line?.finalDose ?? 0);
                      const maxMg = c.maxPerM2 * bsa;
                      const afterPct = Math.round((afterDose / maxMg) * 100);
                      const color = afterPct >= 80 ? "#dc2626" : afterPct >= 60 ? "#f59e0b" : "#674BB3";
                      return (
                        <div key={c.drug}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-[#404040]">{c.drug}</span>
                            <span className="font-bold" style={{ color }}>{Math.round(afterDose)} / {Math.round(maxMg)} mg ({afterPct}%)</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${afterPct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Premedication Table */}
            {orderLines.some(d => d.classification === "premedication") && (
              <div className={cardCls}>
                <h3 className="text-sm font-bold text-[#404040] mb-4">ยาก่อนเคมีบำบัด (Premedication)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[#898989] uppercase border-b border-gray-200">
                        <th className="px-2 py-2 text-left">ยา</th>
                        <th className="px-2 py-2 text-right">ขนาด</th>
                        <th className="px-2 py-2 text-left">ROUTE</th>
                        <th className="px-2 py-2 text-left">DILUENT</th>
                        <th className="px-2 py-2 text-left">เวลาให้ยา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orderLines.filter(d => d.classification === "premedication").map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-2 py-2 font-semibold text-[#404040]">{d.name}</td>
                          <td className="px-2 py-2 text-right text-[#898989]">{d.finalDose} {d.unit}</td>
                          <td className="px-2 py-2 text-[#898989]">{d.route}</td>
                          <td className="px-2 py-2 text-[#898989]">{d.diluent}</td>
                          <td className="px-2 py-2 text-[#898989]">{d.rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Lab + Patient summary (reference sidebar) ── */}
          <div className="w-72 shrink-0 space-y-4">
            <LabSafetyPanel
              labs={labs.map(l => ({ name: l.name, value: l.value, unit: l.unit, ref: l.ref, status: labStatus(l) }))}
              className={cardCls}
            />

          </div>
        </div>
      </div>
    )}

    {/* ═══ STEP 4: Schedule & Note ═══ */}
    {step === 4 && protocol && patient && (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Schedule */}
          <div className={cardCls}>
            <h3 className="text-sm font-bold text-[#404040] mb-3">กำหนดการให้ยา</h3>
            <DatePicker
              label=""
              value={appointDT}
              onChange={(v) => { if (v) setAppointDT(v as ZonedDateTime); }}
              granularity="minute"
              hourCycle={24}
              hideTimeZone
              variant="bordered"
              minValue={now(tz)}
              popoverProps={{ placement: "bottom-end", className: "bg-white shadow-xl rounded-xl border border-gray-200" }}
              calendarProps={{
                classNames: {
                  cellButton: [
                    "data-[selected=true]:!bg-[#674BB3] data-[selected=true]:!text-white",
                    "data-[today=true]:border data-[today=true]:border-[#674BB3]",
                    "data-[unavailable=true]:!opacity-30 data-[disabled=true]:!opacity-30",
                    "hover:bg-onc/10",
                  ].join(" "),
                },
              }}
              timeInputProps={{ label: "เวลา", endContent: <span className="text-xs text-[#898989] ml-1">นาฬิกา</span> }}
            />
          </div>

          {/* Cycle */}
          <div className={cardCls}>
            <h3 className="text-sm font-bold text-[#404040] mb-3">Cycle ({protocol.totalCycles} รอบ)</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: protocol.totalCycles }, (_, i) => i + 1).map(c => (
                <button key={c} type="button" onClick={() => setCycle(c)}
                  className={`flex-1 min-w-[48px] h-10 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    cycle === c
                      ? "bg-onc text-white shadow-md"
                      : c < (patient.currentCycle ?? 1)
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-gray-50 text-text-secondary border border-gray-200 hover:border-onc hover:text-onc"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#898989] mt-3">
              {cycle < (patient.currentCycle ?? 1) ? "รอบที่ผ่านมาแล้ว" : cycle === (patient.currentCycle ?? 1) ? "รอบปัจจุบัน" : "รอบถัดไป"}
              {" · "}q{protocol.cycleDays}d
            </p>
          </div>

        </div>

        {/* Clinical Note — full width */}
        <div className={cardCls}>
          <h3 className="text-sm font-bold text-[#404040] mb-2">บันทึกทางคลินิก</h3>
          <textarea value={clinicalNote} onChange={e => setClinicalNote(e.target.value)} rows={7}
            placeholder="บันทึกเพิ่มเติม..." className={inputCls} />
        </div>
      </div>
    )}

    {/* ═══ STEP 5: Review & Sign ═══ */}
    {step === 5 && protocol && patient && (
      <div className="space-y-4">

        {/* Patient info */}
        <div className={cardCls}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-[#404040]">{patient.name}</p>
              <p className="text-sm text-[#898989]">HN {patient.hn} · {patient.gender} · {patient.diagnosis}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-[#674BB3] bg-onc/10 px-3 py-1 rounded-full">BSA {bsa} m²</span>
              <span className="text-xs font-bold text-[#674BB3] bg-onc/10 px-3 py-1 rounded-full">ECOG {ecog}</span>
              <span className="text-xs font-bold text-[#674BB3] bg-onc/10 px-3 py-1 rounded-full">CrCl {patient.crcl} mL/min</span>
            </div>
          </div>
        </div>

        {/* Top row: Protocol summary + Appointment details */}
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_1fr] gap-4">
          {/* Protocol summary */}
          <div className="relative rounded-2xl p-5 overflow-hidden min-h-40" style={{ background: "linear-gradient(135deg, #EDE9F6 0%, #D8D0F0 50%, #C8BFE8 100%)" }}>
            <div className="relative z-10 max-w-[70%] sm:max-w-[60%]">
              <p className="text-xs font-semibold text-[#674BB3]/70 uppercase tracking-wide">สูตรเคมีบำบัด</p>
              <p className="text-3xl 2xl:text-4xl font-black text-[#404040] mt-3">{protocol.code}</p>
              <p className="text-sm text-[#404040]/70 font-medium mt-1">Cycle {cycle} / {protocol.totalCycles} · q{protocol.cycleDays}d</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-bold text-[#674BB3] bg-white/70 px-3 py-1 rounded-full">{protocol.cancer}</span>
                <span className="text-xs font-bold text-[#674BB3] bg-white/70 px-3 py-1 rounded-full">{protocol.line}</span>
                <span className="text-xs font-bold text-[#674BB3] bg-white/70 px-3 py-1 rounded-full">Emeto: {protocol.emetogenicRisk}</span>
              </div>
              <p className="text-xs text-[#404040]/60 mt-2">{protocol.drugs.filter(d => d.classification === "chemotherapy").map(d => d.name).join(" + ")}</p>
            </div>
            <img src={`${import.meta.env.BASE_URL}onc/chemo-hand.png`} alt="" className="absolute right-4 2xl:right-8 -bottom-6 h-[90%] 2xl:h-[110%] object-contain pointer-events-none opacity-80" />
          </div>
          {/* Appointment details */}
          <div className={cardCls}>
            <h3 className="text-sm font-bold text-[#404040]">รายละเอียดการนัดหมาย</h3>
            <div className="space-y-3 mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#898989]">วันนัดให้ยา</span>
                <span className="font-semibold text-[#404040]">{fmtDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">ปรับขนาดยา</span>
                <span className="font-semibold text-[#404040]">{doseReduction}%</span>
              </div>
              {patient.allergy !== "—" && (
                <div className="flex justify-between">
                  <span className="text-[#898989]">แพ้ยา</span>
                  <span className="font-semibold text-red-600">{patient.allergy}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
              <span className="text-[#898989] text-sm">รวมรายการยา</span>
              <span className="text-xl font-black text-[#404040]">{orderLines.length} <span className="text-sm font-normal text-[#898989]">รายการ</span></span>
            </div>
          </div>
        </div>

        {/* Drug list — full width */}
        <div className={`${cardCls} overflow-x-auto`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#404040]">รายการยา</h3>
            <span className="text-xs font-semibold text-[#898989]">ขนาด</span>
          </div>
          <div className="min-w-100">
            {orderLines.filter(d => d.classification === "chemotherapy").length > 0 && (
              <>
                <p className="text-xs font-semibold text-[#898989] uppercase tracking-wide mb-2">ยาเคมีบำบัด</p>
                {orderLines.filter(d => d.classification === "chemotherapy").map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 pl-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#404040]">{d.name}</span>
                      <span className="text-xs text-[#898989] ml-2">{d.route} · {d.rate}</span>
                    </div>
                    <span className="font-bold text-[#404040] shrink-0 ml-4">{d.finalDose} mg</span>
                  </div>
                ))}
              </>
            )}
            {orderLines.filter(d => d.classification === "premedication").length > 0 && (
              <>
                <p className="text-xs font-semibold text-[#898989] uppercase tracking-wide mb-2 mt-4">ยาก่อนเคมีบำบัด</p>
                {orderLines.filter(d => d.classification === "premedication").map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 pl-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#404040]">{d.name}</span>
                      <span className="text-xs text-[#898989] ml-2">{d.route} · {d.rate}</span>
                    </div>
                    <span className="font-bold text-[#404040] shrink-0 ml-4">{d.finalDose} {d.unit}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        

      </div>
    )}

  </div>);

  /* ── Navigation buttons (ย้อนกลับ + ถัดไป / Preview + Sign) ── */
  const navButtons = (
    <div className="flex items-center gap-3">
      {step > 1 && (
        <button onClick={handleBack}
          className="text-sm font-semibold text-[#898989] hover:text-onc border border-gray-200 rounded-full px-5 py-1.5 transition-colors">
          ย้อนกลับ
        </button>
      )}
      {step < 5 && (
        <button onClick={handleNext} disabled={!canProceed()}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${canProceed() ? "bg-[#674BB3] text-white hover:bg-onc-hover" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
          ถัดไป
        </button>
      )}
      {step === 5 && (
        <>
          <div className="relative">
            <button onClick={() => setShowSignModal(!showSignModal)}
              className="rounded-full px-5 py-1.5 text-sm font-semibold flex items-center gap-1.5 bg-[#674BB3] text-white hover:bg-onc-hover transition-all">
              <ClipboardCheck size={14} /> ยืนยันคำสั่งยา
            </button>
            {showSignModal && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setShowSignModal(false); setPin(""); setPinError(false); }} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-80">
                  <p className="text-sm font-bold text-[#404040] mb-1 text-center">ลงนามคำสั่งยา</p>
                  <p className="text-xs text-[#898989] mb-4 text-center">กรอก PIN 6 หลักเพื่อลงนามคำสั่งยา</p>
                  <div className="flex justify-center gap-2 mb-4 cursor-text" onClick={() => (document.getElementById("pin-input-1") as HTMLInputElement)?.focus()}>
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                        i < pin.length ? "border-onc bg-onc/5 text-onc" : i === pin.length ? "border-onc/50" : "border-gray-200"
                      }`}>{i < pin.length ? "●" : ""}</div>
                    ))}
                  </div>
                  <input id="pin-input-1" type="password" inputMode="numeric" maxLength={6} value={pin}
                    onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(false); }}
                    onKeyDown={e => { if (e.key === "Enter" && pin.length === 6) handleSign(); }}
                    autoFocus className="sr-only" />
                  {pinError && <p className="text-xs text-red-600 font-semibold mb-3 text-center">PIN ไม่ถูกต้อง — ลองอีกครั้ง</p>}
                  <button onClick={handleSign} disabled={pin.length < 6 || hasHardStop}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${pin.length >= 6 && !hasHardStop ? "bg-[#674BB3] text-white hover:bg-onc-hover" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}>
                    <ClipboardCheck size={14} /> ยืนยัน
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  /* ── Embedded mode: stepper → title+buttons → content ── */
  if (embedded) return (
    <>
      <div className="rounded-2xl border-[0.1px] border-border-card p-5 mb-5 sticky top-0 z-10 backdrop-blur-md bg-white/70" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <OrderStepper step={step} onStepClick={(s) => { if (s <= step) setStep(s); }} />
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-[#404040]">{STEP_LABELS[step - 1]}</h2>
          <p className="text-xs text-[#898989] mt-0.5">{STEP_DESCRIPTIONS[step - 1]}</p>
        </div>
        {navButtons}
      </div>
      {wizardSteps}

      {previewModal}
    </>
  );

  /* ── Step-specific tips ── */
  const stepTips: Record<number, { title: string; text: string }> = {
    1: { title: "ประเมิน ECOG", text: "ประเมินสมรรถภาพร่างกายผู้ป่วยก่อนเริ่มให้ยาเคมีบำบัด" },
    2: { title: "เลือก Protocol", text: "เลือกสูตรเคมีบำบัดที่เหมาะสมกับการวินิจฉัย" },
    3: { title: "คำนวณขนาดยา", text: "ระบบคำนวณขนาดยาจาก BSA อัตโนมัติ สามารถปรับลดขนาดยาได้ตามความเหมาะสม" },
    4: { title: "กำหนดการให้ยา", text: "กำหนดวันนัดให้ยาและบันทึกทางคลินิก" },
    5: { title: "ตรวจสอบ", text: "ตรวจสอบรายการยาและลงนามคำสั่งยาเคมีบำบัด" },
  };

  /* ── Standalone mode: full layout ── */
  return (
    <div className="flex flex-col h-full overflow-hidden pt-2">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <button onClick={() => navigate(`/onc/patients/${patient?.hn ?? ""}`)}
          className="text-sm text-[#674BB3] hover:text-[#563AA4] font-medium flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> ข้อมูลผู้ป่วย
        </button>
        <h1 className="text-xl font-bold text-[#404040]">สั่งยาเคมีบำบัด</h1>
        <button onClick={() => navigate(`/onc/patients/${patient?.hn ?? ""}`)}
          className="text-sm text-[#898989] hover:text-[#404040] transition-colors">
          ✕ ยกเลิก
        </button>
      </div>

      {/* ── Main content + Tip sidebar ── */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main content card */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border-[0.1px] border-border-card overflow-y-auto" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <OrderStepper step={step} onStepClick={(s) => { if (s <= step) setStep(s); }} />
              {navButtons}
            </div>
            {wizardSteps}
          </div>
        </div>

        {/* Right sidebar — tip + patient info */}
        <div className="w-64 shrink-0 overflow-y-auto space-y-3">
          {/* Contextual tip */}
          <div className="bg-white rounded-2xl border-[0.1px] border-border-card p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Info size={12} className="text-amber-600" />
              </div>
              <h3 className="text-xs font-bold text-[#404040] uppercase tracking-wide">คำแนะนำ</h3>
            </div>
            <p className="text-xs text-[#898989] leading-relaxed">{stepTips[step]?.text}</p>
          </div>

          {/* Allergy warning */}
          {patient && patient.allergy !== "—" && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={14} className="text-red-600" />
                <h3 className="text-xs font-bold text-red-700">การแพ้ยา</h3>
              </div>
              <p className="text-sm font-bold text-red-700">{patient.allergy}</p>
            </div>
          )}

          {/* Lab summary */}
          {patient && (
            <div className="bg-white rounded-2xl border-[0.1px] border-border-card p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-xs font-bold text-[#404040] mb-2.5">Lab ล่าสุด</h3>
              <div className="space-y-1.5">
                {labs.map(l => {
                  const s = labStatus(l);
                  const color = s === "danger" ? "text-red-600" : s === "warn" ? "text-amber-600" : "text-emerald-600";
                  const dot = s === "danger" ? "bg-red-500" : s === "warn" ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <div key={l.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className="text-[#404040]">{l.name}</span>
                      </div>
                      <span className={`font-bold ${color}`}>{l.value} <span className="font-normal text-[#898989] text-[10px]">{l.unit}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Order Modal */}
      {showSignModal && patient && protocol && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-onc/10 flex items-center justify-center mx-auto mb-3">
                <ClipboardCheck size={24} className="text-[#674BB3]" />
              </div>
              <h2 className="text-lg font-bold text-[#404040]">ยืนยันลงนามคำสั่งยา</h2>
              <p className="text-sm text-[#898989] mt-1">{protocol.code} C{cycle} · {patient.name}</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-amber-800 text-xs mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>การ Sign Order ถือเป็นการรับรองคำสั่งยาทางกฎหมาย โปรดตรวจสอบให้ถูกต้องก่อนยืนยัน</p>
              </div>
            </div>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-[#898989]">รายการยา</span><span className="font-semibold text-[#404040]">{orderLines.length} รายการ</span></div>
              <div className="flex justify-between"><span className="text-[#898989]">วันนัดให้ยา</span><span className="font-semibold text-[#404040]">{fmtDateTime}</span></div>
              <div className="flex justify-between"><span className="text-[#898989]">ปรับขนาดยา</span><span className="font-semibold text-[#404040]">{doseReduction}%</span></div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-[#404040] mb-1 text-center">ลงนามคำสั่งยา</p>
              <p className="text-xs text-[#898989] mb-4 text-center">กรอก PIN 6 หลักเพื่อลงนามคำสั่งยา</p>
              <div className="flex justify-center gap-2 mb-4 cursor-text" onClick={() => (document.getElementById("pin-input-2") as HTMLInputElement)?.focus()}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                    i < pin.length ? "border-onc bg-onc/5 text-onc" : "border-gray-200"
                  }`}>{i < pin.length ? "●" : ""}</div>
                ))}
              </div>
              <input id="pin-input-2" type="password" inputMode="numeric" maxLength={6} value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(false); }}
                onKeyDown={e => { if (e.key === "Enter" && pin.length === 6) handleSign(); }}
                autoFocus className="sr-only" />
              {pinError && <p className="text-xs text-red-600 font-semibold mb-3 text-center">PIN ไม่ถูกต้อง — ลองอีกครั้ง</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowSignModal(false); setPin(""); setPinError(false); }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#404040] hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSign} disabled={pin.length < 6 || hasHardStop}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${pin.length >= 6 && !hasHardStop ? "bg-[#674BB3] text-white hover:bg-onc-hover" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}>
                <ClipboardCheck size={14} /> ยืนยัน Sign Order
              </button>
            </div>
          </div>
        </div>
      )}

      {previewModal}
    </div>
  );
}
