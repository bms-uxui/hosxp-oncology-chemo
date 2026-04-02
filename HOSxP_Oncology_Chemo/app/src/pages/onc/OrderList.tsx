import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search, SlidersHorizontal, Plus, ChevronRight,
  FileText, Calendar, User, FlaskConical,
} from "lucide-react";

/* ══════════════════════════════════════════════
   OrderList — Chemotherapy Orders
   ══════════════════════════════════════════════ */

type OrderStatus =
  | "draft"
  | "pending_verify"
  | "verified"
  | "compounding"
  | "ready"
  | "administered"
  | "completed"
  | "rejected"
  | "cancelled";

interface ChemoOrder {
  id: string;
  orderNo: string;
  patientName: string;
  hn: string;
  protocol: string;
  cycle: string;
  date: string;
  doctor: string;
  status: OrderStatus;
}

/* ── Status config ── */
const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  draft:          { label: "ร่าง",           bg: "bg-gray-100",    text: "text-gray-600" },
  pending_verify: { label: "รอ Verify",      bg: "bg-amber-50",    text: "text-amber-700" },
  verified:       { label: "Verified",       bg: "bg-blue-50",     text: "text-blue-700" },
  compounding:    { label: "กำลังเตรียมยา",    bg: "bg-purple-50",   text: "text-purple-700" },
  ready:          { label: "พร้อมให้ยา",      bg: "bg-cyan-50",     text: "text-cyan-700" },
  administered:   { label: "ให้ยาแล้ว",       bg: "bg-green-50",    text: "text-green-700" },
  completed:      { label: "เสร็จสิ้น",       bg: "bg-gray-100",    text: "text-gray-600" },
  rejected:       { label: "Rejected",       bg: "bg-red-50",      text: "text-red-700" },
  cancelled:      { label: "ยกเลิก",         bg: "bg-red-50",      text: "text-red-600" },
};

/* ── Filter tabs ── */
const filterTabs: { label: string; value: OrderStatus | "all" }[] = [
  { label: "ทั้งหมด",       value: "all" },
  { label: "รอ Verify",    value: "pending_verify" },
  { label: "Verified",     value: "verified" },
  { label: "เตรียมยา",      value: "compounding" },
  { label: "พร้อมให้ยา",    value: "ready" },
  { label: "ให้ยาแล้ว",     value: "administered" },
  { label: "เสร็จสิ้น",     value: "completed" },
];

/* ── Mock data ── */
const mockOrders: ChemoOrder[] = [
  { id: "1", orderNo: "ONC-2569-0041", patientName: "นางคำปุ่น เสนาหอย",    hn: "104365", protocol: "CAF",       cycle: "Cycle 2/6 Day 1",   date: "27 มี.ค. 69", doctor: "นพ.สมชาย รักษาดี",     status: "pending_verify" },
  { id: "2", orderNo: "ONC-2569-0040", patientName: "นายบุญมี ดีใจ",        hn: "205471", protocol: "FOLFOX6",   cycle: "Cycle 5/12 Day 1",  date: "27 มี.ค. 69", doctor: "พญ.วิภา ศรีสุข",       status: "verified" },
  { id: "3", orderNo: "ONC-2569-0039", patientName: "นางเพ็ญ ใจสว่าง",      hn: "308892", protocol: "CARBO-PAC", cycle: "Cycle 1/6 Day 1",   date: "27 มี.ค. 69", doctor: "นพ.สมชาย รักษาดี",     status: "compounding" },
  { id: "4", orderNo: "ONC-2569-0038", patientName: "นายสมศักดิ์ ชัยมงคล",   hn: "412230", protocol: "GEM",       cycle: "Cycle 4/6 Day 8",   date: "27 มี.ค. 69", doctor: "พญ.วิภา ศรีสุข",       status: "ready" },
  { id: "5", orderNo: "ONC-2569-0037", patientName: "นางสาวมาลี สุขใจ",     hn: "519087", protocol: "AC-T",      cycle: "Cycle 3/8 Day 1",   date: "26 มี.ค. 69", doctor: "นพ.สมชาย รักษาดี",     status: "administered" },
  { id: "6", orderNo: "ONC-2569-0036", patientName: "นายอุดม พัฒนา",        hn: "620145", protocol: "R-CHOP",    cycle: "Cycle 6/6 Day 1",   date: "26 มี.ค. 69", doctor: "นพ.ประยุทธ์ จันทร์ดี",   status: "completed" },
  { id: "7", orderNo: "ONC-2569-0035", patientName: "นางสมจิตร ทองดี",      hn: "731456", protocol: "CAF",       cycle: "Cycle 1/6 Day 1",   date: "25 มี.ค. 69", doctor: "พญ.วิภา ศรีสุข",       status: "rejected" },
  { id: "8", orderNo: "ONC-2569-0034", patientName: "นายวิชัย เจริญสุข",     hn: "842567", protocol: "FOLFOX6",   cycle: "Cycle 3/12 Day 1",  date: "25 มี.ค. 69", doctor: "นพ.ประยุทธ์ จันทร์ดี",   status: "draft" },
];

/* ══════════════════════════════════════════════ */
export default function OrderList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => {
    let result = mockOrders;

    // Status filter
    if (activeTab !== "all") {
      result = result.filter((o) => o.status === activeTab);
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.hn.includes(q) ||
          o.patientName.toLowerCase().includes(q) ||
          o.orderNo.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeTab]);

  const hasOrders = mockOrders.length > 0;

  return (
    <div className="min-h-full space-y-4">

      {/* ── Title ── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-[#836e69]">Chemotherapy Orders</p>
          <h1 className="text-[32px] font-bold text-black leading-tight">รายการ Order</h1>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3"
        style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา HN, ชื่อผู้ป่วย, Order No..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f7f7f7] text-[13px] text-[#404040] placeholder:text-[#b0b0b0] outline-none focus:ring-2 focus:ring-[#674BB3]/30 transition-all"
          />
        </div>

        {/* Filter button */}
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#e5e5e5] text-[12px] font-medium text-[#898989] hover:bg-gray-50 transition-all">
          <SlidersHorizontal size={14} />
          <span>ตัวกรอง</span>
        </button>

        {/* New order button */}
        <button
          onClick={() => navigate("/onc/order-entry")}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#674BB3] text-white text-[12px] font-bold hover:bg-[#563AA4] transition-all shadow-sm"
        >
          <Plus size={14} />
          <span>สั่งยาใหม่</span>
        </button>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const count =
            tab.value === "all"
              ? mockOrders.length
              : mockOrders.filter((o) => o.status === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-[#674BB3] text-white shadow-sm"
                  : "text-[#898989] hover:bg-gray-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-[#898989]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.08)" }}>

        {!hasOrders ? (
          /* Empty state — no orders at all */
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center">
              <FileText size={28} className="text-[#b0b0b0]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#404040]">ยังไม่มี Order</p>
              <p className="text-[13px] text-[#898989] mt-1">กดปุ่ม สั่งยาใหม่ เพื่อเริ่มต้น</p>
            </div>
            <button
              onClick={() => navigate("/onc/order-entry")}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#674BB3] text-white text-[12px] font-bold hover:bg-[#563AA4] transition-all shadow-sm mt-2"
            >
              <Plus size={14} />
              <span>สั่งยาใหม่</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state — no search results */
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center">
              <Search size={28} className="text-[#b0b0b0]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#404040]">ไม่มีรายการที่ค้นหา</p>
              <p className="text-[13px] text-[#898989] mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          </div>
        ) : (
          /* Table */
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-6 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} />
                    Order No
                  </div>
                </th>
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    ผู้ป่วย / HN
                  </div>
                </th>
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical size={12} />
                    Protocol
                  </div>
                </th>
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-4 py-3.5">
                  Cycle
                </th>
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    วันที่ให้ยา
                  </div>
                </th>
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-4 py-3.5">
                  แพทย์
                </th>
                <th className="text-left text-[11px] font-bold text-[#898989] uppercase tracking-wider px-4 py-3.5">
                  สถานะ
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const sc = statusConfig[order.status];
                return (
                  <tr
                    key={order.id}
                    onClick={() => console.log("Navigate to order detail:", order.orderNo)}
                    className="border-b border-[#f7f7f7] last:border-0 hover:bg-[#fafafa] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-bold text-[#674BB3]">{order.orderNo}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-bold text-[#404040]">{order.patientName}</p>
                      <p className="text-[11px] text-[#898989]">HN: {order.hn}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[12px] font-bold text-[#404040] bg-[#f7f7f7] px-2.5 py-1 rounded-lg">
                        {order.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[12px] text-[#404040]">{order.cycle}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[12px] text-[#404040]">{order.date}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[12px] text-[#404040]">{order.doctor}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <ChevronRight size={16} className="text-[#d0d0d0] group-hover:text-[#898989] transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer summary ── */}
      {hasOrders && filtered.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[12px] text-[#898989]">
            แสดง {filtered.length} จาก {mockOrders.length} รายการ
          </p>
        </div>
      )}
    </div>
  );
}
