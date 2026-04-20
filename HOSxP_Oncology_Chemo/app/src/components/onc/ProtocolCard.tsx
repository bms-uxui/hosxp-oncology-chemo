import { Pill, Syringe, Calendar, Check, Info } from "lucide-react";
import { Tooltip as HeroTooltip } from "@heroui/react";

interface ProtocolCardProps {
  code: string;
  drugs: string;
  totalCycles: number;
  cycleDays: number;
  treatmentDays: number[];
  cancer: string;
  line: string;
  emetogenicRisk: "High" | "Moderate" | "Low";
  selected?: boolean;
  onClick?: () => void;
}

export default function ProtocolCard({ code, drugs, totalCycles, cycleDays, treatmentDays, cancer, line, emetogenicRisk, selected = false, onClick }: ProtocolCardProps) {
  const emetColor = emetogenicRisk === "High" ? "text-red-600" : emetogenicRisk === "Moderate" ? "text-amber-600" : "text-emerald-600";

  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-2xl border-[0.1px] border-border-card transition-all ${
        selected ? "ring-2 ring-onc/30 bg-onc/5" : "bg-white hover:bg-gray-50"
      }`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Top row: 3-column */}
      <div className="flex items-stretch divide-x divide-gray-100">
        {/* Left: name + description */}
        <div className="flex-1 min-w-0 px-5 py-4">
          <p className={`text-sm font-bold ${selected ? "text-onc" : "text-text"}`}>{code}</p>
          <p className="text-xs text-text-secondary mt-0.5 truncate">{drugs}</p>
        </div>
        {/* Middle: cycles */}
        <div className="w-24 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-text">{totalCycles}</span>
          <span className="text-xs text-text-secondary">Cycles</span>
        </div>
        {/* Right: schedule */}
        <div className="w-24 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-text">q{cycleDays}d</span>
          <span className="text-xs text-text-secondary">รอบการให้ยา</span>
        </div>
        {/* Right: emeto */}
        <div className="w-24 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
          <HeroTooltip placement="top" className="bg-white shadow-lg rounded-lg border border-gray-100 max-w-xs"
            content={<p className="px-2 py-1 text-xs text-text">Emetogenic Risk — ระดับความเสี่ยงที่สูตรยาจะทำให้เกิดอาการคลื่นไส้อาเจียน</p>}>
            <span className={`text-sm font-bold cursor-help flex items-center gap-1 ${emetColor}`}>{emetogenicRisk} <Info size={11} /></span>
          </HeroTooltip>
          <span className="text-xs text-text-secondary">Emeto</span>
        </div>
      </div>
      {/* Bottom row: tags + check */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-blue-600 flex items-center gap-1"><Pill size={12} /> {cancer}</span>
          <span className="text-xs font-medium text-purple-600 flex items-center gap-1"><Syringe size={12} /> {line}</span>
          <span className="text-xs text-text-secondary flex items-center gap-1"><Calendar size={12} /> Day {treatmentDays.join(", ")}</span>
        </div>
        {selected && <Check size={16} className="text-onc shrink-0" />}
      </div>
    </button>
  );
}
