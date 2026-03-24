import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, CheckCircle2, XCircle, Lock,
  Beaker, User, Calendar, FileText, ArrowRight,
  Calculator, Weight, Ruler, Pill, AlertOctagon,
  Plus, Trash2, ChevronDown, Save, Zap, Info,
  Heart, ClipboardList, Edit3, ArrowUpDown, Percent,
  Syringe, Shield,
} from "lucide-react";
import { useOnc } from "../../components/onc/OncContext";

/* ══════════════════════════════════════════════
   CPOE Order Entry
   Ref: Spec §3.3 — Primary tool for physicians
   Ref: Cytotoxic V8.0 p.17-18
   Ref: อุดรธานี p.14-16
   ──────────────────────────────────────────────
   Layout: Left panel (patient+protocol) / Right panel (labs+drugs)
   Safety: Lab Gate, Diagnosis Gate, Allergy, Cumulative Dose
   Math: "Show the math" — BSA, Wt, CrCl always visible
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
  calcDose: number;
  finalDose: number;
  adjustPct: number; // dose adjustment % (e.g. -25)
  startDate: string;
  endDate: string;
  edited: boolean;
  fromProtocol: boolean;
};

/* ── Protocols ── */
const protocols = [
  {
    id: "CAF", code: "CAF", name: "CAF", cancer: "Breast", cycleDays: 21, totalCycles: 6, treatmentDays: [1],
    drugs: [
      { name: "Ondansetron", baseDose: 8, unit: "mg", method: "FIXED" as DoseMethod, route: "IV", diluent: "NSS 50 ml", rate: "15 min", day: 1, classification: "premedication" as DrugClass, seq: 0 },
      { name: "Dexamethasone", baseDose: 20, unit: "mg", method: "FIXED" as DoseMethod, route: "IV", diluent: "NSS 50 ml", rate: "15 min", day: 1, classification: "premedication" as DrugClass, seq: 0 },
      { name: "Cyclophosphamide", baseDose: 500, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 100 ml", rate: "30 min", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
      { name: "Doxorubicin", baseDose: 50, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Push", diluent: "D-5-W 50 ml", rate: "—", day: 1, classification: "chemotherapy" as DrugClass, seq: 2 },
      { name: "5-FU", baseDose: 500, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 500 ml", rate: "4 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 3 },
    ],
  },
  {
    id: "FOLFOX6", code: "FOLFOX6", name: "FOLFOX6", cancer: "Colon", cycleDays: 14, totalCycles: 12, treatmentDays: [1],
    drugs: [
      { name: "Oxaliplatin", baseDose: 85, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 500 ml", rate: "2 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
      { name: "Leucovorin", baseDose: 200, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 100 ml", rate: "2 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 2 },
      { name: "5-FU (bolus)", baseDose: 400, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Push", diluent: "—", rate: "—", day: 1, classification: "chemotherapy" as DrugClass, seq: 3 },
      { name: "5-FU (infusion)", baseDose: 2400, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 500 ml", rate: "46 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 4 },
    ],
  },
  {
    id: "CARBO-PAC", code: "CARBO-PAC", name: "Carboplatin/Paclitaxel", cancer: "Ovarian/Lung", cycleDays: 21, totalCycles: 6, treatmentDays: [1],
    drugs: [
      { name: "Dexamethasone", baseDose: 20, unit: "mg", method: "FIXED" as DoseMethod, route: "IV", diluent: "—", rate: "—", day: 1, classification: "premedication" as DrugClass, seq: 0 },
      { name: "Paclitaxel", baseDose: 175, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "NSS 500 ml", rate: "3 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
      { name: "Carboplatin (AUC5)", baseDose: 5, unit: "AUC", method: "AUC" as DoseMethod, route: "IV Infusion", diluent: "D-5-W 250 ml", rate: "1 hr", day: 1, classification: "chemotherapy" as DrugClass, seq: 2 },
    ],
  },
  {
    id: "GEM", code: "GEM", name: "Gemcitabine", cancer: "Lung/Pancreas", cycleDays: 28, totalCycles: 6, treatmentDays: [1, 8, 15],
    drugs: [
      { name: "Gemcitabine", baseDose: 1000, unit: "mg/m²", method: "BSA" as DoseMethod, route: "IV Infusion", diluent: "NSS 250 ml", rate: "30 min", day: 1, classification: "chemotherapy" as DrugClass, seq: 1 },
    ],
  },
];

/* ── Patient ── */
const patient = {
  hn: "104558", name: "นาง คำปุ่น เสสาร", dob: "15 ม.ค. 2512 (55 ปี)", gender: "หญิง",
  diagnosis: "C50.9 — Breast Cancer", icd10: "C50.9", stage: "IIIA", ecog: 1,
  allergy: "Penicillin", weight: 48, height: 146, bsa: 1.40, creatinine: 0.8, crcl: 72,
};

const doctors = ["นพ.สมชาย รักษาดี", "นพ.วิรัช เจริญสุข", "นพ.กมล ศรีโรจน์"];
const wards = ["OPD เคมีบำบัด", "หอผู้ป่วย 4A", "หอผู้ป่วย 5B"];

type LabItem = { name: string; value: number; unit: string; ref: string; threshold: number; direction: "above" | "below"; date: string };
const labs: LabItem[] = [
  { name: "ANC", value: 2.1, unit: "×10⁹/L", ref: "≥ 1.5", threshold: 1.5, direction: "above", date: "2026-03-21" },
  { name: "PLT", value: 185, unit: "×10⁹/L", ref: "≥ 100", threshold: 100, direction: "above", date: "2026-03-21" },
  { name: "Hb", value: 11.2, unit: "g/dL", ref: "≥ 8.0", threshold: 8.0, direction: "above", date: "2026-03-21" },
  { name: "Cr", value: 0.8, unit: "mg/dL", ref: "≤ 1.5", threshold: 1.5, direction: "below", date: "2026-03-21" },
  { name: "ALT", value: 28, unit: "U/L", ref: "≤ 3×ULN", threshold: 120, direction: "below", date: "2026-03-21" },
  { name: "AST", value: 24, unit: "U/L", ref: "≤ 3×ULN", threshold: 120, direction: "below", date: "2026-03-21" },
  { name: "T.Bili", value: 0.6, unit: "mg/dL", ref: "≤ 1.5", threshold: 1.5, direction: "below", date: "2026-03-21" },
];

const cumulativeHistory = [
  { drug: "Doxorubicin", totalMg: 132, maxPerM2: 550 },
  { drug: "Cyclophosphamide", totalMg: 4823, maxPerM2: 0 },
];

/* ── Helpers ── */
function calcDose(base: number, method: DoseMethod, bsa: number, crcl: number): number {
  switch (method) {
    case "BSA": return Math.round(base * bsa * 10) / 10;
    case "WEIGHT": return Math.round(base * patient.weight * 10) / 10;
    case "AUC": return Math.round(base * (crcl + 25));
    case "FIXED": return base;
  }
}

function calcBSA(wt: number, ht: number) {
  return Math.round(0.007184 * Math.pow(wt, 0.425) * Math.pow(ht, 0.725) * 100) / 100;
}

function isLabStale(d: string) {
  return (new Date().getTime() - new Date(d).getTime()) / 864e5 > 3;
}

function labStatus(lab: LabItem): "safe" | "warn" | "danger" {
  if (lab.direction === "above" && lab.value < lab.threshold) return lab.value < lab.threshold * 0.7 ? "danger" : "warn";
  if (lab.direction === "below" && lab.value > lab.threshold) return "danger";
  return "safe";
}

const todayStr = new Date().toISOString().slice(0, 10);

const classColors: Record<DrugClass, { bg: string; text: string; label: string }> = {
  premedication: { bg: "bg-info-bg", text: "text-info", label: "Premed" },
  chemotherapy: { bg: "bg-onc-bg", text: "text-onc", label: "Chemo" },
  "post-medication": { bg: "bg-success-bg", text: "text-success", label: "Post" },
};

const methodColors: Record<DoseMethod, { bg: string; text: string }> = {
  BSA: { bg: "bg-onc-bg", text: "text-onc" },
  AUC: { bg: "bg-purple-100", text: "text-purple-700" },
  WEIGHT: { bg: "bg-blue-50", text: "text-blue-700" },
  FIXED: { bg: "bg-background-alt", text: "text-text-muted" },
};

/* ══════════════════════════════════════════════ */
export default function OrderEntry() {
  const { verifyPin } = useOnc();

  /* ── State ── */
  const [selProto, setSelProto] = useState("");
  const [cycle, setCycle] = useState(3);
  const [totalCycles, setTotalCycles] = useState(6);
  const [day, setDay] = useState(1);
  const [wt, setWt] = useState(patient.weight);
  const [ht, setHt] = useState(patient.height);
  const [bsa, setBsa] = useState(patient.bsa);
  const [autoCalc, setAutoCalc] = useState(true);
  const [doctor, setDoctor] = useState("");
  const [ward, setWard] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [globalAdjust, setGlobalAdjust] = useState(0); // Dose Adjustment %
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [manualDrug, setManualDrug] = useState("");
  const [pinError, setPinError] = useState(false);

  const protocol = protocols.find(p => p.id === selProto);

  /* ── BSA auto-calc — Ref: Spec "DuBois formula" ── */
  useEffect(() => {
    if (autoCalc && wt > 0 && ht > 0) setBsa(calcBSA(wt, ht));
  }, [wt, ht, autoCalc]);

  /* ── PIN submit ── */
  useEffect(() => {
    if (pin.length === 6) {
      setTimeout(() => {
        if (verifyPin(pin)) {
          setShowPin(false); setPin(""); setSubmitted(true); setPinError(false);
        } else {
          setPinError(true); setPin("");
        }
      }, 400);
    }
  }, [pin, verifyPin]);

  /* ── Auto Order — Ref: V8.0 p.17 "คลิก auto order" ── */
  function handleAutoOrder() {
    if (!protocol) return;
    const lines: OrderLine[] = protocol.drugs.map(d => {
      const cd = calcDose(d.baseDose, d.method, bsa, patient.crcl);
      const adj = d.classification === "premedication" ? 0 : globalAdjust;
      const fd = Math.round(cd * (1 + adj / 100) * 10) / 10;
      return { ...d, calcDose: cd, finalDose: fd, adjustPct: adj, startDate, endDate: startDate, edited: false, fromProtocol: true };
    });
    setOrderLines(lines);
  }

  /* ── Recalculate on BSA or globalAdjust change ── */
  useEffect(() => {
    if (orderLines.length === 0) return;
    setOrderLines(prev => prev.map(l => {
      const cd = calcDose(l.baseDose, l.method, bsa, patient.crcl);
      const adj = l.classification === "premedication" ? 0 : (l.edited ? l.adjustPct : globalAdjust);
      const fd = l.edited ? l.finalDose : Math.round(cd * (1 + adj / 100) * 10) / 10;
      return { ...l, calcDose: cd, finalDose: fd };
    }));
  }, [bsa]);

  /* ── Apply global dose adjustment ── */
  function applyGlobalAdjust() {
    setOrderLines(prev => prev.map(l => {
      if (l.classification === "premedication" || l.edited) return l;
      const fd = Math.round(l.calcDose * (1 + globalAdjust / 100) * 10) / 10;
      return { ...l, finalDose: fd, adjustPct: globalAdjust };
    }));
  }

  /* ── Update line ── */
  function updateLine(i: number, field: keyof OrderLine, val: string | number | boolean) {
    setOrderLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const u = { ...l, [field]: val };
      if (field === "finalDose") { u.edited = true; u.adjustPct = u.calcDose > 0 ? Math.round(((Number(val) / u.calcDose) - 1) * 100) : 0; }
      return u;
    }));
  }

  function deleteLine(i: number) { setOrderLines(prev => prev.filter((_, idx) => idx !== i)); }

  function moveSeq(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= orderLines.length) return;
    setOrderLines(prev => { const a = [...prev]; [a[i], a[t]] = [a[t], a[i]]; return a; });
  }

  /* ── Manual drug add — Ref: V8.0 p.17 "หากพิมพ์ยาที่ไม่มีใน protocol จะเตือน" ── */
  function handleAddDrug() {
    if (!manualDrug.trim()) return;
    const inProto = protocol?.drugs.some(d => d.name.toLowerCase() === manualDrug.toLowerCase());
    if (!inProto && !confirm(`⚠️ "${manualDrug}" ไม่อยู่ใน Protocol ${protocol?.code ?? ""}\nต้องการเพิ่มหรือไม่?`)) return;
    setOrderLines(prev => [...prev, {
      name: manualDrug, baseDose: 0, unit: "mg", method: "FIXED", route: "IV", diluent: "—", rate: "—",
      day, classification: "chemotherapy", seq: prev.length + 1,
      calcDose: 0, finalDose: 0, adjustPct: 0, startDate, endDate: startDate, edited: true, fromProtocol: false,
    }]);
    setManualDrug(""); setShowAddDrug(false);
  }

  /* ══════════════════ WARNINGS — Ref: Spec §4 "Three-Level Alerting" ══════════════════ */
  const warnings = useMemo(() => {
    const w: { level: WarnLevel; msg: string }[] = [];

    // Mandatory fields — Ref: V8.0 p.17 "หากไม่ใส่ โปรแกรมจะไม่คำนวณ"
    if (!doctor) w.push({ level: "HARD_STOP", msg: "ยังไม่ได้เลือกแพทย์ผู้สั่ง" });
    if (!ward) w.push({ level: "HARD_STOP", msg: "ยังไม่ได้เลือกหอผู้ป่วย" });

    // Diagnosis Gate — Ref: Spec "No ICD-10 Diagnosis" hard stop
    if (!patient.icd10) w.push({ level: "HARD_STOP", msg: "ไม่มี Diagnosis (ICD-10) — ต้องบันทึก Diagnosis ก่อนสั่งยา" });

    // Lab Gate — Ref: Spec "Lab Gate", V8.0 Alerting
    const stale = labs.filter(l => isLabStale(l.date));
    if (stale.length > 0) w.push({ level: "HARD_STOP", msg: `ผลแลปเก่าเกิน 3 วัน (${stale.map(l => l.name).join(", ")}) — ต้องตรวจใหม่` });

    labs.forEach(l => {
      const s = labStatus(l);
      if (s === "danger") w.push({ level: "HARD_STOP", msg: `${l.name} = ${l.value} ${l.unit} — ค่าผิดปกติวิกฤต (${l.ref})` });
      else if (s === "warn") w.push({ level: "WARN", msg: `${l.name} = ${l.value} ${l.unit} — ใกล้เกณฑ์ (${l.ref})` });
    });

    // Allergy — Ref: Spec "allergy cross-check"
    if (patient.allergy && patient.allergy !== "—") {
      orderLines.forEach(d => {
        if (d.name.toLowerCase().includes(patient.allergy.toLowerCase()))
          w.push({ level: "HARD_STOP", msg: `ผู้ป่วยแพ้ "${patient.allergy}" — ยา ${d.name} อาจเกี่ยวข้อง` });
      });
    }

    // Cumulative dose — Ref: Spec "cumulative dose tracking"
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

    // Dose deviation >10% — Ref: V8.0 "เตือนให้ตรวจสอบขนาดยา"
    orderLines.forEach(d => {
      if (d.edited && d.calcDose > 0 && Math.abs(d.finalDose - d.calcDose) / d.calcDose > 0.1)
        w.push({ level: "WARN", msg: `${d.name} — Final ${d.finalDose} mg ต่างจาก Calc ${d.calcDose} mg มากกว่า 10%` });
    });

    return w;
  }, [orderLines, doctor, ward, bsa]);

  const hasHardStop = warnings.some(w => w.level === "HARD_STOP");
  const canSubmit = protocol && orderLines.length > 0 && !hasHardStop;

  /* ── Draft save ── */
  function handleDraft() { setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2000); }

  /* ══════════════════ SUCCESS ══════════════════ */
  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-success-bg flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-text">ส่งคำสั่งยาสำเร็จ</h2>
          <p className="text-sm text-text-muted">
            {protocol?.code} C{cycle}/{totalCycles} D{day} · {doctor}<br/>
            {orderLines.length} รายการ → เภสัชกรตรวจสอบ
          </p>
          <button onClick={() => { setSubmitted(false); setSelProto(""); setOrderLines([]); }}
            className="px-6 py-2.5 bg-onc text-white text-sm font-bold rounded-xl hover:bg-onc/90">
            สั่งยารายการใหม่
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <>
      <div className="flex h-full">
        {/* ═══ LEFT — Patient + Protocol ═══ */}
        <div className="w-[340px] shrink-0 border-r border-border bg-surface overflow-y-auto">
          {/* Patient */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-onc-bg flex items-center justify-center">
                <User size={16} className="text-onc" />
              </div>
              <div>
                <p className="text-sm font-bold text-text">{patient.name}</p>
                <p className="text-[11px] text-text-muted">HN {patient.hn} · {patient.dob}</p>
              </div>
            </div>
            <div className="text-xs text-text-secondary space-y-0.5 mb-3">
              <p><b>{patient.icd10}</b> — {patient.diagnosis} · Stage {patient.stage} · ECOG {patient.ecog}</p>
            </div>
            {patient.allergy !== "—" && (
              <div className="onc-alert-danger rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                <Heart size={12} /> <b>แพ้ยา: {patient.allergy}</b>
              </div>
            )}
          </div>

          {/* Anthropometrics — Ref: Spec "show the math" */}
          <div className="p-5 border-b border-border">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Calculator size={10} /> Anthropometrics — "Show the Math"
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-text-muted flex items-center gap-1 mb-1"><Weight size={9} /> Wt (kg)</label>
                <input type="number" value={wt} onChange={e => setWt(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background-alt focus:outline-none focus:border-onc" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted flex items-center gap-1 mb-1"><Ruler size={9} /> Ht (cm)</label>
                <input type="number" value={ht} onChange={e => setHt(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background-alt focus:outline-none focus:border-onc" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted flex items-center gap-1 mb-1"><Calculator size={9} /> BSA</label>
                <input type="number" step="0.01" value={bsa} readOnly={autoCalc}
                  onChange={e => { if (!autoCalc) setBsa(Number(e.target.value)); }}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none ${autoCalc ? "border-onc/40 bg-onc-bg font-bold text-onc" : "border-border bg-surface"}`} />
                <button onClick={() => setAutoCalc(!autoCalc)} className="text-[10px] text-onc hover:underline mt-0.5">
                  {autoCalc ? "BSA CAL ✓" : "Manual"}
                </button>
              </div>
            </div>
            <p className="text-[9px] text-text-muted">
              DuBois: 0.007184 × {wt}^0.425 × {ht}^0.725 = <b>{calcBSA(wt, ht)} m²</b> · CrCl: <b>{patient.crcl} mL/min</b>
            </p>
          </div>

          {/* Doctor + Ward — Ref: V8.0 p.17 mandatory */}
          <div className="p-5 border-b border-border">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ClipboardList size={10} /> แพทย์ & หอผู้ป่วย <span className="text-danger">*</span>
            </p>
            <div className="space-y-2">
              <div className="relative">
                <select value={doctor} onChange={e => setDoctor(e.target.value)}
                  className={`w-full appearance-none px-3 py-2 text-sm border rounded-xl pr-8 focus:outline-none ${!doctor ? "border-danger/40 bg-danger-bg/30" : "border-border bg-background-alt"}`}>
                  <option value="">— เลือกแพทย์ —</option>
                  {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
              </div>
              <div className="relative">
                <select value={ward} onChange={e => setWard(e.target.value)}
                  className={`w-full appearance-none px-3 py-2 text-sm border rounded-xl pr-8 focus:outline-none ${!ward ? "border-danger/40 bg-danger-bg/30" : "border-border bg-background-alt"}`}>
                  <option value="">— เลือกหอผู้ป่วย —</option>
                  {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Protocol + Cycle */}
          <div className="p-5 border-b border-border">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Pill size={10} /> Protocol & Cycle
            </p>
            <div className="relative mb-3">
              <select value={selProto} onChange={e => { setSelProto(e.target.value); setOrderLines([]); const p = protocols.find(x => x.id === e.target.value); if (p) setTotalCycles(p.totalCycles); }}
                className="w-full appearance-none px-3 py-2.5 text-sm border border-border rounded-xl bg-background-alt pr-8 focus:outline-none focus:border-onc">
                <option value="">— เลือก Protocol —</option>
                {protocols.map(p => <option key={p.id} value={p.id}>{p.code} — {p.cancer}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-3.5 text-text-muted pointer-events-none" />
            </div>
            {protocol && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Cycle</label>
                    <input type="number" value={cycle} onChange={e => setCycle(Number(e.target.value))} min={1}
                      className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-onc" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Total</label>
                    <input type="number" value={totalCycles} onChange={e => setTotalCycles(Number(e.target.value))} min={1}
                      className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-onc" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Day</label>
                    <input type="number" value={day} onChange={e => setDay(Number(e.target.value))} min={1}
                      className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-onc" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted mb-1 block">วันที่ให้ยา</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-onc" />
                </div>
                {/* Cycle progress */}
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: totalCycles }, (_, i) => i + 1).map(c => (
                    <div key={c} className={`flex-1 h-1.5 rounded-full ${c < cycle ? "bg-success" : c === cycle ? "bg-onc" : "bg-border"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dose Adjustment — Ref: Spec §3.3 "Dose Adjustment %" */}
          {protocol && (
            <div className="p-5 border-b border-border">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Percent size={10} /> Dose Adjustment
              </p>
              <div className="flex items-center gap-2">
                <input type="number" value={globalAdjust} onChange={e => setGlobalAdjust(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 text-sm border border-border rounded-lg text-center focus:outline-none focus:border-onc" />
                <span className="text-xs text-text-muted">%</span>
                <button onClick={applyGlobalAdjust}
                  className="px-3 py-1.5 text-[11px] font-semibold bg-onc text-white rounded-lg hover:bg-onc/90">
                  Apply
                </button>
              </div>
              {globalAdjust !== 0 && (
                <p className="text-[10px] text-text-muted mt-1.5">
                  {globalAdjust > 0 ? "เพิ่ม" : "ลด"} dose {Math.abs(globalAdjust)}% จาก calculated dose (ไม่รวม premed)
                </p>
              )}
            </div>
          )}

          {/* Cumulative */}
          {cumulativeHistory.filter(h => h.maxPerM2 > 0).map(h => {
            const added = orderLines.find(l => l.name === h.drug);
            const after = h.totalMg + (added?.finalDose ?? 0);
            const max = h.maxPerM2 * bsa;
            const pct = Math.round(after / max * 100);
            return (
              <div key={h.drug} className="px-5 pb-4">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="font-semibold text-text">{h.drug}</span>
                  <span className="text-text-muted">{pct}%</span>
                </div>
                <div className="bg-border rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 80 ? "bg-danger" : pct >= 60 ? "bg-warning" : "bg-onc"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-[9px] text-text-muted mt-0.5">{Math.round(after)} / {Math.round(max)} mg</p>
              </div>
            );
          })}
        </div>

        {/* ═══ RIGHT — Labs + Drug Table ═══ */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="space-y-4 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-text">สั่งยาเคมีบำบัด (CPOE)</h1>
                {protocol && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {protocol.code} · C{cycle}/{totalCycles} D{day} · BSA {bsa} m² · CrCl {patient.crcl}
                    {globalAdjust !== 0 && <span className="text-warning font-semibold"> · Dose {globalAdjust > 0 ? "+" : ""}{globalAdjust}%</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDraft}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    draftSaved ? "border-success bg-success-bg text-success" : "border-border bg-surface text-text-muted hover:bg-background-alt"
                  }`}>
                  <Save size={12} /> {draftSaved ? "Saved ✓" : "บันทึกร่าง"}
                </button>
                <button disabled={!canSubmit} onClick={() => { setShowPin(true); setPinError(false); }}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                    canSubmit ? "bg-onc text-white hover:bg-onc/90 shadow-md shadow-onc/20" : "bg-border text-text-muted cursor-not-allowed"
                  }`}>
                  <Lock size={13} /> Submit + PIN <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Warnings — 3-tier — Ref: Spec §4 */}
            {warnings.map((w, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs ${
                w.level === "HARD_STOP" ? "onc-alert-danger" : w.level === "WARN" ? "onc-alert-warn" : "onc-alert-info"
              }`}>
                {w.level === "HARD_STOP" ? <AlertOctagon size={14} className="shrink-0 mt-0.5" /> :
                 w.level === "WARN" ? <AlertTriangle size={14} className="shrink-0 mt-0.5" /> :
                 <Info size={14} className="shrink-0 mt-0.5" />}
                <span>{w.msg}</span>
              </div>
            ))}

            {/* Lab Snapshot — Ref: Spec §3.3 "Lab Gate Visualizer" */}
            <div className="onc-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={10} /> Lab Snapshot
                </p>
                <span className={`text-[10px] ${isLabStale(labs[0].date) ? "text-danger font-bold" : "text-text-muted"}`}>
                  {labs[0].date} {isLabStale(labs[0].date) && "⚠ เก่าเกิน 3 วัน"}
                </span>
              </div>
              <div className="flex gap-2">
                {labs.map(l => {
                  const s = labStatus(l);
                  return (
                    <div key={l.name} className={`flex-1 rounded-xl px-2 py-2.5 text-center ${
                      s === "danger" ? "bg-danger-bg ring-1 ring-danger/20" : s === "warn" ? "bg-warning-bg ring-1 ring-warning/20" : "bg-background-alt"
                    }`}>
                      <p className="text-[9px] text-text-muted uppercase font-semibold">{l.name}</p>
                      <p className={`text-base font-bold ${s === "danger" ? "text-danger" : s === "warn" ? "text-warning" : "text-text"}`}>{l.value}</p>
                      <p className="text-[8px] text-text-muted">{l.ref}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drug Table */}
            {protocol && (
              <div className="onc-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-bold text-text flex items-center gap-2">
                    <Beaker size={14} className="text-onc" />
                    รายการยา — {protocol.code}
                    {orderLines.length > 0 && <span className="text-xs text-text-muted font-normal">({orderLines.length})</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    {orderLines.length === 0 && (
                      <button onClick={handleAutoOrder} className="flex items-center gap-1.5 px-3 py-1.5 bg-onc text-white text-[11px] font-semibold rounded-lg hover:bg-onc/90">
                        <Zap size={12} /> Auto Order
                      </button>
                    )}
                    <button onClick={() => setShowAddDrug(true)} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-text-muted border border-border rounded-lg hover:bg-background-alt">
                      <Plus size={12} /> เพิ่มยา
                    </button>
                  </div>
                </div>

                {orderLines.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[9px] text-text-muted uppercase tracking-wider border-b border-border bg-background-alt/50">
                          <th className="px-3 py-2 text-center w-10">Seq</th>
                          <th className="px-2 py-2 text-left w-14">Type</th>
                          <th className="px-2 py-2 text-left">Drug</th>
                          <th className="px-2 py-2 text-left w-16">Route</th>
                          <th className="px-2 py-2 text-right w-16">Base</th>
                          <th className="px-2 py-2 text-center w-12">Method</th>
                          <th className="px-2 py-2 text-right w-14">Calc</th>
                          <th className="px-2 py-2 text-center w-10">Adj%</th>
                          <th className="px-2 py-2 text-right w-20">Final</th>
                          <th className="px-2 py-2 text-left w-20">Diluent</th>
                          <th className="px-2 py-2 w-16">Rate</th>
                          <th className="px-2 py-2 w-24">วันเริ่ม</th>
                          <th className="px-2 py-2 w-24">วันสุดท้าย</th>
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light text-[12px]">
                        {orderLines.map((d, i) => {
                          const cls = classColors[d.classification];
                          const ms = methodColors[d.method];
                          return (
                            <tr key={i} className={`${d.classification === "premedication" ? "bg-info-bg/20" : ""} ${!d.fromProtocol ? "bg-warning-bg/20" : ""} hover:bg-background-alt/30`}>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-text-muted text-[10px]">{d.classification === "premedication" ? "P" : d.seq}</span>
                                  {d.classification !== "premedication" && (
                                    <div className="flex flex-col leading-none">
                                      <button onClick={() => moveSeq(i, -1)} className="text-[7px] text-text-muted hover:text-text">▲</button>
                                      <button onClick={() => moveSeq(i, 1)} className="text-[7px] text-text-muted hover:text-text">▼</button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${cls.bg} ${cls.text}`}>{cls.label}</span>
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-semibold text-text">{d.name}</span>
                                {!d.fromProtocol && <span className="text-[8px] text-warning ml-1">(Manual)</span>}
                              </td>
                              <td className="px-2 py-2 text-text-muted text-[10px]">{d.route}</td>
                              <td className="px-2 py-2 text-right text-text-muted text-[10px]">{d.baseDose} {d.unit}</td>
                              <td className="px-2 py-2 text-center">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${ms.bg} ${ms.text}`}>{d.method}</span>
                              </td>
                              <td className="px-2 py-2 text-right text-text-muted">{d.calcDose}</td>
                              <td className="px-2 py-2 text-center">
                                {d.adjustPct !== 0 && (
                                  <span className={`text-[9px] font-bold ${d.adjustPct < 0 ? "text-danger" : "text-success"}`}>
                                    {d.adjustPct > 0 ? "+" : ""}{d.adjustPct}%
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <input type="number" value={d.finalDose} onChange={e => updateLine(i, "finalDose", Number(e.target.value))}
                                  className={`w-16 px-1.5 py-1 text-[12px] text-right border rounded font-bold focus:outline-none focus:border-onc ${
                                    d.edited ? "border-warning bg-warning-bg/30 text-warning" : "border-border bg-surface text-text"
                                  }`} />
                              </td>
                              <td className="px-2 py-2 text-[10px] text-text-muted">{d.diluent}</td>
                              <td className="px-2 py-2 text-[10px] text-text-muted">{d.rate}</td>
                              <td className="px-2 py-2">
                                <input type="date" value={d.startDate} onChange={e => updateLine(i, "startDate", e.target.value)}
                                  className="w-full px-1 py-0.5 text-[10px] border border-border rounded focus:outline-none focus:border-onc" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="date" value={d.endDate} onChange={e => updateLine(i, "endDate", e.target.value)}
                                  className="w-full px-1 py-0.5 text-[10px] border border-border rounded focus:outline-none focus:border-onc" />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button onClick={() => deleteLine(i)} className="p-1 rounded hover:bg-danger-bg text-text-muted hover:text-danger">
                                  <Trash2 size={11} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Zap size={28} className="text-border mx-auto mb-3" />
                    <p className="text-sm text-text-muted">กด <b>Auto Order</b> เพื่อดึงรายการยาจาก Protocol</p>
                    <p className="text-[10px] text-text-muted mt-1">หรือ "เพิ่มยา" เพื่อพิมพ์รายการยาเอง</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!protocol && (
              <div className="onc-card p-16 text-center">
                <Pill size={40} className="text-border mx-auto mb-4" />
                <p className="text-base font-semibold text-text-muted">เลือก Treatment Protocol ด้านซ้าย</p>
                <p className="text-sm text-text-muted mt-1">ระบบจะคำนวณ Dose อัตโนมัติ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Add Drug Modal ═══ */}
      {showAddDrug && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="onc-card-raised p-6 w-96">
            <h3 className="text-base font-bold text-text mb-2">เพิ่มยาด้วยตนเอง</h3>
            <p className="text-xs text-text-muted mb-4">หากยาไม่อยู่ใน Protocol ระบบจะเตือนยืนยัน</p>
            <input value={manualDrug} onChange={e => setManualDrug(e.target.value)}
              placeholder="พิมพ์ชื่อยา..." autoFocus
              onKeyDown={e => e.key === "Enter" && handleAddDrug()}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-onc mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowAddDrug(false)} className="flex-1 py-2 text-sm border border-border rounded-xl text-text-muted hover:bg-background-alt">ยกเลิก</button>
              <button onClick={handleAddDrug} className="flex-1 py-2 text-sm bg-onc text-white rounded-xl font-semibold hover:bg-onc/90">เพิ่ม</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PIN Modal — Ref: Spec §3.3 "non-intrusive modal" ═══ */}
      {showPin && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="onc-card-raised p-8 w-80">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-onc-bg rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-onc" />
              </div>
              <h3 className="text-base font-bold text-text">ยืนยันคำสั่งยา</h3>
              <p className="text-[11px] text-text-muted mt-1">กรอก PIN 4-6 หลัก</p>
              {pinError && <p className="text-xs text-danger font-semibold mt-2">PIN ไม่ถูกต้อง — ลองอีกครั้ง</p>}
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                  i < pin.length ? "border-onc bg-onc-bg text-onc scale-105" : "border-border"
                }`}>
                  {i < pin.length ? "●" : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k => (
                <button key={k} disabled={!k || pin.length === 6}
                  onClick={() => { if (k === "⌫") { setPin(p => p.slice(0,-1)); setPinError(false); } else if (pin.length < 6) setPin(p => p+k); }}
                  className={`h-11 rounded-xl text-sm font-medium transition-all active:scale-95 ${k ? "bg-background-alt hover:bg-border text-text" : "opacity-0 cursor-default"}`}>
                  {k}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowPin(false); setPin(""); setPinError(false); }}
              className="w-full py-2.5 text-sm border border-border rounded-xl text-text-muted hover:bg-background-alt">
              ยกเลิก
            </button>
            {pin.length === 6 && !pinError && (
              <div className="mt-3 flex items-center justify-center gap-2 text-onc text-xs font-semibold">
                <CheckCircle2 size={14} /> กำลังยืนยัน...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
