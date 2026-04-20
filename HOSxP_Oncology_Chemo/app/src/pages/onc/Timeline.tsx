import { useState } from "react";
import {
  Clock, User, Stethoscope, Shield, Beaker, Syringe,
  CheckCircle2, FileText, AlertTriangle, Activity,
  ChevronRight, Filter, Calendar, Pill, XCircle,
  Search, ArrowRight,
} from "lucide-react";

/* ══════════════════════════════════════════════
   Treatment Timeline
   Ref: Spec §Feature 9.4 — Audit trail, treatment history
   Ref: Cytotoxic V8.0 p.19-20 — S/E, SOAP, Planning
   ──────────────────────────────────────────────
   3 Tabs:
   1. Timeline (Audit Trail) — chronological events
   2. Treatment History — all past chemo administrations
   3. Side Effects — adverse events by cycle
   ══════════════════════════════════════════════ */

type EventType = "register" | "order" | "lab" | "verify" | "compound" | "administer" | "complete" | "cancel" | "adjust";
type TabKey = "timeline" | "history" | "sideeffects";

type TimelineEvent = {
  id: string;
  datetime: string;
  type: EventType;
  actor: string;
  role: string;
  action: string;
  detail: string;
  highlight?: boolean;
};

type TreatmentRecord = {
  date: string;
  protocol: string;
  cycle: number;
  day: number;
  drug: string;
  dose: string;
  route: string;
  status: "เสร็จสิ้น" | "กำลังให้ยา" | "รอ" | "Hold" | "ยกเลิก";
};

type SideEffect = {
  date: string;
  cycle: number;
  event: string;
  grade: 1 | 2 | 3 | 4;
  detail: string;
  management: string;
  drug: string;
};

/* ── Mock data ── */
const mockPatient = {
  hn: "104558", name: "นาง คำปุ่น เสสาร", age: 55,
  diagnosis: "C50.9 — Breast Cancer", protocol: "CAF",
  currentCycle: 3, totalCycles: 6,
};

const mockEvents: TimelineEvent[] = [
  { id: "E01", datetime: "16/03/69 07:30", type: "register", actor: "พว.สุวรรณี", role: "พยาบาล", action: "ลงทะเบียนผู้ป่วย", detail: "ชั่งน้ำหนัก 48 kg, ส่วนสูง 146 cm, BSA 1.40" },
  { id: "E02", datetime: "16/03/69 07:45", type: "lab", actor: "ระบบ LIS", role: "ระบบ", action: "รับผล Lab", detail: "ANC 2.1, PLT 185, Hb 11.2, Cr 0.8 — ผ่านเกณฑ์ทั้งหมด" },
  { id: "E03", datetime: "16/03/69 08:15", type: "order", actor: "นพ.สมชาย", role: "แพทย์", action: "สั่งยาเคมี CAF C3D1", detail: "Cyclophosphamide 700 mg, Doxorubicin 70 mg, 5-FU 700 mg · Submit + PIN", highlight: true },
  { id: "E04", datetime: "16/03/69 08:30", type: "verify", actor: "ภก.วิไล", role: "เภสัชกร", action: "ตรวจสอบคำสั่ง — Verified", detail: "ขนาดยาถูกต้อง · ไม่มีการปรับ dose · PIN verified" },
  { id: "E05", datetime: "16/03/69 09:00", type: "compound", actor: "ชนม์", role: "เจ้าหน้าที่เตรียมยา", action: "เตรียมยาเสร็จ", detail: "Lot: CY-2026031, DOX-2026028, FU-2026015 · Waste: Doxorubicin 5 mg" },
  { id: "E06", datetime: "16/03/69 09:30", type: "administer", actor: "พว.อรุณ", role: "พยาบาล", action: "เริ่มให้ยา Ondansetron", detail: "IV 15 min · Start 09:30" },
  { id: "E07", datetime: "16/03/69 09:45", type: "administer", actor: "พว.อรุณ", role: "พยาบาล", action: "เริ่มให้ยา Cyclophosphamide", detail: "IV Infusion 30 min · Start 09:45" },
  { id: "E08", datetime: "16/03/69 10:15", type: "administer", actor: "พว.อรุณ", role: "พยาบาล", action: "เริ่มให้ยา Doxorubicin", detail: "IV Push · Start 10:15" },
  { id: "E09", datetime: "16/03/69 10:20", type: "administer", actor: "พว.อรุณ", role: "พยาบาล", action: "เริ่มให้ยา 5-FU", detail: "IV Infusion 4 hr · Start 10:20" },
  { id: "E10", datetime: "16/03/69 14:20", type: "complete", actor: "พว.อรุณ", role: "พยาบาล", action: "ให้ยาครบทุกรายการ", detail: "ไม่พบอาการไม่พึงประสงค์ · PIN confirmed", highlight: true },
];

const mockHistory: TreatmentRecord[] = [
  { date: "02/02/69", protocol: "CAF", cycle: 1, day: 1, drug: "Cyclophosphamide", dose: "700 mg", route: "IV Infusion", status: "เสร็จสิ้น" },
  { date: "02/02/69", protocol: "CAF", cycle: 1, day: 1, drug: "Doxorubicin", dose: "70 mg", route: "IV Push", status: "เสร็จสิ้น" },
  { date: "02/02/69", protocol: "CAF", cycle: 1, day: 1, drug: "5-FU", dose: "700 mg", route: "IV Infusion", status: "เสร็จสิ้น" },
  { date: "23/02/69", protocol: "CAF", cycle: 2, day: 1, drug: "Cyclophosphamide", dose: "700 mg", route: "IV Infusion", status: "เสร็จสิ้น" },
  { date: "23/02/69", protocol: "CAF", cycle: 2, day: 1, drug: "Doxorubicin", dose: "70 mg", route: "IV Push", status: "เสร็จสิ้น" },
  { date: "23/02/69", protocol: "CAF", cycle: 2, day: 1, drug: "5-FU", dose: "700 mg", route: "IV Infusion", status: "เสร็จสิ้น" },
  { date: "16/03/69", protocol: "CAF", cycle: 3, day: 1, drug: "Cyclophosphamide", dose: "700 mg", route: "IV Infusion", status: "เสร็จสิ้น" },
  { date: "16/03/69", protocol: "CAF", cycle: 3, day: 1, drug: "Doxorubicin", dose: "70 mg", route: "IV Push", status: "เสร็จสิ้น" },
  { date: "16/03/69", protocol: "CAF", cycle: 3, day: 1, drug: "5-FU", dose: "700 mg", route: "IV Infusion", status: "เสร็จสิ้น" },
];

const mockSideEffects: SideEffect[] = [
  { date: "08/02/69", cycle: 1, event: "Nausea/Vomiting", grade: 2, detail: "คลื่นไส้อาเจียน 3 ครั้ง/วัน หลังให้ยา 2 วัน", management: "Ondansetron 8 mg PO q8h × 3 days", drug: "CAF" },
  { date: "10/02/69", cycle: 1, event: "Neutropenia", grade: 1, detail: "ANC 1.3 — follow-up lab วันที่ 15", management: "เฝ้าระวัง ไม่ต้อง G-CSF", drug: "CAF" },
  { date: "01/03/69", cycle: 2, event: "Alopecia", grade: 2, detail: "ผมร่วงทั่วศีรษะ", management: "ให้คำปรึกษา + แนะนำวิก", drug: "Doxorubicin" },
  { date: "02/03/69", cycle: 2, event: "Fatigue", grade: 1, detail: "อ่อนเพลีย 1 สัปดาห์หลังให้ยา", management: "พักผ่อน กิจกรรมเบาๆ", drug: "CAF" },
  { date: "18/03/69", cycle: 3, event: "Mucositis", grade: 1, detail: "แผลในปาก เล็กน้อย", management: "บ้วนปาก Benzydamine", drug: "5-FU" },
];

/* ── Event icon/color mapping ── */
const eventStyle: Record<EventType, { icon: React.ElementType; color: string; bg: string }> = {
  register: { icon: User, color: "text-info", bg: "bg-info-bg" },
  order: { icon: Syringe, color: "text-primary", bg: "bg-primary-light" },
  lab: { icon: FileText, color: "text-text-muted", bg: "bg-background-alt" },
  verify: { icon: Shield, color: "text-onc", bg: "bg-onc-bg" },
  compound: { icon: Beaker, color: "text-warning", bg: "bg-warning-bg" },
  administer: { icon: Stethoscope, color: "text-success", bg: "bg-success-bg" },
  complete: { icon: CheckCircle2, color: "text-success", bg: "bg-success-bg" },
  cancel: { icon: XCircle, color: "text-danger", bg: "bg-danger-bg" },
  adjust: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning-bg" },
};

const statusStyle: Record<string, string> = {
  "เสร็จสิ้น": "bg-success-bg text-success",
  "กำลังให้ยา": "bg-onc-bg text-onc",
  "รอ": "bg-background-alt text-text-muted",
  "Hold": "bg-warning-bg text-warning",
  "ยกเลิก": "bg-danger-bg text-danger",
};

const gradeStyle: Record<number, { label: string; color: string }> = {
  1: { label: "Grade 1 — Mild", color: "bg-info-bg text-info" },
  2: { label: "Grade 2 — Moderate", color: "bg-warning-bg text-warning" },
  3: { label: "Grade 3 — Severe", color: "bg-danger-bg text-danger" },
  4: { label: "Grade 4 — Life-threatening", color: "bg-danger text-white" },
};

/* ══════════════════════════════════════════════ */
export default function Timeline() {
  const [tab, setTab] = useState<TabKey>("timeline");
  const [filterType, setFilterType] = useState<EventType | "ALL">("ALL");
  const [searchHistory, setSearchHistory] = useState("");

  const filteredEvents = filterType === "ALL"
    ? mockEvents
    : mockEvents.filter(e => e.type === filterType);

  const filteredHistory = mockHistory.filter(r =>
    !searchHistory || r.drug.toLowerCase().includes(searchHistory.toLowerCase()) || r.date.includes(searchHistory)
  );

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "timeline", label: "Audit Trail", icon: Clock },
    { key: "history", label: "ประวัติการให้ยา", icon: Pill },
    { key: "sideeffects", label: "Side Effects", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Patient header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-onc-bg flex items-center justify-center">
            <User size={16} className="text-onc" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">{mockPatient.name}</h1>
            <p className="text-xs text-text-muted">
              HN {mockPatient.hn} · {mockPatient.diagnosis} · {mockPatient.protocol} C{mockPatient.currentCycle}/{mockPatient.totalCycles}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background-alt p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab 1: Audit Trail ═══ */}
      {tab === "timeline" && (
        <div className="space-y-4">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-text-muted" />
            {(["ALL", "order", "verify", "compound", "administer", "complete", "lab"] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  filterType === f ? "bg-onc text-white" : "bg-background-alt text-text-muted hover:text-text"
                }`}>
                {f === "ALL" ? "ทั้งหมด" : f}
              </button>
            ))}
          </div>

          {/* Timeline vertical */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-1">
              {filteredEvents.map((evt) => {
                const es = eventStyle[evt.type];
                const Icon = es.icon;
                return (
                  <div key={evt.id} className={`relative flex gap-4 pl-12 py-3 rounded-xl transition-all ${
                    evt.highlight ? "bg-onc-bg/30" : "hover:bg-background-alt/50"
                  }`}>
                    {/* Node */}
                    <div className={`absolute left-2 w-7 h-7 rounded-xl flex items-center justify-center ${es.bg} ring-2 ring-surface`}>
                      <Icon size={13} className={es.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-text-muted font-mono">{evt.datetime}</span>
                        <span className="text-[10px] font-semibold text-text-secondary">{evt.actor}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-background-alt text-text-muted">{evt.role}</span>
                      </div>
                      <p className="text-sm font-semibold text-text">{evt.action}</p>
                      <p className="text-xs text-text-muted mt-0.5">{evt.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab 2: Treatment History ═══ */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-background-alt rounded-xl flex-1 max-w-sm">
              <Search size={13} className="text-text-muted" />
              <input value={searchHistory} onChange={e => setSearchHistory(e.target.value)}
                placeholder="ค้นหายา / วันที่..."
                className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <span className="text-xs text-text-muted">{filteredHistory.length} records</span>
          </div>

          <div className="onc-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border bg-background-alt/50">
                  <th className="px-4 py-2.5 text-left">วันที่</th>
                  <th className="px-3 py-2.5 text-left">Protocol</th>
                  <th className="px-3 py-2.5 text-center">Cycle</th>
                  <th className="px-3 py-2.5 text-center">Day</th>
                  <th className="px-3 py-2.5 text-left">ชื่อยา</th>
                  <th className="px-3 py-2.5 text-right">Dose</th>
                  <th className="px-3 py-2.5 text-left">Route</th>
                  <th className="px-3 py-2.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-sm">
                {filteredHistory.map((r, i) => (
                  <tr key={i} className="hover:bg-background-alt/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-text-muted">{r.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-onc text-xs">{r.protocol}</td>
                    <td className="px-3 py-2.5 text-center text-text">{r.cycle}</td>
                    <td className="px-3 py-2.5 text-center text-text-muted">{r.day}</td>
                    <td className="px-3 py-2.5 font-semibold text-text">{r.drug}</td>
                    <td className="px-3 py-2.5 text-right text-text">{r.dose}</td>
                    <td className="px-3 py-2.5 text-xs text-text-muted">{r.route}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${statusStyle[r.status] ?? "bg-background-alt text-text-muted"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cumulative summary */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Cumulative Dose Summary</p>
            <div className="grid grid-cols-3 gap-4">
              {["Cyclophosphamide", "Doxorubicin", "5-FU"].map(drug => {
                const records = filteredHistory.filter(r => r.drug === drug && r.status === "เสร็จสิ้น");
                const totalMg = records.reduce((sum, r) => sum + parseFloat(r.dose), 0);
                return (
                  <div key={drug} className="text-center">
                    <p className="text-xs font-semibold text-text">{drug}</p>
                    <p className="text-2xl font-black text-onc mt-1">{totalMg.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted">mg total · {records.length} doses</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab 3: Side Effects ═══ */}
      {tab === "sideeffects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{mockSideEffects.length} events recorded</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(g => (
                <span key={g} className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${gradeStyle[g].color}`}>
                  G{g}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {mockSideEffects.map((se, i) => {
              const gs = gradeStyle[se.grade];
              return (
                <div key={i} className="onc-card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center">
                        <AlertTriangle size={16} className="text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{se.event}</p>
                        <p className="text-[10px] text-text-muted">Cycle {se.cycle} · {se.date} · จากยา {se.drug}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${gs.color}`}>
                      {gs.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">รายละเอียด</p>
                      <p className="text-xs text-text-secondary">{se.detail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">การจัดการ</p>
                      <p className="text-xs text-text-secondary">{se.management}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side effect summary by grade */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Summary by Grade</p>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(g => {
                const count = mockSideEffects.filter(s => s.grade === g).length;
                const gs = gradeStyle[g];
                return (
                  <div key={g} className="flex-1 text-center">
                    <p className={`text-2xl font-black ${count > 0 ? gs.color.split(" ")[1] : "text-text-muted"}`}>{count}</p>
                    <p className="text-[10px] text-text-muted">Grade {g}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
