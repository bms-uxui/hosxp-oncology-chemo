import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, ChevronRight, Lock, Eye, EyeOff } from "lucide-react";
import { useOnc, roleLabels, roleEnglish, roleInitials, roleColor, type OncRole } from "../../components/onc/OncContext";

/* ══════════════════════════════════════════════
   Login — Role selection + PIN
   Clean, centered card on gradient background
   ══════════════════════════════════════════════ */

const roles: OncRole[] = ["ONC_DOCTOR", "ONC_PHARMACIST", "COMPOUND_TECH", "CHEMO_NURSE", "BILLING_OFFICER", "ADMIN"];

export default function Login() {
  const { setRole } = useOnc();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<OncRole | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      setRole(selected);
      navigate("/onc");
    }, 600);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "linear-gradient(135deg, #1A2A3A 0%, #243B4F 50%, #1A2A3A 100%)" }}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C6EBF, #9B8FD8)", boxShadow: "0 4px 20px rgba(124,110,191,0.4)" }}>
            <Activity size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold leading-tight">HOSxP Oncology</h1>
            <p className="text-white/40 text-xs">Chemo CPOE Module</p>
          </div>
        </div>

        {/* Card */}
        <div className="onc-card-raised p-8">
          <h2 className="text-lg font-bold text-text mb-1">เข้าสู่ระบบ</h2>
          <p className="text-sm text-text-muted mb-6">เลือก Role เพื่อเข้าใช้งาน (Prototype)</p>

          {/* Role grid */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {roles.map(r => (
              <button key={r} onClick={() => setSelected(r)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all text-left ${
                  selected === r
                    ? "border-onc bg-onc-bg"
                    : "border-border hover:border-onc/30 hover:bg-background-alt"
                }`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: selected === r ? roleColor[r] : "#CBD5E1" }}>
                  {roleInitials[r]}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${selected === r ? "text-onc" : "text-text"}`}>
                    {roleEnglish[r]}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">{roleLabels[r]}</p>
                </div>
              </button>
            ))}
          </div>

          {/* PIN */}
          {selected && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                <Lock size={11} className="inline mr-1" />
                PIN (Prototype: 1234)
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="กรอก PIN 4-6 หลัก"
                  className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-background-alt focus:outline-none focus:border-onc focus:ring-2 focus:ring-onc/20 pr-10"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-text-muted hover:text-text">
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleLogin} disabled={!selected || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              selected && !loading
                ? "text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                : "bg-border text-text-muted cursor-not-allowed"
            }`}
            style={selected && !loading ? { background: "linear-gradient(135deg, #7C6EBF, #6358A5)", boxShadow: "0 4px 16px rgba(124,110,191,0.4)" } : {}}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>เข้าสู่ระบบ <ChevronRight size={14} /></>
            )}
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          HOSxP Oncology Chemo CPOE v1.0 — Prototype
        </p>
      </div>
    </div>
  );
}
