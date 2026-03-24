import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User, AlertTriangle, Heart, Shield, Activity,
  Weight, Ruler, Calculator, FileText, Calendar,
  ChevronRight, Search, Clock, Pill, Syringe,
  CheckCircle2, Circle, ArrowRight, TrendingUp,
  Beaker, Stethoscope,
} from "lucide-react";

/* ══════════════════════════════════════════════
   Patient Summary — "Cockpit" View
   Ref: Spec §3.1 — Single-screen cockpit for HN
   ──────────────────────────────────────────────
   Sections:
   1. Identity Header (HN, name, age, allergy)
   2. Cancer Profile (ICD-10, TNM, ECOG)
   3. Treatment Timeline (past/current/upcoming)
   4. Vital Anthropometrics (Wt, Ht, BSA)
   5. Lab Snapshot (ANC, PLT, Hb, Cr, LFTs)
   ══════════════════════════════════════════════ */

/* ── Mock Data ── */
const mockPatients = [
  {
    hn: "104558", name: "นาง คำปุ่น เสสาร", age: 55, gender: "หญิง",
    dob: "15/01/2512", bloodType: "O+",
    allergy: "Penicillin", allergyLevel: "severe" as const,
    diagnosis: "Breast Cancer", icd10: "C50.9",
    morphology: "Invasive ductal carcinoma, NOS",
    t: "3", n: "1", m: "0", stage: "IIIA", ecog: 1,
    her2: "Positive", er: "Positive", pr: "Negative",
    weight: 48, height: 146, bsa: 1.40,
    creatinine: 0.8, crcl: 72,
    doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด",
    regimen: "CAF", currentCycle: 3, totalCycles: 6,
  },
];

type LabItem = {
  name: string; value: number; unit: string;
  refLow?: number; refHigh?: number;
  threshold?: number; direction: "above" | "below";
  date: string;
};

const mockLabs: LabItem[] = [
  { name: "ANC", value: 2.1, unit: "×10⁹/L", threshold: 1.5, direction: "above", date: "2026-03-21" },
  { name: "PLT", value: 185, unit: "×10⁹/L", threshold: 100, direction: "above", date: "2026-03-21" },
  { name: "Hb", value: 11.2, unit: "g/dL", threshold: 8.0, direction: "above", date: "2026-03-21" },
  { name: "Cr", value: 0.8, unit: "mg/dL", threshold: 1.5, direction: "below", date: "2026-03-21" },
  { name: "ALT", value: 28, unit: "U/L", refHigh: 40, direction: "below", date: "2026-03-21" },
  { name: "AST", value: 24, unit: "U/L", refHigh: 40, direction: "below", date: "2026-03-21" },
  { name: "T.Bili", value: 0.6, unit: "mg/dL", threshold: 1.5, direction: "below", date: "2026-03-21" },
  { name: "eGFR", value: 72, unit: "mL/min", threshold: 60, direction: "above", date: "2026-03-21" },
];

type TimelineEvent = {
  cycle: number; day: number; date: string;
  status: "completed" | "current" | "upcoming" | "skipped";
  label: string; type: "chemo" | "lab" | "consult" | "surgery";
};

const mockTimeline: TimelineEvent[] = [
  { cycle: 1, day: 1, date: "02/02/69", status: "completed", label: "CAF C1D1", type: "chemo" },
  { cycle: 1, day: 0, date: "15/02/69", status: "completed", label: "Follow-up Lab", type: "lab" },
  { cycle: 2, day: 1, date: "23/02/69", status: "completed", label: "CAF C2D1", type: "chemo" },
  { cycle: 2, day: 0, date: "08/03/69", status: "completed", label: "Follow-up Lab", type: "lab" },
  { cycle: 3, day: 1, date: "16/03/69", status: "current", label: "CAF C3D1", type: "chemo" },
  { cycle: 4, day: 1, date: "06/04/69", status: "upcoming", label: "CAF C4D1", type: "chemo" },
  { cycle: 5, day: 1, date: "27/04/69", status: "upcoming", label: "CAF C5D1", type: "chemo" },
  { cycle: 6, day: 1, date: "18/05/69", status: "upcoming", label: "CAF C6D1", type: "chemo" },
];

const cumulativeDose = [
  { drug: "Doxorubicin", total: 132, max: 770, unit: "mg", maxPerM2: 550 },
  { drug: "Cyclophosphamide", total: 2100, max: 0, unit: "mg", maxPerM2: 0 },
  { drug: "5-FU", total: 2100, max: 0, unit: "mg", maxPerM2: 0 },
];

/* ── Helpers ── */
function labStatus(lab: LabItem): "safe" | "warn" | "danger" {
  if (lab.threshold) {
    if (lab.direction === "above" && lab.value < lab.threshold) return lab.value < lab.threshold * 0.7 ? "danger" : "warn";
    if (lab.direction === "below" && lab.value > lab.threshold) return lab.value > lab.threshold * 1.3 ? "danger" : "warn";
  }
  return "safe";
}

function labColor(s: "safe" | "warn" | "danger") {
  return s === "danger" ? "text-danger" : s === "warn" ? "text-warning" : "text-text";
}

function labBg(s: "safe" | "warn" | "danger") {
  return s === "danger" ? "bg-danger-bg ring-1 ring-danger/20" : s === "warn" ? "bg-warning-bg ring-1 ring-warning/20" : "bg-background-alt";
}

const timelineIcon = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "chemo": return Syringe;
    case "lab": return FileText;
    case "consult": return Stethoscope;
    case "surgery": return Activity;
  }
};

const statusColor = (s: TimelineEvent["status"]) => {
  switch (s) {
    case "completed": return { bg: "bg-success/10", text: "text-success", ring: "ring-success/30" };
    case "current": return { bg: "bg-onc-bg", text: "text-onc", ring: "ring-onc/30" };
    case "upcoming": return { bg: "bg-background-alt", text: "text-text-muted", ring: "ring-border" };
    case "skipped": return { bg: "bg-danger-bg", text: "text-danger", ring: "ring-danger/20" };
  }
};

function calcBSA(wt: number, ht: number) {
  return Math.round(0.007184 * Math.pow(wt, 0.425) * Math.pow(ht, 0.725) * 100) / 100;
}

/* ══════════════════════════════════════════════ */
export default function PatientSummary() {
  const navigate = useNavigate();
  const [searchHN, setSearchHN] = useState("104558");
  const pt = mockPatients.find(p => p.hn === searchHN) ?? mockPatients[0];

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">

      {/* ── HN Search ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 onc-card flex-1 max-w-sm">
          <Search size={14} className="text-text-muted" />
          <input value={searchHN} onChange={e => setSearchHN(e.target.value)}
            placeholder="ค้นหา HN..."
            className="bg-transparent outline-none text-sm flex-1 text-text" />
        </div>
        <button onClick={() => setSearchHN(searchHN)}
          className="px-5 py-2.5 bg-onc text-white text-sm font-semibold rounded-xl hover:bg-onc/90 transition-colors">
          ค้นหา
        </button>
      </div>

      {/* ══════════ Row 1: Identity + Cancer Profile ══════════ */}
      <div className="grid grid-cols-12 gap-4">

        {/* 1. Identity Header — Ref: Spec §3.1 "HN, name, age, gender, allergy" */}
        <div className="col-span-5 onc-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-onc-bg flex items-center justify-center shrink-0">
              <User size={24} className="text-onc" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text leading-tight">{pt.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono bg-background-alt px-2 py-0.5 rounded-md text-text-secondary">HN {pt.hn}</span>
                <span className="text-xs text-text-muted">{pt.age} ปี · {pt.gender}</span>
                <span className="text-xs text-text-muted">DOB {pt.dob}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-md font-medium">
                  {pt.bloodType}
                </span>
                <span className="text-xs text-text-muted">แพทย์: {pt.doctor}</span>
              </div>
            </div>
          </div>

          {/* Allergy — high visibility, ref: spec "high-visibility Allergy Status" */}
          {pt.allergy && pt.allergy !== "—" && (
            <div className="mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl onc-alert-danger">
              <AlertTriangle size={16} className="text-danger shrink-0" />
              <div>
                <p className="text-xs font-bold">แพ้ยา: {pt.allergy}</p>
                <p className="text-[10px] opacity-70">Severity: {pt.allergyLevel}</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Cancer Profile — Ref: Spec §3.1 "Primary site, morphology, TNM, ECOG" */}
        <div className="col-span-4 onc-card p-5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Shield size={10} /> Cancer Profile
          </p>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-text-muted">Diagnosis (ICD-10)</p>
              <p className="text-sm font-bold text-text">{pt.icd10} — {pt.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Morphology</p>
              <p className="text-sm text-text-secondary">{pt.morphology}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">TNM Staging</p>
                <div className="flex gap-1">
                  {[
                    { k: "T", v: pt.t },
                    { k: "N", v: pt.n },
                    { k: "M", v: pt.m },
                  ].map(s => (
                    <span key={s.k} className="text-xs font-bold px-2 py-1 rounded-lg bg-navy/5 text-navy">
                      {s.k}{s.v}
                    </span>
                  ))}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-onc-bg text-onc">
                    Stage {pt.stage}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">ECOG PS</p>
                <span className="text-lg font-black text-text">{pt.ecog}</span>
              </div>
            </div>
            {/* Biomarkers */}
            <div className="flex gap-2 pt-1">
              {[
                { k: "HER2", v: pt.her2 },
                { k: "ER", v: pt.er },
                { k: "PR", v: pt.pr },
              ].map(b => (
                <span key={b.k} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  b.v === "Positive" ? "bg-success-bg text-success" : "bg-background-alt text-text-muted"
                }`}>
                  {b.k}: {b.v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Anthropometrics — Ref: Spec §3.1 "most recent weight and height" */}
        <div className="col-span-3 onc-card p-5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Calculator size={10} /> Anthropometrics
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Weight size={13} />
                <span className="text-xs">น้ำหนัก</span>
              </div>
              <span className="text-lg font-bold text-text">{pt.weight} <span className="text-xs font-normal text-text-muted">kg</span></span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Ruler size={13} />
                <span className="text-xs">ส่วนสูง</span>
              </div>
              <span className="text-lg font-bold text-text">{pt.height} <span className="text-xs font-normal text-text-muted">cm</span></span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-onc">
                  <Calculator size={13} />
                  <span className="text-xs font-semibold">BSA (DuBois)</span>
                </div>
                <span className="text-xl font-black text-onc">{pt.bsa} <span className="text-xs font-normal">m²</span></span>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                Verify: 0.007184 × {pt.weight}^0.425 × {pt.height}^0.725 = {calcBSA(pt.weight, pt.height)}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-text-muted">Cr / CrCl</span>
              <span className="text-sm font-semibold text-text">{pt.creatinine} / {pt.crcl} <span className="text-xs font-normal text-text-muted">mL/min</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ Row 2: Labs + Regimen + Cumulative ══════════ */}
      <div className="grid grid-cols-12 gap-4">

        {/* 5. Lab Snapshot — Ref: Spec §3.1 "Lab Snapshot with color-coded status" */}
        <div className="col-span-7 onc-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={10} /> Lab Snapshot
            </p>
            <span className="text-[10px] text-text-muted">
              {mockLabs[0].date} · {isStale(mockLabs[0].date) ? <span className="text-danger font-bold">เก่าเกิน 3 วัน</span> : "ล่าสุด"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {mockLabs.map(lab => {
              const s = labStatus(lab);
              return (
                <div key={lab.name} className={`rounded-xl px-3 py-3 text-center ${labBg(s)}`}>
                  <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">{lab.name}</p>
                  <p className={`text-xl font-bold mt-0.5 ${labColor(s)}`}>{lab.value}</p>
                  <p className="text-[10px] text-text-muted">{lab.unit}</p>
                  {lab.threshold && (
                    <p className="text-[9px] text-text-muted mt-0.5">
                      {lab.direction === "above" ? "≥" : "≤"} {lab.threshold}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Regimen + Cumulative */}
        <div className="col-span-5 space-y-4">
          {/* Active Regimen */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Pill size={10} /> Active Regimen
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-text">{pt.regimen}</p>
                <p className="text-xs text-text-muted">{pt.diagnosis} · q21d</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-onc">{pt.currentCycle}<span className="text-sm font-normal text-text-muted">/{pt.totalCycles}</span></p>
                <p className="text-[10px] text-text-muted">Cycle</p>
              </div>
            </div>
            {/* Cycle pills */}
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: pt.totalCycles }, (_, i) => i + 1).map(c => (
                <div key={c} className={`flex-1 h-2 rounded-full ${
                  c < pt.currentCycle ? "bg-success" :
                  c === pt.currentCycle ? "bg-onc" :
                  "bg-border"
                }`} />
              ))}
            </div>
          </div>

          {/* Cumulative Dose — Ref: Spec "cumulative dose tracking" */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp size={10} /> Cumulative Dose
            </p>
            <div className="space-y-2.5">
              {cumulativeDose.filter(d => d.maxPerM2 > 0).map(d => {
                const pct = Math.round((d.total / d.max) * 100);
                return (
                  <div key={d.drug}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text">{d.drug}</span>
                      <span className="text-xs text-text-muted">{d.total}/{d.max} {d.unit} ({pct}%)</span>
                    </div>
                    <div className="bg-border rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        pct >= 80 ? "bg-danger" : pct >= 60 ? "bg-warning" : "bg-onc"
                      }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ Row 3: Treatment Timeline ══════════ */}
      {/* Ref: Spec §3.1 "Treatment Timeline — longitudinal visual path" */}
      <div className="onc-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={10} /> Treatment Timeline
          </p>
          <div className="flex items-center gap-3 text-[10px]">
            {[
              { label: "Completed", color: "bg-success" },
              { label: "Current", color: "bg-onc" },
              { label: "Upcoming", color: "bg-border" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1 text-text-muted">
                <span className={`w-2 h-2 rounded-full ${l.color}`} /> {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Horizontal timeline */}
        <div className="relative">
          {/* Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />

          <div className="flex items-start gap-1 overflow-x-auto pb-2">
            {mockTimeline.map((evt, i) => {
              const sc = statusColor(evt.status);
              const Icon = timelineIcon(evt.type);
              return (
                <div key={i} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 88 }}>
                  {/* Node */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center ring-2 ${sc.bg} ${sc.ring}`}>
                    {evt.status === "completed" ? (
                      <CheckCircle2 size={16} className={sc.text} />
                    ) : evt.status === "current" ? (
                      <Icon size={16} className={sc.text} />
                    ) : (
                      <Circle size={14} className={sc.text} />
                    )}
                  </div>
                  {/* Label */}
                  <p className={`text-[10px] font-semibold mt-2 ${sc.text}`}>{evt.label}</p>
                  <p className="text-[9px] text-text-muted">{evt.date}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/onc/order-entry")}
          className="flex items-center gap-2 px-5 py-3 bg-onc text-white text-sm font-semibold rounded-xl hover:bg-onc/90 transition-all shadow-lg shadow-onc/20">
          <Syringe size={15} /> สั่งยา (CPOE) <ArrowRight size={14} />
        </button>
        <button onClick={() => navigate("/onc/compounding")}
          className="flex items-center gap-2 px-5 py-3 onc-card text-sm font-semibold text-text hover:bg-background-alt transition-all">
          <Beaker size={15} className="text-onc" /> Working Formula
        </button>
        <button onClick={() => navigate("/onc/plan")}
          className="flex items-center gap-2 px-5 py-3 onc-card text-sm font-semibold text-text hover:bg-background-alt transition-all">
          <Calendar size={15} className="text-onc" /> สร้าง Plan
        </button>
      </div>
    </div>
  );
}

/* Check lab staleness (>3 days) */
function isStale(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) > 3;
}
