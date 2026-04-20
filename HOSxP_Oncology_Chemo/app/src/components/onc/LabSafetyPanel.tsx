import { Tooltip as HeroTooltip } from "@heroui/react";

type LabStatus = "safe" | "warn" | "danger";

interface LabItem {
  name: string;
  value: number;
  unit: string;
  ref: string;
  status: LabStatus;
}

interface LabSafetyPanelProps {
  labs: LabItem[];
  className?: string;
}

export default function LabSafetyPanel({ labs, className = "" }: LabSafetyPanelProps) {
  const dangerCount = labs.filter(l => l.status === "danger").length;
  const warnCount = labs.filter(l => l.status === "warn").length;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text">ผล Lab ล่าสุด</h3>
        {dangerCount > 0
          ? <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{dangerCount} ผิดปกติ</span>
          : warnCount > 0
          ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{warnCount} เฝ้าระวัง</span>
          : <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ปกติ</span>
        }
      </div>
      <div className="space-y-2">
        {labs.map(l => {
          const dotColor = l.status === "danger" ? "bg-red-500" : l.status === "warn" ? "bg-amber-500" : "bg-emerald-500";
          const valColor = l.status === "danger" ? "text-red-600" : l.status === "warn" ? "text-amber-600" : "text-text";
          const rowBg = l.status === "danger" ? "bg-red-50 rounded-lg px-2 py-1 -mx-2" : l.status === "warn" ? "bg-amber-50 rounded-lg px-2 py-1 -mx-2" : "";
          return (
            <HeroTooltip key={l.name} placement="left" className="bg-white shadow-lg rounded-lg border border-gray-100"
              content={<p className="px-2 py-1 text-xs text-text">Ref: <span className="font-bold">{l.ref}</span></p>}>
              <div className={`flex items-center justify-between text-sm cursor-help transition-colors hover:bg-gray-100 rounded-lg px-2 py-1 -mx-2 ${rowBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-text">{l.name}</span>
                </div>
                <span className={`font-bold ${valColor}`}>{l.value} <span className="font-normal text-text-secondary text-xs">{l.unit}</span></span>
              </div>
            </HeroTooltip>
          );
        })}
      </div>
    </div>
  );
}
