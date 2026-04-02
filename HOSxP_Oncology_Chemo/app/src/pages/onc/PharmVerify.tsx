import { useState } from "react";
import {
  CheckCircle2, XCircle, Lock, Search, Clock,
  FileText, AlertTriangle, User, ChevronDown,
  Shield, Pill, Filter, ArrowRight, Edit3,
} from "lucide-react";
import { useOnc } from "../../components/onc/OncContext";
import { Select, SelectItem } from "@heroui/react";

/* ══════════════════════════════════════════════
   Pharmacist Verification Worklist
   Ref: Spec §Stage 2 — "Pharmacist Verification"
   Status: SUBMITTED → VERIFIED or REJECTED
   ══════════════════════════════════════════════ */

type OrderStatus = "SUBMITTED" | "VERIFIED" | "REJECTED";

type OrderItem = {
  name: string; dose: string; route: string; method: string;
  calcDose: number; finalDose: number; diluent: string; rate: string;
};

type Order = {
  id: string; hn: string; name: string; age: number;
  diagnosis: string; protocol: string; cycle: number; day: number;
  doctor: string; ward: string; submittedAt: string;
  status: OrderStatus; items: OrderItem[];
  labs: { name: string; value: number; ref: string; ok: boolean }[];
  adjustedBy?: string; adjustReason?: string;
};

const mockOrders: Order[] = [
  {
    id: "ORD-001", hn: "104558", name: "นาง คำปุ่น เสสาร", age: 55,
    diagnosis: "C50.9 — Breast Cancer", protocol: "CAF", cycle: 3, day: 1,
    doctor: "นพ.สมชาย", ward: "OPD เคมีบำบัด", submittedAt: "09:15",
    status: "SUBMITTED",
    items: [
      { name: "Ondansetron", dose: "8 mg", route: "IV", method: "FIXED", calcDose: 8, finalDose: 8, diluent: "NSS 50 ml", rate: "15 min" },
      { name: "Cyclophosphamide", dose: "500 mg/m²", route: "IV Infusion", method: "BSA", calcDose: 700, finalDose: 700, diluent: "D-5-W 100 ml", rate: "30 min" },
      { name: "Doxorubicin", dose: "50 mg/m²", route: "IV Push", method: "BSA", calcDose: 70, finalDose: 70, diluent: "D-5-W 50 ml", rate: "—" },
      { name: "5-FU", dose: "500 mg/m²", route: "IV Infusion", method: "BSA", calcDose: 700, finalDose: 700, diluent: "D-5-W 500 ml", rate: "4 hr" },
    ],
    labs: [
      { name: "ANC", value: 2.1, ref: "≥ 1.5", ok: true },
      { name: "PLT", value: 185, ref: "≥ 100", ok: true },
      { name: "Cr", value: 0.8, ref: "≤ 1.5", ok: true },
    ],
  },
  {
    id: "ORD-002", hn: "1234567", name: "นางสาวมาลี สุขใจ", age: 52,
    diagnosis: "C50.1 — Breast Cancer HER2+", protocol: "AC-T", cycle: 2, day: 1,
    doctor: "นพ.วิรัช", ward: "OPD เคมีบำบัด", submittedAt: "09:42",
    status: "SUBMITTED",
    items: [
      { name: "Doxorubicin", dose: "60 mg/m²", route: "IV Push", method: "BSA", calcDose: 97, finalDose: 97, diluent: "D-5-W 50 ml", rate: "15 min" },
      { name: "Cyclophosphamide", dose: "600 mg/m²", route: "IV Infusion", method: "BSA", calcDose: 972, finalDose: 972, diluent: "D-5-W 100 ml", rate: "30 min" },
    ],
    labs: [
      { name: "ANC", value: 1.3, ref: "≥ 1.5", ok: false },
      { name: "PLT", value: 98, ref: "≥ 100", ok: false },
      { name: "Cr", value: 0.9, ref: "≤ 1.5", ok: true },
    ],
  },
  {
    id: "ORD-003", hn: "5556677", name: "นายบุญมี ดีใจ", age: 68,
    diagnosis: "C18.0 — Colon Cancer", protocol: "FOLFOX6", cycle: 5, day: 1,
    doctor: "นพ.กมล", ward: "หอผู้ป่วย 4A", submittedAt: "10:05",
    status: "SUBMITTED",
    items: [
      { name: "Oxaliplatin", dose: "85 mg/m²", route: "IV Infusion", method: "BSA", calcDose: 144, finalDose: 144, diluent: "D-5-W 500 ml", rate: "2 hr" },
      { name: "Leucovorin", dose: "200 mg/m²", route: "IV Infusion", method: "BSA", calcDose: 340, finalDose: 340, diluent: "D-5-W 100 ml", rate: "2 hr" },
      { name: "5-FU (bolus)", dose: "400 mg/m²", route: "IV Push", method: "BSA", calcDose: 680, finalDose: 680, diluent: "—", rate: "—" },
    ],
    labs: [
      { name: "ANC", value: 3.2, ref: "≥ 1.5", ok: true },
      { name: "PLT", value: 210, ref: "≥ 100", ok: true },
      { name: "Cr", value: 1.1, ref: "≤ 1.5", ok: true },
    ],
  },
];

const reasonCodes = [
  "ขนาดยาถูกต้อง", "ปรับลด dose ตาม toxicity", "ปรับลด dose ตาม renal function",
  "ปรับลด dose ตาม hepatic function", "อื่นๆ",
];

/* ── Elapsed time helper ── */
function elapsed(t: string) {
  const [h, m] = t.split(":").map(Number);
  const now = new Date();
  const diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
  if (diff < 30) return { text: `${diff} นาที`, color: "text-success" };
  if (diff < 60) return { text: `${diff} นาที`, color: "text-warning" };
  return { text: `${Math.floor(diff / 60)} ชม ${diff % 60} น`, color: "text-danger" };
}

/* ══════════════════════════════════════════════ */
export default function PharmVerify() {
  const { verifyPin } = useOnc();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedId, setSelectedId] = useState<string | null>("ORD-001");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [showPin, setShowPin] = useState(false);
  const [pinAction, setPinAction] = useState<"verify" | "reject">("verify");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [doseAdjust, setDoseAdjust] = useState<Record<string, number>>({});
  const [adjustReason, setAdjustReason] = useState("");

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.name.includes(search) || o.hn.includes(search);
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selected = orders.find(o => o.id === selectedId);
  const hasLabIssue = selected?.labs.some(l => !l.ok) ?? false;

  /* ── PIN flow ── */
  function initAction(action: "verify" | "reject") {
    setPinAction(action);
    setShowPin(true);
    setPin(""); setPinError(false);
  }

  function handlePinComplete(p: string) {
    if (!verifyPin(p) || !selected) { setPinError(true); setPin(""); return; }
    setShowPin(false); setPin("");

    if (pinAction === "verify") {
      // Apply dose adjustments
      const updatedItems = selected.items.map(item => ({
        ...item,
        finalDose: doseAdjust[item.name] ?? item.finalDose,
      }));
      setOrders(prev => prev.map(o => o.id === selected.id
        ? { ...o, status: "VERIFIED" as OrderStatus, items: updatedItems, adjustedBy: "ภก.วิไล", adjustReason }
        : o
      ));
      // Auto-advance to next
      const next = orders.find(o => o.status === "SUBMITTED" && o.id !== selected.id);
      if (next) setSelectedId(next.id);
    } else {
      setOrders(prev => prev.map(o => o.id === selected.id
        ? { ...o, status: "REJECTED" as OrderStatus, adjustReason: rejectReason }
        : o
      ));
    }
    setDoseAdjust({});
    setAdjustReason("");
    setRejectReason("");
  }

  // Auto-submit PIN
  if (pin.length === 6 && showPin) {
    setTimeout(() => handlePinComplete(pin), 300);
  }

  const pendingCount = orders.filter(o => o.status === "SUBMITTED").length;

  return (
    <div className="flex h-full">
      {/* ═══ Left — Queue ═══ */}
      <div className="w-80 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Shield size={14} className="text-onc" /> Pharmacist Worklist
            </h2>
            <span className="text-xs font-bold bg-onc text-white px-2 py-0.5 rounded-full">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-background-alt rounded-xl">
            <Search size={13} className="text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="HN / ชื่อ..." className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <div className="flex gap-1">
            {(["ALL", "SUBMITTED", "VERIFIED", "REJECTED"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors ${
                  filterStatus === s ? "bg-onc text-white" : "bg-background-alt text-text-muted"
                }`}>
                {s === "ALL" ? "ทั้งหมด" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map(o => {
            const el = elapsed(o.submittedAt);
            const labWarn = o.labs.some(l => !l.ok);
            return (
              <button key={o.id} onClick={() => setSelectedId(o.id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                  selectedId === o.id ? "bg-onc-bg ring-1 ring-onc/30" : "hover:bg-background-alt"
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-text">{o.name}</span>
                  <span className={`text-[10px] font-semibold ${el.color}`}>{el.text}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span>HN {o.hn}</span>
                  <span className="font-semibold text-onc">{o.protocol} C{o.cycle}D{o.day}</span>
                  {labWarn && <AlertTriangle size={10} className="text-warning" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    o.status === "SUBMITTED" ? "bg-warning-bg text-warning" :
                    o.status === "VERIFIED" ? "bg-success-bg text-success" :
                    "bg-danger-bg text-danger"
                  }`}>{o.status}</span>
                  <span className="text-[9px] text-text-muted">{o.items.length} drugs · {o.doctor}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Right — Detail ═══ */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Shield size={40} className="text-border mx-auto mb-3" />
              <p className="text-sm text-text-muted">เลือกคำสั่งจากรายการด้านซ้าย</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold text-text">{selected.name} — {selected.protocol} C{selected.cycle}D{selected.day}</h1>
                <p className="text-xs text-text-muted mt-0.5">
                  HN {selected.hn} · {selected.diagnosis} · {selected.doctor} · {selected.ward} · สั่งเวลา {selected.submittedAt}
                </p>
              </div>
              {selected.status === "SUBMITTED" && (
                <div className="flex items-center gap-2">
                  <button onClick={() => initAction("reject")}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-danger border border-danger/30 rounded-xl hover:bg-danger-bg">
                    <XCircle size={13} /> Reject
                  </button>
                  <button onClick={() => initAction("verify")}
                    className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-onc rounded-xl hover:bg-onc/90 shadow-md shadow-onc/20">
                    <CheckCircle2 size={14} /> Verify + PIN
                  </button>
                </div>
              )}
              {selected.status !== "SUBMITTED" && (
                <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${
                  selected.status === "VERIFIED" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                }`}>
                  {selected.status}
                </span>
              )}
            </div>

            {/* Lab warning */}
            {hasLabIssue && (
              <div className="onc-alert-warn rounded-xl px-4 py-3 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> ค่า Lab บางตัวผิดปกติ — กรุณาตรวจสอบก่อน Verify
              </div>
            )}

            {/* Labs */}
            <div className="onc-card p-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FileText size={10} /> Lab at Order Time
              </p>
              <div className="flex gap-3">
                {selected.labs.map(l => (
                  <div key={l.name} className={`flex-1 rounded-xl px-3 py-2.5 text-center ${
                    l.ok ? "bg-background-alt" : "bg-danger-bg ring-1 ring-danger/20"
                  }`}>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">{l.name}</p>
                    <p className={`text-lg font-bold ${l.ok ? "text-text" : "text-danger"}`}>{l.value}</p>
                    <p className="text-[9px] text-text-muted">{l.ref}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drug table — Ref: Spec "dose adjustment with reason code" */}
            <div className="onc-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-bold text-text">รายการยา ({selected.items.length})</p>
                {selected.status === "SUBMITTED" && (
                  <div className="flex items-center gap-2">
                    <Select selectedKeys={adjustReason ? [adjustReason] : []} onSelectionChange={(keys) => setAdjustReason(Array.from(keys)[0] as string)}
                      size="sm" variant="bordered" placeholder="— Reason Code —">
                      {reasonCodes.map(r => <SelectItem key={r}>{r}</SelectItem>)}
                    </Select>
                  </div>
                )}
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border bg-background-alt/50">
                    <th className="px-4 py-2 text-left">Drug</th>
                    <th className="px-3 py-2 text-left">Route</th>
                    <th className="px-3 py-2 text-center">Method</th>
                    <th className="px-3 py-2 text-right">Calc</th>
                    <th className="px-3 py-2 text-right">Final</th>
                    {selected.status === "SUBMITTED" && <th className="px-3 py-2 text-right">Adjusted</th>}
                    <th className="px-3 py-2 text-left">Diluent</th>
                    <th className="px-3 py-2">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light text-sm">
                  {selected.items.map((item, i) => (
                    <tr key={i} className="hover:bg-background-alt/30">
                      <td className="px-4 py-3 font-semibold text-text">{item.name}</td>
                      <td className="px-3 py-3 text-xs text-text-muted">{item.route}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-onc-bg text-onc">{item.method}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-text-muted">{item.calcDose} mg</td>
                      <td className="px-3 py-3 text-right font-bold text-text">{item.finalDose} mg</td>
                      {selected.status === "SUBMITTED" && (
                        <td className="px-3 py-3 text-right">
                          <input type="number"
                            value={doseAdjust[item.name] ?? item.finalDose}
                            onChange={e => setDoseAdjust(prev => ({ ...prev, [item.name]: Number(e.target.value) }))}
                            className="w-20 px-2 py-1 text-sm text-right border border-border rounded-lg focus:outline-none focus:border-onc font-bold" />
                        </td>
                      )}
                      <td className="px-3 py-3 text-xs text-text-muted">{item.diluent}</td>
                      <td className="px-3 py-3 text-xs text-text-muted">{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reject reason */}
            {selected.status === "SUBMITTED" && (
              <div className="onc-card p-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">
                  หมายเหตุ (สำหรับ Reject)
                </label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="ระบุเหตุผลในการปฏิเสธคำสั่ง..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc resize-none" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PIN Modal ═══ */}
      {showPin && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="onc-card-raised p-8 w-80">
            <div className="text-center mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                pinAction === "verify" ? "bg-onc-bg" : "bg-danger-bg"
              }`}>
                <Lock size={20} className={pinAction === "verify" ? "text-onc" : "text-danger"} />
              </div>
              <h3 className="text-base font-bold text-text">
                {pinAction === "verify" ? "ยืนยัน Verify" : "ยืนยัน Reject"}
              </h3>
              <p className="text-[11px] text-text-muted mt-1">กรอก PIN เพื่อยืนยัน</p>
              {pinError && <p className="text-xs text-danger font-semibold mt-2">PIN ไม่ถูกต้อง</p>}
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                  i < pin.length ? "border-onc bg-onc-bg text-onc scale-105" : "border-border"
                }`}>{i < pin.length ? "●" : ""}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k => (
                <button key={k} disabled={!k || pin.length === 6}
                  onClick={() => { if (k === "⌫") { setPin(p => p.slice(0,-1)); setPinError(false); } else if (pin.length < 6) setPin(p => p+k); }}
                  className={`h-11 rounded-xl text-sm font-medium transition-all active:scale-95 ${k ? "bg-background-alt hover:bg-border text-text" : "opacity-0"}`}>{k}</button>
              ))}
            </div>
            <button onClick={() => { setShowPin(false); setPin(""); }} className="w-full py-2.5 text-sm border border-border rounded-xl text-text-muted hover:bg-background-alt">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
