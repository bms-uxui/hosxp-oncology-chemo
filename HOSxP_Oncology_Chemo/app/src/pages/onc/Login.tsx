import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { useOnc } from "../../components/onc/OncContext";

const BASE = import.meta.env.BASE_URL;

const animStyles = `
@keyframes fadeSlideUp {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes bgFadeIn {
  0%   { opacity: 0; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
`;

function fadeUp(delay: number): React.CSSProperties {
  return { opacity: 0, animation: `fadeSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards` };
}

export default function Login() {
  const { setRole } = useOnc();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);
    setTimeout(() => {
      setRole("ONC_DOCTOR");
      navigate("/onc");
    }, 600);
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: "#EDF1F7" }}>
      <style>{animStyles}</style>

      {/* ── BG pattern ── */}
      <img
        src={`${BASE}onc/login-bg.svg`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 0, animation: "bgFadeIn 2.5s cubic-bezier(0.16,1,0.3,1) 0.1s forwards" }}
      />

      {/* ── Bottom purple gradient ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(103,75,179,0.08), transparent)" }} />

      {/* ── Main flex container ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-center max-w-7xl mx-auto px-8 xl:px-16 gap-12 xl:gap-20">

        {/* ════ LEFT SIDE ════ */}
        <div className="flex-1 flex flex-col justify-center py-12 max-w-[540px]">
          <div className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 mb-8 w-fit text-sm text-text"
            style={{
              background: "rgba(103,75,179,0.1)",
              border: "1px solid rgba(103,75,179,0.15)",
              ...fadeUp(0.1),
            }}>
            ขับเคลื่อนโดย <span className="font-bold text-onc mx-1">BMS</span> — ภายใต้ระบบนิเวศคลินิก <span className="font-bold text-text ml-1">HOSxP</span>
          </div>

          <h1 className="text-[40px] xl:text-[46px] font-extrabold text-navy leading-tight mb-5"
            style={fadeUp(0.25)}>
            ยกระดับการสั่งยาเคมีบำบัด<br />ด้วยความแม่นยำทางดิจิทัล
          </h1>

          <p className="text-[15px] text-text-secondary leading-relaxed mb-10 max-w-[500px]"
            style={fadeUp(0.4)}>
            ระบบจัดการยาเคมีบำบัดแบบครบวงจรที่เน้นความปลอดภัยสูงสุด
            เชื่อมโยงการทำงานของทีมสหสาขาวิชาชีพ ตั้งแต่การวางแผนสูตรยาจนถึง
            การบริหารยาข้างเตียง พร้อมระบบตรวจสอบความปลอดภัยแบบเรียลไทม์
          </p>

          <button onClick={handleLogin} disabled={loading}
            className="relative overflow-hidden flex items-center gap-3 px-8 py-3.5 rounded-full text-base font-bold text-white cursor-pointer hover:bg-[#563AA4] active:scale-[0.98] transition-all w-fit"
            style={{ background: "#674BB3", ...fadeUp(0.55) }}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>เข้าสู่ระบบ <ChevronRight size={18} /></>
            )}
            <div className="absolute inset-0 pointer-events-none"
              style={{ animation: "shimmer 2.5s ease-in-out infinite" }}>
              <div className="w-1/2 h-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
            </div>
          </button>

          <p className="text-[10px] text-text-muted/30 mt-6" style={fadeUp(0.7)}>
            HOSxP Oncology Chemo CPOE v1.0 — Prototype
          </p>
        </div>

        {/* ════ RIGHT SIDE — Hero grid (7 parts) ════ */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="relative w-80 xl:w-96 pointer-events-none select-none" style={{ aspectRatio: "372 / 464" }}>
            {/* White glow behind hero */}
            <div className="absolute -inset-12 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)", filter: "blur(20px)" }} />
            {[
              { name: "doctor",   x: 0,   y: 0,   w: 248, h: 136, delay: 0.2  },
              { name: "workflow", x: 248, y: 0,   w: 124, h: 200, delay: 0.32 },
              { name: "nurse",    x: 0,   y: 136, w: 124, h: 204, delay: 0.44 },
              { name: "bms",      x: 124, y: 136, w: 124, h: 124, delay: 0.56 },
              { name: "tablet",   x: 248, y: 200, w: 124, h: 252, delay: 0.68 },
              { name: "iv",       x: 0,   y: 340, w: 124, h: 124, delay: 0.80 },
              { name: "team",     x: 124, y: 260, w: 124, h: 204, delay: 0.92 },
            ].map((s) => (
              <img
                key={s.name}
                src={`${BASE}onc/login-hero/${s.name}.svg`}
                alt=""
                className="absolute"
                style={{
                  left:   `${(s.x / 372) * 100}%`,
                  top:    `${(s.y / 464) * 100}%`,
                  width:  `${(s.w / 372) * 100}%`,
                  height: `${(s.h / 464) * 100}%`,
                  ...fadeUp(s.delay),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
