import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, ReferenceArea, CartesianGrid } from "recharts";

const card = "bg-white rounded-2xl p-5 border-[0.1px] border-[#d9d9d9]/25";

type LabMetric = "wbc" | "anc" | "hb" | "hct" | "plt" | "cr" | "bun" | "egfr" | "alt" | "ast" | "alp" | "tbili" | "alb" | "na" | "k";

const labRefRanges: Record<string, { low: number; high: number; critLow: number }> = {
  wbc: { low: 4.0, high: 11.0, critLow: 2.0 }, anc: { low: 1.5, high: 7.5, critLow: 1.0 },
  hb: { low: 12.0, high: 16.0, critLow: 8.0 }, hct: { low: 36, high: 46, critLow: 25 },
  plt: { low: 150, high: 400, critLow: 75 }, cr: { low: 0.6, high: 1.2, critLow: 0.3 },
  bun: { low: 7, high: 20, critLow: 3 }, egfr: { low: 60, high: 120, critLow: 30 },
  alt: { low: 0, high: 40, critLow: 0 }, ast: { low: 0, high: 40, critLow: 0 },
  alp: { low: 44, high: 147, critLow: 0 }, tbili: { low: 0.1, high: 1.2, critLow: 0 },
  alb: { low: 3.5, high: 5.0, critLow: 2.5 }, na: { low: 136, high: 145, critLow: 130 },
  k: { low: 3.5, high: 5.0, critLow: 3.0 },
};

const labMetrics: { key: LabMetric; label: string; unit: string }[] = [
  { key: "wbc", label: "WBC", unit: "×10³/µL" }, { key: "anc", label: "ANC", unit: "×10³/µL" },
  { key: "hb", label: "Hb", unit: "g/dL" }, { key: "hct", label: "Hct", unit: "%" },
  { key: "plt", label: "PLT", unit: "×10³/µL" }, { key: "cr", label: "Cr", unit: "mg/dL" },
  { key: "bun", label: "BUN", unit: "mg/dL" }, { key: "egfr", label: "eGFR", unit: "mL/min" },
  { key: "alt", label: "ALT", unit: "U/L" }, { key: "ast", label: "AST", unit: "U/L" },
  { key: "alp", label: "ALP", unit: "U/L" }, { key: "tbili", label: "T.Bili", unit: "mg/dL" },
  { key: "alb", label: "Alb", unit: "g/dL" }, { key: "na", label: "Na", unit: "mEq/L" },
  { key: "k", label: "K", unit: "mEq/L" },
];

interface LabTrendCardProps {
  trendData: Record<string, number | string>[];
  className?: string;
}

export default function LabTrendCard({ trendData, className = "" }: LabTrendCardProps) {
  const [labMetric, setLabMetric] = useState<LabMetric>("anc");

  return (
    <div className={`flex flex-col ${card} ${className}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)", minHeight: 280 }}>
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#674BB3]" />
          <h3 className="text-sm font-bold text-[#404040]">แนวโน้มผล Lab</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-[#404040]">
            <span className="flex items-center gap-1.5"><span className="w-6 h-2.5 rounded bg-[#10b981]/30 inline-block border border-[#10b981]/50" /> ค่าปกติ</span>
            <span className="flex items-center gap-1.5"><span className="w-6 inline-block" style={{ borderTop: "2px dashed #f87171" }} /> ค่าวิกฤต</span>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat"
                endContent={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>}
                className="bg-[#674BB3]/10 text-[#674BB3] font-semibold text-sm min-h-8 h-8 min-w-28 rounded-lg px-3 gap-1 border border-[#674BB3]/30 justify-between">
                {labMetrics.find(m => m.key === labMetric)?.label ?? "ANC"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              className="bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto min-w-28"
              selectionMode="single"
              selectedKeys={new Set([labMetric])}
              onAction={(key) => setLabMetric(key as LabMetric)}>
              {labMetrics.map(m => (
                <DropdownItem key={m.key} className="hover:bg-[#674BB3]/10 data-[selected=true]:bg-[#674BB3]/10 data-[selected=true]:text-[#674BB3] rounded-lg">{m.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="labFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#674BB3" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#674BB3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <ReferenceArea y1={labRefRanges[labMetric].low} y2={labRefRanges[labMetric].high}
              fill="#10b981" fillOpacity={0.06}
              label={{ value: "Normal Range", position: "insideTopLeft", fontSize: 10, fill: "#10b981" }} />
            <ReferenceLine y={labRefRanges[labMetric].critLow}
              stroke="#f87171" strokeDasharray="4 4" strokeWidth={1.5}
              label={{ value: "วิกฤต", position: "right", fontSize: 10, fill: "#f87171" }} />
            <ReferenceLine y={labRefRanges[labMetric].low}
              stroke="#10b981" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: `Low ${labRefRanges[labMetric].low}`, position: "left", fontSize: 9, fill: "#10b981" }} />
            <ReferenceLine y={labRefRanges[labMetric].high}
              stroke="#10b981" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: `High ${labRefRanges[labMetric].high}`, position: "left", fontSize: 9, fill: "#10b981" }} />
            <XAxis dataKey="cycle" tick={{ fontSize: 12, fill: "#898989" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false}
              label={{ value: "Cycle", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#898989" }} />
            <YAxis tick={{ fontSize: 11, fill: "#898989" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} width={50}
              domain={[0, (max: number) => Math.ceil(max * 1.3)]}
              label={{ value: labMetrics.find(m => m.key === labMetric)?.unit ?? "", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#898989" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Area type="linear" dataKey={labMetric} stroke="#674BB3" strokeWidth={2}
              fill="url(#labFill)"
              dot={{ r: 5, fill: "#674BB3", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 7, fill: "#674BB3", stroke: "#674BB3", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
