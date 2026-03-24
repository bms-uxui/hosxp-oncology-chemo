import { useState, useEffect } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { useOnc } from "./OncContext";

/* ══════════════════════════════════════════════
   Reusable PIN Modal
   Ref: Spec §3.3 "non-intrusive modal, doesn't lose progress"
   Ref: Spec "PIN hashed+salted, rate-limited"
   ══════════════════════════════════════════════ */

type PinModalProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  theme?: "default" | "danger" | "success";
  onVerified: () => void;
  onCancel: () => void;
};

const themeColors = {
  default: { bg: "bg-onc-bg", text: "text-onc", border: "border-onc", fill: "bg-onc-bg" },
  danger: { bg: "bg-danger-bg", text: "text-danger", border: "border-danger", fill: "bg-danger-bg" },
  success: { bg: "bg-success-bg", text: "text-success", border: "border-success", fill: "bg-success-bg" },
};

export default function PinModal({ open, title = "ยืนยัน PIN", subtitle, theme = "default", onVerified, onCancel }: PinModalProps) {
  const { verifyPin } = useOnc();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const tc = themeColors[theme];

  useEffect(() => {
    if (!open) { setPin(""); setError(false); }
  }, [open]);

  useEffect(() => {
    if (pin.length === 6) {
      setTimeout(() => {
        if (verifyPin(pin)) {
          setPin(""); setError(false); setAttempts(0);
          onVerified();
        } else {
          setError(true); setPin("");
          setAttempts(a => a + 1);
        }
      }, 300);
    }
  }, [pin, verifyPin, onVerified]);

  if (!open) return null;

  const locked = attempts >= 5;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="onc-card-raised p-8 w-80">
        <div className="text-center mb-6">
          <div className={`w-12 h-12 ${tc.bg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
            <Lock size={20} className={tc.text} />
          </div>
          <h3 className="text-base font-bold text-text">{title}</h3>
          {subtitle && <p className="text-[11px] text-text-muted mt-1">{subtitle}</p>}
          {error && <p className="text-xs text-danger font-semibold mt-2">PIN ไม่ถูกต้อง ({attempts}/5)</p>}
          {locked && <p className="text-xs text-danger font-semibold mt-2">ล็อกชั่วคราว — ลองใหม่ภายหลัง</p>}
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
              i < pin.length ? `${tc.border} ${tc.fill} ${tc.text} scale-105` : "border-border"
            }`}>
              {i < pin.length ? "●" : ""}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k => (
            <button key={k} disabled={!k || pin.length === 6 || locked}
              onClick={() => {
                if (k === "⌫") { setPin(p => p.slice(0, -1)); setError(false); }
                else if (pin.length < 6) setPin(p => p + k);
              }}
              className={`h-11 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                k ? "bg-background-alt hover:bg-border text-text disabled:opacity-40" : "opacity-0 cursor-default"
              }`}>
              {k}
            </button>
          ))}
        </div>

        <button onClick={onCancel}
          className="w-full py-2.5 text-sm border border-border rounded-xl text-text-muted hover:bg-background-alt">
          ยกเลิก
        </button>

        {pin.length === 6 && !error && (
          <div className={`mt-3 flex items-center justify-center gap-2 ${tc.text} text-xs font-semibold`}>
            <CheckCircle2 size={14} /> กำลังยืนยัน...
          </div>
        )}
      </div>
    </div>
  );
}
