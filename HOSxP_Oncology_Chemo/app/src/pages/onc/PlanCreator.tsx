import { useState, useMemo } from "react";
import {
  Calendar, ChevronDown, Zap, Save, Trash2,
  CheckCircle2, Circle, Clock, AlertTriangle,
  Pill, User, Edit3, Printer, ArrowRight,
} from "lucide-react";

/* ══════════════════════════════════════════════
   Plan Creator — Treatment Schedule Generator
   Ref: Spec §3 "Plan Creator"
   Ref: อุดรธานี p.15 "Create Plan เพื่อให้ระบบสร้างวันให้ยา"
   Ref: Cytotoxic V8.0 p.10 "สร้างบัตรนัดฉีดยา"
   ──────────────────────────────────────────────
   1. Select regimen + start date + cycles
   2. Auto-generate schedule
   3. Editable date overrides
   4. Save plan
   ══════════════════════════════════════════════ */

/* ── Regimen data (shared structure) ── */
type Regimen = {
  id: string; code: string; name: string; cancer: string;
  cycleLengthDays: number; totalCycles: number; treatmentDays: number[];
  drugs: { name: string; classification: string }[];
};

const regimens: Regimen[] = [
  { id: "R001", code: "CAF", name: "CAF", cancer: "Breast Cancer", cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1],
    drugs: [{ name: "Cyclophosphamide", classification: "chemo" }, { name: "Doxorubicin", classification: "chemo" }, { name: "5-FU", classification: "chemo" }] },
  { id: "R002", code: "FOLFOX6", name: "FOLFOX6", cancer: "Colorectal Cancer", cycleLengthDays: 14, totalCycles: 12, treatmentDays: [1],
    drugs: [{ name: "Oxaliplatin", classification: "chemo" }, { name: "Leucovorin", classification: "chemo" }, { name: "5-FU", classification: "chemo" }] },
  { id: "R003", code: "GEM", name: "Gemcitabine", cancer: "Lung / Pancreas", cycleLengthDays: 28, totalCycles: 6, treatmentDays: [1, 8, 15],
    drugs: [{ name: "Gemcitabine", classification: "chemo" }] },
  { id: "R004", code: "CARBO-PAC", name: "Carboplatin/Paclitaxel", cancer: "Ovarian / NSCLC", cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1],
    drugs: [{ name: "Paclitaxel", classification: "chemo" }, { name: "Carboplatin", classification: "chemo" }] },
  { id: "R005", code: "BEP", name: "BEP", cancer: "Testicular GCT", cycleLengthDays: 21, totalCycles: 4, treatmentDays: [1, 2, 3, 4, 5, 8, 15],
    drugs: [{ name: "Bleomycin", classification: "chemo" }, { name: "Etoposide", classification: "chemo" }, { name: "Cisplatin", classification: "chemo" }] },
];

const mockPatient = {
  hn: "104558", name: "นาง คำปุ่น เสสาร", age: 55,
  diagnosis: "C50.9 — Breast Cancer", stage: "IIIA",
};

type PlanEntry = {
  id: string; cycle: number; day: number;
  date: string; // YYYY-MM-DD
  edited: boolean; skipped: boolean;
  status: "upcoming" | "today" | "completed";
};

/* ── Helpers ── */
const fmtInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtDisplay = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};

const fmtWeekday = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("th-TH", { weekday: "short" });
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const isWeekend = (s: string) => {
  const d = new Date(s).getDay();
  return d === 0 || d === 6;
};

const today = new Date();
const todayStr = fmtInput(today);

/* ══════════════════════════════════════════════ */
export default function PlanCreator() {
  const [selectedRegimen, setSelectedRegimen] = useState("");
  const [startDate, setStartDate] = useState(fmtInput(new Date(2026, 2, 23))); // 23 Mar 2026
  const [cycleOverride, setCycleOverride] = useState<number | null>(null);
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [saved, setSaved] = useState(false);

  const regimen = regimens.find(r => r.id === selectedRegimen);
  const totalCycles = cycleOverride ?? regimen?.totalCycles ?? 6;

  /* ── Generate Schedule — Ref: อุดรธานี "Create Plan" ── */
  function handleGenerate() {
    if (!regimen) return;
    const start = new Date(startDate);
    const plan: PlanEntry[] = [];
    let treatmentNo = 0;

    for (let c = 1; c <= totalCycles; c++) {
      for (const d of regimen.treatmentDays) {
        treatmentNo++;
        const offset = (c - 1) * regimen.cycleLengthDays + (d - 1);
        const date = addDays(start, offset);
        const dateStr = fmtInput(date);
        const isSameDay = dateStr === todayStr;
        plan.push({
          id: `${c}-${d}`,
          cycle: c, day: d,
          date: dateStr,
          edited: false, skipped: false,
          status: isSameDay ? "today" : date < today ? "completed" : "upcoming",
        });
      }
    }
    setEntries(plan);
    setSaved(false);
  }

  /* ── Edit date ── */
  function updateDate(id: string, newDate: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, date: newDate, edited: true } : e));
    setSaved(false);
  }

  /* ── Toggle skip ── */
  function toggleSkip(id: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, skipped: !e.skipped } : e));
    setSaved(false);
  }

  /* ── Delete entry ── */
  function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
    setSaved(false);
  }

  /* ── Save ── */
  function handleSave() {
    setSaved(true);
    // In production: POST to onc_treatment_plan + onc_cycle + onc_cycle_day
  }

  /* ── Stats ── */
  const stats = useMemo(() => {
    const active = entries.filter(e => !e.skipped);
    const weekendCount = active.filter(e => isWeekend(e.date)).length;
    const lastDate = active.length > 0 ? active[active.length - 1].date : "";
    return { total: active.length, weekendCount, lastDate };
  }, [entries]);

  return (
    <div className="flex h-full">
      {/* ═══ Left — Config Panel ═══ */}
      <div className="w-80 shrink-0 bg-surface border-r border-border flex flex-col overflow-y-auto">
        {/* Patient */}
        <div className="p-5 border-b border-border">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <User size={10} /> ผู้ป่วย
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-onc-bg flex items-center justify-center">
              <User size={16} className="text-onc" />
            </div>
            <div>
              <p className="text-sm font-bold text-text">{mockPatient.name}</p>
              <p className="text-xs text-text-muted">HN {mockPatient.hn} · {mockPatient.diagnosis}</p>
            </div>
          </div>
        </div>

        {/* Regimen selector */}
        <div className="p-5 border-b border-border">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Pill size={10} /> เลือก Regimen
          </p>
          <div className="relative mb-3">
            <select value={selectedRegimen} onChange={e => { setSelectedRegimen(e.target.value); setEntries([]); setCycleOverride(null); }}
              className="w-full appearance-none px-3 py-2.5 text-sm border border-border rounded-xl bg-background-alt pr-8 focus:outline-none focus:border-onc">
              <option value="">— เลือก Regimen —</option>
              {regimens.map(r => <option key={r.id} value={r.id}>{r.code} — {r.cancer}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
          </div>

          {regimen && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Protocol</span>
                <span className="font-semibold text-text">{regimen.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Cycle Length</span>
                <span className="font-semibold text-text">q{regimen.cycleLengthDays}d</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Treatment Days</span>
                <span className="font-semibold text-text">Day {regimen.treatmentDays.join(", ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Drugs</span>
                <span className="font-semibold text-text">{regimen.drugs.map(d => d.name).join(", ")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Schedule config */}
        {regimen && (
          <div className="p-5 border-b border-border">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Calendar size={10} /> ตั้งค่าตาราง
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-text-muted mb-1 block">วันที่เริ่มให้ยาครั้งแรก</label>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setEntries([]); }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted mb-1 block">จำนวน Cycle</label>
                <input type="number" value={totalCycles} min={1} max={24}
                  onChange={e => { setCycleOverride(Number(e.target.value)); setEntries([]); }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc" />
              </div>
              <button onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-onc text-white text-sm font-semibold rounded-xl hover:bg-onc/90 transition-colors shadow-md shadow-onc/20">
                <Zap size={14} /> Generate Schedule
              </button>
            </div>
          </div>
        )}

        {/* Summary stats */}
        {entries.length > 0 && (
          <div className="p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">สรุป</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">นัดทั้งหมด</span>
                <span className="font-bold text-text">{stats.total} นัด</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">เริ่ม</span>
                <span className="font-semibold text-text">{fmtDisplay(startDate)}</span>
              </div>
              {stats.lastDate && (
                <div className="flex justify-between">
                  <span className="text-text-muted">สิ้นสุด</span>
                  <span className="font-semibold text-text">{fmtDisplay(stats.lastDate)}</span>
                </div>
              )}
              {stats.weekendCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg onc-alert-warn text-[11px]">
                  <AlertTriangle size={11} />
                  มี {stats.weekendCount} นัดตรงกับวันหยุด (เสาร์-อาทิตย์)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Right — Schedule Table ═══ */}
      <div className="flex-1 overflow-y-auto p-6">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar size={48} className="text-border mx-auto mb-4" />
              <p className="text-sm font-semibold text-text-muted">
                {regimen ? 'กด "Generate Schedule" เพื่อสร้างตารางนัด' : "เลือก Regimen ด้านซ้ายเพื่อเริ่มต้น"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-text">Treatment Plan — {regimen?.code}</h1>
                <p className="text-sm text-text-muted mt-0.5">
                  {mockPatient.name} · HN {mockPatient.hn} · {stats.total} นัด · {fmtDisplay(startDate)} — {stats.lastDate && fmtDisplay(stats.lastDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-text-muted border border-border rounded-xl hover:bg-background-alt">
                  <Printer size={13} /> พิมพ์บัตรนัด
                </button>
                <button onClick={handleSave}
                  className={`flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                    saved
                      ? "bg-success text-white"
                      : "bg-onc text-white hover:bg-onc/90 shadow-md shadow-onc/20"
                  }`}>
                  {saved ? <><CheckCircle2 size={14} /> บันทึกแล้ว</> : <><Save size={14} /> บันทึก Plan</>}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="onc-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border bg-background-alt/50">
                    <th className="px-4 py-3 text-center w-14">Cycle</th>
                    <th className="px-3 py-3 text-center w-14">Day</th>
                    <th className="px-3 py-3 text-center w-14">ครั้งที่</th>
                    <th className="px-3 py-3 text-left">วันที่นัด</th>
                    <th className="px-3 py-3 text-center w-14">วัน</th>
                    <th className="px-3 py-3 text-center w-28">สถานะ</th>
                    <th className="px-3 py-3 text-center w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light text-sm">
                  {entries.map((entry, idx) => {
                    const weekend = isWeekend(entry.date);
                    return (
                      <tr key={entry.id} className={`transition-colors ${
                        entry.skipped ? "opacity-40 line-through" :
                        entry.status === "today" ? "bg-onc-bg/50" :
                        entry.status === "completed" ? "bg-success-bg/30" :
                        weekend ? "bg-warning-bg/30" : "hover:bg-background-alt/50"
                      }`}>
                        <td className="px-4 py-3 text-center font-bold text-text">{entry.cycle}</td>
                        <td className="px-3 py-3 text-center text-text-secondary">{entry.day}</td>
                        <td className="px-3 py-3 text-center font-semibold text-text">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <input type="date" value={entry.date}
                              onChange={e => updateDate(entry.id, e.target.value)}
                              className={`px-2 py-1 text-sm border rounded-lg focus:outline-none focus:border-onc ${
                                entry.edited ? "border-warning bg-warning-bg/30 font-semibold" : "border-border bg-surface"
                              }`} />
                            {entry.edited && (
                              <span className="text-[9px] font-semibold text-warning bg-warning-bg px-1.5 py-0.5 rounded">
                                <Edit3 size={8} className="inline mr-0.5" />แก้ไข
                              </span>
                            )}
                            {weekend && !entry.skipped && (
                              <span className="text-[9px] font-semibold text-warning bg-warning-bg px-1.5 py-0.5 rounded">
                                <AlertTriangle size={8} className="inline mr-0.5" />วันหยุด
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-text-muted">{fmtWeekday(entry.date)}</td>
                        <td className="px-3 py-3 text-center">
                          {entry.skipped ? (
                            <span className="text-[10px] font-semibold text-text-muted">Skipped</span>
                          ) : entry.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                              <CheckCircle2 size={11} /> เสร็จแล้ว
                            </span>
                          ) : entry.status === "today" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-onc">
                              <Clock size={11} /> วันนี้
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                              <Circle size={10} /> รอ
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => toggleSkip(entry.id)}
                              className={`p-1 rounded text-[10px] font-semibold transition-colors ${
                                entry.skipped ? "text-success hover:bg-success-bg" : "text-text-muted hover:bg-warning-bg hover:text-warning"
                              }`}
                              title={entry.skipped ? "Unskip" : "Skip"}>
                              {entry.skipped ? "Undo" : "Skip"}
                            </button>
                            <button onClick={() => deleteEntry(entry.id)}
                              className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-bg transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cycle summary cards */}
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: totalCycles }, (_, i) => i + 1).map(c => {
                const cycleEntries = entries.filter(e => e.cycle === c && !e.skipped);
                const firstDate = cycleEntries[0]?.date;
                const allDone = cycleEntries.every(e => e.status === "completed");
                const isCurrent = cycleEntries.some(e => e.status === "today");
                return (
                  <div key={c} className={`onc-card px-3 py-2.5 text-center ${
                    isCurrent ? "ring-2 ring-onc/30 bg-onc-bg" :
                    allDone ? "bg-success-bg/30" : ""
                  }`}>
                    <p className={`text-lg font-black ${isCurrent ? "text-onc" : allDone ? "text-success" : "text-text"}`}>C{c}</p>
                    <p className="text-[9px] text-text-muted">{cycleEntries.length} days</p>
                    {firstDate && <p className="text-[9px] text-text-muted mt-0.5">{fmtDisplay(firstDate)}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
