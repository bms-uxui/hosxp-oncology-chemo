const card = "bg-white rounded-2xl p-5 border-[0.1px] border-[#d9d9d9]/25";

function getCtcaeGrade(value: number, ctcae?: number[]): number {
  if (!ctcae) return 0;
  if (value < ctcae[2]) return 3;
  if (value < ctcae[1]) return 2;
  if (value < ctcae[0]) return 1;
  return 0;
}

function getLabStatus(value: number, low: number, high: number, critLow?: number): { label: string; color: string; bg: string } {
  if (critLow !== undefined && value < critLow) return { label: "วิกฤต", color: "#dc2626", bg: "#fef2f2" };
  if (value < low) return { label: "ต่ำ", color: "#f59e0b", bg: "#fffbeb" };
  if (value > high) return { label: "สูง", color: "#f59e0b", bg: "#fffbeb" };
  return { label: "ปกติ", color: "#10b981", bg: "#ecfdf5" };
}

type LabItem = {
  name: string; value: number; prev: number; low: number; high: number;
  critLow: number | undefined; unit: string; ctcae: number[] | undefined;
};

interface LabResultsTableProps {
  labData: LabItem[];
  className?: string;
}

export default function LabResultsTable({ labData, className = "" }: LabResultsTableProps) {
  return (
    <div className={`${card} ${className}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h3 className="text-sm font-bold text-[#404040] mb-4">ผลตรวจ Lab ล่าสุด</h3>
      <table className="w-full">
        <thead>
          <tr className="text-xs text-[#898989] border-b border-gray-100">
            <th className="text-left font-semibold pb-3 pl-1">Parameter</th>
            <th className="text-left font-semibold pb-3">Result</th>
            <th className="text-left font-semibold pb-3">Reference Range</th>
            <th className="text-center font-semibold pb-3 pr-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {labData.map((l) => {
            const status = getLabStatus(l.value, l.low, l.high, l.critLow);
            const grade = getCtcaeGrade(l.value, l.ctcae);
            return (
              <tr key={l.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 pl-1 text-sm font-semibold text-[#404040]">{l.name}</td>
                <td className="py-3 text-sm text-[#404040]">
                  <span className="font-bold">{l.value}</span> <span className="text-[#898989]">{l.unit}</span>
                </td>
                <td className="py-3 text-sm text-[#898989]">{l.low}–{l.high} {l.unit}</td>
                <td className="py-3 pr-1 text-center">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                    style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                  {grade > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1.5 ${
                      grade >= 3 ? "text-red-600 bg-red-50" : grade >= 2 ? "text-orange-600 bg-orange-50" : "text-amber-600 bg-amber-50"
                    }`}>
                      G{grade}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
