import { FlaskConical, ShieldAlert, Activity, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router";
import PatientAvatar from "./PatientAvatar";

/* ══════════════════════════════════════════════
   PatientCard — Figma two-overlapping-card style
   ══════════════════════════════════════════════ */

export type PatientCardData = {
  name: string;
  hn: string;
  age: string;
  doctor: string;
  status: string;
  statusColor?: string;
  regimen: string;
  allergy: string;
  tnm: string;
  appointment: string;
  cycleNow: number;
  cycleTotal: number;
};

export default function PatientCard({ p }: { p: PatientCardData }) {
  const statusBg = p.statusColor ?? "#674BB3";
  const navigate = useNavigate();

  return (
    <div className="flex flex-col cursor-pointer group transition-all hover:-translate-y-0.5"
      onClick={() => navigate("/onc/patients")}>
      {/* Header card — gradient bg + glassmorphism */}
      <div className="rounded-2xl px-4 pt-4 pb-16 transition-all group-hover:shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${statusBg}08 0%, ${statusBg}15 100%)`,
          border: `1px solid ${statusBg}20`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
        <div className="flex gap-3 items-start">
          <div className="flex-1 flex gap-3 items-center min-w-0">
            <PatientAvatar hn={p.hn} size={48} />
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#404040] leading-tight">{p.name}</p>
              <p className="text-xs text-[#898989] leading-tight mt-0.5">HN {p.hn} • อายุ {p.age}</p>
              <p className="text-xs text-[#898989] leading-tight">แพทย์: {p.doctor}</p>
            </div>
          </div>
          <div className="text-white text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap"
            style={{ background: statusBg }}>
            {p.status}
          </div>
        </div>
      </div>

      {/* Detail card — glassmorphism overlaps header */}
      <div className="rounded-2xl px-4 py-4 flex flex-col gap-3 -mt-12 relative z-10 transition-all group-hover:shadow-xl"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        }}>
        {/* Row 1: Regimen + Allergy */}
        <div className="flex">
          <div className="flex-1 flex gap-2 items-center">
            <FlaskConical size={16} className="shrink-0 text-[#898989]" />
            <div>
              <p className="text-[11px] text-[#898989] leading-tight">REGIMEN</p>
              <p className="text-sm font-bold text-[#404040] leading-tight">{p.regimen}</p>
            </div>
          </div>
          <div className="flex-1 flex gap-2 items-center">
            <ShieldAlert size={16} className="shrink-0 text-[#898989]" />
            <div>
              <p className="text-[11px] text-[#898989] leading-tight">ALLERGY</p>
              <p className="text-sm font-bold text-[#404040] leading-tight">{p.allergy}</p>
            </div>
          </div>
        </div>

        {/* Row 2: TNM + Appointment */}
        <div className="flex">
          <div className="flex-1 flex gap-2 items-center">
            <Activity size={16} className="shrink-0 text-[#898989]" />
            <div>
              <p className="text-[11px] text-[#898989] leading-tight">TNM STAGE</p>
              <span className="inline-block text-sm font-bold text-[#404040] bg-[rgba(181,59,237,0.1)] px-1.5 py-0.5 rounded leading-tight">
                {p.tnm}
              </span>
            </div>
          </div>
          <div className="flex-1 flex gap-2 items-center">
            <CalendarDays size={16} className="shrink-0 text-[#898989]" />
            <div>
              <p className="text-[11px] text-[#898989] leading-tight">APPOINTMENT</p>
              <p className="text-sm font-bold text-[#404040] leading-tight">{p.appointment}</p>
            </div>
          </div>
        </div>

        {/* Cycle progress */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-[#898989]">Cycle {p.cycleNow}/{p.cycleTotal}</p>
          <div className="flex gap-1.5">
            {Array.from({ length: p.cycleTotal }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i < p.cycleNow ? "#3eaf3f" : "#d9d9d9" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
