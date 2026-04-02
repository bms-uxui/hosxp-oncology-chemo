import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

/* ══════════════════════════════════════════════
   CalendarMiniWidget — shadcn-inspired mini calendar
   Today highlighted, event dots, month navigation,
   upcoming appointments list
   ══════════════════════════════════════════════ */

/* ── Event data per day ── */
interface DayEvent {
  name: string;
  regimen: string;
  time: string;
  color: string;
}

const EVENTS: Record<string, DayEvent[]> = {
  "2026-03-24": [
    { name: "นางคำปุ่น เสนาหอย", regimen: "CAF C2D1", time: "09:00", color: "#674BB3" },
    { name: "นายบุญมี ดีใจ", regimen: "FOLFOX6 C5D1", time: "10:00", color: "#6366f1" },
    { name: "นางเพ็ญ ใจสว่าง", regimen: "CARBO-PAC C1D1", time: "10:30", color: "#f59e0b" },
    { name: "นายสมศักดิ์ ชัยมงคล", regimen: "GEM C4D8", time: "13:00", color: "#10b981" },
    { name: "นางสาวมาลี สุขใจ", regimen: "AC-T C3D1", time: "13:30", color: "#674BB3" },
    { name: "นายอุดม พัฒนา", regimen: "R-CHOP C2D1", time: "14:00", color: "#64748b" },
  ],
  "2026-03-25": [
    { name: "นางเพ็ญ ใจสว่าง", regimen: "CARBO-PAC C1D2", time: "09:00", color: "#674BB3" },
    { name: "นายสุรชัย วงศ์วาน", regimen: "FOLFOX6 C8D1", time: "10:00", color: "#6366f1" },
    { name: "นางสุภา รักษ์ดี", regimen: "CAF C6D1", time: "13:00", color: "#f59e0b" },
    { name: "นางอรุณ เรืองศรี", regimen: "CAF C5D1", time: "14:00", color: "#674BB3" },
  ],
  "2026-03-26": [
    { name: "นายบุญมี ดีใจ", regimen: "FOLFOX6 C5D2", time: "09:00", color: "#6366f1" },
    { name: "นางคำปุ่น เสนาหอย", regimen: "CAF C2D8", time: "09:30", color: "#674BB3" },
    { name: "นางสาวมาลี สุขใจ", regimen: "AC-T C3D2", time: "10:00", color: "#10b981" },
    { name: "นายสมศักดิ์ ชัยมงคล", regimen: "GEM C4D9", time: "10:30", color: "#f59e0b" },
    { name: "นางเพ็ญ ใจสว่าง", regimen: "CARBO-PAC C1D3", time: "13:00", color: "#674BB3" },
    { name: "นายอุดม พัฒนา", regimen: "R-CHOP C2D2", time: "13:30", color: "#6366f1" },
    { name: "นางสุภา รักษ์ดี", regimen: "CAF C6D2", time: "14:00", color: "#f59e0b" },
    { name: "นางอรุณ เรืองศรี", regimen: "CAF C5D8", time: "14:30", color: "#674BB3" },
  ],
  "2026-03-27": [
    { name: "นายบุญมี ดีใจ", regimen: "FOLFOX6 C6D1", time: "09:30", color: "#f59e0b" },
    { name: "นางคำปุ่น เสนาหอย", regimen: "CAF C2D15", time: "10:00", color: "#674BB3" },
    { name: "นางสาวมาลี สุขใจ", regimen: "AC-T C3D8", time: "13:00", color: "#10b981" },
  ],
  "2026-03-28": [
    { name: "นายสมศักดิ์ ชัยมงคล", regimen: "GEM C5D1", time: "09:00", color: "#674BB3" },
    { name: "นางเพ็ญ ใจสว่าง", regimen: "CARBO-PAC C1D8", time: "10:00", color: "#6366f1" },
    { name: "นายอุดม พัฒนา", regimen: "R-CHOP C3D1", time: "13:00", color: "#f59e0b" },
    { name: "นางอรุณ เรืองศรี", regimen: "CAF C5D15", time: "14:00", color: "#674BB3" },
    { name: "นางสุภา รักษ์ดี", regimen: "CAF C6D8", time: "14:30", color: "#10b981" },
  ],
  "2026-03-31": [
    { name: "นางคำปุ่น เสนาหอย", regimen: "CAF C3D1", time: "09:00", color: "#674BB3" },
    { name: "นายบุญมี ดีใจ", regimen: "FOLFOX6 C6D2", time: "09:30", color: "#6366f1" },
    { name: "นางเพ็ญ ใจสว่าง", regimen: "CARBO-PAC C2D1", time: "10:00", color: "#f59e0b" },
    { name: "นายสมศักดิ์ ชัยมงคล", regimen: "GEM C5D2", time: "10:30", color: "#10b981" },
    { name: "นางสาวมาลี สุขใจ", regimen: "AC-T C4D1", time: "13:00", color: "#674BB3" },
    { name: "นายอุดม พัฒนา", regimen: "R-CHOP C3D2", time: "13:30", color: "#6366f1" },
    { name: "นางอรุณ เรืองศรี", regimen: "CAF C6D1", time: "14:00", color: "#f59e0b" },
  ],
};

/* ── Helpers ── */
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const DAY_HEADERS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const days: { day: number; inMonth: boolean; key: string }[] = [];

  // Previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    days.push({ day: d, inMonth: false, key: toKey(py, pm, d) });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, inMonth: true, key: toKey(year, month, d) });
  }

  // Next month (fill to 42 or nearest full week)
  const rows = Math.ceil(days.length / 7);
  const total = rows * 7;
  for (let d = 1; days.length < total; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    days.push({ day: d, inMonth: false, key: toKey(ny, nm, d) });
  }

  return days;
}

export default function CalendarMiniWidget() {
  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);

  const days = getCalendarGrid(viewYear, viewMonth);
  const selectedEvents = EVENTS[selectedKey] ?? [];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedKey(todayKey);
  }

  const thaiYear = viewYear + 543;

  return (
    <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#674BB3]" />
          <h3 className="text-sm font-bold text-[#404040]">
            {THAI_MONTHS[viewMonth]} {thaiYear}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goToday}
            className="text-[10px] font-medium text-[#674BB3] hover:bg-[#674BB3]/10 px-2 py-1 rounded-lg transition-all">
            วันนี้
          </button>
          <button onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#898989] transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#898989] transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="px-4 grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[#898989] py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="px-4 pb-3 grid grid-cols-7">
        {days.map((d, i) => {
          const isToday = d.key === todayKey;
          const isSelected = d.key === selectedKey;
          const events = EVENTS[d.key] ?? [];
          const hasEvents = events.length > 0;

          return (
            <button
              key={i}
              onClick={() => setSelectedKey(d.key)}
              className={`relative flex flex-col items-center justify-center h-10 rounded-xl text-[12px] transition-all ${
                !d.inMonth ? "text-[#d1d1d1]"
                  : isSelected && isToday ? "bg-[#674BB3] text-white font-bold shadow-sm"
                  : isSelected ? "bg-[#674BB3]/10 text-[#674BB3] font-bold ring-1 ring-[#674BB3]/30"
                  : isToday ? "font-bold text-[#674BB3]"
                  : "text-[#404040] hover:bg-gray-50"
              }`}
            >
              <span>{d.day}</span>
              {/* Event dots */}
              {hasEvents && !(isSelected && isToday) && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {events.slice(0, 3).map((e, j) => (
                    <div key={j} className="w-1 h-1 rounded-full" style={{ background: isSelected ? "#674BB3" : e.color }} />
                  ))}
                  {events.length > 3 && <div className="w-1 h-1 rounded-full bg-[#898989]" />}
                </div>
              )}
              {/* Count badge on today+selected */}
              {isSelected && isToday && hasEvents && (
                <span className="text-[7px] font-medium leading-none opacity-80">{events.length} นัด</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="h-px bg-[#f0f0f0] mx-4" />

      {/* Selected day events */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-bold text-[#898989] mb-3">
          {selectedKey === todayKey ? "นัดหมายวันนี้" : `นัดหมาย ${parseInt(selectedKey.split("-")[2])} ${THAI_MONTHS[parseInt(selectedKey.split("-")[1]) - 1]}`}
          {selectedEvents.length > 0 && (
            <span className="ml-1.5 text-[10px] font-medium text-white bg-[#674BB3] px-1.5 py-0.5 rounded-md">
              {selectedEvents.length}
            </span>
          )}
        </p>

        {selectedEvents.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {selectedEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: e.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-[#404040] leading-tight truncate">{e.name}</p>
                  <p className="text-[10px] text-[#898989] leading-tight">{e.regimen}</p>
                </div>
                <span className="text-[11px] font-medium text-[#404040] shrink-0">{e.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#898989] text-center py-4">ไม่มีนัดหมาย</p>
        )}
      </div>
    </div>
  );
}
