import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity, Users, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Syringe, Beaker, Shield, Stethoscope,
  TrendingUp, Calendar, ChevronRight, Search, Filter,
} from "lucide-react";
import { useOnc, roleLabels, roleEnglish } from "../../components/onc/OncContext";

/* ══════════════════════════════════════════════
   Dashboard — Overview / Pipeline Status
   Ref: Spec §Feature 8
   ──────────────────────────────────────────────
   - Pipeline status counts (5 stages)
   - Today's stats
   - Patient queue cards
   - Alerts / longest wait
   ══════════════════════════════════════════════ */

type PipelineStage = "DRAFT" | "SUBMITTED" | "VERIFIED" | "PREPARED" | "ADMINISTERED";

type QueuePatient = {
  id: string; hn: string; name: string; age: number;
  protocol: string; cycle: number; day: number;
  status: PipelineStage; ward: string; appointmentDate: string;
  warn: boolean; warnMsg?: string;
};

const mockQueue: QueuePatient[] = [
  { id: "Q1", hn: "104558", name: "นาง คำปุ่น เสสาร", age: 55, protocol: "CAF", cycle: 3, day: 1, status: "DRAFT", ward: "OPD เคมีบำบัด", appointmentDate: "23/03/69", warn: false },
  { id: "Q2", hn: "1234567", name: "นางสาวมาลี สุขใจ", age: 52, protocol: "AC-T", cycle: 2, day: 1, status: "SUBMITTED", ward: "OPD เคมีบำบัด", appointmentDate: "23/03/69", warn: true, warnMsg: "ANC 1.3 — ใกล้เกณฑ์" },
  { id: "Q3", hn: "5556677", name: "นายบุญมี ดีใจ", age: 68, protocol: "FOLFOX6", cycle: 5, day: 1, status: "SUBMITTED", ward: "หอผู้ป่วย 4A", appointmentDate: "23/03/69", warn: false },
  { id: "Q4", hn: "7788990", name: "นางเพ็ญ ใจสว่าง", age: 61, protocol: "CARBO-PAC", cycle: 1, day: 1, status: "VERIFIED", ward: "OPD เคมีบำบัด", appointmentDate: "23/03/69", warn: false },
  { id: "Q5", hn: "2233445", name: "นายสมศักดิ์ ชัยมงคล", age: 72, protocol: "GEM", cycle: 4, day: 8, status: "VERIFIED", ward: "OPD เคมีบำบัด", appointmentDate: "23/03/69", warn: true, warnMsg: "Cr 1.4 — ใกล้เกณฑ์" },
  { id: "Q6", hn: "8899001", name: "นายอุดม พัฒนา", age: 45, protocol: "R-CHOP", cycle: 2, day: 1, status: "PREPARED", ward: "หอผู้ป่วย 4A", appointmentDate: "23/03/69", warn: false },
  { id: "Q7", hn: "3344556", name: "นางอรุณ เรืองศรี", age: 59, protocol: "CAF", cycle: 5, day: 1, status: "PREPARED", ward: "OPD เคมีบำบัด", appointmentDate: "23/03/69", warn: false },
  { id: "Q8", hn: "6677889", name: "นายสุรชัย วงศ์วาน", age: 63, protocol: "FOLFOX6", cycle: 8, day: 1, status: "ADMINISTERED", ward: "หอผู้ป่วย 4A", appointmentDate: "23/03/69", warn: false },
  { id: "Q9", hn: "9900112", name: "นางสุภา รักษ์ดี", age: 50, protocol: "CAF", cycle: 6, day: 1, status: "ADMINISTERED", ward: "OPD เคมีบำบัด", appointmentDate: "23/03/69", warn: false },
];

const stages: { key: PipelineStage; label: string; sublabel: string; icon: React.ElementType; color: string }[] = [
  { key: "DRAFT", label: "สั่งยา", sublabel: "แพทย์", icon: Syringe, color: "#4A7BF7" },
  { key: "SUBMITTED", label: "ตรวจสอบ", sublabel: "เภสัชกร", icon: Shield, color: "#7C6EBF" },
  { key: "VERIFIED", label: "เตรียมผสมยา", sublabel: "เจ้าหน้าที่ผสมยา", icon: Beaker, color: "#F59E0B" },
  { key: "PREPARED", label: "ให้ยา", sublabel: "พยาบาล", icon: Stethoscope, color: "#10B981" },
  { key: "ADMINISTERED", label: "เสร็จสิ้น", sublabel: "จำหน่าย", icon: CheckCircle2, color: "#64748B" },
];

/* ── Greeting by role ── */
function greeting(role: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "สวัสดีตอนเช้า" : h < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
  return `${period}, ${roleLabels[role as keyof typeof roleLabels]?.split(" ")[0] ?? ""}`;
}

export default function Dashboard() {
  const { role } = useOnc();
  const navigate = useNavigate();
  const [filterStage, setFilterStage] = useState<PipelineStage | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = mockQueue.filter(p => {
    if (filterStage !== "ALL" && p.status !== filterStage) return false;
    if (search && !p.name.includes(search) && !p.hn.includes(search)) return false;
    return true;
  });

  const alerts = mockQueue.filter(p => p.warn);
  const todayTotal = mockQueue.length;
  const completed = mockQueue.filter(p => p.status === "ADMINISTERED").length;
  const pending = todayTotal - completed;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-xl font-bold text-text">{greeting(role)}</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {" · "}{roleEnglish[role]}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "ผู้ป่วยวันนี้", value: todayTotal, sub: `นัด 12 / มา ${todayTotal}`, icon: Users, color: "#4A7BF7" },
          { label: "กำลังดำเนินการ", value: pending, sub: "รอใน pipeline", icon: Clock, color: "#7C6EBF" },
          { label: "เสร็จสิ้น", value: completed, sub: `${Math.round(completed / todayTotal * 100)}% ของวันนี้`, icon: CheckCircle2, color: "#10B981" },
          { label: "Alerts", value: alerts.length, sub: alerts.length > 0 ? alerts[0].warnMsg ?? "" : "ไม่มีการเตือน", icon: AlertTriangle, color: alerts.length > 0 ? "#DC2626" : "#64748B" },
        ].map((s, i) => (
          <div key={i} className="onc-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: s.color + "15" }}>
              <s.icon size={22} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-text">{s.value}</p>
              <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
              <p className="text-[10px] text-text-muted">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pipeline — 5 stages ── */}
      <div className="onc-card p-5">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Activity size={10} /> Treatment Pipeline
        </p>
        <div className="flex items-center gap-2">
          {stages.map((stage, i) => {
            const count = mockQueue.filter(p => p.status === stage.key).length;
            const isActive = filterStage === stage.key;
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <button onClick={() => setFilterStage(isActive ? "ALL" : stage.key)}
                  className={`flex-1 rounded-2xl p-4 transition-all text-center ${
                    isActive ? "ring-2 shadow-md" : "hover:bg-background-alt"
                  }`}
                  style={isActive ? { background: stage.color + "10", outlineColor: stage.color + "40" } : {}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: stage.color + "15" }}>
                    <stage.icon size={18} style={{ color: stage.color }} />
                  </div>
                  <p className="text-2xl font-black" style={{ color: count > 0 ? stage.color : "#94A3B8" }}>{count}</p>
                  <p className="text-xs font-semibold text-text mt-0.5">{stage.label}</p>
                  <p className="text-[9px] text-text-muted">{stage.sublabel}</p>
                </button>
                {i < stages.length - 1 && (
                  <ChevronRight size={16} className="text-border shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Patient Queue + Alerts ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Queue */}
        <div className="col-span-8 onc-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text flex items-center gap-2">
              <Users size={14} className="text-onc" />
              คิวผู้ป่วยวันนี้
              {filterStage !== "ALL" && (
                <span className="text-xs font-normal text-onc bg-onc-bg px-2 py-0.5 rounded-lg">
                  {stages.find(s => s.key === filterStage)?.label}
                  <button onClick={() => setFilterStage("ALL")} className="ml-1 text-text-muted hover:text-danger">×</button>
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background-alt rounded-xl">
                <Search size={12} className="text-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="HN / ชื่อ..." className="bg-transparent outline-none text-xs w-32" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {filtered.map(p => {
              const stage = stages.find(s => s.key === p.status)!;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-background-alt/50 transition-all cursor-pointer group">
                  {/* Status dot */}
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text truncate">{p.name}</span>
                      {p.warn && <AlertTriangle size={12} className="text-danger shrink-0" />}
                    </div>
                    <p className="text-[10px] text-text-muted">
                      HN {p.hn} · {p.protocol} C{p.cycle}D{p.day} · {p.ward}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg shrink-0"
                    style={{ background: stage.color + "15", color: stage.color }}>
                    {stage.label}
                  </span>

                  {/* Appointment date */}
                  <span className="text-[10px] font-medium text-text-muted shrink-0">
                    <Calendar size={10} className="inline mr-1" />
                    นัด {p.appointmentDate}
                  </span>

                  {/* Arrow */}
                  <ChevronRight size={14} className="text-border group-hover:text-onc shrink-0 transition-colors" />
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-sm text-text-muted">ไม่มีผู้ป่วยตามเงื่อนไข</div>
            )}
          </div>
        </div>

        {/* Right column — Alerts + Quick Actions */}
        <div className="col-span-4 space-y-4">
          {/* Alerts */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-danger" /> Alerts
            </p>
            {alerts.length === 0 ? (
              <p className="text-sm text-text-muted">ไม่มีการเตือน</p>
            ) : (
              <div className="space-y-2">
                {alerts.map(a => (
                  <div key={a.id} className="onc-alert-warn rounded-xl px-3 py-2.5 text-xs">
                    <p className="font-semibold">{a.name}</p>
                    <p className="opacity-80">{a.warnMsg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* นัดหมายวันนี้ */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Calendar size={10} /> นัดหมายวันนี้
            </p>
            {mockQueue.filter(p => p.status !== "ADMINISTERED").slice(0, 4).map(p => {
              const stage = stages.find(s => s.key === p.status)!;
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-text">{p.name}</p>
                    <p className="text-[10px] text-text-muted">{p.protocol} C{p.cycle}D{p.day}</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: stage.color + "15", color: stage.color }}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="onc-card p-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: "สั่งยา (CPOE)", to: "/onc/order-entry", icon: Syringe, color: "#4A7BF7" },
                { label: "ตรวจสอบคำสั่ง", to: "/onc/pharm-verify", icon: Shield, color: "#7C6EBF" },
                { label: "เตรียมยา", to: "/onc/compounding", icon: Beaker, color: "#F59E0B" },
                { label: "ให้ยา", to: "/onc/administration", icon: Stethoscope, color: "#10B981" },
              ].map(a => (
                <button key={a.to} onClick={() => navigate(a.to)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-alt transition-all text-left group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: a.color + "15" }}>
                    <a.icon size={15} style={{ color: a.color }} />
                  </div>
                  <span className="text-xs font-semibold text-text flex-1">{a.label}</span>
                  <ArrowRight size={12} className="text-border group-hover:text-onc transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
