import { useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, Info, Lock, X } from "lucide-react";
import type { GateResult, VerificationResult } from "../../hooks/useOrderVerification";

/* ══════════════════════════════════════════════
   SafetyGatePanel — Displays clinical safety gates
   Shows hard-stops, warnings, and override controls
   ══════════════════════════════════════════════ */

interface Props {
  verification: VerificationResult;
  onOverride?: (gateId: string, reason: string, pin: string) => boolean;
  className?: string;
}

export default function SafetyGatePanel({ verification, onOverride, className = "" }: Props) {
  const { gates, hardStops, warnings, canVerify, bsaStatus } = verification;
  const [overrideGateId, setOverrideGateId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overridePin, setOverridePin] = useState("");
  const [overrideError, setOverrideError] = useState("");

  if (gates.length === 0) {
    return (
      <div className={`flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 ${className}`}>
        <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-700">ผ่านการตรวจสอบทั้งหมด</p>
          <p className="text-xs text-emerald-600">Lab values, BSA, และ Cumulative dose อยู่ในเกณฑ์ปกติ</p>
        </div>
      </div>
    );
  }

  function handleOverride() {
    if (!overrideGateId || !overrideReason.trim() || overridePin.length < 4) return;
    if (onOverride) {
      const ok = onOverride(overrideGateId, overrideReason, overridePin);
      if (!ok) { setOverrideError("PIN ไม่ถูกต้อง"); setOverridePin(""); return; }
    }
    setOverrideGateId(null);
    setOverrideReason("");
    setOverridePin("");
    setOverrideError("");
  }

  const iconMap = {
    "hard-stop": <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />,
    "warning": <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />,
    "info": <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />,
  };

  const bgMap = {
    "hard-stop": "bg-red-50 border-red-200",
    "warning": "bg-amber-50 border-amber-200",
    "info": "bg-blue-50 border-blue-200",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Summary */}
      {hardStops.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <ShieldAlert size={16} className="text-red-500" />
          <p className="text-sm font-bold text-red-700">
            {hardStops.length} Hard Stop — ต้อง Override เพื่อดำเนินการ
          </p>
        </div>
      )}

      {/* BSA status badge */}
      {bsaStatus === "historical" && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <p className="text-xs font-semibold text-amber-700">BSA คำนวณจากน้ำหนักที่ไม่เป็นปัจจุบัน</p>
        </div>
      )}

      {/* Gate list */}
      {gates.map(g => {
        const isOverridden = verification.overrides.has(g.id);
        return (
          <div key={g.id} className={`border rounded-xl px-4 py-3 ${isOverridden ? "bg-gray-50 border-gray-200 opacity-60" : bgMap[g.severity]}`}>
            <div className="flex items-start gap-3">
              {iconMap[g.severity]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text">{g.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{g.message}</p>
                {g.value !== undefined && g.threshold !== undefined && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-mono bg-white/70 px-2 py-0.5 rounded">ค่าจริง: {g.value}</span>
                    <span className="text-xs font-mono bg-white/70 px-2 py-0.5 rounded">เกณฑ์: {g.threshold}</span>
                  </div>
                )}
              </div>
              {g.requiresOverride && !isOverridden && onOverride && (
                <button onClick={() => { setOverrideGateId(g.id); setOverrideReason(""); setOverridePin(""); setOverrideError(""); }}
                  className="text-xs font-semibold text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 shrink-0">
                  <Lock size={12} className="inline mr-1" /> Override
                </button>
              )}
              {isOverridden && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-lg shrink-0">Overridden</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Override dialog */}
      {overrideGateId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOverrideGateId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text">Override Hard Stop</h3>
              <button onClick={() => setOverrideGateId(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X size={16} className="text-text-secondary" />
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              {gates.find(g => g.id === overrideGateId)?.message}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">เหตุผลในการ Override</label>
                <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                  placeholder="ระบุเหตุผลทางคลินิก..."
                  rows={2} autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">PIN ยืนยัน</label>
                <input type="password" inputMode="numeric" maxLength={6} value={overridePin}
                  onChange={e => { setOverridePin(e.target.value.replace(/\D/g, "")); setOverrideError(""); }}
                  placeholder="กรอก PIN"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-400" />
                {overrideError && <p className="text-xs text-red-500 mt-1">{overrideError}</p>}
              </div>
              <button onClick={handleOverride} disabled={!overrideReason.trim() || overridePin.length < 4}
                className={`w-full py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 ${
                  overrideReason.trim() && overridePin.length >= 4 ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}>
                <ShieldAlert size={14} /> ยืนยัน Override
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
