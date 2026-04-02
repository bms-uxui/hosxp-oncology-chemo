import { useNavigate } from "react-router";
import { useState } from "react";
import { UserPlus, Search, Filter } from "lucide-react";
import { useOnc, roleLabels } from "../../components/onc/OncContext";
import PatientAvatar from "../../components/onc/PatientAvatar";

/* ══════════════════════════════════════════════
   Overview — Home page (Figma: purple theme)
   Banner + Pipeline + Patient Table
   ══════════════════════════════════════════════ */

const B = "/hosxp-oncology-chemo/onc";

const pipeline = [
  { avatar: `${B}/avatar-doctor.png`, label: "รอตรวจสอบ", count: 1, sublabel: "รอแพทย์สั่งยา", color: "#674BB3" },
  { avatar: `${B}/avatar-pharmacist.png`, label: "รอตรวจสอบ", count: 30, sublabel: "เภสัชกรตรวจสอบ", color: "#6366f1", imgClass: "h-28 right-1 -bottom-8" },
  { avatar: `${B}/avatar-compound.png`, label: "เตรียมยา", count: 12, sublabel: "เตรียมผสมยาเคมี", color: "#f59e0b", imgClass: "h-28 right-1 -bottom-8" },
  { avatar: `${B}/avatar-nurse.png`, label: "ผู้ป่วยรอให้ยา", count: 25, sublabel: "รอพยาบาลให้ยา", color: "#10b981" },
  { avatar: `${B}/avatar-complete.png`, label: "ให้ยาครบ", count: 25, sublabel: "ให้ยาครบแล้ว", color: "#64748b" },
];

/*
  Chemo Order ID (orderId) is the key identifier that tracks each order
  through the entire workflow:
    1. DRAFT      → Doctor creates order in Order Entry
    2. SUBMITTED  → Doctor signs with PIN → orderId generated (CHEMO-YYYYMMDD-XXXX)
    3. VERIFIED   → Pharmacist reviews & approves
    4. PREPARED   → Compounding room prepares drugs
    5. ADMINISTERED → Nurse administers to patient
    6. COMPLETED  → All drugs given, order closed
*/
const patients = [
  { hn: "104365", orderId: "CHEMO-20690312-0001", name: "นางคำปุ่น เสนาหอย", age: "54", gender: "หญิง", regimen: "CAF", cycle: "C2/6", doctor: "นพ.สมชาย รักษาดี", status: "รอแพทย์สั่งยา", statusColor: "#674BB3", date: "12 ก.ย. 69" },
  { hn: "205471", orderId: "CHEMO-20690312-0002", name: "นายบุญมี ดีใจ", age: "68", gender: "ชาย", regimen: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา ศรีสุข", status: "เภสัชกรตรวจสอบ", statusColor: "#6366f1", date: "12 ก.ย. 69" },
  { hn: "308892", orderId: "CHEMO-20690313-0003", name: "นางเพ็ญ ใจสว่าง", age: "61", gender: "หญิง", regimen: "CARBO-PAC", cycle: "C1/6", doctor: "นพ.สมชาย รักษาดี", status: "เตรียมผสมยาเคมี", statusColor: "#f59e0b", date: "13 ก.ย. 69" },
  { hn: "412230", orderId: "CHEMO-20690313-0004", name: "นายสมศักดิ์ ชัยมงคล", age: "72", gender: "ชาย", regimen: "GEM", cycle: "C4/6", doctor: "พญ.วิภา ศรีสุข", status: "รอพยาบาลให้ยา", statusColor: "#10b981", date: "13 ก.ย. 69" },
  { hn: "519087", orderId: "CHEMO-20690314-0005", name: "นางสาวมาลี สุขใจ", age: "52", gender: "หญิง", regimen: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย รักษาดี", status: "ให้ยาครบแล้ว", statusColor: "#64748b", date: "14 ก.ย. 69" },
  { hn: "620145", orderId: "CHEMO-20690315-0006", name: "นายอุดม พัฒนา", age: "45", gender: "ชาย", regimen: "R-CHOP", cycle: "C2/6", doctor: "นพ.ประยุทธ์ จันทร์ดี", status: "รอแพทย์สั่งยา", statusColor: "#674BB3", date: "15 ก.ย. 69" },
  { hn: "731256", orderId: "CHEMO-20690315-0007", name: "นางอรุณ เรืองศรี", age: "59", gender: "หญิง", regimen: "CAF", cycle: "C5/6", doctor: "นพ.สมชาย รักษาดี", status: "รอพยาบาลให้ยา", statusColor: "#10b981", date: "15 ก.ย. 69" },
  { hn: "842367", orderId: "CHEMO-20690314-0008", name: "นายสุรชัย วงศ์วาน", age: "63", gender: "ชาย", regimen: "FOLFOX6", cycle: "C8/12", doctor: "พญ.วิภา ศรีสุข", status: "ให้ยาครบแล้ว", statusColor: "#64748b", date: "14 ก.ย. 69" },
  { hn: "953478", orderId: "CHEMO-20690316-0009", name: "นางสุภา รักษ์ดี", age: "50", gender: "หญิง", regimen: "CARBO-PAC", cycle: "C3/6", doctor: "นพ.ประยุทธ์ จันทร์ดี", status: "เภสัชกรตรวจสอบ", statusColor: "#6366f1", date: "16 ก.ย. 69" },
  { hn: "164589", orderId: "CHEMO-20690316-0010", name: "นายวิชัย ใจดี", age: "70", gender: "ชาย", regimen: "GEM", cycle: "C2/4", doctor: "พญ.วิภา ศรีสุข", status: "เตรียมผสมยาเคมี", statusColor: "#f59e0b", date: "16 ก.ย. 69" },
  { hn: "275690", orderId: "CHEMO-20690317-0011", name: "นางนภา แก้วใส", age: "48", gender: "หญิง", regimen: "AC-T", cycle: "C1/4", doctor: "นพ.สมชาย รักษาดี", status: "รอแพทย์สั่งยา", statusColor: "#674BB3", date: "17 ก.ย. 69" },
  { hn: "386701", orderId: "CHEMO-20690317-0012", name: "นายประสิทธิ์ ทองคำ", age: "66", gender: "ชาย", regimen: "FOLFOX6", cycle: "C3/12", doctor: "พญ.วิภา ศรีสุข", status: "รอพยาบาลให้ยา", statusColor: "#10b981", date: "17 ก.ย. 69" },
];

export default function Overview() {
  const navigate = useNavigate();
  const { role, setSearchOpen } = useOnc();
  const roleName = roleLabels[role]?.split(" (")[0] ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });

  const statusFilters = [
    { label: "ทั้งหมด", value: null },
    { label: "รอแพทย์สั่งยา", value: "รอแพทย์สั่งยา", color: "#674BB3" },
    { label: "เภสัชกรตรวจสอบ", value: "เภสัชกรตรวจสอบ", color: "#6366f1" },
    { label: "เตรียมผสมยาเคมี", value: "เตรียมผสมยาเคมี", color: "#f59e0b" },
    { label: "รอพยาบาลให้ยา", value: "รอพยาบาลให้ยา", color: "#10b981" },
    { label: "ให้ยาครบแล้ว", value: "ให้ยาครบแล้ว", color: "#64748b" },
  ];

  const filtered = patients.filter(p => {
    if (search && !p.name.includes(search) && !p.hn.includes(search) && !p.regimen.toLowerCase().includes(search.toLowerCase()) && !p.orderId.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4 overflow-hidden">

      {/* ── Banner ── */}
      <div className="rounded-3xl overflow-hidden relative shrink-0" style={{ background: "#DEDFFF", minHeight: 160 }}>
        {/* Ribbon decoration left */}
        <img src={`${B}/ribbon-left.svg`} className="absolute -left-2 bottom-0 h-14 opacity-50" alt="" />
        {/* 3D illustration right — overflows bottom */}
        <img src={`${B}/banner-3d.png`} className="absolute right-0 -bottom-8 h-52 object-contain" alt="" />
        {/* Content */}
        <div className="relative z-10 px-8 py-6 flex flex-col justify-between h-full">
          <div>
            <h1 className="text-xl font-bold text-[#674BB3]">สวัสดี, {roleName}</h1>
            <p className="text-sm text-[#674BB3]/70 mt-1 max-w-md">จัดการคำสั่งยา ติดตามสถานะ และดูแลผู้ป่วยได้ในที่เดียว</p>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => navigate("/onc/patients")}
              className="group/btn flex items-center gap-2 px-6 py-3 bg-[#674BB3] text-white text-sm font-semibold rounded-xl hover:bg-[#563AA4] transition-colors">
              <UserPlus size={18} /> ลงทะเบียนผู้ป่วยใหม่
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-5 gap-4 shrink-0">
        {pipeline.map((s, i) => (
          <div key={i}
            className="bg-white rounded-2xl p-4 text-left overflow-hidden relative"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p className="text-sm" style={{ color: s.color + "cc" }}>{s.sublabel}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.count}</p>
            {/* Illustration */}
            <img src={s.avatar} className={`absolute object-contain object-bottom ${(s as any).imgClass ?? "h-24 -right-2 -bottom-4"}`} alt="" />
          </div>
        ))}
      </div>

      {/* ── Patient Table Card ── */}
      <div className="bg-white rounded-3xl overflow-hidden flex-1 min-h-0 flex flex-col" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Filter + Search inside card */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา HN, ชื่อ, Protocol..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <Filter size={14} className="text-[#898989] shrink-0" />
            {statusFilters.map(f => (
              <button key={f.label} onClick={() => setStatusFilter(f.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  statusFilter === f.value
                    ? "text-white"
                    : "text-[#898989] hover:bg-gray-100"
                }`}
                style={statusFilter === f.value ? { background: f.color ?? "#674BB3" } : {}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 mx-4 mb-4 rounded-2xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 sticky top-0 z-10">
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">ผู้ป่วย</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">HN</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">Order ID</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">Protocol</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">Cycle</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">แพทย์</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">วันที่</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-[#898989]">ไม่พบผู้ป่วยที่ค้นหา</td></tr>
              )}
              {filtered.map((p, i) => (
                <tr key={i} onClick={() => navigate(`/onc/patients/${p.hn}`)}
                  onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, show: true })}
                  onMouseLeave={() => setTooltip(prev => ({ ...prev, show: false }))}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer group/row relative">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PatientAvatar hn={p.hn} size={40} />
                      <div>
                        <p className="text-sm font-semibold text-[#404040]">{p.name}</p>
                        <p className="text-xs text-[#898989]">{p.gender} · {p.age} ปี</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#404040] font-mono">{p.hn}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono font-semibold text-[#674BB3] bg-[#674BB3]/5 px-2 py-1 rounded-lg">{p.orderId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#674BB3] bg-[#674BB3]/10 px-2 py-1 rounded-lg">{p.regimen}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#404040]">{p.cycle}</td>
                  <td className="px-4 py-3 text-sm text-[#898989]">{p.doctor}</td>
                  <td className="px-4 py-3 text-sm text-[#898989]">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                      style={{ background: p.statusColor }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cursor-following tooltip */}
      {tooltip.show && (
        <div className="fixed z-50 pointer-events-none bg-[#404040] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          ดูรายละเอียด
        </div>
      )}
    </div>
  );
}
