const card = "bg-white rounded-2xl p-5 border-[0.1px] border-[#d9d9d9]/25";

type HistoryEvent = {
  date: string; cycle: string; regimen: string; status: "current" | "done"; doctor: string;
  drugs: { name: string; dose: string; route: string; duration: string }[];
  labs: { anc: number; plt: number; hb: number };
  note: string; sideEffects: string[];
};

interface TreatmentHistoryProps {
  events: HistoryEvent[];
}

export default function TreatmentHistory({ events }: TreatmentHistoryProps) {
  return (
    <>
      {events.map((evt, i, arr) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0 w-6">
            <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${
              evt.status === "current" ? "bg-[#674BB3] ring-4 ring-[#674BB3]/20" : "bg-emerald-500"
            }`} />
            {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
          </div>
          <div className={`flex-1 mb-4 ${card}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-[#404040]">{evt.date}</span>
                {evt.cycle !== "—" && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    evt.status === "current" ? "bg-[#674BB3]/10 text-[#674BB3]" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {evt.regimen} {evt.cycle}
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold ${evt.status === "current" ? "text-[#674BB3]" : "text-emerald-600"}`}>
                {evt.status === "current" ? "กำลังดำเนินการ" : "เสร็จสิ้น"}
              </span>
            </div>

            <p className="text-base text-[#404040] mb-3">{evt.note}</p>

            {evt.drugs.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-[#898989] uppercase tracking-wide mb-2">ยาที่ให้</p>
                <div className="flex flex-wrap gap-2">
                  {evt.drugs.map(d => (
                    <span key={d.name} className="text-sm bg-gray-50 border border-gray-100 text-[#404040] px-3 py-1.5 rounded-lg">
                      <span className="font-semibold">{d.name}</span> {d.dose} · {d.route} · {d.duration}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-5 text-sm">
              <span className="text-[#898989]">Lab:</span>
              <span className="text-[#404040]">ANC <span className="font-bold">{evt.labs.anc}</span></span>
              <span className="text-[#404040]">PLT <span className="font-bold">{evt.labs.plt}</span></span>
              <span className="text-[#404040]">Hb <span className="font-bold">{evt.labs.hb}</span></span>
            </div>

            {evt.sideEffects.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-[#898989]">ผลข้างเคียง:</span>
                {evt.sideEffects.map(se => (
                  <span key={se} className="text-sm font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">{se}</span>
                ))}
              </div>
            )}

            <p className="text-sm text-[#898989] mt-3">แพทย์: {evt.doctor}</p>
          </div>
        </div>
      ))}
    </>
  );
}
