import { useState, useEffect, useRef } from "react";
import {
  Stethoscope, Play, Square, CheckCircle2, Lock,
  Clock, AlertTriangle, User, Search, Syringe,
  Timer, FileText, Heart, Thermometer, Activity, Wind,
} from "lucide-react";
import { useOnc } from "../../components/onc/OncContext";

/* ══════════════════════════════════════════════
   Nurse Administration — Bedside Tablet
   Ref: Spec §3.4 — Optimized for handheld tablets
   Ref: Spec "Touch targets min 44x44px"
   Ref: Spec "Infusion Timer — visual countdown"
   Status: PREPARED → ADMINISTERED
   ══════════════════════════════════════════════ */

type DrugLine = {
  name: string; dose: number; unit: string; route: string;
  rate: string; infusionMin: number; diluent: string;
  startedAt: string | null; stoppedAt: string | null;
  status: "waiting" | "infusing" | "completed";
};

type AdminOrder = {
  id: string; hn: string; name: string; age: number;
  protocol: string; cycle: number; day: number; ward: string;
  preparedAt: string; status: "PREPARED" | "ADMINISTERING" | "ADMINISTERED";
  drugs: DrugLine[];
  adverseReaction: string;
};

const mockOrders: AdminOrder[] = [
  {
    id: "ADM-001", hn: "104558", name: "นาง คำปุ่น เสสาร", age: 55,
    protocol: "CAF", cycle: 3, day: 1, ward: "OPD เคมีบำบัด",
    preparedAt: "10:00", status: "PREPARED",
    drugs: [
      { name: "Ondansetron", dose: 8, unit: "mg", route: "IV", rate: "15 min", infusionMin: 15, diluent: "NSS 50 ml", startedAt: null, stoppedAt: null, status: "waiting" },
      { name: "Dexamethasone", dose: 20, unit: "mg", route: "IV", rate: "15 min", infusionMin: 15, diluent: "NSS 50 ml", startedAt: null, stoppedAt: null, status: "waiting" },
      { name: "Cyclophosphamide", dose: 700, unit: "mg", route: "IV Infusion", rate: "30 min", infusionMin: 30, diluent: "D-5-W 100 ml", startedAt: null, stoppedAt: null, status: "waiting" },
      { name: "Doxorubicin", dose: 70, unit: "mg", route: "IV Push", rate: "—", infusionMin: 5, diluent: "D-5-W 50 ml", startedAt: null, stoppedAt: null, status: "waiting" },
      { name: "5-FU", dose: 700, unit: "mg", route: "IV Infusion", rate: "4 hr", infusionMin: 240, diluent: "D-5-W 500 ml", startedAt: null, stoppedAt: null, status: "waiting" },
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-002", hn: "5556677", name: "นายบุญมี ดีใจ", age: 68,
    protocol: "FOLFOX6", cycle: 5, day: 1, ward: "หอผู้ป่วย 4A",
    preparedAt: "10:30", status: "PREPARED",
    drugs: [
      { name: "Oxaliplatin", dose: 144, unit: "mg", route: "IV Infusion", rate: "2 hr", infusionMin: 120, diluent: "D-5-W 500 ml", startedAt: null, stoppedAt: null, status: "waiting" },
      { name: "Leucovorin", dose: 340, unit: "mg", route: "IV Infusion", rate: "2 hr", infusionMin: 120, diluent: "D-5-W 100 ml", startedAt: null, stoppedAt: null, status: "waiting" },
    ],
    adverseReaction: "",
  },
];

const fmtTime = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

/* ══════════════════════════════════════════════ */
export default function Administration() {
  const { verifyPin } = useOnc();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedId, setSelectedId] = useState<string | null>("ADM-001");
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tick, setTick] = useState(0);

  const selected = orders.find(o => o.id === selectedId);
  const allCompleted = selected?.drugs.every(d => d.status === "completed") ?? false;

  /* ── Vital Signs (eMAR) state ── */
  type VitalSigns = { bp: string; hr: string; temp: string; spo2: string };
  const [vitalsByOrder, setVitalsByOrder] = useState<Record<string, VitalSigns>>({});
  const [vitalsSaved, setVitalsSaved] = useState<Record<string, boolean>>({});

  const currentVitals = selected ? (vitalsByOrder[selected.id] ?? { bp: "", hr: "", temp: "", spo2: "" }) : { bp: "", hr: "", temp: "", spo2: "" };
  const currentVitalsSaved = selected ? (vitalsSaved[selected.id] ?? false) : false;

  function updateVital(field: keyof VitalSigns, value: string) {
    if (!selected) return;
    setVitalsByOrder(prev => ({
      ...prev,
      [selected.id]: { ...(prev[selected.id] ?? { bp: "", hr: "", temp: "", spo2: "" }), [field]: value },
    }));
  }

  function saveVitals() {
    if (!selected) return;
    setVitalsSaved(prev => ({ ...prev, [selected.id]: true }));
  }

  /* Timer tick — updates every 10s for infusion countdown */
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 10000);
    return () => clearInterval(t);
  }, []);

  /* ── Start drug ── */
  function startDrug(idx: number) {
    if (!selected) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : {
      ...o,
      status: "ADMINISTERING" as const,
      drugs: o.drugs.map((d, i) => i !== idx ? d : { ...d, startedAt: fmtTime(), status: "infusing" as const }),
    }));
  }

  /* ── Stop drug ── */
  function stopDrug(idx: number) {
    if (!selected) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : {
      ...o,
      drugs: o.drugs.map((d, i) => i !== idx ? d : { ...d, stoppedAt: fmtTime(), status: "completed" as const }),
    }));
  }

  /* ── Adverse reaction ── */
  function setReaction(text: string) {
    if (!selected) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : { ...o, adverseReaction: text }));
  }

  /* ── Complete + PIN ── */
  function handleComplete() {
    setShowPin(true); setPin(""); setPinError(false);
  }

  function handlePinDone(p: string) {
    if (!verifyPin(p) || !selected) { setPinError(true); setPin(""); return; }
    setShowPin(false); setPin("");
    setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: "ADMINISTERED" as const } : o));
    const next = orders.find(o => o.id !== selected.id && o.status !== "ADMINISTERED");
    if (next) setSelectedId(next.id);
  }

  if (pin.length === 6 && showPin) {
    setTimeout(() => handlePinDone(pin), 300);
  }

  /* ── Infusion elapsed helper ── */
  function infusionElapsed(startedAt: string | null): number {
    if (!startedAt) return 0;
    const [h, m] = startedAt.split(":").map(Number);
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
  }

  return (
    <div className="flex h-full">
      {/* ═══ Left — Patient Queue ═══ */}
      <div className="w-80 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
            <Stethoscope size={14} className="text-onc" /> Nurse Administration
          </h2>
          <div className="flex items-center gap-2 px-3 py-2 bg-background-alt rounded-xl">
            <Search size={13} className="text-text-muted" />
            <input placeholder="HN / ชื่อ..." className="bg-transparent outline-none text-sm flex-1" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {orders.map(o => {
            const infusingCount = o.drugs.filter(d => d.status === "infusing").length;
            return (
              <button key={o.id} onClick={() => setSelectedId(o.id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                  selectedId === o.id ? "bg-onc-bg ring-1 ring-onc/30" : "hover:bg-background-alt"
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-text">{o.name}</span>
                  {infusingCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-onc animate-pulse">
                      <Timer size={10} /> {infusingCount} infusing
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted">HN {o.hn} · {o.protocol} C{o.cycle}D{o.day}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                  o.status === "ADMINISTERED" ? "bg-success-bg text-success" :
                  o.status === "ADMINISTERING" ? "bg-onc-bg text-onc" :
                  "bg-warning-bg text-warning"
                }`}>{o.status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Right — Drug Administration ═══ */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Stethoscope size={40} className="text-border mx-auto mb-3" />
              <p className="text-sm text-text-muted">เลือกผู้ป่วยจากรายการด้านซ้าย</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold text-text">{selected.name}</h1>
                <p className="text-xs text-text-muted">
                  HN {selected.hn} · {selected.age} ปี · {selected.protocol} C{selected.cycle}D{selected.day} · {selected.ward}
                </p>
              </div>
              {allCompleted && selected.status !== "ADMINISTERED" && (
                <button onClick={handleComplete}
                  className="onc-touch flex items-center gap-2 px-6 py-3 bg-success text-white text-sm font-bold rounded-2xl hover:bg-success/90 shadow-lg shadow-success/20">
                  <CheckCircle2 size={18} /> Complete + PIN
                </button>
              )}
              {selected.status === "ADMINISTERED" && (
                <span className="text-sm font-bold px-4 py-2.5 bg-success-bg text-success rounded-2xl">✓ ADMINISTERED</span>
              )}
            </div>

            {/* ═══ Vital Signs ก่อนให้ยา (eMAR) ═══ */}
            <div className="onc-card p-5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Activity size={10} className="text-onc" /> Vital Signs ก่อนให้ยา
              </p>

              {/* Green summary when all drugs done and vitals were saved */}
              {allCompleted && currentVitalsSaved && (
                <div className="bg-success-bg border border-success/20 rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-success mb-2">✓ Vital Signs บันทึกแล้ว</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text">
                    <span className="flex items-center gap-1.5"><Activity size={12} className="text-success" /> BP: {currentVitals.bp || "—"} mmHg</span>
                    <span className="flex items-center gap-1.5"><Heart size={12} className="text-success" /> HR: {currentVitals.hr || "—"} bpm</span>
                    <span className="flex items-center gap-1.5"><Thermometer size={12} className="text-success" /> Temp: {currentVitals.temp || "—"} °C</span>
                    <span className="flex items-center gap-1.5"><Wind size={12} className="text-success" /> SpO₂: {currentVitals.spo2 || "—"} %</span>
                  </div>
                </div>
              )}

              {/* Input fields */}
              {selected.status !== "ADMINISTERED" && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* BP */}
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted flex items-center gap-1 mb-1">
                        <Activity size={10} className="text-onc" /> ความดันโลหิต (BP)
                      </label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={currentVitals.bp}
                        onChange={e => updateVital("bp", e.target.value)}
                        disabled={currentVitalsSaved}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50"
                      />
                      <span className="text-[9px] text-text-muted">mmHg</span>
                    </div>
                    {/* HR */}
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted flex items-center gap-1 mb-1">
                        <Heart size={10} className="text-danger" /> อัตราการเต้นหัวใจ (HR)
                      </label>
                      <input
                        type="number"
                        placeholder="80"
                        value={currentVitals.hr}
                        onChange={e => updateVital("hr", e.target.value)}
                        disabled={currentVitalsSaved}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50"
                      />
                      <span className="text-[9px] text-text-muted">bpm</span>
                    </div>
                    {/* Temp */}
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted flex items-center gap-1 mb-1">
                        <Thermometer size={10} className="text-warning" /> อุณหภูมิ (Temp)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        value={currentVitals.temp}
                        onChange={e => updateVital("temp", e.target.value)}
                        disabled={currentVitalsSaved}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50"
                      />
                      <span className="text-[9px] text-text-muted">°C</span>
                    </div>
                    {/* SpO₂ */}
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted flex items-center gap-1 mb-1">
                        <Wind size={10} className="text-info" /> ออกซิเจนในเลือด (SpO₂)
                      </label>
                      <input
                        type="number"
                        placeholder="98"
                        value={currentVitals.spo2}
                        onChange={e => updateVital("spo2", e.target.value)}
                        disabled={currentVitalsSaved}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc disabled:opacity-50"
                      />
                      <span className="text-[9px] text-text-muted">%</span>
                    </div>
                  </div>

                  {/* Save button */}
                  {!currentVitalsSaved ? (
                    <button
                      onClick={saveVitals}
                      disabled={!currentVitals.bp && !currentVitals.hr && !currentVitals.temp && !currentVitals.spo2}
                      className="onc-touch w-full py-3 bg-onc text-white text-sm font-bold rounded-2xl hover:bg-onc/90 shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} /> บันทึก Vital Signs
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-success">
                      <CheckCircle2 size={14} /> บันทึก Vital Signs แล้ว
                    </div>
                  )}
                </>
              )}

              {/* Summary for ADMINISTERED orders */}
              {selected.status === "ADMINISTERED" && currentVitalsSaved && (
                <div className="bg-success-bg border border-success/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-success mb-2">✓ Vital Signs บันทึกแล้ว</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text">
                    <span className="flex items-center gap-1.5"><Activity size={12} className="text-success" /> BP: {currentVitals.bp || "—"} mmHg</span>
                    <span className="flex items-center gap-1.5"><Heart size={12} className="text-success" /> HR: {currentVitals.hr || "—"} bpm</span>
                    <span className="flex items-center gap-1.5"><Thermometer size={12} className="text-success" /> Temp: {currentVitals.temp || "—"} °C</span>
                    <span className="flex items-center gap-1.5"><Wind size={12} className="text-success" /> SpO₂: {currentVitals.spo2 || "—"} %</span>
                  </div>
                </div>
              )}

              {selected.status === "ADMINISTERED" && !currentVitalsSaved && (
                <p className="text-xs text-text-muted">ไม่ได้บันทึก Vital Signs</p>
              )}
            </div>

            {/* Drug cards — touch-optimized, Ref: §3.4 "44x44px targets" */}
            <div className="space-y-3">
              {selected.drugs.map((drug, idx) => {
                const elapsed = infusionElapsed(drug.startedAt);
                const remaining = Math.max(0, drug.infusionMin - elapsed);
                const progress = drug.infusionMin > 0 ? Math.min(elapsed / drug.infusionMin, 1) : 0;

                return (
                  <div key={idx} className={`onc-card p-5 ${
                    drug.status === "infusing" ? "ring-2 ring-onc/30" :
                    drug.status === "completed" ? "opacity-60" : ""
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          drug.status === "completed" ? "bg-success-bg" :
                          drug.status === "infusing" ? "bg-onc-bg" : "bg-background-alt"
                        }`}>
                          {drug.status === "completed" ? <CheckCircle2 size={20} className="text-success" /> :
                           drug.status === "infusing" ? <Syringe size={20} className="text-onc" /> :
                           <Clock size={20} className="text-text-muted" />}
                        </div>
                        <div>
                          <p className="text-base font-bold text-text">{drug.name}</p>
                          <p className="text-xs text-text-muted">
                            {drug.dose} {drug.unit} · {drug.route} · {drug.diluent} · {drug.rate}
                          </p>
                        </div>
                      </div>

                      {/* Start/Stop buttons — touch targets */}
                      <div className="flex items-center gap-2">
                        {drug.status === "waiting" && selected.status !== "ADMINISTERED" && (
                          <button onClick={() => startDrug(idx)}
                            className="onc-touch px-5 py-3 bg-onc text-white font-bold text-sm rounded-2xl hover:bg-onc/90 shadow-md flex items-center gap-2">
                            <Play size={16} fill="white" /> Start
                          </button>
                        )}
                        {drug.status === "infusing" && (
                          <button onClick={() => stopDrug(idx)}
                            className="onc-touch px-5 py-3 bg-danger text-white font-bold text-sm rounded-2xl hover:bg-danger/90 shadow-md flex items-center gap-2">
                            <Square size={16} fill="white" /> Stop
                          </button>
                        )}
                        {drug.status === "completed" && (
                          <span className="text-xs font-semibold text-success flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            {drug.startedAt} → {drug.stoppedAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Infusion Timer — Ref: §3.4 "visual countdown" */}
                    {drug.status === "infusing" && drug.infusionMin > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-text-muted">เริ่ม {drug.startedAt}</span>
                          <span className="font-bold text-onc">
                            {remaining > 0 ? `เหลือ ${remaining} นาที` : "ครบเวลาแล้ว!"}
                          </span>
                        </div>
                        <div className="bg-border rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${
                            remaining <= 0 ? "bg-success" : "bg-onc"
                          }`} style={{ width: `${progress * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Adverse Reaction — Ref: Spec "adverse reaction textarea" */}
            <div className="onc-card p-5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle size={10} /> อาการไม่พึงประสงค์ระหว่างให้ยา
              </p>
              <textarea
                value={selected.adverseReaction}
                onChange={e => setReaction(e.target.value)}
                placeholder="บันทึกอาการไม่พึงประสงค์ (ถ้ามี)..."
                rows={3}
                disabled={selected.status === "ADMINISTERED"}
                className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc resize-none disabled:opacity-50" />
            </div>
          </div>
        )}
      </div>

      {/* ═══ PIN Modal ═══ */}
      {showPin && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="onc-card-raised p-8 w-80">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-success-bg rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-success" />
              </div>
              <h3 className="text-base font-bold text-text">Complete Administration</h3>
              <p className="text-[11px] text-text-muted mt-1">ยืนยันการให้ยาเสร็จสิ้น</p>
              {pinError && <p className="text-xs text-danger font-semibold mt-2">PIN ไม่ถูกต้อง</p>}
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                  i < pin.length ? "border-success bg-success-bg text-success scale-105" : "border-border"
                }`}>{i < pin.length ? "●" : ""}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k => (
                <button key={k} disabled={!k || pin.length === 6}
                  onClick={() => { if (k === "⌫") { setPin(p => p.slice(0,-1)); setPinError(false); } else if (pin.length < 6) setPin(p => p+k); }}
                  className={`h-12 rounded-2xl text-base font-semibold active:scale-95 ${k ? "bg-background-alt hover:bg-border text-text" : "opacity-0"}`}>{k}</button>
              ))}
            </div>
            <button onClick={() => { setShowPin(false); setPin(""); }}
              className="w-full py-3 text-sm border border-border rounded-2xl text-text-muted hover:bg-background-alt">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
