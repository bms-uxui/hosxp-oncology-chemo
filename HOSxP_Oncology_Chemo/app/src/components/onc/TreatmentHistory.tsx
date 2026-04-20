import { useState } from "react";
import { Syringe, ClipboardCheck, FlaskConical, Stethoscope, CheckCircle2, Clock, AlertTriangle, FileText, Filter } from "lucide-react";

const card = "bg-white rounded-2xl p-5 border-[0.1px] border-border-card";

/* ── Workflow stage type ── */
type StageStatus = "done" | "active" | "pending" | "skipped";

interface WorkflowStage {
  key: "order" | "verify" | "compound" | "administer" | "done";
  label: string;
  status: StageStatus;
  date?: string;
  by?: string;
  note?: string;
}

type HistoryEvent = {
  date: string;
  cycle: string;
  regimen: string;
  status: "current" | "done";
  doctor: string;
  drugs: { name: string; dose: string; route: string; duration: string }[];
  labs: { anc: number; plt: number; hb: number };
  note: string;
  sideEffects: string[];
  orderNo?: string;
  doseReduction?: number;
  workflow?: WorkflowStage[];
};

type FilterType = "all" | "current" | "done" | "has-order";

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "current", label: "กำลังดำเนินการ" },
  { key: "done", label: "เสร็จสิ้น" },
  { key: "has-order", label: "มีใบสั่งยา" },
];

export type { HistoryEvent };

interface TreatmentHistoryProps {
  events: HistoryEvent[];
  onViewOrder?: (event: HistoryEvent) => void;
}

const STAGE_META: Record<string, { icon: React.ElementType; color: string }> = {
  order: { icon: Syringe, color: "#674BB3" },
  verify: { icon: ClipboardCheck, color: "#6366f1" },
  compound: { icon: FlaskConical, color: "#f59e0b" },
  administer: { icon: Stethoscope, color: "#10b981" },
  done: { icon: CheckCircle2, color: "#10b981" },
};

function WorkflowPipeline({ stages }: { stages: WorkflowStage[] }) {
  const cols = stages.length;
  return (
    <div className="mt-3 mb-1">
      {/* Grid of equal columns */}
      <div className="grid relative" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {/* Connector line — spans full width behind icons */}
        <div className="absolute top-5 left-0 right-0 flex items-center px-8" style={{ height: 0 }}>
          {stages.slice(0, -1).map((s, i) => (
            <div key={i} className={`flex-1 h-0.5 ${s.status === "done" ? "bg-emerald-300" : "bg-gray-200"}`} />
          ))}
        </div>
        {/* Icons + labels */}
        {stages.map((s) => {
          const meta = STAGE_META[s.key];
          const Icon = meta.icon;
          const isDone = s.status === "done";
          const isActive = s.status === "active";
          return (
            <div key={s.key} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDone ? "bg-emerald-100" : isActive ? "bg-white" : "bg-gray-50"
              }`} style={isActive ? { boxShadow: `0 0 0 2.5px ${meta.color}` } : {}}>
                {isDone ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : isActive ? (
                  <Icon size={20} style={{ color: meta.color }} />
                ) : (
                  <Icon size={20} className="text-gray-300" />
                )}
              </div>
              <p className={`text-sm mt-2 text-center font-medium leading-tight ${
                isDone ? "text-emerald-600" : isActive ? "font-bold" : "text-gray-400"
              }`} style={isActive ? { color: meta.color } : {}}>
                {s.label}
              </p>
              {(isDone || isActive) && s.date && (
                <p className="text-xs text-text-secondary mt-0.5">{s.date}</p>
              )}
              {(isDone || isActive) && s.by && (
                <p className="text-xs text-text-secondary truncate max-w-full text-center px-1">{s.by}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TreatmentHistory({ events, onViewOrder }: TreatmentHistoryProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = events.filter(evt => {
    if (filter === "current") return evt.status === "current";
    if (filter === "done") return evt.status === "done";
    if (filter === "has-order") return !!evt.orderNo;
    return true;
  });

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} className="text-text-secondary" />
        {FILTER_OPTIONS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
              filter === f.key
                ? "bg-onc text-white"
                : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }`}>
            {f.label}
          </button>
        ))}
        <span className="text-xs text-text-secondary ml-auto">{filtered.length} รายการ</span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-secondary text-sm">ไม่พบรายการ</div>
      )}

      {filtered.map((evt, i, arr) => (
        <div key={i} className="flex gap-4">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center shrink-0 w-6">
            <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${
              evt.status === "current" ? "bg-onc ring-4 ring-onc/20" : "bg-emerald-500"
            }`} />
            {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
          </div>

          {/* Card */}
          <div className={`flex-1 mb-4 ${card}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-text">{evt.date}</span>
                {evt.cycle !== "—" && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    evt.status === "current" ? "bg-onc/10 text-onc" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {evt.regimen} {evt.cycle}
                  </span>
                )}
                {evt.orderNo && (
                  <span className="text-sm text-text-secondary font-mono">{evt.orderNo}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {evt.orderNo && onViewOrder && (
                  <button onClick={() => onViewOrder(evt)}
                    className="text-sm font-medium text-onc border border-onc/30 rounded-full px-3 py-1 hover:bg-onc/5 transition-colors flex items-center gap-1.5">
                    <FileText size={13} /> ดูใบสั่งยา
                  </button>
                )}
                <span className={`text-sm font-bold ${evt.status === "current" ? "text-onc" : "text-emerald-600"}`}>
                  {evt.status === "current" ? "กำลังดำเนินการ" : "เสร็จสิ้น"}
                </span>
              </div>
            </div>

            {/* Note */}
            <p className="text-base text-text mb-3">{evt.note}</p>

            {/* Dose reduction badge */}
            {evt.doseReduction !== undefined && evt.doseReduction < 100 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-3">
                <AlertTriangle size={14} /> ปรับลดขนาดยา {evt.doseReduction}%
              </span>
            )}

            {/* Workflow pipeline */}
            {evt.workflow && evt.workflow.length > 0 && (
              <div className="bg-gray-50/80 rounded-xl px-5 py-4 mb-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">สถานะขั้นตอน</p>
                <WorkflowPipeline stages={evt.workflow} />
                {/* Active stage detail */}
                {evt.workflow.filter(s => s.status === "active").map(s => (
                  <div key={s.key} className="flex items-center gap-2 mt-3 text-sm">
                    <Clock size={14} className="text-text-secondary" />
                    <span className="text-text-secondary">กำลังรอ:</span>
                    <span className="font-semibold text-text">{s.label}</span>
                    {s.note && <span className="text-text-secondary">— {s.note}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Drugs */}
            {evt.drugs.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">ยาที่ให้</p>
                <div className="flex flex-wrap gap-2">
                  {evt.drugs.map(d => (
                    <span key={d.name} className="text-sm bg-gray-50 border border-gray-100 text-text px-3 py-2 rounded-lg">
                      <span className="font-semibold">{d.name}</span> {d.dose} · {d.route} · {d.duration}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Labs */}
            {(evt.labs.anc > 0 || evt.labs.plt > 0 || evt.labs.hb > 0) && (
              <div className="flex items-center gap-5 text-base">
                <span className="text-text-secondary">Lab:</span>
                <span className="text-text">ANC <span className="font-bold">{evt.labs.anc}</span></span>
                <span className="text-text">PLT <span className="font-bold">{evt.labs.plt}</span></span>
                <span className="text-text">Hb <span className="font-bold">{evt.labs.hb}</span></span>
              </div>
            )}

            {/* Side effects */}
            {evt.sideEffects.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-text-secondary">ผลข้างเคียง:</span>
                {evt.sideEffects.map(se => (
                  <span key={se} className="text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">{se}</span>
                ))}
              </div>
            )}

            <p className="text-base text-text-secondary mt-3">แพทย์: {evt.doctor}</p>
          </div>
        </div>
      ))}
    </>
  );
}
