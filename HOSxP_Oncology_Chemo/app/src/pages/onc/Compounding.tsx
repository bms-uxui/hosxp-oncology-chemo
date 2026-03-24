import { useState } from "react";
import {
  Beaker, Search, CheckCircle2, Lock, User,
  Package, AlertTriangle, ClipboardCheck, Hash,
  Calendar, Trash2,
} from "lucide-react";
import { useOnc } from "../../components/onc/OncContext";

/* ══════════════════════════════════════════════
   Compounding Worklist
   Ref: Spec §Stage 3 — lot/expiry tracking, waste
   Ref: V8.0 p.14 — inventory auto-deduct
   Status: VERIFIED → PREPARED
   ══════════════════════════════════════════════ */

type CompItem = {
  drug: string; dose: number; unit: string; diluent: string; diluentVol: number;
  lotNo: string; expiryDate: string; preparedQty: number; wasteQty: number;
  confirmed: boolean;
};

type CompOrder = {
  id: string; hn: string; name: string; protocol: string;
  cycle: number; day: number; ward: string; verifiedAt: string;
  status: "VERIFIED" | "PREPARED"; items: CompItem[];
};

const mockOrders: CompOrder[] = [
  {
    id: "CMP-001", hn: "104558", name: "นาง คำปุ่น เสสาร",
    protocol: "CAF", cycle: 3, day: 1, ward: "OPD เคมีบำบัด", verifiedAt: "09:30",
    status: "VERIFIED",
    items: [
      { drug: "Cyclophosphamide", dose: 700, unit: "mg", diluent: "D-5-W", diluentVol: 100, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0, confirmed: false },
      { drug: "Doxorubicin", dose: 70, unit: "mg", diluent: "D-5-W", diluentVol: 50, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0, confirmed: false },
      { drug: "5-FU", dose: 700, unit: "mg", diluent: "D-5-W", diluentVol: 500, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0, confirmed: false },
    ],
  },
  {
    id: "CMP-002", hn: "5556677", name: "นายบุญมี ดีใจ",
    protocol: "FOLFOX6", cycle: 5, day: 1, ward: "หอผู้ป่วย 4A", verifiedAt: "10:15",
    status: "VERIFIED",
    items: [
      { drug: "Oxaliplatin", dose: 144, unit: "mg", diluent: "D-5-W", diluentVol: 500, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0, confirmed: false },
      { drug: "Leucovorin", dose: 340, unit: "mg", diluent: "D-5-W", diluentVol: 100, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0, confirmed: false },
      { drug: "5-FU (bolus)", dose: 680, unit: "mg", diluent: "—", diluentVol: 0, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0, confirmed: false },
    ],
  },
];

/* ══════════════════════════════════════════════ */
export default function Compounding() {
  const { verifyPin } = useOnc();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedId, setSelectedId] = useState<string | null>("CMP-001");
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selected = orders.find(o => o.id === selectedId);
  const allFilled = selected?.items.every(i => i.lotNo && i.expiryDate && i.preparedQty > 0) ?? false;

  function updateItem(idx: number, field: keyof CompItem, value: string | number) {
    if (!selected) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : {
      ...o,
      items: o.items.map((item, i) => i !== idx ? item : { ...item, [field]: value }),
    }));
  }

  /* Apply first lot/expiry to all — Ref: V8.0 convenience */
  function applyLotToAll() {
    if (!selected || !selected.items[0]) return;
    const { lotNo, expiryDate } = selected.items[0];
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : {
      ...o,
      items: o.items.map(item => ({ ...item, lotNo: lotNo || item.lotNo, expiryDate: expiryDate || item.expiryDate })),
    }));
  }

  /* Double-check → PIN → PREPARED — Ref: Spec "Double-check confirmation" */
  function handlePrepare() {
    setShowConfirm(true);
  }

  function confirmPrepare() {
    setShowConfirm(false);
    setShowPin(true);
    setPin(""); setPinError(false);
  }

  function handlePinComplete(p: string) {
    if (!verifyPin(p) || !selected) { setPinError(true); setPin(""); return; }
    setShowPin(false); setPin("");
    setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: "PREPARED" as const } : o));
    // Auto-advance
    const next = orders.find(o => o.status === "VERIFIED" && o.id !== selected.id);
    if (next) setSelectedId(next.id);
  }

  if (pin.length === 6 && showPin) {
    setTimeout(() => handlePinComplete(pin), 300);
  }

  return (
    <div className="flex h-full">
      {/* ═══ Left — Queue ═══ */}
      <div className="w-80 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
            <Beaker size={14} className="text-onc" /> Compounding Worklist
          </h2>
          <div className="flex items-center gap-2 px-3 py-2 bg-background-alt rounded-xl">
            <Search size={13} className="text-text-muted" />
            <input placeholder="HN / ชื่อ..." className="bg-transparent outline-none text-sm flex-1" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {orders.map(o => (
            <button key={o.id} onClick={() => setSelectedId(o.id)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                selectedId === o.id ? "bg-onc-bg ring-1 ring-onc/30" : "hover:bg-background-alt"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-text">{o.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  o.status === "PREPARED" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                }`}>{o.status}</span>
              </div>
              <p className="text-[10px] text-text-muted">
                HN {o.hn} · {o.protocol} C{o.cycle}D{o.day} · {o.items.length} drugs
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Right — Compounding Form ═══ */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Beaker size={40} className="text-border mx-auto mb-3" />
              <p className="text-sm text-text-muted">เลือกคำสั่งจากรายการด้านซ้าย</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold text-text">{selected.name} — {selected.protocol} C{selected.cycle}D{selected.day}</h1>
                <p className="text-xs text-text-muted">HN {selected.hn} · {selected.ward} · Verified {selected.verifiedAt}</p>
              </div>
              {selected.status === "VERIFIED" && (
                <button onClick={handlePrepare} disabled={!allFilled}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                    allFilled ? "bg-onc text-white hover:bg-onc/90 shadow-md shadow-onc/20" : "bg-border text-text-muted cursor-not-allowed"
                  }`}>
                  <ClipboardCheck size={14} /> Mark as Prepared
                </button>
              )}
              {selected.status === "PREPARED" && (
                <span className="text-sm font-bold px-4 py-2 bg-success-bg text-success rounded-xl">✓ PREPARED</span>
              )}
            </div>

            {!allFilled && selected.status === "VERIFIED" && (
              <div className="onc-alert-warn rounded-xl px-4 py-3 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> กรอกข้อมูล Lot/Expiry/Qty ให้ครบทุกรายการก่อน Mark as Prepared
              </div>
            )}

            {/* Drug cards — Ref: Spec "lot/expiry/waste per drug" */}
            {selected.items.map((item, idx) => (
              <div key={idx} className="onc-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-onc-bg flex items-center justify-center">
                      <Package size={18} className="text-onc" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{item.drug}</p>
                      <p className="text-xs text-text-muted">{item.dose} {item.unit} · {item.diluent} {item.diluentVol > 0 ? `${item.diluentVol} ml` : ""}</p>
                    </div>
                  </div>
                  {item.lotNo && item.expiryDate && item.preparedQty > 0 && (
                    <CheckCircle2 size={20} className="text-success" />
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 flex items-center gap-1"><Hash size={9} /> Lot No.</label>
                    <input value={item.lotNo} onChange={e => updateItem(idx, "lotNo", e.target.value)}
                      disabled={selected.status === "PREPARED"}
                      placeholder="LOT..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 flex items-center gap-1"><Calendar size={9} /> Expiry</label>
                    <input type="date" value={item.expiryDate} onChange={e => updateItem(idx, "expiryDate", e.target.value)}
                      disabled={selected.status === "PREPARED"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1">Prepared Qty ({item.unit})</label>
                    <input type="number" value={item.preparedQty || ""} onChange={e => updateItem(idx, "preparedQty", Number(e.target.value))}
                      disabled={selected.status === "PREPARED"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 flex items-center gap-1"><Trash2 size={9} /> Waste ({item.unit})</label>
                    <input type="number" value={item.wasteQty || ""} onChange={e => updateItem(idx, "wasteQty", Number(e.target.value))}
                      disabled={selected.status === "PREPARED"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50" />
                  </div>
                </div>

                {idx === 0 && selected.items.length > 1 && selected.status === "VERIFIED" && (
                  <button onClick={applyLotToAll}
                    className="mt-3 text-[11px] font-semibold text-onc hover:underline">
                    Apply Lot/Expiry to all drugs ↓
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Double-check Confirmation — Ref: Spec "mandatory secondary check" ═══ */}
      {showConfirm && selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="onc-card-raised p-6 w-[480px]">
            <h3 className="text-base font-bold text-text mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-onc" /> ยืนยันการเตรียมยา (Double-check)
            </h3>
            <div className="space-y-2 mb-4">
              {selected.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-background-alt rounded-lg text-sm">
                  <span className="font-semibold text-text">{item.drug}</span>
                  <span className="text-text-muted">Lot: <b>{item.lotNo}</b> · Qty: <b>{item.preparedQty} {item.unit}</b> · Waste: {item.wasteQty}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mb-4">
              คุณ [ชื่อผู้ตรวจ] ได้ระบุ Lot No. และปริมาณที่ต้องเตรียมให้ <b>{selected.name}</b><br/>
              ตรวจสอบหรือไม่?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 text-sm border border-border rounded-xl text-text-muted hover:bg-background-alt">ยกเลิก</button>
              <button onClick={confirmPrepare} className="flex-1 py-2.5 text-sm bg-onc text-white rounded-xl font-bold hover:bg-onc/90">Confirm + PIN</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PIN Modal ═══ */}
      {showPin && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="onc-card-raised p-8 w-80">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-onc-bg rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-onc" />
              </div>
              <h3 className="text-base font-bold text-text">ยืนยัน Compounding</h3>
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
                  className={`h-11 rounded-xl text-sm font-medium active:scale-95 ${k ? "bg-background-alt hover:bg-border text-text" : "opacity-0"}`}>{k}</button>
              ))}
            </div>
            <button onClick={() => { setShowPin(false); setPin(""); }} className="w-full py-2.5 text-sm border border-border rounded-xl text-text-muted hover:bg-background-alt">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
