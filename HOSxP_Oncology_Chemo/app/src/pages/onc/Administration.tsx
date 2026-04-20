import { useState, useEffect } from "react";
import {
  Stethoscope, Play, Square, CheckCircle2, Lock,
  Clock, Timer, Heart, Thermometer, Activity, Wind,
  Droplets, Search, Check, Eye, LogOut, ClipboardCheck, X, AlertTriangle,
  Frown, CircleDot, Syringe, TrendingDown, HeartPulse, Bell, ScanLine,
} from "lucide-react";
import { useNavigate } from "react-router";
import PatientAvatar from "../../components/onc/PatientAvatar";
import { useOnc, roleLabels, roleEnglish, roleInitials, roleColor } from "../../components/onc/OncContext";
import { Stepper as MuiStepper, Step, StepLabel, StepConnector, stepConnectorClasses } from "@mui/material";
import { styled } from "@mui/material/styles";

/* ══════════════════════════════════════════════
   Nurse Administration — Tablet Bedside
   Touch-first: min 48px targets, large text
   Landscape orientation optimized
   ══════════════════════════════════════════════ */

type DrugClass = "premedication" | "chemotherapy";

type DrugLine = {
  name: string; dose: number; unit: string; route: string;
  rate: string; infusionMin: number; diluent: string;
  startedAt: string | null; stoppedAt: string | null;
  status: "waiting" | "infusing" | "completed";
  classification: DrugClass;
};

type AdminOrder = {
  id: string; hn: string; name: string; age: number;
  protocol: string; cycle: number; day: number; ward: string;
  preparedAt: string; status: "PREPARED" | "ADMINISTERING" | "ADMINISTERED";
  drugs: DrugLine[];
  adverseReaction: string;
};

/* ── Stepper (Qonto style) ── */
const NurseConnector = styled(StepConnector)({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: "calc(-50% + 16px)", right: "calc(50% + 16px)" },
  [`&.${stepConnectorClasses.active}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3" } },
  [`&.${stepConnectorClasses.completed}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3" } },
  [`& .${stepConnectorClasses.line}`]: { borderColor: "#e5e7eb", borderTopWidth: 3, borderRadius: 1, transition: "border-color 0.3s ease" },
});

function NurseStepIcon({ active, completed }: { active?: boolean; completed?: boolean }) {
  return (
    <div style={{ color: active ? "#674BB3" : completed ? "#674BB3" : "#e5e7eb", display: "flex", height: 22, alignItems: "center" }}>
      {completed ? <Check size={18} style={{ color: "#674BB3" }} />
        : <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "currentColor", transform: active ? "scale(1.3)" : "scale(1)" }} />}
    </div>
  );
}

const NURSE_STEPS = ["ตรวจรับยา", "วัด Vital Signs", "ให้ Pre-med", "ให้ Chemo", "สังเกตอาการ", "ยืนยัน"];

const D = (name: string, dose: number, unit: string, route: string, rate: string, min: number, dil: string, cls: DrugClass): DrugLine =>
  ({ name, dose, unit, route, rate, infusionMin: min, diluent: dil, startedAt: null, stoppedAt: null, status: "waiting", classification: cls });
const PRE = "premedication" as const, CHE = "chemotherapy" as const;

const mockOrders: AdminOrder[] = [
  {
    id: "ADM-001", hn: "104365", name: "นางคำปุ่น เสนาหอย", age: 54,
    protocol: "CAF", cycle: 3, day: 1, ward: "OPD เคมีบำบัด",
    preparedAt: "10:00", status: "PREPARED",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Dexamethasone", 20, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Cyclophosphamide", 700, "mg", "IV Infusion", "30 min", 30, "D-5-W 100 ml", CHE),
      D("Doxorubicin", 70, "mg", "IV Push", "—", 5, "D-5-W 50 ml", CHE),
      D("5-FU", 700, "mg", "IV Infusion", "4 hr", 240, "D-5-W 500 ml", CHE),
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-002", hn: "205471", name: "นายบุญมี ดีใจ", age: 68,
    protocol: "FOLFOX6", cycle: 5, day: 1, ward: "หอผู้ป่วย 4A",
    preparedAt: "10:30", status: "PREPARED",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Oxaliplatin", 144, "mg", "IV Infusion", "2 hr", 120, "D-5-W 500 ml", CHE),
      D("Leucovorin", 340, "mg", "IV Infusion", "2 hr", 120, "D-5-W 100 ml", CHE),
      D("5-FU (bolus)", 400, "mg", "IV Push", "—", 2, "—", CHE),
      D("5-FU (infusion)", 2400, "mg", "IV Infusion", "46 hr", 2760, "D-5-W 500 ml", CHE),
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-003", hn: "308892", name: "นางเพ็ญ ใจสว่าง", age: 61,
    protocol: "CARBO-PAC", cycle: 1, day: 1, ward: "OPD เคมีบำบัด",
    preparedAt: "11:00", status: "PREPARED",
    drugs: [
      D("Dexamethasone", 20, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Chlorpheniramine", 10, "mg", "IV", "—", 5, "—", PRE),
      D("Paclitaxel", 271, "mg", "IV Infusion", "3 hr", 180, "NSS 500 ml", CHE),
      D("Carboplatin (AUC5)", 425, "mg", "IV Infusion", "1 hr", 60, "D-5-W 250 ml", CHE),
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-004", hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: 72,
    protocol: "GEM", cycle: 4, day: 1, ward: "หอผู้ป่วย 3B",
    preparedAt: "09:30", status: "ADMINISTERING",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Gemcitabine", 1000, "mg", "IV Infusion", "30 min", 30, "NSS 250 ml", CHE),
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-005", hn: "519087", name: "นางสาวมาลี สุขใจ", age: 52,
    protocol: "AC-T", cycle: 3, day: 1, ward: "OPD เคมีบำบัด",
    preparedAt: "11:30", status: "PREPARED",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Dexamethasone", 20, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Doxorubicin", 60, "mg", "IV Push", "—", 5, "D-5-W 50 ml", CHE),
      D("Cyclophosphamide", 600, "mg", "IV Infusion", "30 min", 30, "D-5-W 100 ml", CHE),
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-006", hn: "620145", name: "นายอุดม พัฒนา", age: 45,
    protocol: "R-CHOP", cycle: 6, day: 1, ward: "หอผู้ป่วย 4A",
    preparedAt: "08:30", status: "ADMINISTERED",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Dexamethasone", 20, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Rituximab", 375, "mg", "IV Infusion", "4 hr", 240, "NSS 500 ml", CHE),
    ],
    adverseReaction: "ไม่มี",
  },
  {
    id: "ADM-007", hn: "710234", name: "นางสมหวัง ดีเลิศ", age: 63,
    protocol: "CAF", cycle: 1, day: 1, ward: "OPD เคมีบำบัด",
    preparedAt: "12:00", status: "PREPARED",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Dexamethasone", 20, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Cyclophosphamide", 650, "mg", "IV Infusion", "30 min", 30, "D-5-W 100 ml", CHE),
      D("Doxorubicin", 65, "mg", "IV Push", "—", 5, "D-5-W 50 ml", CHE),
      D("5-FU", 650, "mg", "IV Infusion", "4 hr", 240, "D-5-W 500 ml", CHE),
    ],
    adverseReaction: "",
  },
  {
    id: "ADM-008", hn: "815678", name: "นายวิชัย พงษ์สวัสดิ์", age: 58,
    protocol: "FOLFOX6", cycle: 2, day: 1, ward: "หอผู้ป่วย 3B",
    preparedAt: "12:30", status: "PREPARED",
    drugs: [
      D("Ondansetron", 8, "mg", "IV", "15 min", 15, "NSS 50 ml", PRE),
      D("Oxaliplatin", 148, "mg", "IV Infusion", "2 hr", 120, "D-5-W 500 ml", CHE),
      D("Leucovorin", 348, "mg", "IV Infusion", "2 hr", 120, "D-5-W 100 ml", CHE),
    ],
    adverseReaction: "",
  },
];

const fmtTime = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

const statusLabel: Record<string, string> = {
  PREPARED: "รอให้ยา", ADMINISTERING: "กำลังให้ยา", ADMINISTERED: "ให้ยาครบ",
};
const statusColor: Record<string, string> = {
  PREPARED: "bg-amber-500", ADMINISTERING: "bg-onc", ADMINISTERED: "bg-emerald-500",
};

export default function Administration() {
  const { verifyPin, notifications, unreadCount, markNotificationRead } = useOnc();
  const [notiOpen, setNotiOpen] = useState(false);
  const myNotifications = notifications.filter(n => n.targetRole === "CHEMO_NURSE");
  const navigate = useNavigate();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ADMINISTERING" | "PREPARED" | "ADMINISTERED">("ALL");
  const [signedOrders, setSignedOrders] = useState<Record<string, boolean>>({});
  const [showOrderDoc, setShowOrderDoc] = useState(false);
  const [confirmedRead, setConfirmedRead] = useState<Record<string, boolean>>({});
  const [signing, setSigning] = useState(false);
  const [confirmStopIdx, setConfirmStopIdx] = useState<number | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [, setTick] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const [scanResult, setScanResult] = useState<Record<string, boolean>>({});
  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmStartIdx, setConfirmStartIdx] = useState<number | null>(null);

  const selected = selectedIdx !== null ? orders[selectedIdx] : null;
  const allCompleted = selected?.drugs.every(d => d.status === "completed") ?? false;

  type VitalSigns = { bp: string; hr: string; temp: string; spo2: string };
  const [vitalsByOrder, setVitalsByOrder] = useState<Record<string, VitalSigns>>({});
  const [vitalsSaved, setVitalsSaved] = useState<Record<string, boolean>>({});
  const currentVitals = selected ? (vitalsByOrder[selected.id] ?? { bp: "", hr: "", temp: "", spo2: "" }) : { bp: "", hr: "", temp: "", spo2: "" };
  const currentVitalsSaved = selected ? (vitalsSaved[selected.id] ?? false) : false;

  function updateVital(field: keyof VitalSigns, value: string) {
    if (!selected) return;
    setVitalsByOrder(prev => ({ ...prev, [selected.id]: { ...(prev[selected.id] ?? { bp: "", hr: "", temp: "", spo2: "" }), [field]: value } }));
  }
  function saveVitals() { if (selected) setVitalsSaved(prev => ({ ...prev, [selected.id]: true })); }

  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 1000); return () => clearInterval(t); }, []);

  const hasInfusing = selected?.drugs.some(d => d.status === "infusing") ?? false;

  function startDrug(idx: number) {
    if (!selected || hasInfusing) return;
    setConfirmStartIdx(idx);
  }
  function doStartDrug(idx: number) {
    if (!selected) return;
    setConfirmStartIdx(null);
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : {
      ...o, status: "ADMINISTERING" as const,
      drugs: o.drugs.map((d, i) => i !== idx ? d : { ...d, startedAt: fmtTime(), status: "infusing" as const }),
    }));
  }
  function stopDrug(idx: number) {
    if (!selected) return;
    const drug = selected.drugs[idx];
    const elapsed = infusionElapsedSec(drug.startedAt);
    const totalSec = drug.infusionMin * 60;
    if (elapsed < totalSec) {
      setConfirmStopIdx(idx);
      return;
    }
    doStopDrug(idx);
  }
  function doStopDrug(idx: number) {
    if (!selected) return;
    setConfirmStopIdx(null);
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : {
      ...o, drugs: o.drugs.map((d, i) => i !== idx ? d : { ...d, stoppedAt: fmtTime(), status: "completed" as const }),
    }));
  }
  function setReaction(text: string) {
    if (!selected) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : { ...o, adverseReaction: text }));
  }
  function handleComplete() { setShowPin(true); setPin(""); setPinError(false); }
  function handlePinDone(p: string) {
    if (!verifyPin(p) || !selected) { setPinError(true); setPin(""); return; }
    const patientName = selected.name;
    setShowPin(false); setPin("");
    setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: "ADMINISTERED" as const } : o));
    setSelectedIdx(null);
    setToast(`ยืนยันการให้ยา ${patientName} สำเร็จแล้ว`);
    setTimeout(() => setToast(null), 3000);
  }
  if (pin.length === 6 && showPin) { setTimeout(() => handlePinDone(pin), 300); }

  // DEMO: 60x speed (1 real second = 1 mock minute)
  function infusionElapsedSec(startedAt: string | null): number {
    if (!startedAt) return 0;
    const [h, m] = startedAt.split(":").map(Number);
    const now = new Date();
    const realSec = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) - (h * 3600 + m * 60);
    return realSec * 10;
  }

  const infusingDrug = selected?.drugs.find(d => d.status === "infusing");
  const completedCount = selected?.drugs.filter(d => d.status === "completed").length ?? 0;
  // Compute nurse step based on patient progress
  const premeds = selected?.drugs.filter(d => d.classification === "premedication") ?? [];
  const chemos = selected?.drugs.filter(d => d.classification === "chemotherapy") ?? [];
  const allPremedsDone = premeds.length === 0 || premeds.every(d => d.status === "completed");
  const allChemosDone = chemos.every(d => d.status === "completed");
  const orderSigned = selected ? (signedOrders[selected.id] ?? false) : false;
  const autoStep = !orderSigned ? 1
    : !currentVitalsSaved ? 2
    : !allPremedsDone ? 3
    : !allChemosDone ? 4
    : allCompleted && selected?.status !== "ADMINISTERED" ? 5
    : selected?.status === "ADMINISTERED" ? 6
    : 4;
  const nurseStep = stepOverride ?? autoStep;

  const statusOrder: Record<string, number> = { ADMINISTERING: 0, PREPARED: 1, ADMINISTERED: 2 };
  const filteredOrders = orders
    .filter(o => {
      const matchSearch = !searchQ || o.name.includes(searchQ) || o.hn.includes(searchQ) || o.protocol.includes(searchQ);
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dateStr = now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ═══ Portrait Rotate Overlay ═══ */}
      <div className="fixed inset-0 z-[100] bg-white flex-col items-center justify-center gap-8 text-center p-8 hidden portrait:flex">
        <div className="relative">
          {/* Phone rotating from vertical to horizontal */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="animate-[rotatePhone_3s_ease-in-out_infinite]">
            <rect x="24" y="8" width="32" height="52" rx="6" stroke="#674BB3" strokeWidth="2.5" fill="#F0EDF8" />
            <line x1="40" y1="50" x2="40" y2="50.01" stroke="#674BB3" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {/* Arrow */}
          <div className="absolute -left-4 -top-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#674BB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="14 15 9 20 4 15" />
              <path d="M20 4h-7a4 4 0 0 0-4 4v12" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold text-text">กรุณาหมุนหน้าจอเป็นแนวนอน</p>
          <p className="text-sm text-text-secondary mt-2">หน้านี้ออกแบบสำหรับการใช้งานแบบแนวนอน<br/>เพื่อประสบการณ์ใช้งานที่ดีที่สุด</p>
        </div>
      </div>

      {/* ═══ Left Panel — Branding only (clock + illustration) ═══ */}
      <div className="w-[35%] max-w-md shrink-0 flex flex-col text-white relative overflow-hidden" style={{ background: "#674BB3" }}>
        {/* Ribbon behind */}
        <img src={`${import.meta.env.BASE_URL}onc/ribbon.svg`} alt="" className="absolute top-0 right-0 h-full pointer-events-none" />

        {/* Clock */}
        <div className="relative z-10 px-10 pt-10">
          <p className="text-base text-white/70">{dateStr}</p>
          <p className="mt-2"><span className="text-7xl font-black tracking-tight">{timeStr}</span> <span className="text-3xl font-bold">น.</span></p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Illustration + profile card overlay */}
        <div className="relative z-10 px-4">
          <img src={`${import.meta.env.BASE_URL}onc/chemo-theraphy-3d.png`} alt="" className="w-full object-contain pointer-events-none" />
          {/* Profile card — overlapping illustration */}
          <div className="absolute bottom-8 left-6 right-6 bg-white/95 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: roleColor.CHEMO_NURSE }}>
              {roleInitials.CHEMO_NURSE}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text truncate">{roleLabels.CHEMO_NURSE}</p>
              <p className="text-xs text-text-secondary">{roleEnglish.CHEMO_NURSE}</p>
            </div>
            <button onClick={() => navigate("/onc/login")} className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-text-secondary">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Notification panel — right drawer */}
      {notiOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/10" onClick={() => setNotiOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-96 max-w-[80vw] bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden animate-[fadeSlideIn_0.2s_ease-out]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-text">การแจ้งเตือน</h2>
                <p className="text-xs text-text-secondary">รายการยาที่พร้อมให้ผู้ป่วย</p>
              </div>
              <button onClick={() => setNotiOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X size={18} className="text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {myNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                  <Bell size={32} className="opacity-20 mb-3" />
                  <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                myNotifications.map(n => (
                  <button key={n.id} onClick={() => {
                    markNotificationRead(n.id);
                    setNotiOpen(false);
                    if (n.hn) {
                      const idx = orders.findIndex(o => o.hn === n.hn);
                      if (idx >= 0) setSelectedIdx(idx);
                    }
                  }}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100 ${!n.read ? "bg-onc/5" : ""}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === "prepared" ? "bg-emerald-100" : n.type === "rejection" ? "bg-red-100" : "bg-onc/10"
                    }`}>
                      {n.type === "prepared" ? <CheckCircle2 size={18} className="text-emerald-600" />
                        : n.type === "rejection" ? <X size={18} className="text-red-500" />
                        : <Bell size={18} className="text-onc" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text">{n.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-text-secondary mt-1.5">{n.from} · {n.timestamp}</p>
                    </div>
                    {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Right Panel — White, scrollable ═══ */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">

        {/* ── Patient List View (no patient selected) ── */}
        {!selected && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-text">รายการผู้ป่วยรอให้ยาเคมีบำบัด</h1>
              <button onClick={() => setNotiOpen(!notiOpen)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-onc text-white hover:bg-onc-hover active:scale-95 transition-all">
                <div className="relative">
                  <Bell size={18} className="text-white" />
                  {unreadCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
                </div>
                <span className="text-sm font-semibold">การแจ้งเตือน</span>
              </button>
            </div>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input placeholder="ค้นหาผู้ป่วย..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-onc transition-colors" />
            </div>
            {/* Status filter pills */}
            <div className="flex gap-2 mb-4 w-full">
              {([
                { key: "ALL" as const, label: "ทั้งหมด", count: orders.length },
                { key: "ADMINISTERING" as const, label: "กำลังให้ยา", count: orders.filter(o => o.status === "ADMINISTERING").length },
                { key: "PREPARED" as const, label: "รอให้ยา", count: orders.filter(o => o.status === "PREPARED").length },
                { key: "ADMINISTERED" as const, label: "ให้ยาครบ", count: orders.filter(o => o.status === "ADMINISTERED").length },
              ]).map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`flex-1 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                    statusFilter === f.key
                      ? f.key === "ADMINISTERING" ? "bg-onc text-white"
                        : f.key === "PREPARED" ? "bg-amber-500 text-white"
                        : f.key === "ADMINISTERED" ? "bg-emerald-500 text-white"
                        : "bg-text text-white"
                      : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                  }`}>
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredOrders.slice(0, visibleCount).map((o, cardIdx) => {
                const origIdx = orders.findIndex(x => x.id === o.id);
                const doneCount = o.drugs.filter(d => d.status === "completed").length;
                const infCount = o.drugs.filter(d => d.status === "infusing").length;
                return (
                  <button key={o.id} onClick={() => setSelectedIdx(origIdx)}
                    className="w-full text-left rounded-2xl border-[0.1px] border-border-card bg-white hover:bg-gray-50 transition-all animate-[fadeSlideIn_0.3s_ease-out_both]" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)", animationDelay: `${cardIdx * 50}ms` }}>
                    {/* Top row: columns */}
                    <div className="flex items-stretch divide-x divide-gray-100">
                      {/* Patient */}
                      <div className="flex-1 min-w-0 px-5 py-4 flex items-center gap-3">
                        <PatientAvatar hn={o.hn} size={44} />
                        <div className="min-w-0">
                          <p className="text-base font-bold text-text truncate">{o.name}</p>
                          <p className="text-xs text-text-secondary mt-0.5">HN {o.hn}</p>
                        </div>
                      </div>
                      {/* Protocol */}
                      <div className="w-28 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-onc">{o.protocol}</span>
                        <span className="text-xs text-text-secondary">C{o.cycle}D{o.day}</span>
                      </div>
                      {/* Drug count */}
                      <div className="w-24 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-text">{o.drugs.filter(d => d.classification === "chemotherapy").length}</span>
                        <span className="text-xs text-text-secondary">รายการยา</span>
                      </div>
                      {/* Status */}
                      <div className="w-28 shrink-0 px-3 py-4 flex items-center justify-center">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full text-white ${
                          o.status === "ADMINISTERED" ? "bg-emerald-500" :
                          o.status === "ADMINISTERING" ? "bg-onc" :
                          "bg-amber-500"
                        }`}>{statusLabel[o.status]}</span>
                      </div>
                    </div>
                    {/* Bottom row: tags */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-secondary flex items-center gap-1"><Stethoscope size={12} /> {o.ward}</span>
                        <span className="text-xs text-text-secondary flex items-center gap-1"><Clock size={12} /> เตรียมยา {o.preparedAt} น.</span>
                      </div>
                      {infCount > 0 && <span className="text-xs font-bold text-onc flex items-center gap-1 animate-pulse"><Timer size={12} /> กำลังให้ยา</span>}
                      {o.status === "PREPARED" && (() => {
                        const [h, m] = o.preparedAt.split(":").map(Number);
                        const waitMin = Math.floor((now.getHours() * 60 + now.getMinutes()) - (h * 60 + m));
                        if (waitMin <= 0) return null;
                        const isLong = waitMin >= 60;
                        return <span className={`text-xs font-bold flex items-center gap-1 ${isLong ? "text-red-500" : "text-amber-500"}`}><Timer size={12} /> รอ {waitMin >= 60 ? `${Math.floor(waitMin / 60)} ชม. ${waitMin % 60} นาที` : `${waitMin} นาที`}</span>;
                      })()}
                    </div>
                  </button>
                );
              })}
              {visibleCount < filteredOrders.length && (
                <button onClick={() => setVisibleCount(v => v + 4)}
                  className="w-full py-4 text-base font-semibold text-onc hover:bg-onc/5 rounded-xl transition-colors">
                  แสดงเพิ่ม ({filteredOrders.length - visibleCount} รายการ)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Patient Workflow View (patient selected) ── */}
        {selected && (
        <div>

          {/* Sticky header group — card style */}
          <div className="sticky top-0 z-20 p-4 pb-0">
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2.5 flex items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <button onClick={() => setSelectedIdx(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 active:opacity-80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-text truncate">{selected.name} <span className="text-sm font-normal text-text-secondary">HN {selected.hn} · {selected.age} ปี</span></p>
            </div>
            <span className="text-sm font-bold text-onc">{selected.protocol}</span>
            <span className="text-xs text-text-secondary">C{selected.cycle}D{selected.day}</span>
            <span className="text-sm font-bold text-text">{completedCount}/{selected.drugs.length}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full text-white shrink-0 ${statusColor[selected.status]}`}>
              {statusLabel[selected.status]}
            </span>
          </div>

          {/* Stepper */}
          <div className="mt-2 bg-white rounded-2xl border border-gray-100 px-4 py-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <MuiStepper activeStep={nurseStep - 1} alternativeLabel connector={<NurseConnector />}>
              {NURSE_STEPS.map((label, i) => (
                <Step key={label} completed={i < nurseStep - 1}>
                  <StepLabel StepIconComponent={NurseStepIcon}
                    onClick={() => setStepOverride(i + 1)}
                    sx={{ cursor: "pointer", "& .MuiStepLabel-label": { fontSize: "13px", fontFamily: "inherit", fontWeight: nurseStep === i + 1 ? 700 : 500, color: nurseStep === i + 1 ? "#674BB3" : undefined } }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </MuiStepper>
          </div>
          </div>

          {/* Tab content */}
          <div className="p-4">

            {/* ── Step 1: ตรวจรับยา (styled like OrderEntry review) ── */}
            {nurseStep === 1 && selected && (
              <div className=" space-y-3">

                {/* Protocol banner */}
                <div className="relative rounded-xl p-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #EDE9F6 0%, #D8D0F0 50%, #C8BFE8 100%)" }}>
                  <div className="relative z-10 max-w-[65%]">
                    <p className="text-xs font-semibold text-onc/70 uppercase tracking-wide">สูตรเคมีบำบัด</p>
                    <p className="text-2xl font-black text-text mt-1">{selected.protocol}</p>
                    <p className="text-sm text-text/70 font-medium">Cycle {selected.cycle} / Day {selected.day} · {selected.ward}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs font-bold text-onc bg-white/70 px-3 py-1 rounded-full">เตรียมยา {selected.preparedAt} น.</span>
                      <span className="text-xs font-bold text-onc bg-white/70 px-3 py-1 rounded-full">{selected.drugs.length} รายการ</span>
                    </div>
                  </div>
                  <div className="absolute right-4 -bottom-8 h-[110%] pointer-events-none">
                    <img src={`${import.meta.env.BASE_URL}onc/chemo-bag-3d.png`} alt="" className="h-full object-contain" />
                  </div>
                </div>

                {/* Patient info card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <PatientAvatar hn={selected.hn} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-text">{selected.name}</p>
                    <p className="text-xs text-text-secondary">HN {selected.hn} · {selected.age} ปี · {selected.ward}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className="text-xs font-semibold text-onc bg-onc/10 px-2.5 py-1 rounded-lg">{selected.protocol} C{selected.cycle}D{selected.day}</span>
                    <span className="text-xs font-semibold text-text-secondary bg-gray-50 px-2.5 py-1 rounded-lg">เตรียมยา {selected.preparedAt} น.</span>
                  </div>
                </div>

                {/* Drug list — table style */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-text">รายการยา</p>
                    <p className="text-xs text-text-secondary">{selected.drugs.length} รายการ</p>
                  </div>

                  {/* Pre-med */}
                  {selected.drugs.filter(d => d.classification === "premedication").length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-5 pt-3 pb-1">ยาก่อนเคมีบำบัด (Pre-medication)</p>
                      {selected.drugs.filter(d => d.classification === "premedication").map((d, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">P{i + 1}</div>
                            <div>
                              <p className="text-sm font-semibold text-text">{d.name}</p>
                              <p className="text-xs text-text-secondary">{d.route} · {d.diluent} · {d.rate}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-text">{d.dose} {d.unit}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Chemo */}
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-5 pt-3 pb-1">ยาเคมีบำบัด (Chemotherapy)</p>
                  {selected.drugs.filter(d => d.classification === "chemotherapy").map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-onc/10 flex items-center justify-center text-onc text-xs font-bold">{i + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-text">{d.name}</p>
                          <p className="text-xs text-text-secondary">{d.route} · {d.diluent} · {d.rate}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-text">{d.dose} {d.unit}</span>
                    </div>
                  ))}
                </div>

                {/* Spacer for sticky bottom */}
                <div className="h-32" />
              </div>
            )}

            {/* Sticky bottom actions — step 1 only */}
            {nurseStep === 1 && selected && (() => {
              const isRead = confirmedRead[selected.id] ?? false;
              return (
                <div className="fixed bottom-0 right-0 z-30 p-4 bg-linear-to-t from-white via-white to-transparent" style={{ left: "min(35%, 28rem)" }}>
                  <div className="space-y-2">
                    {/* Step 0: Scan QR first */}
                    {!scanResult[selected.id] && (
                      <button onClick={() => { setScanResult(prev => ({ ...prev, [selected.id]: true })); }}
                        className="w-full py-4 bg-text text-white text-base font-bold rounded-lg active:opacity-90 transition-colors flex items-center justify-center gap-2">
                        <ScanLine size={20} /> สแกน QR Code รับยา
                      </button>
                    )}
                    {scanResult[selected.id] && !isRead && (
                      <>
                        <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-4 py-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-600">สแกนรับยาแล้ว — ยืนยันตรงกับคำสั่ง</span>
                        </div>
                        <button onClick={() => setShowOrderDoc(true)}
                          className="w-full py-3 bg-onc text-white text-base font-bold rounded-lg active:opacity-90 transition-colors flex items-center justify-center gap-2">
                          <Eye size={16} /> อ่านใบสั่งยาเคมีบำบัด
                        </button>
                      </>
                    )}
                    {/* Step 2: Confirm and proceed */}
                    {scanResult[selected.id] && isRead && (
                      <>
                        <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-4 py-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-600">ตรวจสอบคำสั่งยาแล้ว</span>
                          <button onClick={() => setShowOrderDoc(true)} className="ml-auto text-xs text-onc font-semibold hover:underline flex items-center gap-1">
                            <Eye size={12} /> ดูอีกครั้ง
                          </button>
                        </div>
                        <button onClick={() => { setSignedOrders(prev => ({ ...prev, [selected.id]: true })); setStepOverride(null); }}
                          className="w-full py-3 bg-onc text-white text-base font-bold rounded-lg active:opacity-90 transition-colors flex items-center justify-center gap-2">
                          <ClipboardCheck size={16} /> ยืนยันรับยา — ไปขั้นตอนถัดไป
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Step 2: Vital Signs ── */}
            {nurseStep === 2 && (
              <div>
                <div className="bg-white rounded-xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <p className="text-lg font-bold text-text flex items-center gap-2 mb-4">
                    <Activity size={20} className="text-onc" /> วัด Vital Signs ก่อนให้ยา
                  </p>
                  {!currentVitalsSaved ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {([
                          { field: "bp" as const, icon: Activity, label: "BP", placeholder: "___/___", unit: "mmHg", color: "text-onc", inputMode: "numeric" as const, mask: "bp" },
                          { field: "hr" as const, icon: Heart, label: "HR", placeholder: "___", unit: "bpm", color: "text-red-500", inputMode: "numeric" as const, mask: "num" },
                          { field: "temp" as const, icon: Thermometer, label: "Temp", placeholder: "__._ ", unit: "°C", color: "text-amber-500", inputMode: "decimal" as const, mask: "dec" },
                          { field: "spo2" as const, icon: Wind, label: "SpO₂", placeholder: "___", unit: "%", color: "text-blue-500", inputMode: "numeric" as const, mask: "num" },
                        ]).map(v => (
                          <div key={v.field}>
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                              <v.icon size={14} className={v.color} /> {v.label}
                            </label>
                            <div className="relative">
                              <input type="text" inputMode={v.inputMode}
                                autoFocus={v.field === "bp"}
                                placeholder={v.placeholder} value={currentVitals[v.field]}
                                onChange={e => {
                                  let val = e.target.value;
                                  if (v.mask === "bp") {
                                    val = val.replace(/[^\d/]/g, "");
                                    const parts = val.split("/");
                                    if (parts[0] && parts[0].length > 3) parts[0] = parts[0].slice(0, 3);
                                    if (parts.length > 1 && parts[1].length > 3) parts[1] = parts[1].slice(0, 3);
                                    if (parts[0] && parts[0].length === 3 && !val.includes("/")) val = parts[0] + "/";
                                    else val = parts.slice(0, 2).join("/");
                                  } else if (v.mask === "num") {
                                    val = val.replace(/\D/g, "").slice(0, 3);
                                  } else if (v.mask === "dec") {
                                    val = val.replace(/[^\d.]/g, "").slice(0, 4);
                                  }
                                  updateVital(v.field, val);
                                }}
                                className="w-full px-4 py-3 text-2xl font-bold text-center border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-onc transition-colors tracking-wider" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">{v.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const bpValid = /^\d{2,3}\/\d{2,3}$/.test(currentVitals.bp);
                        const hrVal = Number(currentVitals.hr);
                        const hrValid = currentVitals.hr !== "" && hrVal >= 30 && hrVal <= 250;
                        const tempVal = Number(currentVitals.temp);
                        const tempValid = currentVitals.temp !== "" && tempVal >= 34 && tempVal <= 42;
                        const spo2Val = Number(currentVitals.spo2);
                        const spo2Valid = currentVitals.spo2 !== "" && spo2Val >= 50 && spo2Val <= 100;
                        const allValid = bpValid && hrValid && tempValid && spo2Valid;

                        const errors: string[] = [];
                        if (currentVitals.bp && !bpValid) errors.push("BP ต้องเป็น xxx/xxx");
                        if (currentVitals.hr && !hrValid) errors.push("HR ต้องอยู่ระหว่าง 30-250");
                        if (currentVitals.temp && !tempValid) errors.push("Temp ต้องอยู่ระหว่าง 34-42°C");
                        if (currentVitals.spo2 && !spo2Valid) errors.push("SpO₂ ต้องอยู่ระหว่าง 50-100%");

                        // Abnormal value warnings (valid but clinically concerning)
                        const warnings: string[] = [];
                        if (bpValid) {
                          const [sys, dia] = currentVitals.bp.split("/").map(Number);
                          if (sys >= 180 || dia >= 110) warnings.push("BP สูงมาก — ควรปรึกษาแพทย์ก่อนให้ยา");
                          else if (sys <= 90 || dia <= 60) warnings.push("BP ต่ำ — ควรปรึกษาแพทย์ก่อนให้ยา");
                        }
                        if (hrValid) {
                          if (hrVal > 120) warnings.push("HR เร็วผิดปกติ (>120 bpm)");
                          else if (hrVal < 50) warnings.push("HR ช้าผิดปกติ (<50 bpm)");
                        }
                        if (tempValid) {
                          if (tempVal >= 38) warnings.push("มีไข้ (≥38°C) — ควรปรึกษาแพทย์ก่อนให้ยา");
                        }
                        if (spo2Valid) {
                          if (spo2Val < 95) warnings.push("SpO₂ ต่ำ (<95%) — ควรประเมินก่อนให้ยา");
                        }

                        return (
                          <>
                            {errors.length > 0 && (
                              <div className="text-sm text-red-500 space-y-0.5 mb-2">
                                {errors.map((err, i) => <p key={i}>• {err}</p>)}
                              </div>
                            )}
                            {warnings.length > 0 && errors.length === 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex gap-2">
                                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-700 space-y-0.5">
                                  {warnings.map((w, i) => <p key={i} className="font-semibold">{w}</p>)}
                                  <p className="text-xs text-amber-600 mt-1">ค่าอยู่ในช่วงผิดปกติ — สามารถบันทึกได้แต่ควรแจ้งแพทย์</p>
                                </div>
                              </div>
                            )}
                            <button onClick={() => { saveVitals(); setStepOverride(null); }}
                              disabled={!allValid}
                              className="w-full py-3 bg-onc text-white text-base font-bold rounded-lg active:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                              <CheckCircle2 size={16} /> บันทึกและไปขั้นตอนถัดไป
                            </button>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-5">
                      <p className="text-base font-bold text-emerald-600 mb-3 flex items-center gap-2"><CheckCircle2 size={18} /> บันทึกแล้ว</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <span><b>BP:</b> {currentVitals.bp || "—"} mmHg</span>
                        <span><b>HR:</b> {currentVitals.hr || "—"} bpm</span>
                        <span><b>Temp:</b> {currentVitals.temp || "—"} °C</span>
                        <span><b>SpO₂:</b> {currentVitals.spo2 || "—"} %</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Pre-med ── */}
            {nurseStep === 3 && (
              <div className="space-y-3 ">
                <p className="text-lg font-bold text-text mb-2">ยาก่อนเคมีบำบัด (Pre-medication)</p>
                {premeds.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-text-secondary">ไม่มียา Pre-med ในคำสั่งนี้</div>
                ) : premeds.map((drug, idx) => {
                  const realIdx = selected.drugs.indexOf(drug);
                  const elapsedSec = infusionElapsedSec(drug.startedAt);
                  const totalSec = drug.infusionMin * 60;
                  const remainingSec = Math.max(0, totalSec - elapsedSec);
                  const remainingMin = Math.ceil(remainingSec / 60);
                  const progress = totalSec > 0 ? Math.min(elapsedSec / totalSec, 1) : 0;
                  return (
                    <div key={idx} className={`rounded-xl border p-5 ${drug.status === "completed" ? "bg-gray-50 border-gray-200 border-l-4 border-l-emerald-400" : "bg-white border-gray-100"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold bg-blue-50 text-blue-600 shrink-0">
                            {drug.status === "completed" ? <CheckCircle2 size={20} className="text-emerald-500" /> : `P${idx + 1}`}
                          </div>
                          <div>
                            <p className="text-xl font-bold text-text">{drug.name}</p>
                            <p className="text-base text-text-secondary"><b>{drug.dose} {drug.unit}</b> · {drug.route} · {drug.diluent} · {drug.rate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {drug.status === "waiting" && <button onClick={() => startDrug(realIdx)} disabled={hasInfusing} className={`onc-touch px-8 py-4 font-bold text-lg rounded-lg active:opacity-80 transition-colors flex items-center gap-2 ${hasInfusing ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-onc text-white"}`}><Play size={20} fill={hasInfusing ? "#9ca3af" : "white"} /> เริ่มให้ยา</button>}
                          {drug.status === "infusing" && (() => {
                            const done = remainingSec <= 0;
                            return done ? (
                              <button onClick={() => doStopDrug(realIdx)} className="onc-touch px-8 py-4 bg-emerald-500 text-white font-bold text-lg rounded-lg active:opacity-80 transition-colors flex items-center gap-2"><CheckCircle2 size={20} /> เสร็จสิ้น</button>
                            ) : (
                              <button onClick={() => stopDrug(realIdx)} className="onc-touch px-8 py-4 bg-red-500 text-white font-bold text-lg rounded-lg active:opacity-80 transition-colors flex items-center gap-2"><Square size={20} fill="white" /> หยุดให้ยา</button>
                            );
                          })()}
                          {drug.status === "completed" && <span className="text-base font-semibold text-emerald-600 flex items-center gap-2"><CheckCircle2 size={18} />{drug.startedAt} → {drug.stoppedAt}</span>}
                        </div>
                      </div>
                      {drug.status === "infusing" && drug.infusionMin > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-base mb-2">
                            <span className="text-text-secondary"><Clock size={16} className="inline mr-1" />เริ่ม {drug.startedAt}</span>
                            <span className="font-bold text-onc text-lg">{remainingSec > 0 ? `เหลือ ${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")} นาที` : "ครบเวลาแล้ว"}</span>
                          </div>
                          <div className="bg-gray-200 rounded h-3 overflow-hidden">
                            <div className={`h-full rounded transition-all duration-1000 ${remainingSec <= 0 ? "bg-emerald-400" : "bg-onc"}`} style={{ width: `${progress * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {allPremedsDone && premeds.length > 0 && (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-[fadeSlideIn_0.3s_ease-out]">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={22} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-700">ให้ Pre-med ครบทุกรายการแล้ว</p>
                        <p className="text-xs text-emerald-600">{premeds.length} รายการ — พร้อมให้ยาเคมีบำบัด</p>
                      </div>
                    </div>
                    <button onClick={() => setStepOverride(null)} className="w-full py-3 bg-onc text-white text-base font-bold rounded-lg active:opacity-90 transition-colors flex items-center justify-center gap-2">
                      ถัดไป: ให้ยาเคมีบำบัด
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Step 4: Chemo ── */}
            {nurseStep === 4 && (
              <div className="space-y-3 ">
                <p className="text-lg font-bold text-text mb-2">ยาเคมีบำบัด (Chemotherapy)</p>
                {chemos.map((drug, idx) => {
                  const realIdx = selected.drugs.indexOf(drug);
                  const elapsedSec = infusionElapsedSec(drug.startedAt);
                  const totalSec = drug.infusionMin * 60;
                  const remainingSec = Math.max(0, totalSec - elapsedSec);
                  const remainingMin = Math.ceil(remainingSec / 60);
                  const progress = totalSec > 0 ? Math.min(elapsedSec / totalSec, 1) : 0;
                  return (
                    <div key={idx} className={`rounded-xl border p-5 ${drug.status === "completed" ? "bg-gray-50 border-gray-200 border-l-4 border-l-emerald-400" : "bg-white border-gray-100"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold bg-onc/10 text-onc shrink-0">
                            {drug.status === "completed" ? <CheckCircle2 size={20} className="text-emerald-500" /> : idx + 1}
                          </div>
                          <div>
                            <p className="text-xl font-bold text-text">{drug.name}</p>
                            <p className="text-base text-text-secondary"><b>{drug.dose} {drug.unit}</b> · {drug.route} · {drug.diluent} · {drug.rate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {drug.status === "waiting" && <button onClick={() => startDrug(realIdx)} disabled={hasInfusing} className={`onc-touch px-8 py-4 font-bold text-lg rounded-lg active:opacity-80 transition-colors flex items-center gap-2 ${hasInfusing ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-onc text-white"}`}><Play size={20} fill={hasInfusing ? "#9ca3af" : "white"} /> เริ่มให้ยา</button>}
                          {drug.status === "infusing" && (() => {
                            const done = remainingSec <= 0;
                            return done ? (
                              <button onClick={() => doStopDrug(realIdx)} className="onc-touch px-8 py-4 bg-emerald-500 text-white font-bold text-lg rounded-lg active:opacity-80 transition-colors flex items-center gap-2"><CheckCircle2 size={20} /> เสร็จสิ้น</button>
                            ) : (
                              <button onClick={() => stopDrug(realIdx)} className="onc-touch px-8 py-4 bg-red-500 text-white font-bold text-lg rounded-lg active:opacity-80 transition-colors flex items-center gap-2"><Square size={20} fill="white" /> หยุดให้ยา</button>
                            );
                          })()}
                          {drug.status === "completed" && <span className="text-base font-semibold text-emerald-600 flex items-center gap-2"><CheckCircle2 size={18} />{drug.startedAt} → {drug.stoppedAt}</span>}
                        </div>
                      </div>
                      {drug.status === "infusing" && drug.infusionMin > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-base mb-2">
                            <span className="text-text-secondary"><Clock size={16} className="inline mr-1" />เริ่ม {drug.startedAt}</span>
                            <span className="font-bold text-onc text-lg">{remainingSec > 0 ? `เหลือ ${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")} นาที` : "ครบเวลาแล้ว"}</span>
                          </div>
                          <div className="bg-gray-200 rounded h-3 overflow-hidden">
                            <div className={`h-full rounded transition-all duration-1000 ${remainingSec <= 0 ? "bg-emerald-400" : "bg-onc"}`} style={{ width: `${progress * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {allChemosDone && chemos.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-[fadeSlideIn_0.3s_ease-out]">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">ให้ยาเคมีบำบัดครบทุกรายการแล้ว</p>
                      <p className="text-xs text-emerald-600">{chemos.length} รายการ — ดำเนินการสังเกตอาการต่อไป</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 5: สังเกตอาการ ── */}
            {nurseStep === 5 && (() => {
              const reactionChips = [
                { label: "คลื่นไส้/อาเจียน", icon: <Frown size={16} /> },
                { label: "ผื่นแพ้ผิวหนัง", icon: <CircleDot size={16} /> },
                { label: "หนาวสั่น/ไข้", icon: <Thermometer size={16} /> },
                { label: "ปวดบริเวณฉีดยา", icon: <Syringe size={16} /> },
                { label: "หายใจลำบาก", icon: <Wind size={16} /> },
                { label: "ความดันตก", icon: <TrendingDown size={16} /> },
                { label: "ใจสั่น/หัวใจเต้นเร็ว", icon: <HeartPulse size={16} /> },
                { label: "Extravasation", icon: <AlertTriangle size={16} /> },
              ];
              const severityLevels = [
                { value: 1, label: "Grade 1", desc: "เล็กน้อย", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                { value: 2, label: "Grade 2", desc: "ปานกลาง", color: "bg-amber-100 text-amber-700 border-amber-200" },
                { value: 3, label: "Grade 3", desc: "รุนแรง", color: "bg-orange-100 text-orange-700 border-orange-200" },
                { value: 4, label: "Grade 4", desc: "อันตราย", color: "bg-red-100 text-red-700 border-red-200" },
              ];
              const currentReaction = selected.adverseReaction || "";
              // Parse: chips are known labels, severity is [Gx], rest is free text
              const chipLabels = reactionChips.map(c => c.label);
              const parts = currentReaction.split("|").filter(Boolean);
              const selectedChips = parts.filter(p => chipLabels.includes(p));
              const severityPart = parts.find(p => /^\[G\d\]$/.test(p));
              const currentSeverity = severityPart ? Number(severityPart[2]) : 0;
              const freeText = parts.filter(p => !chipLabels.includes(p) && !/^\[G\d\]$/.test(p)).join(" ").trim();

              const buildReaction = (chips: string[], free: string, sev: number) => {
                const result = [...chips, ...(free ? [free] : []), ...(sev > 0 ? [`[G${sev}]`] : [])];
                return result.join("|");
              };

              const toggleChip = (label: string) => {
                const chips = new Set(selectedChips);
                if (chips.has(label)) chips.delete(label); else chips.add(label);
                setReaction(buildReaction([...chips], freeText, currentSeverity));
              };
              const setSeverity = (grade: number) => {
                setReaction(buildReaction(selectedChips, freeText, currentSeverity === grade ? 0 : grade));
              };
              const hasAnyReaction = selectedChips.length > 0 || freeText.length > 0;

              return (
                <div className="space-y-4">
                  {/* Common reactions */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <p className="text-lg font-bold text-text flex items-center gap-2 mb-2">
                      <Eye size={20} className="text-onc" /> สังเกตอาการหลังให้ยา
                    </p>
                    <p className="text-sm text-text-secondary mb-4">เลือกอาการที่พบ (ถ้ามี)</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {reactionChips.map(chip => {
                        const active = selectedChips.includes(chip.label);
                        return (
                          <button key={chip.label} onClick={() => toggleChip(chip.label)}
                            className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-all active:scale-95 flex items-center gap-1.5 ${
                              active ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-text-secondary hover:bg-gray-100"
                            }`}>
                            <span>{chip.icon}</span> {chip.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Severity scale — show when any reaction selected */}
                    {hasAnyReaction && (
                      <div className="mb-5">
                        <p className="text-sm font-semibold text-text mb-2">ระดับความรุนแรง (CTCAE)</p>
                        <div className="grid grid-cols-4 gap-2">
                          {severityLevels.map(s => (
                            <button key={s.value} onClick={() => setSeverity(currentSeverity === s.value ? 0 : s.value)}
                              className={`py-3 rounded-lg border-2 text-center transition-all active:scale-95 ${
                                currentSeverity === s.value ? s.color + " border-current font-bold" : "bg-white border-gray-200 text-text-secondary hover:bg-gray-50"
                              }`}>
                              <p className="text-sm font-bold">{s.label}</p>
                              <p className="text-xs">{s.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Free text for additional notes */}
                    <p className="text-sm font-semibold text-text mb-2">รายละเอียดเพิ่มเติม</p>
                    <textarea
                      value={freeText}
                      onChange={e => setReaction(buildReaction(selectedChips, e.target.value, currentSeverity))}
                      placeholder="บันทึกรายละเอียดเพิ่มเติม (ถ้ามี)..."
                      rows={3}
                      className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-onc resize-none transition-colors" />
                  </div>

                  <button onClick={() => setStepOverride(6)}
                    className="w-full py-4 bg-onc text-white text-lg font-bold rounded-lg active:opacity-90 transition-colors flex items-center justify-center gap-2">
                    ถัดไป: ยืนยัน
                  </button>
                </div>
              );
            })()}

            {/* ── Step 6: ยืนยัน ── */}
            {nurseStep === 6 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <p className="text-lg font-bold text-text mb-4">สรุปการให้ยา</p>
                  <div className="space-y-3 text-base">
                    <div className="flex justify-between"><span className="text-text-secondary">ผู้ป่วย</span><span className="font-bold text-text">{selected.name}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Protocol</span><span className="font-bold text-onc">{selected.protocol} C{selected.cycle}D{selected.day}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">ยาทั้งหมด</span><span className="font-bold text-text">{selected.drugs.length} รายการ ({completedCount} เสร็จ)</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Vital Signs</span><span className="font-bold text-text">BP {currentVitals.bp} · HR {currentVitals.hr} · Temp {currentVitals.temp} · SpO₂ {currentVitals.spo2}</span></div>
                    {selected.adverseReaction && <div className="flex justify-between"><span className="text-text-secondary">อาการไม่พึงประสงค์</span><span className="font-bold text-amber-600">{selected.adverseReaction.replace(/\[G\d\]/, "").replace(/\|/g, ", ")}</span></div>}
                  </div>
                </div>

                {/* Drug timeline */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <p className="text-sm font-bold text-text mb-4">ลำดับการให้ยา</p>
                  <div className="space-y-0">
                    {selected.drugs.map((d, i) => (
                      <div key={i} className="flex items-start gap-3 relative">
                        {/* Timeline line */}
                        {i < selected.drugs.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />}
                        {/* Dot */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          d.status === "completed" ? "bg-emerald-100" : d.status === "infusing" ? "bg-onc/10" : "bg-gray-100"
                        }`}>
                          {d.status === "completed" ? <CheckCircle2 size={14} className="text-emerald-500" />
                            : d.status === "infusing" ? <Timer size={14} className="text-onc" />
                            : <Clock size={14} className="text-gray-400" />}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-text">{d.name} <span className="font-normal text-text-secondary">{d.dose} {d.unit}</span></p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              d.classification === "premedication" ? "bg-blue-50 text-blue-600" : "bg-onc/10 text-onc"
                            }`}>{d.classification === "premedication" ? "Pre-med" : "Chemo"}</span>
                          </div>
                          {d.startedAt && (
                            <p className="text-xs text-text-secondary mt-0.5">
                              {d.startedAt}{d.stoppedAt ? ` → ${d.stoppedAt}` : " — กำลังให้ยา"}
                            </p>
                          )}
                          {!d.startedAt && <p className="text-xs text-text-secondary mt-0.5">ยังไม่ได้เริ่ม</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.status !== "ADMINISTERED" ? (
                  <button onClick={handleComplete}
                    className="w-full py-4 bg-emerald-500 text-white text-lg font-bold rounded-lg active:opacity-90 transition-colors flex items-center justify-center gap-2">
                    <Lock size={20} /> ยืนยัน + PIN
                  </button>
                ) : (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-6 text-center">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-emerald-600">ให้ยาครบแล้ว</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ═══ Order Document — Bottom Sheet ═══ */}
      {showOrderDoc && selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowOrderDoc(false)} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] max-h-[85vh] bg-white rounded-t-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="px-5 py-2 flex items-center justify-between border-b shrink-0">
              <div>
                <p className="font-bold text-text">ใบสั่งยาเคมีบำบัด</p>
                <p className="text-xs text-text-secondary">{selected.name} · {selected.protocol} C{selected.cycle}D{selected.day}</p>
              </div>
              <button onClick={() => setShowOrderDoc(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X size={16} className="text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="mx-auto bg-white shadow-lg p-6" style={{ width: 595, minHeight: 842, aspectRatio: "1 / 1.4142" }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b-2 border-onc pb-3">
                  <div>
                    <h1 className="text-sm font-bold text-onc">โรงพยาบาลตัวอย่าง</h1>
                    <p className="text-[10px] text-text-secondary">คลินิกเคมีบำบัด / Chemotherapy Clinic</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-red-600">ใบสั่งยาเคมีบำบัด</p>
                    <p className="text-[10px] text-text-secondary">เลขที่: <span className="font-mono font-bold text-text">{selected.id}</span></p>
                  </div>
                </div>
                {/* Patient */}
                <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="col-span-2"><span className="text-text-secondary">ชื่อ-สกุล: </span><span className="font-bold">{selected.name}</span></div>
                    <div><span className="text-text-secondary">HN: </span><span className="font-bold">{selected.hn}</span></div>
                    <div><span className="text-text-secondary">อายุ: </span><span className="font-bold">{selected.age} ปี</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <div><span className="text-text-secondary">Protocol: </span><span className="font-bold text-onc">{selected.protocol}</span></div>
                    <div><span className="text-text-secondary">Cycle: </span><span className="font-bold">C{selected.cycle}D{selected.day}</span></div>
                    <div><span className="text-text-secondary">หอผู้ป่วย: </span><span className="font-bold">{selected.ward}</span></div>
                  </div>
                </div>
                {/* Drug table */}
                <table className="w-full text-[10px] border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-50 text-text-secondary">
                      <th className="border border-gray-300 px-2 py-1 text-left">ลำดับ</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">ประเภท</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">ชื่อยา</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">ขนาด</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">Route</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Diluent</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">เวลาให้ยา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.drugs.map((d, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                        <td className="border border-gray-300 px-2 py-1.5">
                          <span className={d.classification === "premedication" ? "text-blue-600" : "text-red-600"}>{d.classification === "premedication" ? "Pre-med" : "Chemo"}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 font-bold">{d.name}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{d.dose} {d.unit}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{d.route}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-text-secondary">{d.diluent}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{d.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 text-center text-[10px] border-t-2 border-gray-400 pt-4">
                  <div>
                    <p className="font-bold">แพทย์ผู้สั่งยา</p>
                    <p className="font-semibold text-onc mt-1">{roleLabels.ONC_DOCTOR}</p>
                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mb-1" />
                    <p className="text-text-secondary">วันที่: {selected.preparedAt} น.</p>
                  </div>
                  <div>
                    <p className="font-bold">เภสัชกรผู้ตรวจสอบ</p>
                    <p className="font-semibold text-onc mt-1">{roleLabels.ONC_PHARMACIST}</p>
                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mb-1" />
                    <p className="text-text-secondary">วันที่: {selected.preparedAt} น.</p>
                  </div>
                  <div>
                    <p className="font-bold">พยาบาลผู้ให้ยา</p>
                    {signing ? (
                      <>
                        {(() => {
                          const name = roleLabels.CHEMO_NURSE;
                          const charCount = name.length;
                          const typeDuration = charCount * 0.12;
                          const blinkCount = Math.ceil(typeDuration / 0.5);
                          return (
                            <div className="mt-1 inline-block overflow-hidden whitespace-nowrap font-semibold text-onc"
                              style={{ borderRight: "2px solid #674BB3", animation: `typeWriter ${typeDuration}s steps(${charCount}) forwards, blinkCursor 0.5s step-end ${blinkCount}` }}>
                              {name}
                            </div>
                          );
                        })()}
                        <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mb-1" />
                        <p className="text-text-secondary">กำลังลงนาม...</p>
                      </>
                    ) : orderSigned ? (
                      <>
                        <p className="font-semibold text-onc mt-1">{roleLabels.CHEMO_NURSE}</p>
                        <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mb-1" />
                        <p className="text-text-secondary">วันที่: ............... เวลา: ........ น.</p>
                      </>
                    ) : (
                      <>
                        <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                        <p className="text-text-secondary">รอลงนาม</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Accept checkbox — sticky bottom of sheet */}
            {!orderSigned && (
              <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
                <label className="flex items-center gap-3 cursor-pointer select-none mb-3">
                  <input type="checkbox" checked={confirmedRead[selected.id] ?? false}
                    onChange={() => setConfirmedRead(prev => ({ ...prev, [selected.id]: !(prev[selected.id] ?? false) }))}
                    className="w-5 h-5 rounded accent-onc shrink-0" />
                  <span className="text-sm text-text">ข้าพเจ้าได้ตรวจสอบรายละเอียดคำสั่งยาเรียบร้อยแล้ว</span>
                </label>
                <button onClick={() => {
                    setSigning(true);
                    const closeDuration = (roleLabels.CHEMO_NURSE.length * 0.12 + 0.5) * 1000;
                    setTimeout(() => {
                      setConfirmedRead(prev => ({ ...prev, [selected.id]: true }));
                      setSigning(false);
                      setShowOrderDoc(false);
                    }, closeDuration);
                  }}
                  disabled={!(confirmedRead[selected.id] ?? false) || signing}
                  className="w-full py-3 bg-onc text-white text-base font-bold rounded-lg active:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {signing ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังลงนาม...</>
                  ) : (
                    <><CheckCircle2 size={16} /> ยืนยันและลงนาม</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Confirm Start Drug ═══ */}
      {confirmStartIdx !== null && selected && (() => {
        const drug = selected.drugs[confirmStartIdx];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmStartIdx(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 px-8 py-10 animate-[fadeSlideIn_0.25s_ease-out]">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-onc/10 flex items-center justify-center mx-auto mb-4">
                  <Play size={28} className="text-onc" />
                </div>
                <h3 className="text-xl font-bold text-text">เริ่มให้ยา?</h3>
                <p className="text-sm text-text-secondary mt-1">ยืนยันข้อมูลก่อนเริ่มให้ยา</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-text-secondary">ยา</span><span className="font-semibold text-text">{drug.name}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">ขนาด</span><span className="font-semibold text-text">{drug.dose} {drug.unit}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">วิธีให้</span><span className="font-semibold text-text">{drug.route}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">ตัวทำละลาย</span><span className="font-semibold text-text">{drug.diluent}</span></div>
                {drug.infusionMin > 0 && <div className="flex justify-between"><span className="text-text-secondary">ระยะเวลา</span><span className="font-semibold text-text">{drug.rate}</span></div>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmStartIdx(null)}
                  className="flex-1 py-3 border border-gray-200 text-text-secondary text-sm font-semibold rounded-xl active:opacity-80 transition-colors">
                  ยกเลิก
                </button>
                <button onClick={() => doStartDrug(confirmStartIdx)}
                  className="flex-1 py-3 bg-onc text-white text-sm font-bold rounded-xl active:opacity-80 transition-colors flex items-center justify-center gap-2">
                  <Play size={16} fill="white" /> เริ่มให้ยา
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ Confirm Early Stop ═══ */}
      {confirmStopIdx !== null && selected && (() => {
        const drug = selected.drugs[confirmStopIdx];
        const elapsed = infusionElapsedSec(drug.startedAt);
        const totalSec = drug.infusionMin * 60;
        const remainMin = Math.ceil((totalSec - elapsed) / 60);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmStopIdx(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 px-8 py-10 animate-[fadeSlideIn_0.25s_ease-out]">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-text">หยุดยาก่อนกำหนด?</h3>
                <p className="text-sm text-text-secondary mt-1">{drug.name} ยังเหลืออีก {remainMin} นาที</p>
              </div>
              <p className="text-sm text-text-secondary text-center mb-6">ยา {drug.name} ({drug.dose} {drug.unit}) ยังให้ไม่ครบตามเวลาที่กำหนด ({drug.infusionMin} นาที) ต้องการหยุดให้ยาหรือไม่?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmStopIdx(null)}
                  className="flex-1 py-3 border border-gray-200 text-text-secondary text-sm font-semibold rounded-xl active:opacity-80 transition-colors">
                  ยกเลิก
                </button>
                <button onClick={() => doStopDrug(confirmStopIdx)}
                  className="flex-1 py-3 bg-red-500 text-white text-sm font-bold rounded-xl active:opacity-80 transition-colors">
                  ยืนยันหยุดยา
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ PIN Dialog ═══ */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowPin(false); setPin(""); }} />
          {/* Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 px-8 py-10 animate-[fadeSlideIn_0.25s_ease-out]">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-text">กรุณายืนยันรหัส 6 หลัก</h3>
              <p className="text-sm text-text-secondary mt-1">กรอกรหัส 6 หลักเพื่อดำเนินการต่อ</p>
            </div>
            {pinError && <p className="text-sm text-red-500 font-semibold mb-4 text-center">PIN ไม่ถูกต้อง — ลองอีกครั้ง</p>}
            {/* PIN dots */}
            <div className="flex justify-center gap-5 mb-10">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length ? "bg-gray-800 scale-110" : "bg-gray-300"
                }`} />
              ))}
            </div>
            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 mb-4 max-w-[260px] mx-auto">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k => (
                <div key={k} className="flex justify-center">
                  {k ? (
                    <button disabled={k !== "⌫" && pin.length === 6}
                      onClick={() => { if (k === "⌫") { setPin(p => p.slice(0,-1)); setPinError(false); } else if (pin.length < 6) setPin(p => p+k); }}
                      className={`w-16 h-16 rounded-full text-xl font-semibold transition-all active:scale-95 flex items-center justify-center ${
                        k === "⌫" ? "text-text-secondary hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100 text-text"
                      }`}>
                      {k === "⌫" ? <X size={20} /> : k}
                    </button>
                  ) : <div className="w-16 h-16" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Success Toast ═══ */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-[fadeSlideIn_0.3s_ease-out]">
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-emerald-100 px-5 py-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-text">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
