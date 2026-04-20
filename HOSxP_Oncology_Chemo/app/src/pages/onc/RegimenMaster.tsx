import { useState } from "react";
import {
  Search, Plus, Pill, Trash2, Copy,
  Edit3, Save, Syringe, Shield, AlertTriangle, Filter,
  Target, CircleAlert, CheckCircle, History, ChevronUp, ChevronDown,
} from "lucide-react";
import { Select, SelectItem, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useToast } from "../../components/onc/Toast";

/* ══════════════════════════════════════════════
   Regimen Master & Template Builder
   ══════════════════════════════════════════════ */

type DoseMethod = "BSA" | "WEIGHT" | "AUC" | "FIXED";
type DrugClass = "premedication" | "chemotherapy" | "post-medication";

type RegimenDrug = {
  id: string; name: string; dayNo: number; baseDose: number; unit: string;
  method: DoseMethod; route: string; diluent: string; diluentVol: number;
  rate: string; infusionMin: number; classification: DrugClass; seq: number; notes: string;
};

type VersionLog = {
  version: number;
  date: string;
  by: string;
  changes: string;
};

type Regimen = {
  id: string; code: string; name: string; cancer: string;
  intent: "Curative" | "Adjuvant" | "Neoadjuvant" | "Palliative";
  emetogenicLevel: "High" | "Moderate" | "Low" | "Minimal";
  cycleLengthDays: number; totalCycles: number; treatmentDays: number[];
  version: number; active: boolean; drugs: RegimenDrug[]; notes: string;
  versionLog?: VersionLog[];
};

const BASE = import.meta.env.BASE_URL;
const editFadeIn = "animate-[editSlideUp_0.3s_ease-out]";
const editAnimStyle = `@keyframes editSlideUp { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }`;
const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-onc focus:ring-1 focus:ring-onc transition-colors";
function NumberStepper({ value, onChange, min = 0, className = "" }: { value: number; onChange: (v: number) => void; min?: number; className?: string }) {
  return (
    <div className={`flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#674BB3] focus-within:ring-1 focus-within:ring-[#674BB3] bg-white w-full h-[38px] ${className}`}>
      <input type="text" inputMode="numeric" value={value}
        onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="flex-1 min-w-0 text-sm text-right font-bold px-3 outline-none h-full" />
      <div className="flex flex-col border-l border-gray-200">
        <button type="button" onClick={() => onChange(value + 1)} className="px-1.5 py-1 hover:bg-gray-100 transition-colors">
          <ChevronUp size={14} className="text-[#898989]" />
        </button>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="px-1.5 py-1 hover:bg-gray-100 transition-colors border-t border-gray-200">
          <ChevronDown size={14} className="text-[#898989]" />
        </button>
      </div>
    </div>
  );
}

const selectCls = {
  trigger: "!bg-white border border-gray-200 rounded-lg min-h-[38px] h-[38px] px-3 data-[hover=true]:border-[#674BB3]/50 data-[focus=true]:border-[#674BB3]",
  value: "text-sm text-[#404040]",
  selectorIcon: "right-3 absolute text-[#898989]",
  popoverContent: "bg-white shadow-xl rounded-xl border border-gray-100 p-1",
};

const initialRegimens: Regimen[] = [
  {
    id: "R001", code: "CAF", name: "CAF (Cyclophosphamide + Doxorubicin + 5-FU)",
    cancer: "Breast Cancer", intent: "Adjuvant", emetogenicLevel: "High",
    cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1], version: 3, active: true,
    notes: "Repeat cycle every 21 days. 6 cycles total.",
    versionLog: [
      { version: 1, date: "15/01/2569", by: "ภก.วิไล ใจดี", changes: "สร้าง Protocol ใหม่" },
      { version: 2, date: "22/03/2569", by: "ภก.วิไล ใจดี", changes: "ปรับขนาด Doxorubicin 60→50 mg/m², เพิ่ม Ondansetron premed" },
      { version: 3, date: "10/04/2569", by: "ภก.สมชาย ยาดี", changes: "เปลี่ยน Diluent 5-FU เป็น D-5-W 500ml, เพิ่ม Notes" },
    ],
    drugs: [
      { id: "d1", name: "Ondansetron", dayNo: 1, baseDose: 8, unit: "mg", method: "FIXED", route: "IV", diluent: "NSS", diluentVol: 50, rate: "15 min", infusionMin: 15, classification: "premedication", seq: 0, notes: "ให้ก่อนเคมี 30 นาที" },
      { id: "d2", name: "Dexamethasone", dayNo: 1, baseDose: 20, unit: "mg", method: "FIXED", route: "IV", diluent: "NSS", diluentVol: 50, rate: "15 min", infusionMin: 15, classification: "premedication", seq: 0, notes: "" },
      { id: "d3", name: "Cyclophosphamide", dayNo: 1, baseDose: 500, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "D-5-W", diluentVol: 100, rate: "30 min", infusionMin: 30, classification: "chemotherapy", seq: 1, notes: "" },
      { id: "d4", name: "Doxorubicin", dayNo: 1, baseDose: 50, unit: "mg/m²", method: "BSA", route: "IV Push", diluent: "D-5-W", diluentVol: 50, rate: "—", infusionMin: 0, classification: "chemotherapy", seq: 2, notes: "Vesicant — do not extravasate" },
      { id: "d5", name: "5-FU", dayNo: 1, baseDose: 500, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "D-5-W", diluentVol: 500, rate: "4 hr", infusionMin: 240, classification: "chemotherapy", seq: 3, notes: "" },
    ],
  },
  {
    id: "R002", code: "FOLFOX6", name: "FOLFOX6 (Oxaliplatin + Leucovorin + 5-FU)",
    cancer: "Colorectal Cancer", intent: "Adjuvant", emetogenicLevel: "Moderate",
    cycleLengthDays: 14, totalCycles: 12, treatmentDays: [1], version: 2, active: true,
    notes: "Repeat every 14 days. 12 cycles adjuvant.",
    drugs: [
      { id: "d6", name: "Ondansetron", dayNo: 1, baseDose: 8, unit: "mg", method: "FIXED", route: "IV", diluent: "NSS", diluentVol: 50, rate: "15 min", infusionMin: 15, classification: "premedication", seq: 0, notes: "" },
      { id: "d7", name: "Oxaliplatin", dayNo: 1, baseDose: 85, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "D-5-W", diluentVol: 500, rate: "2 hr", infusionMin: 120, classification: "chemotherapy", seq: 1, notes: "" },
      { id: "d8", name: "Leucovorin", dayNo: 1, baseDose: 200, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "D-5-W", diluentVol: 100, rate: "2 hr", infusionMin: 120, classification: "chemotherapy", seq: 2, notes: "" },
      { id: "d9", name: "5-FU (bolus)", dayNo: 1, baseDose: 400, unit: "mg/m²", method: "BSA", route: "IV Push", diluent: "—", diluentVol: 0, rate: "—", infusionMin: 0, classification: "chemotherapy", seq: 3, notes: "" },
      { id: "d10", name: "5-FU (infusion)", dayNo: 1, baseDose: 2400, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "D-5-W", diluentVol: 500, rate: "46 hr", infusionMin: 2760, classification: "chemotherapy", seq: 4, notes: "Continuous infusion" },
    ],
  },
  {
    id: "R003", code: "GEM", name: "Gemcitabine (Single Agent)",
    cancer: "Lung / Pancreas", intent: "Palliative", emetogenicLevel: "Low",
    cycleLengthDays: 28, totalCycles: 6, treatmentDays: [1, 8, 15], version: 1, active: true,
    notes: "Day 1, 8, 15 every 28 days.",
    drugs: [
      { id: "d11", name: "Gemcitabine", dayNo: 1, baseDose: 1000, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "NSS", diluentVol: 250, rate: "30 min", infusionMin: 30, classification: "chemotherapy", seq: 1, notes: "" },
    ],
  },
  {
    id: "R004", code: "CARBO-PAC", name: "Carboplatin/Paclitaxel",
    cancer: "Ovarian / NSCLC", intent: "Curative", emetogenicLevel: "Moderate",
    cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1], version: 1, active: true,
    notes: "Repeat every 21 days. Premedication required.",
    drugs: [
      { id: "d12", name: "Dexamethasone", dayNo: 1, baseDose: 20, unit: "mg", method: "FIXED", route: "IV", diluent: "NSS", diluentVol: 50, rate: "15 min", infusionMin: 15, classification: "premedication", seq: 0, notes: "" },
      { id: "d13", name: "Chlorpheniramine", dayNo: 1, baseDose: 10, unit: "mg", method: "FIXED", route: "IV", diluent: "—", diluentVol: 0, rate: "—", infusionMin: 0, classification: "premedication", seq: 0, notes: "" },
      { id: "d14", name: "Paclitaxel", dayNo: 1, baseDose: 175, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "NSS", diluentVol: 500, rate: "3 hr", infusionMin: 180, classification: "chemotherapy", seq: 1, notes: "" },
      { id: "d15", name: "Carboplatin (AUC5)", dayNo: 1, baseDose: 5, unit: "AUC", method: "AUC", route: "IV Infusion", diluent: "D-5-W", diluentVol: 250, rate: "1 hr", infusionMin: 60, classification: "chemotherapy", seq: 2, notes: "Dose = AUC × (GFR + 25)" },
    ],
  },
  {
    id: "R005", code: "R-CHOP", name: "R-CHOP",
    cancer: "DLBCL / NHL", intent: "Curative", emetogenicLevel: "High",
    cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1], version: 1, active: false,
    notes: "Repeat every 21 days. 6-8 cycles.",
    drugs: [
      { id: "d16", name: "Rituximab", dayNo: 1, baseDose: 375, unit: "mg/m²", method: "BSA", route: "IV Infusion", diluent: "NSS", diluentVol: 500, rate: "4 hr", infusionMin: 240, classification: "chemotherapy", seq: 1, notes: "First infusion: slow rate" },
    ],
  },
];

const classStyle: Record<DrugClass, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  premedication: { label: "Premed", color: "text-blue-600", bg: "bg-blue-50", icon: Shield },
  chemotherapy: { label: "Chemo", color: "text-onc", bg: "bg-onc/10", icon: Syringe },
  "post-medication": { label: "Post-med", color: "text-emerald-600", bg: "bg-emerald-50", icon: Pill },
};

const methodBadge: Record<DoseMethod, string> = {
  BSA: "bg-onc/10 text-onc", AUC: "bg-purple-50 text-purple-600",
  WEIGHT: "bg-blue-50 text-blue-600", FIXED: "bg-gray-100 text-text-secondary",
};

const intentLabel: Record<string, string> = {
  Curative: "รักษาหาย", Adjuvant: "เสริม", Neoadjuvant: "ก่อนผ่าตัด", Palliative: "ประคับประคอง",
};
const intentBadge: Record<string, string> = {
  Curative: "bg-emerald-500 text-white", Adjuvant: "bg-blue-500 text-white",
  Neoadjuvant: "bg-amber-500 text-white", Palliative: "bg-gray-400 text-white",
};

const emetoLabel: Record<string, string> = {
  High: "สูง", Moderate: "ปานกลาง", Low: "ต่ำ", Minimal: "น้อยมาก",
};
const emetoBadge: Record<string, string> = {
  High: "bg-red-500 text-white", Moderate: "bg-amber-500 text-white",
  Low: "bg-blue-500 text-white", Minimal: "bg-gray-400 text-white",
};

export default function RegimenMaster() {
  const [regimens, setRegimens] = useState(initialRegimens);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const filtered = regimens.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) || r.cancer.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === null || r.active === filterActive;
    return matchSearch && matchActive;
  });

  const selected = regimens.find(r => r.id === selectedId);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [statsSnapshot, setStatsSnapshot] = useState({ total: 0, chemo: 0, premed: 0, days: 0 });
  const [confirmModal, setConfirmModal] = useState<"save" | "cancel" | "deactivate" | null>(null);

  function selectRegimen(id: string | null) {
    setSelectedId(id);
    setActiveDay(null);
    if (id) {
      const r = regimens.find(reg => reg.id === id);
      if (r) {
        const days = [...new Set([...r.treatmentDays, ...r.drugs.map(d => d.dayNo)])].length;
        setStatsSnapshot({ total: r.drugs.length, chemo: r.drugs.filter(d => d.classification === "chemotherapy").length, premed: r.drugs.filter(d => d.classification === "premedication").length, days });
      }
    }
  }

  function addDrug(dayNo: number) {
    if (!selected) return;
    const newDrug: RegimenDrug = {
      id: `d${Date.now()}`, name: "", dayNo, baseDose: 0, unit: "mg/m²",
      method: "BSA", route: "IV Infusion", diluent: "NSS", diluentVol: 100,
      rate: "30 min", infusionMin: 30, classification: "chemotherapy",
      seq: selected.drugs.filter(d => d.classification === "chemotherapy" && d.dayNo === dayNo).length + 1, notes: "",
    };
    updateRegimen({ ...selected, drugs: [...selected.drugs, newDrug] });
  }

  function updateDrug(drugId: string, field: string, value: string | number) {
    if (!selected) return;
    updateRegimen({ ...selected, drugs: selected.drugs.map(d => d.id === drugId ? { ...d, [field]: value } : d) });
  }

  function deleteDrug(drugId: string) {
    if (!selected) return;
    updateRegimen({ ...selected, drugs: selected.drugs.filter(d => d.id !== drugId) });
  }

  function updateRegimen(updated: Regimen) {
    setRegimens(prev => prev.map(r => r.id === updated.id ? updated : r));
  }

  function toggleActive() {
    if (!selected) return;
    updateRegimen({ ...selected, active: !selected.active });
  }

  function validateRegimen(): string[] {
    if (!selected) return [];
    const errors: string[] = [];
    if (selected.cycleLengthDays < 1) errors.push("Cycle Length ต้องมากกว่า 0");
    if (selected.totalCycles < 1) errors.push("Total Cycles ต้องมากกว่า 0");
    if (selected.drugs.length === 0) errors.push("ต้องมียาอย่างน้อย 1 รายการ");
    const emptyDrugs = selected.drugs.filter(d => !d.name.trim());
    if (emptyDrugs.length > 0) errors.push(`มียา ${emptyDrugs.length} รายการที่ยังไม่ได้กรอกชื่อ`);
    const zeroDose = selected.drugs.filter(d => d.baseDose <= 0);
    if (zeroDose.length > 0) errors.push(`มียา ${zeroDose.length} รายการที่ขนาดยาเป็น 0`);
    const noChemo = selected.drugs.filter(d => d.classification === "chemotherapy").length === 0;
    if (noChemo) errors.push("ต้องมียาเคมีบำบัดอย่างน้อย 1 รายการ");
    return errors;
  }

  function handleSave() {
    const errors = validateRegimen();
    if (errors.length > 0) {
      errors.forEach(e => toast("error", e));
      return;
    }
    setConfirmModal("save");
  }

  function confirmSave() {
    if (!selected) return;
    const newLog: VersionLog = {
      version: selected.version + 1,
      date: new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }),
      by: "ภก.วิไล ใจดี",
      changes: "แก้ไขข้อมูล Protocol",
    };
    updateRegimen({ ...selected, version: selected.version + 1, versionLog: [...(selected.versionLog || []), newLog] });
    setEditMode(false);
    setConfirmModal(null);
    toast("success", `บันทึก ${selected.code} v${selected.version + 1} สำเร็จ`);
  }

  function handleCancel() {
    setConfirmModal("cancel");
  }

  function confirmCancel() {
    setEditMode(false);
    setConfirmModal(null);
  }

  function handleDeactivate() {
    setConfirmModal("deactivate");
  }

  function confirmDeactivate() {
    if (!selected) return;
    const wasActive = selected.active;
    updateRegimen({ ...selected, active: !selected.active });
    setConfirmModal(null);
    toast("success", wasActive ? `ปิดการใช้งาน ${selected.code} แล้ว` : `เปิดใช้งาน ${selected.code} แล้ว`);
  }

  const uniqueDays = selected ? [...new Set([...selected.treatmentDays, ...selected.drugs.map(d => d.dayNo)])].sort((a, b) => a - b) : [];

  /* ═══ Detail view (selected regimen) — Desktop 2-column ═══ */
  if (selected) {

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] overflow-y-auto space-y-4">
        <style>{editAnimStyle}</style>
        {/* Breadcrumb */}
        <div className="shrink-0 pt-2">
          <Breadcrumbs size="sm" separator="›" className="text-[13px]" classNames={{ list: "gap-1", separator: "text-[#898989] mx-1" }}>
            <BreadcrumbItem onPress={() => { selectRegimen(null); setEditMode(false); }} classNames={{ item: "text-[#898989] hover:text-[#674BB3]" }}>สูตรยาเคมีบำบัด</BreadcrumbItem>
            <BreadcrumbItem isCurrent classNames={{ item: "text-[#674BB3] font-semibold" }}>{selected.code}</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        {/* ── Row 1: Stacked header cards ── */}
        <div className="shrink-0 rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Top — purple banner */}
          <div className="px-6 py-5 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #D8D0F0 0%, #C8BFE8 100%)" }}>
            <img src={`${BASE}onc/chemo-hand.png`} className="absolute right-4 -bottom-6 h-36 object-contain pointer-events-none opacity-70" alt="" />
            {/* Top-right action buttons */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              {!editMode ? (
                <>
                  <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#674BB3] rounded-xl hover:bg-[#563AA4] transition-colors w-full">
                    <Edit3 size={16} /> แก้ไข
                  </button>
                  <button onClick={() => {
                      const id = `R${Date.now()}`;
                      const cloned: Regimen = { ...selected, id, code: selected.code + " (Copy)", version: 1, drugs: selected.drugs.map(d => ({ ...d, id: `d${Date.now()}${Math.random()}` })) };
                      setRegimens(prev => [...prev, cloned]); selectRegimen(id); setEditMode(true);
                    }} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#674BB3] bg-white/70 backdrop-blur-sm border border-[#674BB3]/20 rounded-xl hover:bg-white/90 transition-colors w-full">
                    <Copy size={16} /> คัดลอก
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#674BB3] rounded-xl hover:bg-[#563AA4] transition-colors w-full">
                    <Save size={16} /> บันทึก
                  </button>
                  <button onClick={handleCancel} className="px-5 py-2.5 text-sm font-semibold text-[#674BB3] bg-white/70 backdrop-blur-sm border border-[#674BB3]/20 rounded-xl hover:bg-white/90 transition-colors w-full">
                    ยกเลิก
                  </button>
                </>
              )}
            </div>
            <div key={`banner-${editMode}`} className={editFadeIn}>
              {editMode ? (
                <>
                  <label className="text-xs font-semibold text-[#674BB3]/60 mb-1 block">ชื่อสูตรยา</label>
                  <input value={selected.name} onChange={e => updateRegimen({ ...selected, name: e.target.value })}
                    placeholder="กรอกชื่อเต็มของสูตรยา เช่น CAF (Cyclophosphamide + Doxorubicin + 5-FU)"
                    className="w-full max-w-lg bg-white/60 backdrop-blur-sm text-sm text-[#674BB3] font-medium px-3 py-1.5 rounded-lg border border-[#674BB3]/20 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none" />
                  <label className="text-xs font-semibold text-[#674BB3]/60 mt-3 mb-1 block">รหัส Protocol</label>
                  <input value={selected.code} onChange={e => updateRegimen({ ...selected, code: e.target.value })}
                    placeholder="กรอกรหัสย่อ เช่น CAF, FOLFOX6"
                    className="bg-white/60 backdrop-blur-sm text-2xl font-bold text-[#674BB3] px-3 py-1 rounded-lg border border-[#674BB3]/20 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none w-48" />
                </>
              ) : (
                <>
                  <p className="text-sm text-[#674BB3]/70">{selected.name}</p>
                  <h1 className="text-2xl font-bold text-[#674BB3] mt-1">{selected.code}</h1>
                </>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-sm font-semibold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 ${intentBadge[selected.intent]}`}>
                  <Target size={14} />{intentLabel[selected.intent]}
                </span>
                <span className={`text-sm font-semibold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 ${emetoBadge[selected.emetogenicLevel]}`}>
                  <CircleAlert size={14} />{emetoLabel[selected.emetogenicLevel]}
                </span>
                <span className={`text-sm font-semibold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 ${selected.active ? "bg-emerald-600 text-white" : "bg-gray-400 text-white"}`}>
                  <CheckCircle size={14} />{selected.active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                </span>
                <span className="text-sm font-mono text-[#404040] bg-white/60 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <History size={14} />v{selected.version}
                </span>
              </div>
            </div>
          </div>
          {/* Bottom — หมายเหตุ */}
          {selected.notes && (
            <div className="px-6 py-3 flex items-start gap-2">
              <span className="text-xs font-semibold text-[#898989] shrink-0 mt-0.5">หมายเหตุ:</span>
              <p className="text-xs text-[#898989] leading-relaxed">{selected.notes}</p>
            </div>
          )}
        </div>

        {/* ── Main content: Left info + Right (stats + tables) ── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ═══ LEFT COLUMN — Protocol info, Notes, Actions ═══ */}
          <div className="w-80 min-w-[320px] max-w-[320px] shrink-0 overflow-y-auto space-y-4">
            {/* เกี่ยวกับ Protocol */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-4">เกี่ยวกับ Protocol</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-[#898989] shrink-0">ชนิดมะเร็ง</span>{editMode ? <input value={selected.cancer} onChange={e => updateRegimen({ ...selected, cancer: e.target.value })} placeholder="เช่น Breast Cancer" className="text-right text-sm font-semibold text-[#404040] px-2 py-1 border border-gray-200 rounded-lg bg-white focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none w-40" /> : <span className="font-semibold text-[#404040]">{selected.cancer || "—"}</span>}</div>
                <div className="flex justify-between"><span className="text-[#898989]">Cycle</span><span className="font-semibold text-[#404040]">q{selected.cycleLengthDays}d × {selected.totalCycles}</span></div>
                <div className="flex justify-between"><span className="text-[#898989]">วันให้ยา</span><span className="font-semibold text-[#404040]">Day {selected.treatmentDays.join(", ")}</span></div>
              </div>
            </div>

            {/* Stat cards 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "ยาทั้งหมด", value: statsSnapshot.total, color: "#674BB3" },
                { label: "เคมีบำบัด", value: statsSnapshot.chemo, color: "#674BB3" },
                { label: "Premed", value: statsSnapshot.premed, color: "#3b82f6" },
                { label: "Days", value: statsSnapshot.days, color: "#10b981" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <p className="text-xs text-[#898989]">{s.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>


            {/* ประวัติเวอร์ชัน */}
            {selected.versionLog && selected.versionLog.length > 0 && (
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <History size={14} className="text-[#674BB3]" />
                  <h3 className="text-sm font-bold text-[#404040]">ประวัติเวอร์ชัน</h3>
                </div>
                <div className="space-y-0">
                  {[...selected.versionLog].reverse().map((log, i, arr) => (
                    <div key={log.version} className="flex gap-3">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${i === 0 ? "bg-[#674BB3]" : "bg-gray-300"}`} />
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                      </div>
                      {/* Content */}
                      <div className={`pb-4 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${i === 0 ? "text-[#674BB3]" : "text-[#404040]"}`}>v{log.version}</span>
                          <span className="text-[10px] text-[#898989]">{log.date}</span>
                        </div>
                        <p className="text-xs text-[#404040] mt-0.5">{log.changes}</p>
                        <p className="text-[10px] text-[#898989] mt-0.5">{log.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ═══ RIGHT COLUMN — Stats + Drug tables ═══ */}
          <div className="flex-1 min-w-0 overflow-y-auto space-y-4">

            {/* Settings (edit mode) */}
            {editMode && (
              <div className={`bg-white rounded-2xl overflow-hidden ${editFadeIn}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-bold text-[#404040]">ตั้งค่า Regimen</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5 w-[15%]">Cycle Length</th>
                        <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5 w-[15%]">Total Cycles</th>
                        <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5 w-[15%]">เจตนาการรักษา</th>
                        <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5 w-[15%]">ระดับอาเจียน</th>
                        <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5 w-[40%]">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2.5"><NumberStepper value={selected.cycleLengthDays} onChange={v => updateRegimen({ ...selected, cycleLengthDays: v })} min={1} /></td>
                        <td className="px-3 py-2.5"><NumberStepper value={selected.totalCycles} onChange={v => updateRegimen({ ...selected, totalCycles: v })} min={1} /></td>
                        <td className="px-3 py-2.5">
                          <Select selectedKeys={[selected.intent]} onSelectionChange={(keys) => updateRegimen({ ...selected, intent: Array.from(keys)[0] as Regimen["intent"] })} size="sm" variant="flat" popoverProps={{ className: "z-50" }} classNames={selectCls}>
                            {(["Curative","Adjuvant","Neoadjuvant","Palliative"] as const).map(v => <SelectItem key={v} classNames={{ base: "rounded-lg data-[hover=true]:bg-gray-50 px-3 py-2", title: "text-sm" }}>{intentLabel[v]}</SelectItem>)}
                          </Select>
                        </td>
                        <td className="px-3 py-2.5">
                          <Select selectedKeys={[selected.emetogenicLevel]} onSelectionChange={(keys) => updateRegimen({ ...selected, emetogenicLevel: Array.from(keys)[0] as Regimen["emetogenicLevel"] })} size="sm" variant="flat" popoverProps={{ className: "z-50" }} classNames={selectCls}>
                            {(["High","Moderate","Low","Minimal"] as const).map(v => <SelectItem key={v} classNames={{ base: "rounded-lg data-[hover=true]:bg-gray-50 px-3 py-2", title: "text-sm" }}>{emetoLabel[v]}</SelectItem>)}
                          </Select>
                        </td>
                        <td className="px-3 py-2.5"><input value={selected.notes} onChange={e => updateRegimen({ ...selected, notes: e.target.value })} className="w-full px-2 h-[38px] text-sm border border-gray-200 rounded-lg bg-white hover:border-[#674BB3]/50 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-all" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Day tabs */}
            {(() => {
              const currentDay = activeDay ?? uniqueDays[0] ?? 1;
              const dayDrugs = selected.drugs.filter(d => d.dayNo === currentDay);
              const premeds = dayDrugs.filter(d => d.classification === "premedication");
              const chemos = dayDrugs.filter(d => d.classification === "chemotherapy");
              const postmeds = dayDrugs.filter(d => d.classification === "post-medication");
              return (
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  {/* Tab bar */}
                  <div key={`tabs-${editMode}`} className={`flex items-center justify-between px-5 pt-4 pb-0 border-b border-gray-100 ${editFadeIn}`}>
                    <div className="flex gap-1">
                      {uniqueDays.map(d => (
                        <button key={d} onClick={() => setActiveDay(d)}
                          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors relative ${
                            currentDay === d
                              ? "text-[#674BB3] bg-[#674BB3]/5"
                              : "text-[#898989] hover:text-[#404040] hover:bg-gray-50"
                          }`}>
                          Day {d}
                          <span className="ml-1.5 text-[10px] font-normal">({selected.drugs.filter(dr => dr.dayNo === d).length})</span>
                          {currentDay === d && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#674BB3] rounded-t-full" />}
                        </button>
                      ))}
                      {editMode && (
                        <button onClick={() => {
                            const next = selected.treatmentDays.length > 0 ? Math.max(...selected.treatmentDays) + 7 : 1;
                            const newDay = next;
                            const newDrug: RegimenDrug = {
                              id: `d${Date.now()}`, name: "", dayNo: newDay, baseDose: 0, unit: "mg/m²",
                              method: "BSA", route: "IV Infusion", diluent: "NSS", diluentVol: 100,
                              rate: "30 min", infusionMin: 30, classification: "chemotherapy",
                              seq: 1, notes: "",
                            };
                            updateRegimen({ ...selected, treatmentDays: [...selected.treatmentDays, newDay].sort((a, b) => a - b), drugs: [...selected.drugs, newDrug] });
                            setActiveDay(newDay);
                          }}
                          className={`px-6 py-2.5 text-sm font-semibold text-[#674BB3] border-2 border-dashed border-[#674BB3]/30 rounded-t-xl bg-[#674BB3]/5 hover:bg-[#674BB3]/10 hover:border-[#674BB3]/50 transition-colors flex items-center gap-2 ${editFadeIn}`}>
                          <Plus size={14} /> เพิ่มวันให้ยา
                        </button>
                      )}
                    </div>
                    {editMode && (
                      <button onClick={() => addDrug(currentDay)} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#674BB3] border border-[#674BB3]/30 rounded-xl hover:bg-[#674BB3]/5 transition-colors mb-2 ${editFadeIn}`}>
                        <Plus size={14} /> เพิ่มยา
                      </button>
                    )}
                  </div>

                  {/* Drug cards for active day */}
                  {/* Drug content */}
                  {dayDrugs.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[#898989]">ไม่มียาใน Day {currentDay}</div>
                  ) : editMode ? (
                    /* Edit mode — inline editable table */
                    <div className={`overflow-x-auto ${editFadeIn}`}>
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: "12%" }} /> {/* Type */}
                          <col style={{ width: "15%" }} /> {/* ชื่อยา */}
                          <col style={{ width: "12%" }} /> {/* ขนาด */}
                          <col style={{ width: "11%" }} /> {/* หน่วย */}
                          <col style={{ width: "12%" }} /> {/* วิธี */}
                          <col style={{ width: "12%" }} /> {/* Route */}
                          <col style={{ width: "12%" }} /> {/* Diluent */}
                          <col style={{ width: "10%" }} /> {/* Rate */}
                          <col style={{ width: "4%" }} /> {/* Delete */}
                        </colgroup>
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">Type</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">ชื่อยา</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">ขนาด</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">หน่วย</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">วิธี</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">Route</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">Diluent</th>
                            <th className="text-left text-xs font-semibold text-[#898989] uppercase tracking-wider px-3 py-2.5">Rate</th>
                            <th className="px-2 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayDrugs.map((drug) => {
                            const cls = classStyle[drug.classification];
                            const Ico = cls.icon;
                            return (
                              <tr key={drug.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                                <td className="px-3 py-2">
                                  <Select selectedKeys={[drug.classification]} onSelectionChange={(keys) => updateDrug(drug.id, "classification", Array.from(keys)[0] as string)} size="sm" variant="flat" popoverProps={{ className: "z-50 min-w-[160px]" }}
                                    classNames={{
                                      ...selectCls,
                                      value: `text-sm font-semibold ${cls.color}`,
                                    }}
                                    renderValue={(items) => {
                                      return items.map(item => {
                                        const s = classStyle[item.key as DrugClass];
                                        const I = s.icon;
                                        return <span key={item.key} className={`inline-flex items-center gap-1 ${s.color}`}><I size={12} />{s.label}</span>;
                                      });
                                    }}>
                                    {(["premedication","chemotherapy","post-medication"] as DrugClass[]).map(c => {
                                      const s = classStyle[c];
                                      const I = s.icon;
                                      return <SelectItem key={c} textValue={s.label} classNames={{ base: "rounded-lg data-[hover=true]:bg-gray-50 px-3 py-2", title: "text-sm" }}><span className={`inline-flex items-center gap-1 ${s.color}`}><I size={12} />{s.label}</span></SelectItem>;
                                    })}
                                  </Select>
                                </td>
                                <td className="px-3 py-2"><input value={drug.name} onChange={e => updateDrug(drug.id, "name", e.target.value)} className="w-full px-2 h-[38px] text-sm border border-gray-200 rounded-lg bg-white hover:border-[#674BB3]/50 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-all" /></td>
                                <td className="px-3 py-2"><NumberStepper value={drug.baseDose} onChange={v => updateDrug(drug.id, "baseDose", v)} /></td>
                                <td className="px-3 py-2">
                                  <Select selectedKeys={[drug.unit]} onSelectionChange={(keys) => updateDrug(drug.id, "unit", Array.from(keys)[0] as string)} size="sm" variant="flat" popoverProps={{ className: "z-50" }} classNames={selectCls}>
                                    {["mg","mg/m²","mg/kg","AUC","g","mcg","mL","unit"].map(u => <SelectItem key={u} classNames={{ base: "rounded-lg data-[hover=true]:bg-gray-50 px-3 py-2", title: "text-sm" }}>{u}</SelectItem>)}
                                  </Select>
                                </td>
                                <td className="px-3 py-2">
                                  <Select selectedKeys={[drug.method]} onSelectionChange={(keys) => updateDrug(drug.id, "method", Array.from(keys)[0] as string)} size="sm" variant="flat" popoverProps={{ className: "z-50" }} classNames={selectCls}>
                                    {(["BSA","WEIGHT","AUC","FIXED"] as DoseMethod[]).map(m => <SelectItem key={m} classNames={{ base: "rounded-lg data-[hover=true]:bg-gray-50 px-3 py-2", title: "text-sm" }}>{m}</SelectItem>)}
                                  </Select>
                                </td>
                                <td className="px-3 py-2"><input value={drug.route} onChange={e => updateDrug(drug.id, "route", e.target.value)} className="w-full px-2 h-[38px] text-sm border border-gray-200 rounded-lg bg-white hover:border-[#674BB3]/50 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-all" /></td>
                                <td className="px-3 py-2"><input value={drug.diluent} onChange={e => updateDrug(drug.id, "diluent", e.target.value)} className="w-full px-2 h-[38px] text-sm border border-gray-200 rounded-lg bg-white hover:border-[#674BB3]/50 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-all" /></td>
                                <td className="px-3 py-2"><input value={drug.rate} onChange={e => updateDrug(drug.id, "rate", e.target.value)} className="w-full px-2 h-[38px] text-sm border border-gray-200 rounded-lg bg-white hover:border-[#674BB3]/50 focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-all" /></td>
                                <td className="px-2 py-2"><button onClick={() => deleteDrug(drug.id)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#898989] hover:text-red-500 transition-all"><Trash2 size={13} /></button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* View mode — card list */
                    <div className="p-4 space-y-2">
                      {[...premeds, ...chemos, ...postmeds].map((drug) => {
                        const cls = classStyle[drug.classification];
                        const Ico = cls.icon;
                        return (
                          <div key={drug.id} className="rounded-xl border border-gray-100 transition-all hover:border-gray-200">
                            <div className="flex items-stretch divide-x divide-gray-100">
                              <div className="flex-1 min-w-0 px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-[#404040]">{drug.name}</p>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${methodBadge[drug.method]}`}>{drug.method}</span>
                                </div>
                                <p className="text-xs text-[#898989] mt-0.5">{drug.baseDose} {drug.unit}{drug.notes ? ` · ${drug.notes}` : ""}</p>
                              </div>
                              <div className="w-28 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
                                <span className="text-sm font-bold text-[#404040]">{drug.route}</span>
                                <span className="text-xs text-[#898989]">Route</span>
                              </div>
                              <div className="w-28 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
                                <span className="text-sm font-bold text-[#404040]">{drug.diluent !== "—" ? drug.diluent : "—"}</span>
                                <span className="text-xs text-[#898989]">{drug.diluentVol > 0 ? `${drug.diluentVol} ml` : "Diluent"}</span>
                              </div>
                              <div className="w-24 shrink-0 px-3 py-4 flex flex-col items-center justify-center">
                                <span className="text-sm font-bold text-[#404040]">{drug.rate}</span>
                                <span className="text-xs text-[#898989]">Rate</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                              <span className={`text-xs font-medium inline-flex items-center gap-1 ${cls.color}`}><Ico size={12} /> {cls.label}</span>
                              <span className="text-xs text-[#898989]">Seq {drug.classification === "premedication" ? "P" : drug.seq}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ═══ Confirmation Modal ═══ */}
        {confirmModal && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setConfirmModal(null)} />
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 w-[420px] max-w-[90vw] ${editFadeIn}`} style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              {confirmModal === "save" && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#674BB3]/10 flex items-center justify-center mb-4">
                    <Save size={22} className="text-[#674BB3]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#404040]">บันทึกการเปลี่ยนแปลง</h3>
                  <p className="text-sm text-[#898989] mt-1 mb-5">ยืนยันบันทึก Protocol <span className="font-bold text-[#404040]">{selected.code}</span> เป็น v{selected.version + 1} หรือไม่?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#898989] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>
                    <button onClick={confirmSave} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#674BB3] rounded-xl hover:bg-[#563AA4] transition-colors">บันทึก</button>
                  </div>
                </>
              )}
              {confirmModal === "cancel" && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                    <AlertTriangle size={22} className="text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#404040]">ยกเลิกการแก้ไข</h3>
                  <p className="text-sm text-[#898989] mt-1 mb-5">การเปลี่ยนแปลงทั้งหมดจะไม่ถูกบันทึก ต้องการยกเลิกหรือไม่?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#898989] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">แก้ไขต่อ</button>
                    <button onClick={confirmCancel} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors">ยกเลิกการแก้ไข</button>
                  </div>
                </>
              )}
              {confirmModal === "deactivate" && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                    <AlertTriangle size={22} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#404040]">{selected.active ? "ปิดการใช้งาน" : "เปิดใช้งาน"} Protocol</h3>
                  <p className="text-sm text-[#898989] mt-1 mb-5">
                    {selected.active
                      ? <>Protocol <span className="font-bold text-[#404040]">{selected.code}</span> จะไม่สามารถใช้ในการสั่งยาได้จนกว่าจะเปิดใช้งานอีกครั้ง</>
                      : <>เปิดใช้งาน Protocol <span className="font-bold text-[#404040]">{selected.code}</span> เพื่อให้สามารถสั่งยาได้</>
                    }
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#898989] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>
                    <button onClick={confirmDeactivate} className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${selected.active ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                      {selected.active ? "ปิดการใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  /* ═══ List view (no selection) ═══ */
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4 overflow-hidden">

      {/* ── Banner (same style as Overview) ── */}
      <div className="rounded-3xl overflow-hidden relative shrink-0" style={{ background: "#DEDFFF", minHeight: 140 }}>
        <img src={`${BASE}onc/ribbon-left.svg`} className="absolute -left-2 bottom-0 h-14 opacity-50" alt="" />
        <img src={`${BASE}onc/chemo-hand.png`} className="absolute right-4 -bottom-4 h-44 object-contain" alt="" />
        <div className="relative z-10 px-8 py-6">
          <h1 className="text-xl font-bold text-[#674BB3]">สูตรยาเคมีบำบัด</h1>
          <p className="text-sm text-[#674BB3]/70 mt-1 max-w-md">จัดการสูตรยา Protocol Template สำหรับการสั่งยาเคมีบำบัด</p>
          <button onClick={() => {
              const id = `R${Date.now()}`;
              const newReg: Regimen = { id, code: "", name: "", cancer: "", intent: "Adjuvant", emetogenicLevel: "Moderate", cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1], version: 1, active: true, drugs: [], notes: "" };
              setRegimens(prev => [...prev, newReg]); selectRegimen(id); setEditMode(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#674BB3] text-white text-sm font-semibold rounded-xl hover:bg-[#563AA4] transition-colors mt-4">
            <Plus size={18} /> สร้าง Protocol ใหม่
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        {[
          { label: "ทั้งหมด", count: regimens.length, color: "#674BB3" },
          { label: "Active", count: regimens.filter(r => r.active).length, color: "#10b981" },
          { label: "Inactive", count: regimens.filter(r => !r.active).length, color: "#64748b" },
          { label: "ชนิดมะเร็ง", count: new Set(regimens.map(r => r.cancer)).size, color: "#6366f1" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p className="text-sm text-[#898989]">{s.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* ── Regimen Table Card ── */}
      <div className="bg-white rounded-3xl overflow-hidden flex-1 min-h-0 flex flex-col" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Filter + Search */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา Regimen, Cancer..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <Filter size={14} className="text-[#898989] shrink-0" />
            {([
              { label: "ทั้งหมด", value: null, color: "#674BB3" },
              { label: "Active", value: true, color: "#10b981" },
              { label: "Inactive", value: false, color: "#64748b" },
            ] as const).map(f => (
              <button key={String(f.value)} onClick={() => setFilterActive(f.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  filterActive === f.value ? "text-white" : "text-[#898989] hover:bg-gray-100"
                }`}
                style={filterActive === f.value ? { background: f.color } : {}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 mx-4 mb-4 rounded-2xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 sticky top-0 z-10">
                <th className="text-left text-xs font-semibold text-[#898989] px-3 py-3">Protocol</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-3 py-3">ชนิดมะเร็ง</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-3 py-3">รายละเอียด</th>
                <th className="text-center text-xs font-semibold text-[#898989] px-3 py-3">จำนวนยา</th>
                <th className="text-center text-xs font-semibold text-[#898989] px-3 py-3">รอบการให้ยา</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-3 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-[#898989]">ไม่พบ Regimen ที่ค้นหา</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} onClick={() => selectRegimen(r.id)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold text-[#674BB3] bg-[#674BB3]/10 px-2.5 py-1 rounded-lg">{r.code}</span>
                    <p className="text-sm text-[#898989] mt-1.5 truncate max-w-[280px]">{r.name}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#404040]">{r.cancer}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${intentBadge[r.intent]}`}><Target size={12} />{intentLabel[r.intent]}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${emetoBadge[r.emetogenicLevel]}`}><CircleAlert size={12} />{emetoLabel[r.emetogenicLevel]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-bold text-[#404040]">{r.drugs.filter(d => d.classification === "chemotherapy").length}</td>
                  <td className="px-4 py-4 text-center text-sm text-[#898989]">q{r.cycleLengthDays}d × {r.totalCycles}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${r.active ? "bg-emerald-600 text-white" : "bg-gray-400 text-white"}`}>
                      <CheckCircle size={12} />{r.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
