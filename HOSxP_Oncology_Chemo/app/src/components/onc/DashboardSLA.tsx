import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Pause } from "lucide-react";

/* ══════════════════════════════════════════════
   DashboardSLA — Turnaround Time & SLA Monitor
   Shows elapsed time per patient in verification queue

   SLA Thresholds:
   - Green:  < 30 min
   - Yellow: 30–60 min
   - Red:    > 60 min (bottleneck alert)

   HELD state: Lab gate failure → red border
   ══════════════════════════════════════════════ */

export type SLAStatus = "green" | "yellow" | "red";
export type QueueItemStatus = "SUBMITTED" | "VERIFIED" | "PREPARING" | "PREPARED" | "HELD";

export interface QueueItem {
  id: string;
  hn: string;
  name: string;
  protocol: string;
  cycle: number;
  day: number;
  status: QueueItemStatus;
  enteredStageAt: string; // ISO timestamp or HH:MM
  holdReason?: string;    // reason for HELD (e.g. "ANC < 1.0")
}

interface Props {
  items: QueueItem[];
  stageLabel: string;
  className?: string;
}

/* ── Elapsed time helper ── */
function getElapsedMin(enteredAt: string): number {
  let enteredDate: Date;
  if (enteredAt.includes(":") && enteredAt.length <= 5) {
    // HH:MM format
    const [h, m] = enteredAt.split(":").map(Number);
    enteredDate = new Date();
    enteredDate.setHours(h, m, 0, 0);
  } else {
    enteredDate = new Date(enteredAt);
  }
  return Math.max(0, Math.floor((Date.now() - enteredDate.getTime()) / 60000));
}

function getSLAStatus(minutes: number): SLAStatus {
  if (minutes < 30) return "green";
  if (minutes < 60) return "yellow";
  return "red";
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ชม. ${m} นาที`;
}

const slaColors: Record<SLAStatus, { text: string; bg: string; border: string; dot: string }> = {
  green: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  yellow: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  red: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
};

/* ── SLA Badge ── */
export function SLABadge({ enteredAt, className = "" }: { enteredAt: string; className?: string }) {
  const [elapsed, setElapsed] = useState(() => getElapsedMin(enteredAt));

  useEffect(() => {
    const interval = setInterval(() => setElapsed(getElapsedMin(enteredAt)), 30000); // update every 30s
    return () => clearInterval(interval);
  }, [enteredAt]);

  const sla = getSLAStatus(elapsed);
  const colors = slaColors[sla];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} ${sla === "red" ? "animate-pulse" : ""} ${className}`}>
      <Clock size={12} />
      {formatElapsed(elapsed)}
    </span>
  );
}

/* ── Queue Card ── */
function QueueCard({ item }: { item: QueueItem }) {
  const [elapsed, setElapsed] = useState(() => getElapsedMin(item.enteredStageAt));
  const isHeld = item.status === "HELD";

  useEffect(() => {
    const interval = setInterval(() => setElapsed(getElapsedMin(item.enteredStageAt)), 30000);
    return () => clearInterval(interval);
  }, [item.enteredStageAt]);

  const sla = getSLAStatus(elapsed);
  const colors = slaColors[sla];

  return (
    <div className={`rounded-xl border px-4 py-3 transition-all ${
      isHeld ? "border-red-400 border-2 bg-red-50/50" : `${colors.border} ${colors.bg}`
    }`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-text">{item.name}</p>
        <div className="flex items-center gap-2">
          {isHeld && (
            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Pause size={10} /> HELD
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${colors.text} ${sla === "red" ? "animate-pulse" : ""}`}>
            <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">HN {item.hn} · {item.protocol} C{item.cycle}D{item.day}</p>
        {isHeld && item.holdReason && (
          <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
            <AlertTriangle size={10} /> {item.holdReason}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function DashboardSLA({ items, stageLabel, className = "" }: Props) {
  const [, setTick] = useState(0);

  // Force re-render every 30s for timer updates
  useEffect(() => {
    const interval = setInterval(() => setTick(v => v + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const held = items.filter(i => i.status === "HELD");
  const active = items.filter(i => i.status !== "HELD");
  const bottlenecks = items.filter(i => getElapsedMin(i.enteredStageAt) >= 60);

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-text">{stageLabel}</p>
          <p className="text-xs text-text-secondary">{items.length} รายการ</p>
        </div>
        <div className="flex items-center gap-3">
          {held.length > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Pause size={12} /> {held.length} HELD
            </span>
          )}
          {bottlenecks.length > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <AlertTriangle size={12} /> {bottlenecks.length} เกิน SLA
            </span>
          )}
        </div>
      </div>

      {/* Queue list — HELD items first */}
      <div className="space-y-2">
        {held.map(item => <QueueCard key={item.id} item={item} />)}
        {active.map(item => <QueueCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
