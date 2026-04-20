import { useState, useRef } from "react";
import {
  CheckCircle2, XCircle, Search, Check,
  AlertTriangle, Shield, X,
  Pill, Timer, Lock,
  FlaskConical, Hash, Calendar, Trash2, ClipboardCheck,
  ChevronUp, ChevronDown, Printer, Download,
} from "lucide-react";
import { useOnc, DRUG_PRICES, SERVICE_ITEMS, type BillingItem } from "../../components/onc/OncContext";
import PatientAvatar from "../../components/onc/PatientAvatar";
import { Listbox, ListboxItem, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Stepper as MuiStepper, Step, StepLabel, StepConnector, stepConnectorClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useToast } from "../../components/onc/Toast";
import { useOrderVerification } from "../../hooks/useOrderVerification";
import type { PatientClinical, DrugOrder, CumulativeDoseRecord } from "../../hooks/useOrderVerification";
import SafetyGatePanel from "../../components/onc/SafetyGatePanel";

/* ── MUI Qonto-style Stepper (same as OrderEntry) ── */
const PharmConnector = styled(StepConnector)({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: "calc(-50% + 16px)", right: "calc(50% + 16px)" },
  [`&.${stepConnectorClasses.active}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3" } },
  [`&.${stepConnectorClasses.completed}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3" } },
  [`& .${stepConnectorClasses.line}`]: { borderColor: "#e5e7eb", borderTopWidth: 3, borderRadius: 1, transition: "border-color 0.3s ease" },
});

function PharmStepIcon({ active, completed }: { active?: boolean; completed?: boolean }) {
  return (
    <div style={{ color: active ? "#674BB3" : completed ? "#674BB3" : "#e5e7eb", display: "flex", height: 22, alignItems: "center" }}>
      {completed ? <Check size={18} style={{ color: "#674BB3" }} />
        : <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "currentColor", transform: active ? "scale(1.3)" : "scale(1)" }} />}
    </div>
  );
}

const PHARM_STEPS = ["เตรียมยา", "ยาพร้อม"];


/* ══════════════════════════════════════════════
   Pharmacist — Verify + Compound (single flow)
   SUBMITTED → VERIFIED → PREPARING → PREPARED
   ══════════════════════════════════════════════ */

type OrderStatus = "SUBMITTED" | "VERIFIED" | "PREPARING" | "PREPARED" | "REJECTED";
type OrderItem = {
  name: string; dose: string; route: string; method: string;
  calcDose: number; finalDose: number; diluent: string; rate: string;
  classification: "premedication" | "chemotherapy";
  lotNo: string; expiryDate: string; preparedQty: number; wasteQty: number;
};
type Order = {
  id: string; hn: string; name: string; age: number;
  diagnosis: string; protocol: string; cycle: number; day: number;
  doctor: string; ward: string; submittedAt: string;
  status: OrderStatus; items: OrderItem[];
  labs: { name: string; value: number; ref: string; ok: boolean }[];
  adjustedBy?: string; adjustReason?: string;
};

const I = (name: string, dose: string, route: string, method: string, calcDose: number, finalDose: number, diluent: string, rate: string, cls: "premedication" | "chemotherapy"): OrderItem =>
  ({ name, dose, route, method, calcDose, finalDose, diluent, rate, classification: cls, lotNo: "", expiryDate: "", preparedQty: 0, wasteQty: 0 });

const mockOrders: Order[] = [
  {
    id: "ORD-001", hn: "104558", name: "นาง คำปุ่น เสนาหอย", age: 55,
    diagnosis: "C50.9 — Breast Cancer", protocol: "CAF", cycle: 3, day: 1,
    doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", submittedAt: "09:15", status: "SUBMITTED",
    items: [
      I("Ondansetron", "8 mg", "IV", "FIXED", 8, 8, "NSS 50 ml", "15 min", "premedication"),
      I("Cyclophosphamide", "500 mg/m²", "IV Infusion", "BSA", 700, 700, "D-5-W 100 ml", "30 min", "chemotherapy"),
      I("Doxorubicin", "50 mg/m²", "IV Push", "BSA", 70, 70, "D-5-W 50 ml", "—", "chemotherapy"),
      I("5-FU", "500 mg/m²", "IV Infusion", "BSA", 700, 700, "D-5-W 500 ml", "4 hr", "chemotherapy"),
    ],
    labs: [{ name: "ANC", value: 2.1, ref: "≥ 1.5", ok: true }, { name: "PLT", value: 185, ref: "≥ 100", ok: true }, { name: "Cr", value: 0.8, ref: "≤ 1.5", ok: true }],
  },
  {
    id: "ORD-002", hn: "519087", name: "นางสาวมาลี สุขใจ", age: 52,
    diagnosis: "C50.1 — Breast Cancer HER2+", protocol: "AC-T", cycle: 2, day: 1,
    doctor: "นพ.สมชาย รักษาดี", ward: "OPD เคมีบำบัด", submittedAt: "09:42", status: "SUBMITTED",
    items: [
      I("Dexamethasone", "20 mg", "IV", "FIXED", 20, 20, "NSS 50 ml", "15 min", "premedication"),
      I("Doxorubicin", "60 mg/m²", "IV Push", "BSA", 97, 97, "D-5-W 50 ml", "15 min", "chemotherapy"),
      I("Cyclophosphamide", "600 mg/m²", "IV Infusion", "BSA", 972, 972, "D-5-W 100 ml", "30 min", "chemotherapy"),
    ],
    labs: [{ name: "ANC", value: 1.3, ref: "≥ 1.5", ok: false }, { name: "PLT", value: 98, ref: "≥ 100", ok: false }, { name: "Cr", value: 0.9, ref: "≤ 1.5", ok: true }],
  },
  {
    id: "ORD-003", hn: "205471", name: "นายบุญมี ดีใจ", age: 68,
    diagnosis: "C18.0 — Colon Cancer", protocol: "FOLFOX6", cycle: 5, day: 1,
    doctor: "พญ.วิภา ศรีสุข", ward: "หอผู้ป่วย 4A", submittedAt: "10:05", status: "SUBMITTED",
    items: [
      I("Ondansetron", "8 mg", "IV", "FIXED", 8, 8, "NSS 50 ml", "15 min", "premedication"),
      I("Oxaliplatin", "85 mg/m²", "IV Infusion", "BSA", 144, 144, "D-5-W 500 ml", "2 hr", "chemotherapy"),
      I("Leucovorin", "200 mg/m²", "IV Infusion", "BSA", 340, 340, "D-5-W 100 ml", "2 hr", "chemotherapy"),
      I("5-FU (bolus)", "400 mg/m²", "IV Push", "BSA", 680, 680, "—", "—", "chemotherapy"),
    ],
    labs: [{ name: "ANC", value: 3.2, ref: "≥ 1.5", ok: true }, { name: "PLT", value: 210, ref: "≥ 100", ok: true }, { name: "Cr", value: 1.1, ref: "≤ 1.5", ok: true }],
  },
];

const statusLabel: Record<OrderStatus, string> = { SUBMITTED: "รอตรวจสอบ", VERIFIED: "ลงนามแล้ว", PREPARING: "กำลังเตรียมยา", PREPARED: "ยาพร้อม", REJECTED: "ปฏิเสธ" };
const statusColor: Record<OrderStatus, string> = { SUBMITTED: "bg-amber-500", VERIFIED: "bg-indigo-500", PREPARING: "bg-onc", PREPARED: "bg-emerald-500", REJECTED: "bg-red-500" };

function elapsed(t: string) {
  const [h, m] = t.split(":").map(Number);
  const now = new Date();
  const diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
  if (diff <= 0) return { text: "เมื่อสักครู่", color: "text-emerald-500" };
  if (diff < 30) return { text: `${diff} นาที`, color: "text-emerald-500" };
  if (diff < 60) return { text: `${diff} นาที`, color: "text-amber-500" };
  return { text: `${Math.floor(diff / 60)} ชม. ${diff % 60} นาที`, color: "text-red-500" };
}

/* ── Shared card style ── */
const card = "bg-white rounded-2xl border-[0.1px] border-border-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]";

type PatientData = {
  hn: string; name: string; age: number; gender: string; dob: string;
  bloodType: string; allergy: string; allergyLevel: string;
  diagnosis: string; icd10: string; morphology: string;
  t: string; n: string; m: string; stage: string; ecog: number;
  weight: number; height: number; bsa: number;
  creatinine: number; crcl: number;
  doctor: string; ward: string; regimen: string;
  currentCycle: number; totalCycles: number;
  [key: string]: unknown;
};

export default function PharmVerify({ embedded, patientHN, patientData }: { embedded?: boolean; patientHN?: string; patientData?: PatientData }) {
  const { verifyPin, addNotification, addBillingRecord } = useOnc();
  const { toast } = useToast();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedId, setSelectedId] = useState<string | null>("ORD-001");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [showPin, setShowPin] = useState(false);
  const [pinAction, setPinAction] = useState<"verify" | "reject" | "compound">("verify");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [signing, setSigning] = useState(false);
  const [applyCounter, setApplyCounter] = useState(0);
  const [showCompForm, setShowCompForm] = useState(false);
  const [preparingShimmer, setPreparingShimmer] = useState(false);
  const signatureRef = useRef<HTMLDivElement>(null);
  const compFormRef = useRef<HTMLDivElement>(null);

  const filtered = orders.filter(o => {
    if (embedded && patientHN) return o.hn === patientHN;
    const matchSearch = !search || o.name.includes(search) || o.hn.includes(search);
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Auto-select first order for this patient when embedded
  const effectiveSelectedId = embedded ? (filtered[0]?.id ?? null) : selectedId;
  const selected = orders.find(o => o.id === effectiveSelectedId);
  const hasLabIssue = selected?.labs.some(l => !l.ok) ?? false;
  const pendingCount = orders.filter(o => o.status === "SUBMITTED").length;

  // Clinical safety gates
  const [gateOverrides, setGateOverrides] = useState<Map<string, string>>(new Map());
  const clinicalPatient: PatientClinical | null = patientData && selected ? {
    weight: patientData.weight, height: patientData.height, bsa: patientData.bsa,
    creatinine: patientData.creatinine, crcl: patientData.crcl,
    labs: selected.labs.map(l => ({ name: l.name, value: l.value, unit: "" })),
  } : null;
  const drugOrders: DrugOrder[] = selected?.items.filter(i => i.classification === "chemotherapy").map(i => ({
    name: i.name, calcDose: i.calcDose, finalDose: i.finalDose, unit: "mg", method: i.method as DrugOrder["method"],
  })) ?? [];
  const cumulativeDoses: CumulativeDoseRecord[] = selected?.items
    .filter(i => i.classification === "chemotherapy" && ["Doxorubicin", "Epirubicin"].includes(i.name))
    .map(i => ({ drugName: i.name, totalGivenMg: i.finalDose * ((selected.cycle || 1) - 1), maxLifetimeMgPerM2: i.name === "Doxorubicin" ? 550 : 900 })) ?? [];
  const verification = useOrderVerification(clinicalPatient, drugOrders, cumulativeDoses, gateOverrides);

  function handleGateOverride(gateId: string, reason: string, pin: string): boolean {
    if (!verifyPin(pin)) return false;
    setGateOverrides(prev => new Map(prev).set(gateId, reason));
    return true;
  }
  const allCompFilled = selected?.items.filter(i => i.classification === "chemotherapy").every(i => i.lotNo && i.expiryDate && i.preparedQty > 0) ?? false;

  function initAction(action: "verify" | "reject" | "compound") {
    if (action === "reject") {
      setShowRejectInput(true);
      setRejectReason("");
      return;
    }
    setPinAction(action); setShowPin(true); setPin(""); setPinError(false);
  }
  function confirmReject() {
    if (!rejectReason.trim()) return;
    setShowRejectInput(false);
    setTimeout(() => { setPinAction("reject"); setShowPin(true); setPin(""); setPinError(false); }, 100);
  }

  function handlePinComplete(p: string) {
    if (!verifyPin(p) || !selected) { setPinError(true); setPin(""); return; }
    setShowPin(false); setPin("");
    if (pinAction === "reject") {
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: "REJECTED" as OrderStatus, adjustReason: rejectReason } : o));
      toast("warning", `ปฏิเสธคำสั่งยา: ${selected.name} — ${selected.protocol}`);
      addNotification({
        type: "rejection",
        title: `ปฏิเสธ: ${selected.name} (HN ${selected.hn})`,
        message: `${selected.protocol} C${selected.cycle}D${selected.day} — ${rejectReason}`,
        targetRole: "ONC_DOCTOR",
        from: "ภก.วิไล ใจดี",
        hn: selected.hn,
        orderId: selected.id,
      });
    } else if (pinAction === "compound") {
      const chemoItems = selected.items.filter(i => i.classification === "chemotherapy");
      const drugList = chemoItems.map(i => `${i.name} ${i.finalDose}mg`).join(", ");
      const selId = selected.id;
      const selName = selected.name;
      const selHn = selected.hn;
      const selProto = selected.protocol;
      const selCycle = selected.cycle;
      const selDay = selected.day;
      // Show shimmer immediately
      setShowCompForm(false);
      setSigning(false);
      setPreparingShimmer(true);
      // After shimmer → transition to PREPARED + generate billing
      const allItems = selected.items;
      const selWard = selected.ward;
      setTimeout(() => {
        setPreparingShimmer(false);
        setOrders(prev => prev.map(o => o.id === selId ? { ...o, status: "PREPARED" as OrderStatus, adjustedBy: "ภก.วิไล ใจดี" } : o));
        toast("success", `เตรียมยาเสร็จ: ${selName} — ${selProto} C${selCycle}D${selDay}`);
        addNotification({ type: "prepared", title: `ยาพร้อม: ${selName} (HN ${selHn})`, message: `${selProto} C${selCycle}D${selDay} — ${drugList} เตรียมเสร็จแล้ว พร้อมรับยาและให้ผู้ป่วย`, targetRole: "CHEMO_NURSE", from: "ภก.วิไล ใจดี", hn: selHn, orderId: selId });
        addNotification({ type: "prepared", title: `เตรียมยาเสร็จ: ${selName} (HN ${selHn})`, message: `${selProto} C${selCycle}D${selDay} — ${drugList} ผ่านการเตรียมยาแล้ว รอพยาบาลให้ยา`, targetRole: "ONC_DOCTOR", from: "ภก.วิไล ใจดี", hn: selHn, orderId: selId });

        // Auto-generate billing
        const billingItems: BillingItem[] = [];
        allItems.forEach((item, i) => {
          const price = DRUG_PRICES[item.name] ?? 500;
          billingItems.push({ code: `DRG-${String(i + 1).padStart(3, "0")}`, description: `${item.name} ${item.finalDose}mg`, category: "drug", quantity: 1, unitPrice: price, totalPrice: price });
          if (item.diluent && item.diluent !== "—") {
            billingItems.push({ code: `DIL-${String(i + 1).padStart(3, "0")}`, description: item.diluent, category: "diluent", quantity: 1, unitPrice: 35, totalPrice: 35 });
          }
        });
        billingItems.push(...SERVICE_ITEMS);
        const totalAmount = billingItems.reduce((sum, b) => sum + b.totalPrice, 0);
        const billingId = `BIL-${Date.now()}`;
        addBillingRecord({
          id: billingId, orderId: selId, hn: selHn, patientName: selName,
          protocol: selProto, cycle: selCycle, day: selDay, ward: selWard,
          status: "PENDING", items: billingItems, totalAmount,
          generatedAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          generatedBy: "ภก.วิไล ใจดี",
        });
        addNotification({ type: "billing", title: `ค่าใช้จ่ายพร้อมตรวจสอบ: ${selName}`, message: `${selProto} C${selCycle}D${selDay} — รวม ฿${totalAmount.toLocaleString()}`, targetRole: "BILLING_OFFICER", from: "ภก.วิไล ใจดี", hn: selHn, orderId: selId });
      }, 3000);
      return;
    }

  }

  function updateCompItem(idx: number, field: string, value: string | number) {
    if (!selected) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : { ...o, items: o.items.map((item, i) => i !== idx ? item : { ...item, [field]: value }) }));
  }
  function applyLotToAll() {
    if (!selected) return;
    const first = selected.items.find(i => i.classification === "chemotherapy");
    if (!first) return;
    setOrders(prev => prev.map(o => o.id !== selected.id ? o : { ...o, items: o.items.map(item => item.classification === "chemotherapy" ? { ...item, lotNo: first.lotNo || item.lotNo, expiryDate: first.expiryDate || item.expiryDate } : item) }));
    setApplyCounter(c => c + 1);
  }

  if (pin.length === 6 && showPin) { setTimeout(() => handlePinComplete(pin), 300); }

  const pharmStepIndex = selected?.status === "SUBMITTED" ? 0 : selected?.status === "PREPARING" ? 0 : selected?.status === "PREPARED" ? 1 : selected?.status === "REJECTED" ? -1 : 0;

  const pinLabel = pinAction === "compound" ? "ลงนามเตรียมยา" : "ยืนยันปฏิเสธ";
  const pinDropdown = (
    <>
      <div className="fixed inset-0 z-40" onClick={() => { setShowPin(false); setPin(""); setPinError(false); }} />
      <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-80">
        <p className="text-sm font-bold text-text mb-1 text-center">{pinLabel}</p>
        <p className="text-xs text-text-secondary mb-4 text-center">กรอก PIN 6 หลักเพื่อลงนาม</p>
        <div className="flex justify-center gap-2 mb-4 cursor-text" onClick={() => (document.getElementById("pharm-pin") as HTMLInputElement)?.focus()}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
              i < pin.length ? "border-onc bg-onc/5 text-onc" : i === pin.length ? "border-onc/50" : "border-gray-200"
            }`}>{i < pin.length ? "●" : ""}</div>
          ))}
        </div>
        <input id="pharm-pin" type="password" inputMode="numeric" maxLength={6} value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(false); }}
          onKeyDown={e => { if (e.key === "Enter" && pin.length === 6) handlePinComplete(pin); }}
          autoFocus className="sr-only" />
        {pinError && <p className="text-xs text-red-600 font-semibold mb-3 text-center">PIN ไม่ถูกต้อง — ลองอีกครั้ง</p>}
        <button onClick={() => { if (pin.length === 6) handlePinComplete(pin); }} disabled={pin.length < 6}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            pin.length >= 6 ? "bg-onc text-white hover:bg-onc-hover" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}>
          <ClipboardCheck size={14} /> ยืนยัน
        </button>
      </div>
    </>
  );

  /* ── Signing state is handled inside the document view ── */

  /* ── Embedded mode: just the workflow content, no queue/sidebar ── */
  if (embedded && selected) {
    return (
      <>
        {/* Stepper — sticky */}
        {selected.status !== "REJECTED" && !preparingShimmer && (
        <div className="rounded-2xl border-[0.1px] border-border-card p-5 mb-4 sticky top-0 z-10 backdrop-blur-md bg-white/70" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div>
            {selected.status !== "REJECTED" ? (
              <MuiStepper activeStep={pharmStepIndex} alternativeLabel connector={<PharmConnector />}
                sx={{ "& .MuiStep-root": { p: 0 } }}>
                {PHARM_STEPS.map((label, i) => (
                  <Step key={label} completed={i < pharmStepIndex}>
                    <StepLabel
                      slots={{ stepIcon: () => <PharmStepIcon active={i === pharmStepIndex} completed={i < pharmStepIndex} /> }}
                      sx={{
                        p: 0,
                        "& .MuiStepLabel-iconContainer": { p: 0 },
                        "& .MuiStepLabel-labelContainer": { p: 0 },
                        "& .MuiStepLabel-label, & .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
                          fontFamily: '"Google Sans", "Google Sans Text", "Noto Sans Thai", sans-serif',
                          fontSize: "12px !important", fontWeight: i === pharmStepIndex ? "700 !important" : "600 !important", mt: 0.5, whiteSpace: "nowrap", p: 0,
                          color: i === pharmStepIndex ? "#674BB3" : "#404040",
                        },
                      }}
                    >{label}</StepLabel>
                  </Step>
                ))}
              </MuiStepper>
            ) : null}
          </div>
        </div>
        )}

        {/* Step title + actions */}
        {selected.status !== "REJECTED" && !preparingShimmer && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text">
              {selected.status === "PREPARED" ? "ยาพร้อม" : showCompForm ? "ตรวจสอบผ่าน — กรอกข้อมูลเตรียมยา" : "ตรวจสอบคำสั่งยา"}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {selected.status === "PREPARED" ? "เตรียมยาเสร็จสิ้น พร้อมส่งให้พยาบาลให้ยา" : showCompForm ? "กรอก Lot/Expiry/Qty แล้วลงนามเพื่อยืนยัน" : "ตรวจสอบรายการยา ขนาดยา และผล Lab ก่อนดำเนินการ"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selected.status === "SUBMITTED" && !showCompForm && (<>
              <button onClick={() => initAction("reject")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 active:scale-95 transition-all">
                <XCircle size={14} /> ปฏิเสธ
              </button>
              <button onClick={() => { if (verification.canVerify) { setShowCompForm(true); setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: "PREPARING" as OrderStatus } : o)); setTimeout(() => compFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300); } }}
                disabled={!verification.canVerify}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg active:scale-95 transition-all ${
                  verification.canVerify ? "text-white bg-onc hover:bg-onc-hover" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}>
                <CheckCircle2 size={14} /> ตรวจสอบผ่าน
              </button>
            </>)}
            {(selected.status === "PREPARING" || showCompForm) && (
              <div className="relative">
                <button onClick={() => initAction("compound")} disabled={!allCompFilled}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg active:scale-95 transition-all ${
                    allCompFilled ? "bg-onc text-white hover:bg-onc-hover" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}>
                  {signing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังลงนาม...</> : <><ClipboardCheck size={14} /> ลงนามเตรียมยา</>}
                </button>
                {showPin && pinAction === "compound" && pinDropdown}
              </div>
            )}
            {showRejectInput && (
              <div className="relative">
                <div className="fixed inset-0 z-40" onClick={() => setShowRejectInput(false)} />
                <div className="absolute right-0 top-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-96">
                  <p className="text-sm font-bold text-text mb-1">เหตุผลในการปฏิเสธ</p>
                  <p className="text-xs text-text-secondary mb-3">ข้อความนี้จะถูกส่งแจ้งแพทย์ผู้สั่งยาโดยตรง</p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="เช่น ANC ต่ำกว่าเกณฑ์, ขนาดยาเกินกว่า max dose..."
                    rows={3} autoFocus
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 resize-none mb-3" />
                  <button onClick={confirmReject} disabled={!rejectReason.trim()}
                    className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                      rejectReason.trim() ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}>
                    <XCircle size={14} /> ยืนยันปฏิเสธ + PIN
                  </button>
                </div>
              </div>
            )}
            {showPin && pinAction === "reject" && (
              <div className="relative">
                {pinDropdown}
              </div>
            )}
          </div>
        </div>
        )}

        {/* 2-col: Document (left) + Info sidebar (right) */}
        {(selected.status === "SUBMITTED" || selected.status === "PREPARING" || selected.status === "REJECTED") && !preparingShimmer && (() => {
          const p = patientData;
          return (
          <div className="flex gap-4 min-h-0 flex-1">
            {/* Left: A4 Document */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-gray-100 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 shrink-0">
                <p className="text-xs font-semibold text-text-secondary">ใบสั่งยาเคมีบำบัด · {selected.id}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const t = document.title; document.title = selected.id; window.print(); document.title = t; }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                    <Printer size={13} /> พิมพ์
                  </button>
                  <button onClick={() => { const t = document.title; document.title = selected.id; window.print(); document.title = t; }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                    <Download size={13} /> PDF
                  </button>
                </div>
              </div>
              {/* A4 */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="print-area mx-auto bg-white shadow-lg p-8" style={{ width: 595, minHeight: 842, aspectRatio: "1 / 1.4142" }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-4 border-b-2 border-[#674BB3] pb-3">
                <div>
                  <h1 className="text-sm font-bold text-[#674BB3]">โรงพยาบาลตัวอย่าง</h1>
                  <p className="text-[10px] text-[#898989]">คลินิกเคมีบำบัด / Chemotherapy Clinic</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-red-600">ใบสั่งยาเคมีบำบัด</p>
                  <p className="text-[10px] text-[#898989]">เลขที่: <span className="font-mono font-bold text-[#404040]">{selected.id}</span></p>
                </div>
              </div>
              {/* Patient info */}
              <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                <div className="grid grid-cols-4 gap-1">
                  <div className="col-span-2"><span className="text-[#898989]">ชื่อ-สกุล: </span><span className="font-bold">{p?.name ?? selected.name}</span></div>
                  <div><span className="text-[#898989]">HN: </span><span className="font-bold">{selected.hn}</span></div>
                  <div><span className="text-[#898989]">เพศ: </span><span className="font-bold">{p?.gender ?? "—"}</span></div>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <div><span className="text-[#898989]">อายุ: </span><span className="font-bold">{selected.age} ปี</span></div>
                  <div><span className="text-[#898989]">BW: </span><span className="font-bold">{p?.weight ?? "—"} kg</span></div>
                  <div><span className="text-[#898989]">HT: </span><span className="font-bold">{p?.height ?? "—"} cm</span></div>
                  <div><span className="text-[#898989]">BSA: </span><span className="font-bold">{p?.bsa ?? "—"} m²</span></div>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <div><span className="text-[#898989]">CrCl: </span><span className="font-bold">{p?.crcl ?? "—"} mL/min</span></div>
                  <div><span className="text-[#898989]">ECOG: </span><span className="font-bold">{p?.ecog ?? "—"}</span></div>
                  <div><span className="text-[#898989]">Cr: </span><span className="font-bold">{p?.creatinine ?? "—"} mg/dL</span></div>
                  <div />
                </div>
              </div>
              {/* Diagnosis */}
              <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                <div className="grid grid-cols-3 gap-1">
                  <div><span className="text-[#898989]">Diagnosis: </span><span className="font-bold">{p?.diagnosis ?? selected.diagnosis}</span></div>
                  <div><span className="text-[#898989]">ICD-10: </span><span className="font-bold">{p?.icd10 ?? "—"}</span></div>
                  <div><span className="text-[#898989]">Stage: </span><span className="font-bold text-[#674BB3]">{p?.stage ?? "—"}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <div><span className="text-[#898989]">Morphology: </span><span className="font-bold">{p?.morphology ?? "—"}</span></div>
                  <div><span className="text-[#898989]">TNM: </span><span className="font-bold">T{p?.t ?? "—"}N{p?.n ?? "—"}M{p?.m ?? "—"}</span></div>
                  {p?.allergy && p.allergy !== "—" && (
                    <div><span className="text-[#898989]">แพ้ยา: </span><span className="font-bold text-red-600">{p.allergy}</span></div>
                  )}
                </div>
              </div>
              {/* Protocol */}
              <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                <div className="grid grid-cols-4 gap-1">
                  <div><span className="text-[#898989]">Protocol: </span><span className="font-bold text-[#674BB3] text-xs">{selected.protocol}</span></div>
                  <div><span className="text-[#898989]">Cycle: </span><span className="font-bold text-xs">{selected.cycle}/{p?.totalCycles ?? "—"}</span></div>
                  <div><span className="text-[#898989]">Day: </span><span className="font-bold">{selected.day}</span></div>
                  <div><span className="text-[#898989]">Ward: </span><span className="font-bold">{selected.ward}</span></div>
                </div>
              </div>
              {/* Lab */}
              <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                <p className="text-[#898989] font-semibold mb-1">Lab Values:</p>
                <div className="grid grid-cols-3 gap-1">
                  {selected.labs.map(l => (
                    <div key={l.name}>
                      <span className="text-[#898989]">{l.name}: </span>
                      <span className={`font-bold ${l.ok ? "" : "text-red-600"}`}>{l.value}</span>
                      <span className="text-[#898989]"> ({l.ref})</span>
                      {!l.ok && <span className="text-red-600 font-bold"> ⚠</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Drug table */}
              <table className="w-full text-[10px] border border-gray-300 mb-3">
                <thead>
                  <tr className="bg-gray-50 text-[#898989]">
                    <th className="border border-gray-300 px-2 py-1 text-left">ลำดับ</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">ประเภท</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">ชื่อยา</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">ขนาดมาตรฐาน</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">ขนาดที่สั่ง</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Route</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Diluent</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">เวลาให้ยา</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((d, i) => (
                    <tr key={i}>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                      <td className="border border-gray-300 px-2 py-1.5">
                        <span className={d.classification === "premedication" ? "text-blue-700" : "text-red-700"}>
                          {d.classification === "premedication" ? "Pre-med" : "Chemo"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 font-bold">{d.name}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right text-[#898989]">{d.dose}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{d.finalDose} mg</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{d.route}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-[#898989]">{d.diluent}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{d.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 text-center text-[10px] border-t-2 border-gray-400 pt-4">
                <div>
                  <p className="font-bold">แพทย์ผู้สั่งยา</p>
                  <p className="font-semibold text-[#674BB3]">{selected.doctor}</p>
                  <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-1 mb-1" />
                  <p className="text-[#898989]">วันที่: {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} {selected.submittedAt} น.</p>
                </div>
                <div ref={signatureRef}>
                  <p className="font-bold">เภสัชกรผู้ตรวจสอบ</p>
                  {signing ? (
                    <>
                      {(() => {
                        const name = "ภก.วิไล ใจดี";
                        const charCount = name.length;
                        const typeDuration = charCount * 0.12;
                        const blinkCount = Math.ceil(typeDuration / 0.5);
                        return (
                          <div className="mt-1 inline-block overflow-hidden whitespace-nowrap font-semibold text-[#674BB3]"
                            style={{ borderRight: "2px solid #674BB3", animation: `typeWriter ${typeDuration}s steps(${charCount}) forwards, blinkCursor 0.5s step-end ${blinkCount}` }}>
                            {name}
                          </div>
                        );
                      })()}
                      <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mb-1" />
                      <p className="text-[#898989]"><span className="w-3 h-3 border-2 border-[#674BB3]/30 border-t-[#674BB3] rounded-full animate-spin inline-block mr-1" />กำลังลงนาม...</p>
                    </>
                  ) : selected.adjustedBy ? (
                    <p className="font-semibold text-[#674BB3]">{selected.adjustedBy}</p>
                  ) : (
                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                  )}
                  {!signing && <p className="text-[#898989]">วันที่: ............... เวลา: ........ น.</p>}
                </div>
                <div>
                  <p className="font-bold">พยาบาลผู้ให้ยา</p>
                  <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto mt-4 mb-1" />
                  <p className="text-[#898989]">วันที่: ............... เวลา: ........ น.</p>
                </div>
              </div>
            </div>
            </div>
            </div>

            {/* Right: Safety gates + Compounding cards */}
            <div className="w-96 shrink-0 overflow-y-auto overflow-x-hidden space-y-3">
              {selected.status === "SUBMITTED" && !showCompForm && (
                <SafetyGatePanel verification={verification} onOverride={handleGateOverride} />
              )}
              {selected.status === "REJECTED" && (
                <div className={`${card} flex items-center gap-3`}>
                  <XCircle size={18} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-600">ปฏิเสธแล้ว</p>
                    {selected.adjustReason && <p className="text-xs text-text mt-0.5">{selected.adjustReason}</p>}
                  </div>
                </div>
              )}

              {/* Compounding cards — one per chemo drug */}
              {showCompForm && selected.status === "PREPARING" && (() => {
                const chemoItems = selected.items.filter(d => d.classification === "chemotherapy");
                const filledCount = chemoItems.filter(i => i.lotNo && i.expiryDate && i.preparedQty > 0).length;
                return (
                <>
                  {/* Summary header */}
                  <div ref={compFormRef} className="flex items-center justify-between px-1" style={{ animation: "fadeSlideIn 0.3s ease-out" }}>
                    <div className="flex items-center gap-2">
                      <FlaskConical size={14} className="text-onc" />
                      <p className="text-xs font-bold text-text">เตรียมยา</p>
                    </div>
                    <span className="text-[10px] font-semibold text-text-secondary">{filledCount}/{chemoItems.length} พร้อม</span>
                  </div>

                  {/* Drug cards */}
                  {chemoItems.map((item, idx) => {
                    const realIdx = selected.items.indexOf(item);
                    const filled = item.lotNo && item.expiryDate && item.preparedQty > 0;
                    return (
                      <div key={idx} className={card + " !p-4 overflow-hidden min-w-0"} style={{ animation: `fadeSlideIn 0.3s ease-out ${(idx + 1) * 0.06}s both` }}>
                        {/* Drug header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-bold text-text">{item.name}</p>
                            <p className="text-xs text-text-secondary">{item.route} · {item.rate} · {item.diluent}</p>
                          </div>
                          <span className="text-sm font-bold text-onc shrink-0">{item.finalDose} mg</span>
                        </div>

                        {/* Form fields */}
                        <div className="space-y-2.5">
                          {/* Lot + Expiry */}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Lot No.</label>
                              <input value={item.lotNo} onChange={e => updateCompItem(realIdx, "lotNo", e.target.value)}
                                placeholder="LOT..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-onc" />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Expiry</label>
                              <DatePicker
                                key={`exp-${realIdx}-${applyCounter}`}
                                defaultValue={item.expiryDate ? (() => { try { return parseDate(item.expiryDate); } catch { return undefined; } })() : undefined}
                                onChange={(v) => { if (v) { try { updateCompItem(realIdx, "expiryDate", v.toString()); } catch {} } }}
                                size="sm" variant="bordered"
                                popoverProps={{ placement: "bottom-end", className: "bg-white shadow-xl rounded-xl border border-gray-200" }}
                                calendarProps={{ classNames: { cellButton: "data-[selected=true]:!bg-onc data-[selected=true]:!text-white hover:bg-onc/10" } }}
                                className="w-full"
                              />
                            </div>
                          </div>
                          {/* Qty + Waste — same row */}
                          <div className="flex gap-2">
                            <div className="flex-1 min-w-0">
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">ปริมาณ (mg)</label>
                              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-onc">
                                <input type="text" inputMode="numeric" value={item.preparedQty || ""}
                                  onChange={e => updateCompItem(realIdx, "preparedQty", Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="flex-1 min-w-0 text-sm text-right font-bold px-2 py-2 outline-none" />
                                <div className="flex flex-col border-l border-gray-300 shrink-0">
                                  <button type="button" onClick={() => updateCompItem(realIdx, "preparedQty", (item.preparedQty || 0) + 1)}
                                    className="px-1.5 py-0.5 hover:bg-gray-100"><ChevronUp size={11} className="text-text-secondary" /></button>
                                  <button type="button" onClick={() => updateCompItem(realIdx, "preparedQty", Math.max(0, (item.preparedQty || 0) - 1))}
                                    className="px-1.5 py-0.5 hover:bg-gray-100 border-t border-gray-300"><ChevronDown size={11} className="text-text-secondary" /></button>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">ยาเหลือทิ้ง (mg)</label>
                              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-onc">
                                <input type="text" inputMode="numeric" value={item.wasteQty || ""}
                                  onChange={e => updateCompItem(realIdx, "wasteQty", Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="flex-1 min-w-0 text-sm text-right font-bold px-2 py-2 outline-none" />
                                <div className="flex flex-col border-l border-gray-300 shrink-0">
                                  <button type="button" onClick={() => updateCompItem(realIdx, "wasteQty", (item.wasteQty || 0) + 1)}
                                    className="px-1.5 py-0.5 hover:bg-gray-100"><ChevronUp size={11} className="text-text-secondary" /></button>
                                  <button type="button" onClick={() => updateCompItem(realIdx, "wasteQty", Math.max(0, (item.wasteQty || 0) - 1))}
                                    className="px-1.5 py-0.5 hover:bg-gray-100 border-t border-gray-300"><ChevronDown size={11} className="text-text-secondary" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Apply to all — first card only */}
                        {idx === 0 && chemoItems.length > 1 && item.lotNo && (
                          <button onClick={applyLotToAll}
                            className="mt-3 w-full text-xs font-semibold text-onc border border-onc/30 rounded-xl px-3 py-2 hover:bg-onc/5 active:scale-[0.98] transition-all">
                            Apply Lot/Expiry ทั้งหมด
                          </button>
                        )}
                        {/* Filled indicator */}
                        {filled && (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <span className="text-[11px] font-semibold text-emerald-600">พร้อม</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
                );
              })()}
            </div>
          </div>
          );
        })()}

          {/* Shimmer loading — QR sticker skeleton */}
          {preparingShimmer && (
            <div className="flex justify-center py-8" style={{ animation: "fadeSlideIn 0.4s ease-out" }}>
              <div className="w-[420px] border border-gray-200 rounded-xl overflow-hidden shadow-md">
                <div className="bg-onc/15 px-5 py-2.5 flex items-center justify-between">
                  <div className="onc-skeleton h-4 w-40 rounded" />
                  <div className="onc-skeleton h-3 w-16 rounded" />
                </div>
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className="onc-skeleton w-28 h-28 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="onc-skeleton h-4 w-36 rounded" />
                      <div className="onc-skeleton h-3 w-24 rounded" />
                      <div className="onc-skeleton h-3 w-32 rounded" />
                      <div className="onc-skeleton h-2.5 w-20 rounded mt-1" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                    <div className="onc-skeleton h-3 w-52 rounded" />
                    <div className="onc-skeleton h-3 w-48 rounded" />
                    <div className="onc-skeleton h-3 w-36 rounded" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                    <div className="onc-skeleton h-2.5 w-20 rounded" />
                    <div className="onc-skeleton h-2.5 w-24 rounded" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status results */}
          {selected.status === "PREPARED" && !preparingShimmer && (
            <div className="space-y-4">
              <div className={`${card} flex items-center gap-4`}>
                <CheckCircle2 size={20} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-text">ยาพร้อมส่งให้พยาบาล</p>
                  <p className="text-xs text-text-secondary">พิมพ์สติกเกอร์ QR Code ติดถุงยาแล้วส่งไปหอผู้ป่วย</p>
                </div>
              </div>

              {/* QR Sticker Label — for printing */}
              <div className={`${card} !p-0 overflow-hidden`}>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-text">สติกเกอร์ติดถุงยา</p>
                  <button onClick={() => { const t = document.title; document.title = `LABEL-${selected.id}`; window.print(); document.title = t; }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-onc border border-onc/30 rounded-lg px-3 py-1.5 hover:bg-onc/5 active:scale-95 transition-all">
                    <Printer size={13} /> พิมพ์สติกเกอร์
                  </button>
                </div>
                <div className="p-6 flex justify-center">
                  {/* Physical sticker label */}
                  <div className="print-area print-sticker w-[420px] bg-white border border-gray-300 rounded-xl overflow-hidden shadow-md">
                    {/* Purple header strip */}
                    <div className="bg-onc px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-300" />
                        <span className="text-sm font-bold text-white">ยาเคมีบำบัด — Cytotoxic</span>
                      </div>
                      <span className="text-xs text-white/70 font-semibold">{selected.protocol}</span>
                    </div>
                    {/* Content */}
                    <div className="p-5">
                      {/* QR + Patient */}
                      <div className="flex gap-4">
                        <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
                          <rect width="100" height="100" fill="white" />
                          <rect x="5" y="5" width="25" height="25" rx="2" fill="#404040" />
                          <rect x="9" y="9" width="17" height="17" rx="1" fill="white" />
                          <rect x="12" y="12" width="11" height="11" rx="1" fill="#404040" />
                          <rect x="70" y="5" width="25" height="25" rx="2" fill="#404040" />
                          <rect x="74" y="9" width="17" height="17" rx="1" fill="white" />
                          <rect x="77" y="12" width="11" height="11" rx="1" fill="#404040" />
                          <rect x="5" y="70" width="25" height="25" rx="2" fill="#404040" />
                          <rect x="9" y="74" width="17" height="17" rx="1" fill="white" />
                          <rect x="12" y="77" width="11" height="11" rx="1" fill="#404040" />
                          <rect x="35" y="5" width="5" height="5" fill="#404040" />
                          <rect x="45" y="10" width="5" height="5" fill="#404040" />
                          <rect x="55" y="5" width="5" height="5" fill="#404040" />
                          <rect x="35" y="20" width="5" height="5" fill="#404040" />
                          <rect x="50" y="15" width="5" height="5" fill="#404040" />
                          <rect x="35" y="38" width="5" height="5" fill="#404040" />
                          <rect x="45" y="42" width="5" height="5" fill="#404040" />
                          <rect x="55" y="38" width="5" height="5" fill="#404040" />
                          <rect x="42" y="52" width="5" height="5" fill="#404040" />
                          <rect x="52" y="55" width="5" height="5" fill="#404040" />
                          <rect x="62" y="48" width="5" height="5" fill="#404040" />
                          <rect x="72" y="42" width="5" height="5" fill="#404040" />
                          <rect x="82" y="52" width="5" height="5" fill="#404040" />
                          <rect x="42" y="72" width="5" height="5" fill="#404040" />
                          <rect x="55" y="78" width="5" height="5" fill="#404040" />
                          <rect x="62" y="72" width="5" height="5" fill="#404040" />
                          <rect x="72" y="82" width="5" height="5" fill="#404040" />
                          <rect x="82" y="72" width="5" height="5" fill="#404040" />
                          <rect x="90" y="85" width="5" height="5" fill="#404040" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-text leading-tight">{selected.name}</p>
                          <p className="text-sm text-text-secondary mt-1">HN {selected.hn}</p>
                          <p className="text-sm text-text-secondary">C{selected.cycle}D{selected.day} · {selected.ward}</p>
                          <p className="text-xs font-mono text-text-muted mt-2">{selected.id}</p>
                        </div>
                      </div>
                      {/* Drug list */}
                      <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5">
                        {selected.items.filter(d => d.classification === "chemotherapy").map((item, idx) => (
                          <p key={idx} className="text-sm text-text">
                            <span className="font-bold">{item.name}</span> {item.finalDose}mg · {item.diluent}
                          </p>
                        ))}
                      </div>
                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-text-secondary">{selected.adjustedBy || "ภก.วิไล ใจดี"}</p>
                        <p className="text-xs text-text-secondary">{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

      </>
    );
  }

  if (embedded && !selected) {
    return <div className="text-center py-12 text-text-secondary"><p className="text-sm">ไม่พบคำสั่งยาสำหรับผู้ป่วยรายนี้</p></div>;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Shield size={48} className="text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-text-secondary">กรุณาเข้าถึงจากหน้ารายละเอียดผู้ป่วย</p>
      </div>
    </div>
  );
}

