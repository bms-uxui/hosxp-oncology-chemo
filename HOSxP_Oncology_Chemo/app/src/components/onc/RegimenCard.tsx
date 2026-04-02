import { Syringe, FileText } from "lucide-react";
import { Tooltip as HeroTooltip } from "@heroui/react";

const card = "bg-white rounded-2xl p-5 border-[0.1px] border-[#d9d9d9]/25";

type Drug = { name: string; dose: string; route: string; rate: string; diluent: string; type: string };
type CumulativeDose = { drug: string; total: number; max: number; unit: string };

const defaultDrugs: Drug[] = [
  { name: "Ondansetron", dose: "8 mg", route: "IV", rate: "15 min", diluent: "NSS 50 mL", type: "Premed" },
  { name: "Dexamethasone", dose: "20 mg", route: "IV", rate: "15 min", diluent: "NSS 50 mL", type: "Premed" },
  { name: "Cyclophosphamide", dose: "700 mg", route: "IV Infusion", rate: "30 min", diluent: "D5W 100 mL", type: "Chemo" },
  { name: "Doxorubicin", dose: "70 mg", route: "IV Push", rate: "5 min", diluent: "D5W 50 mL", type: "Chemo" },
  { name: "5-FU", dose: "700 mg", route: "IV Infusion", rate: "4 hr", diluent: "D5W 500 mL", type: "Chemo" },
];

interface RegimenCardProps {
  regimen: string;
  diagnosis: string;
  currentCycle: number;
  totalCycles: number;
  drugs?: Drug[];
  cumulativeDose: CumulativeDose[];
  className?: string;
}

export default function RegimenCard({ regimen, diagnosis, currentCycle, totalCycles, drugs = defaultDrugs, cumulativeDose, className = "" }: RegimenCardProps) {
  return (
    <div className={`flex flex-col ${card} ${className}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h3 className="text-sm font-bold text-[#404040] mb-3 flex items-center gap-1.5">
        <Syringe size={14} className="text-[#674BB3]" /> สูตรยาปัจจุบัน
      </h3>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-bold text-[#404040]">{regimen}</p>
          <p className="text-xs text-[#898989] mt-0.5">q21d · {diagnosis}</p>
        </div>
        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">Active</span>
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-xs text-[#898989]">Cycle</span>
        <span className="text-xl font-black text-[#674BB3]">{currentCycle}</span>
        <span className="text-sm text-[#898989]">/ {totalCycles}</span>
      </div>
      <div className="flex gap-1 mt-2">
        {Array.from({ length: totalCycles }, (_, i) => i + 1).map(c => {
          const status = c < currentCycle ? "เสร็จสิ้น" : c === currentCycle ? "กำลังดำเนินการ" : "รอดำเนินการ";
          const color = c < currentCycle ? "#10b981" : c === currentCycle ? "#674BB3" : "#d1d5db";
          return (
            <HeroTooltip key={c} placement="top" className="bg-white shadow-lg rounded-lg border border-gray-100"
              content={
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-bold">Cycle {c}</p>
                  <p className="text-[#898989]">สถานะ: <span className="font-bold" style={{ color }}>{status}</span></p>
                </div>
              }>
              <div className={`flex-1 h-2 rounded-full cursor-pointer hover:h-3 transition-all ${
                c < currentCycle ? "bg-emerald-500" : c === currentCycle ? "bg-[#674BB3]" : "bg-gray-200"
              }`} />
            </HeroTooltip>
          );
        })}
      </div>

      {/* Drug order */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex-1">
        <div className="space-y-2">
          {/* Premed group */}
          {drugs.some(d => d.type === "Premed") && (
            <p className="text-xs font-semibold text-[#898989] uppercase tracking-wide">Pre-med</p>
          )}
          {drugs.filter(d => d.type === "Premed").map(d => (
            <HeroTooltip key={d.name} placement="left" className="bg-white shadow-lg rounded-lg border border-gray-100"
              content={
                <div className="px-1.5 py-1 text-[11px]">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-[#898989]">ประเภท: <span className="text-[#404040] font-bold">{d.type}</span></p>
                  <p className="text-[#898989]">Diluent: <span className="text-[#404040] font-bold">{d.diluent}</span></p>
                  <p className="text-[#898989]">Rate: <span className="text-[#404040] font-bold">{d.rate}</span></p>
                  <p className="text-[#898989]">Route: <span className="text-[#404040] font-bold">{d.route}</span></p>
                </div>
              }>
              <div className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 rounded-lg px-1 py-0.5 -mx-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-blue-400" />
                  <span className="font-semibold text-[#404040]">{d.name}</span>
                </div>
                <span className="text-[#898989]">{d.dose} · {d.route}</span>
              </div>
            </HeroTooltip>
          ))}

          {/* Chemo group */}
          {drugs.some(d => d.type === "Chemo") && (
            <p className="text-xs font-semibold text-[#898989] uppercase tracking-wide mt-2">Chemotherapy</p>
          )}
          {drugs.filter(d => d.type === "Chemo").map(d => (
            <HeroTooltip key={d.name} placement="left" className="bg-white shadow-lg rounded-lg border border-gray-100"
              content={
                <div className="px-1.5 py-1 text-[11px]">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-[#898989]">ประเภท: <span className="text-[#404040] font-bold">{d.type}</span></p>
                  <p className="text-[#898989]">Diluent: <span className="text-[#404040] font-bold">{d.diluent}</span></p>
                  <p className="text-[#898989]">Rate: <span className="text-[#404040] font-bold">{d.rate}</span></p>
                  <p className="text-[#898989]">Route: <span className="text-[#404040] font-bold">{d.route}</span></p>
                </div>
              }>
              <div className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 rounded-lg px-1 py-0.5 -mx-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-amber-400" />
                  <span className="font-semibold text-[#404040]">{d.name}</span>
                </div>
                <span className="text-[#898989]">{d.dose} · {d.route}</span>
              </div>
            </HeroTooltip>
          ))}
        </div>
      </div>

      {/* Cumulative dose */}
      {cumulativeDose.length > 0 && <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-[#674BB3]" />
          <span className="text-sm font-bold text-[#404040]">ขนาดยาสะสม</span>
        </div>
        {cumulativeDose.map(d => {
          const pct = Math.round((d.total / d.max) * 100);
          const color = pct >= 80 ? "#dc2626" : pct >= 50 ? "#f59e0b" : "#674BB3";
          return (
            <div key={d.drug}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-[#404040]">{d.drug}</span>
                <span className="text-sm text-[#898989]">{d.total} / {d.max} {d.unit}</span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                  {pct}%
                </span>
              </div>
              <p className="text-xs text-[#898989] mt-1">เหลืออีก {d.max - d.total} {d.unit} ({100 - pct}%)</p>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
