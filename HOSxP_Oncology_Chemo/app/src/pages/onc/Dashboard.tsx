import { useState } from "react";
import {
  ChevronRight,
  Syringe, ClipboardCheck, FlaskConical, Stethoscope, CheckCircle2,
  AlertTriangle, Clock, ShieldAlert,
} from "lucide-react";
import PatientCard from "../../components/onc/PatientCard";
import StageProgressCircle from "../../components/onc/StageProgressCircle";
import CalendarMiniWidget from "../../components/onc/CalendarMiniWidget";
import { useOnc } from "../../components/onc/OncContext";

const B = "/hosxp-oncology-chemo/onc";

interface StageData {
  id: string;
  key: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  avatar: string;
  count: number;
  completed: number;
  heldCount: number;
  oldestWaitMinutes: number;
}

const TOTAL_TODAY = 12;

const ROLE_STAGE_MAP: Record<string, string> = {
  ONC_DOCTOR: "doctor",
  ONC_PHARMACIST: "pharmacist",
  CHEMO_NURSE: "nurse",
};

const stagesMeta: StageData[] = [
  { id: "doctor", key: "แพทย์สั่งยา", label: "รอตรวจสอบ", sublabel: "แพทย์สั่งยา", icon: Syringe, avatar: `${B}/avatar-doctor.png`, count: 2, completed: 2, heldCount: 1, oldestWaitMinutes: 25 },
  { id: "pharmacist", key: "เภสัชกรตรวจสอบ", label: "รอตรวจสอบ", sublabel: "เภสัชกรตรวจสอบ", icon: ClipboardCheck, avatar: `${B}/avatar-pharmacist.png`, count: 3, completed: 1, heldCount: 1, oldestWaitMinutes: 72 },
  { id: "compound", key: "เตรียมยา", label: "เตรียมยา", sublabel: "เตรียมยา", icon: FlaskConical, avatar: `${B}/avatar-compound.png`, count: 2, completed: 1, heldCount: 0, oldestWaitMinutes: 45 },
  { id: "nurse", key: "พยาบาลให้ยา", label: "ผู้ป่วยรอให้ยา", sublabel: "พยาบาลให้ยา", icon: Stethoscope, avatar: `${B}/avatar-nurse.png`, count: 3, completed: 1, heldCount: 2, oldestWaitMinutes: 18 },
  { id: "done", key: "เสร็จสิ้น", label: "ให้ยาครบ", sublabel: "เสร็จสิ้น", icon: CheckCircle2, avatar: `${B}/avatar-complete.png`, count: 2, completed: 2, heldCount: 0, oldestWaitMinutes: 0 },
];

const patients = [
  { id: "P1", name: "นางคำปุ่น เสนาหอย", hn: "104365", age: "54 ปี 6 เดือน", doctor: "นพ.สมชาย รักษาดี", status: "แพทย์สั่งยา", statusColor: "#674BB3", regimen: "CAF", allergy: "Penicillin", tnm: "Stage IIIA", appointment: "12 ก.ย. 69", cycleNow: 2, cycleTotal: 6 },
  { id: "P2", name: "นายบุญมี ดีใจ", hn: "205471", age: "68 ปี 2 เดือน", doctor: "พญ.วิภา ศรีสุข", status: "เภสัชกรตรวจสอบ", statusColor: "#6366f1", regimen: "FOLFOX6", allergy: "Sulfa", tnm: "Stage IV", appointment: "12 ก.ย. 69", cycleNow: 5, cycleTotal: 12 },
  { id: "P3", name: "นางเพ็ญ ใจสว่าง", hn: "308892", age: "61 ปี 9 เดือน", doctor: "นพ.สมชาย รักษาดี", status: "เตรียมยา", statusColor: "#f59e0b", regimen: "CARBO-PAC", allergy: "NKDA", tnm: "Stage IIB", appointment: "13 ก.ย. 69", cycleNow: 1, cycleTotal: 6 },
  { id: "P4", name: "นายสมศักดิ์ ชัยมงคล", hn: "412230", age: "72 ปี 1 เดือน", doctor: "พญ.วิภา ศรีสุข", status: "พยาบาลให้ยา", statusColor: "#10b981", regimen: "GEM", allergy: "Aspirin", tnm: "Stage III", appointment: "13 ก.ย. 69", cycleNow: 4, cycleTotal: 6 },
  { id: "P5", name: "นางสาวมาลี สุขใจ", hn: "519087", age: "52 ปี 4 เดือน", doctor: "นพ.สมชาย รักษาดี", status: "แพทย์สั่งยา", statusColor: "#674BB3", regimen: "AC-T", allergy: "Iodine", tnm: "Stage IIA", appointment: "14 ก.ย. 69", cycleNow: 3, cycleTotal: 8 },
  { id: "P6", name: "นายอุดม พัฒนา", hn: "620145", age: "45 ปี 7 เดือน", doctor: "นพ.ประยุทธ์ จันทร์ดี", status: "เสร็จสิ้น", statusColor: "#64748b", regimen: "R-CHOP", allergy: "NKDA", tnm: "Stage II", appointment: "11 ก.ย. 69", cycleNow: 6, cycleTotal: 6 },
];

const activityFeed = [
  { action: "สั่งยา CAF Cycle 3 Day 1", patient: "คำปุ่น เสนาหอย", actor: "นพ.สมชาย", time: "10:32", color: "#674BB3" },
  { action: "Verify คำสั่งยา FOLFOX6", patient: "บุญมี ดีใจ", actor: "ภญ.นภา", time: "10:15", color: "#6366f1" },
  { action: "เตรียมยา CARBO-PAC เสร็จ", patient: "เพ็ญ ใจสว่าง", actor: "จนท.วิไล", time: "09:48", color: "#f59e0b" },
  { action: "เริ่มให้ยา GEM Day 8", patient: "สมศักดิ์ ชัยมงคล", actor: "พย.สุดา", time: "09:30", color: "#10b981" },
  { action: "ให้ยา R-CHOP ครบ — จำหน่าย", patient: "อุดม พัฒนา", actor: "พย.สุดา", time: "09:10", color: "#64748b" },
  { action: "Lab ANC 1.2 — ใกล้ threshold", patient: "มาลี สุขใจ", actor: "ระบบ", time: "08:45", color: "#dc2626" },
  { action: "สั่งยา AC-T Cycle 4 Day 1", patient: "มาลี สุขใจ", actor: "นพ.สมชาย", time: "08:30", color: "#674BB3" },
];

export default function Dashboard() {
  const { role } = useOnc();
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const roleStageId = ROLE_STAGE_MAP[role] ?? null;

  const filtered = activeStage
    ? patients.filter(p => p.status === stagesMeta.find(s => s.id === activeStage)?.key)
    : patients;

  return (
    <div className="min-h-full space-y-4">

      {/* ── Title ── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[#836e69]">Treatment Pipeline</p>
        <h1 className="text-[32px] font-bold text-black leading-tight">ภาพรวมการรักษา</h1>
      </div>

      {/* ── Pipeline Bar ── */}
      <div className="bg-[#674BB3] rounded-3xl px-4 py-4 xl:px-6 xl:py-5 overflow-x-auto"
        style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.12)" }}>
        <div className="flex items-center" style={{ minWidth: 900 }}>
          {stagesMeta.map((s, i) => {
            const isActive = activeStage === s.id;
            const isBottleneck = s.oldestWaitMinutes > 60 && s.id !== "done";
            const isRoleStage = roleStageId === s.id;

            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => setActiveStage(isActive ? null : s.id)}
                  className={`relative flex items-center flex-1 min-w-0 rounded-2xl p-1.5 transition-all cursor-pointer min-h-12 ${
                    isActive ? "" : "hover:bg-white/10"
                  } ${isRoleStage && !isActive ? "bg-white/5 ring-1 ring-white/20" : ""}`}
                  style={{
                    background: isActive ? "rgba(255,255,255,0.18)" : undefined,
                    outline: isActive ? "2px solid rgba(255,255,255,0.5)" : "none",
                    outlineOffset: 2,
                  }}
                  aria-label={`${s.sublabel}: ${s.count} คน`}>

                  {/* Avatar + Sublabel */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative">
                      <StageProgressCircle
                        avatar={s.avatar}
                        completed={s.completed}
                        totalToday={TOTAL_TODAY}
                        heldCount={s.heldCount}
                        count={s.count}
                        oldestWaitMinutes={s.oldestWaitMinutes}
                        isRoleStage={isRoleStage}
                        isActive={isActive}
                      />
                      {s.heldCount > 0 && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
                          <ShieldAlert size={12} />
                          <span>{s.heldCount} ระงับ</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <p className={`text-xs font-bold whitespace-nowrap ${roleStageId === s.id ? "text-yellow-200" : "text-white"}`}>
                        {s.sublabel}
                      </p>
                      {roleStageId === s.id && (
                        <span className="text-[8px] bg-yellow-400/30 text-yellow-100 font-bold px-1.5 py-0.5 rounded-full">คุณ</span>
                      )}
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex-1 h-1 rounded-full mx-2 min-w-2"
                    style={{ background: isBottleneck ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.3)" }} />

                  {/* Count */}
                  <div className="shrink-0 text-center min-w-0 pr-1">
                    <p className="text-[13px] font-medium leading-tight" style={{ color: "rgba(255,255,255,0.8)" }}>{s.label}</p>
                    <p className={`text-4xl font-bold leading-tight ${isBottleneck ? "text-red-200" : "text-white"}`}>{s.count}</p>
                    {s.heldCount > 0 ? (
                      <p className="text-[11px] font-medium text-red-200 flex items-center justify-center gap-0.5">
                        <AlertTriangle size={10} />{s.heldCount} ระงับ
                      </p>
                    ) : (
                      <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>คน</p>
                    )}
                  </div>
                </button>

                {i < stagesMeta.length - 1 && <ChevronRight size={24} className="shrink-0 mx-1 text-white/40" />}
              </div>
            );
          })}
        </div>

        {/* Legends */}
        <div className="flex items-center justify-end gap-3 xl:gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#3eaf3f]" />
            <span className="text-[11px] text-white">ปกติ (&lt;30 นาที)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-[11px] text-white">เฝ้าระวัง (&gt;45 นาที)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="text-[11px] text-white">คอขวด (&gt;60 นาที)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#ef4444]" />
            <span className="text-[11px] text-white">ระงับ (HELD)</span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Patient list */}
        <div className="flex-1 bg-white rounded-3xl p-4 xl:p-4 min-w-0"
          style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.12)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[#404040]">
              รายชื่อผู้ป่วย
              {activeStage && (
                <span className="ml-2 text-[11px] font-medium text-white bg-[#674BB3] px-2 py-0.5 rounded-lg">
                  {stagesMeta.find(s => s.id === activeStage)?.sublabel}
                </span>
              )}
            </p>
            {activeStage && (
              <button onClick={() => setActiveStage(null)}
                className="text-[11px] text-[#898989] hover:text-[#404040] transition-colors">
                แสดงทั้งหมด ×
              </button>
            )}
          </div>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map((p) => <PatientCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-[#898989] text-sm">ไม่มีผู้ป่วยในขั้นตอนนี้</div>
          )}
        </div>

        {/* Right panel */}
        <div className="xl:shrink-0 flex flex-col gap-4 xl:w-96 w-full">
          {/* Calendar Mini Widget */}
          <CalendarMiniWidget />

          {/* Activity Feed */}
          <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-[#404040] flex items-center gap-1.5">
                <Clock size={14} className="text-[#674BB3]" />กิจกรรมล่าสุด
              </p>
              <span className="text-[9px] text-[#898989]">วันนี้</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {activityFeed.map((a, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                    {i < activityFeed.length - 1 && <div className="w-px flex-1 bg-[#e5e5e5] mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#404040] leading-tight">{a.action}</p>
                        <p className="text-[10px] text-[#898989] leading-tight mt-0.5">{a.patient} • {a.actor}</p>
                      </div>
                      <span className="text-[9px] text-[#898989] shrink-0 pt-0.5">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
