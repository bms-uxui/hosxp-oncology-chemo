import { useState } from "react";
import {
  Search, Plus, Pill, ChevronDown, Trash2, Copy,
  CheckCircle2, XCircle, Edit3, Save, ArrowUpDown,
  Beaker, Shield, AlertTriangle, Clock, Syringe,
} from "lucide-react";
import { Select, SelectItem } from "@heroui/react";

/* ══════════════════════════════════════════════
   Regimen Master & Template Builder
   Ref: Spec §3.2 — Day-based grid, drug classification,
   calculation selectors (BSA/Weight/Fixed/AUC)
   ──────────────────────────────────────────────
   Layout: Left = Regimen list, Right = Builder/Editor
   ══════════════════════════════════════════════ */

type DoseMethod = "BSA" | "WEIGHT" | "AUC" | "FIXED";
type DrugClass = "premedication" | "chemotherapy" | "post-medication";

type RegimenDrug = {
  id: string;
  name: string;
  dayNo: number;
  baseDose: number;
  unit: string;
  method: DoseMethod;
  route: string;
  diluent: string;
  diluentVol: number;
  rate: string;
  infusionMin: number;
  classification: DrugClass;
  seq: number;
  notes: string;
};

type Regimen = {
  id: string;
  code: string;
  name: string;
  cancer: string;
  intent: "Curative" | "Adjuvant" | "Neoadjuvant" | "Palliative";
  emetogenicLevel: "High" | "Moderate" | "Low" | "Minimal";
  cycleLengthDays: number;
  totalCycles: number;
  treatmentDays: number[];
  version: number;
  active: boolean;
  drugs: RegimenDrug[];
  notes: string;
};

/* ── Mock Regimens ── */
const initialRegimens: Regimen[] = [
  {
    id: "R001", code: "CAF", name: "CAF (Cyclophosphamide + Doxorubicin + 5-FU)",
    cancer: "Breast Cancer", intent: "Adjuvant", emetogenicLevel: "High",
    cycleLengthDays: 21, totalCycles: 6, treatmentDays: [1], version: 3, active: true,
    notes: "Repeat cycle every 21 days. 6 cycles total.",
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

/* ── Classification styling ── */
const classStyle: Record<DrugClass, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  premedication: { label: "Premed", bg: "bg-info-bg", text: "text-info", icon: Shield },
  chemotherapy: { label: "Chemo", bg: "bg-onc-bg", text: "text-onc", icon: Syringe },
  "post-medication": { label: "Post-med", bg: "bg-success-bg", text: "text-success", icon: Pill },
};

const methodStyle: Record<DoseMethod, { bg: string; text: string }> = {
  BSA: { bg: "bg-onc-bg", text: "text-onc" },
  AUC: { bg: "bg-purple-100", text: "text-purple-700" },
  WEIGHT: { bg: "bg-blue-50", text: "text-blue-700" },
  FIXED: { bg: "bg-background-alt", text: "text-text-muted" },
};

const intentColor: Record<string, string> = {
  Curative: "text-success bg-success-bg",
  Adjuvant: "text-info bg-info-bg",
  Neoadjuvant: "text-warning bg-warning-bg",
  Palliative: "text-text-muted bg-background-alt",
};

const emetoColor: Record<string, string> = {
  High: "text-danger bg-danger-bg",
  Moderate: "text-warning bg-warning-bg",
  Low: "text-info bg-info-bg",
  Minimal: "text-text-muted bg-background-alt",
};

/* ══════════════════════════════════════════════ */
export default function RegimenMaster() {
  const [regimens, setRegimens] = useState(initialRegimens);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("R001");
  const [editMode, setEditMode] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const filtered = regimens.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) || r.cancer.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === null || r.active === filterActive;
    return matchSearch && matchActive;
  });

  const selected = regimens.find(r => r.id === selectedId);

  /* ── Drug CRUD ── */
  function addDrug() {
    if (!selected) return;
    const newDrug: RegimenDrug = {
      id: `d${Date.now()}`, name: "", dayNo: 1, baseDose: 0, unit: "mg/m²",
      method: "BSA", route: "IV Infusion", diluent: "NSS", diluentVol: 100,
      rate: "30 min", infusionMin: 30, classification: "chemotherapy",
      seq: selected.drugs.filter(d => d.classification === "chemotherapy").length + 1, notes: "",
    };
    updateRegimen({ ...selected, drugs: [...selected.drugs, newDrug] });
  }

  function updateDrug(drugId: string, field: string, value: string | number) {
    if (!selected) return;
    updateRegimen({
      ...selected,
      drugs: selected.drugs.map(d => d.id === drugId ? { ...d, [field]: value } : d),
    });
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

  function bumpVersion() {
    if (!selected) return;
    updateRegimen({ ...selected, version: selected.version + 1 });
    setEditMode(false);
  }

  /* ── Unique treatment days from drugs ── */
  const uniqueDays = selected ? [...new Set(selected.drugs.map(d => d.dayNo))].sort((a, b) => a - b) : [];

  return (
    <div className="flex h-full">
      {/* ═══ Left — Regimen List ═══ */}
      <div className="w-80 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-background-alt rounded-xl flex-1">
              <Search size={13} className="text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหา Regimen..."
                className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <button onClick={() => {
                const id = `R${Date.now()}`;
                const newReg: Regimen = {
                  id, code: "NEW", name: "New Protocol", cancer: "", intent: "Adjuvant",
                  emetogenicLevel: "Moderate", cycleLengthDays: 21, totalCycles: 6,
                  treatmentDays: [1], version: 1, active: true, drugs: [], notes: "",
                };
                setRegimens(prev => [...prev, newReg]);
                setSelectedId(id);
                setEditMode(true);
              }}
              className="w-9 h-9 rounded-xl bg-onc text-white flex items-center justify-center hover:bg-onc/90 transition-colors">
              <Plus size={15} />
            </button>
          </div>
          {/* Filter */}
          <div className="flex gap-1.5">
            {[
              { label: "ทั้งหมด", value: null },
              { label: "Active", value: true },
              { label: "Inactive", value: false },
            ].map(f => (
              <button key={String(f.value)} onClick={() => setFilterActive(f.value)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  filterActive === f.value ? "bg-onc text-white" : "bg-background-alt text-text-muted hover:text-text"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map(r => (
            <button key={r.id} onClick={() => { setSelectedId(r.id); setEditMode(false); }}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                selectedId === r.id ? "bg-onc-bg ring-1 ring-onc/30" : "hover:bg-background-alt"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${selectedId === r.id ? "text-onc" : "text-text"}`}>{r.code}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-text-muted">v{r.version}</span>
                  <span className={`w-2 h-2 rounded-full ${r.active ? "bg-success" : "bg-text-muted"}`} />
                </div>
              </div>
              <p className="text-xs text-text-secondary truncate">{r.cancer}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${intentColor[r.intent]}`}>{r.intent}</span>
                <span className="text-[9px] text-text-muted">{r.drugs.filter(d => d.classification === "chemotherapy").length} drugs · q{r.cycleLengthDays}d</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Right — Builder/Editor ═══ */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Pill size={40} className="text-border mx-auto mb-3" />
              <p className="text-sm text-text-muted">เลือก Regimen จากรายการด้านซ้าย</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-text">{selected.code}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${intentColor[selected.intent]}`}>{selected.intent}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${emetoColor[selected.emetogenicLevel]}`}>
                    <AlertTriangle size={8} className="inline mr-0.5" />{selected.emetogenicLevel} Emeto
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${selected.active ? "bg-success-bg text-success" : "bg-background-alt text-text-muted"}`}>
                    {selected.active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted bg-background-alt px-2 py-0.5 rounded-md">v{selected.version}</span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{selected.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{selected.cancer} · q{selected.cycleLengthDays}d × {selected.totalCycles} cycles · Day {selected.treatmentDays.join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button onClick={bumpVersion} className="flex items-center gap-1.5 px-4 py-2 bg-onc text-white text-xs font-semibold rounded-xl hover:bg-onc/90">
                      <Save size={13} /> Save v{selected.version + 1}
                    </button>
                    <button onClick={() => setEditMode(false)} className="px-4 py-2 text-xs text-text-muted border border-border rounded-xl hover:bg-background-alt">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-onc border border-onc/30 rounded-xl hover:bg-onc-bg">
                      <Edit3 size={13} /> Edit
                    </button>
                    <button onClick={toggleActive} className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                      selected.active ? "text-text-muted border-border hover:bg-danger-bg hover:text-danger hover:border-danger/30" : "text-success border-success/30 hover:bg-success-bg"
                    }`}>
                      {selected.active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => {
                        if (!selected) return;
                        const id = `R${Date.now()}`;
                        const cloned: Regimen = {
                          ...selected, id, code: selected.code + " (Copy)", version: 1,
                          drugs: selected.drugs.map(d => ({ ...d, id: `d${Date.now()}${Math.random()}` })),
                        };
                        setRegimens(prev => [...prev, cloned]);
                        setSelectedId(id);
                      }}
                      className="flex items-center gap-1 px-3 py-2 text-xs text-text-muted border border-border rounded-xl hover:bg-background-alt">
                      <Copy size={12} /> Clone
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Regimen metadata (editable in edit mode) */}
            {editMode && (
              <div className="onc-card p-4">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Regimen Settings</p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Cycle Length (days)</label>
                    <input type="number" value={selected.cycleLengthDays}
                      onChange={e => updateRegimen({ ...selected, cycleLengthDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background-alt focus:outline-none focus:border-onc" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Total Cycles</label>
                    <input type="number" value={selected.totalCycles}
                      onChange={e => updateRegimen({ ...selected, totalCycles: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background-alt focus:outline-none focus:border-onc" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Intent</label>
                    <Select selectedKeys={selected.intent ? [selected.intent] : []} onSelectionChange={(keys) => updateRegimen({ ...selected, intent: Array.from(keys)[0] as Regimen["intent"] })}
                      size="sm" variant="bordered">
                      {["Curative", "Adjuvant", "Neoadjuvant", "Palliative"].map(v => <SelectItem key={v}>{v}</SelectItem>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted mb-1 block">Emetogenic Level</label>
                    <Select selectedKeys={selected.emetogenicLevel ? [selected.emetogenicLevel] : []} onSelectionChange={(keys) => updateRegimen({ ...selected, emetogenicLevel: Array.from(keys)[0] as Regimen["emetogenicLevel"] })}
                      size="sm" variant="bordered">
                      {["High", "Moderate", "Low", "Minimal"].map(v => <SelectItem key={v}>{v}</SelectItem>)}
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] text-text-muted mb-1 block">Notes</label>
                  <input value={selected.notes}
                    onChange={e => updateRegimen({ ...selected, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background-alt focus:outline-none focus:border-onc" />
                </div>
              </div>
            )}

            {/* Note display (view mode) */}
            {!editMode && selected.notes && (
              <div className="onc-alert-info rounded-xl px-4 py-2.5 text-xs">{selected.notes}</div>
            )}

            {/* ── Day-based Grid — Ref: Spec §3.2 "calendar-like view" ── */}
            {uniqueDays.map(dayNo => {
              const dayDrugs = selected.drugs.filter(d => d.dayNo === dayNo);
              const premeds = dayDrugs.filter(d => d.classification === "premedication");
              const chemos = dayDrugs.filter(d => d.classification === "chemotherapy");
              const postmeds = dayDrugs.filter(d => d.classification === "post-medication");

              return (
                <div key={dayNo} className="onc-card overflow-hidden">
                  {/* Day header */}
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background-alt/50">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-onc text-white flex items-center justify-center text-sm font-bold">
                        D{dayNo}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-text">Day {dayNo}</p>
                        <p className="text-[10px] text-text-muted">{dayDrugs.length} drugs ({premeds.length} premed, {chemos.length} chemo)</p>
                      </div>
                    </div>
                    {editMode && (
                      <button onClick={addDrug} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-onc border border-onc/30 rounded-lg hover:bg-onc-bg">
                        <Plus size={12} /> Add Drug
                      </button>
                    )}
                  </div>

                  {/* Drug table */}
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] text-text-muted uppercase tracking-wider border-b border-border-light">
                        <th className="px-4 py-2 text-left w-10">Seq</th>
                        <th className="px-3 py-2 text-left w-16">Type</th>
                        <th className="px-3 py-2 text-left">Drug Name</th>
                        <th className="px-3 py-2 text-right">Base Dose</th>
                        <th className="px-3 py-2 text-center w-16">Method</th>
                        <th className="px-3 py-2 text-left">Route</th>
                        <th className="px-3 py-2 text-left">Diluent</th>
                        <th className="px-3 py-2 text-left">Rate</th>
                        {editMode && <th className="px-3 py-2 w-12"></th>}
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border-light">
                      {/* Render grouped: premed → chemo → post */}
                      {[...premeds, ...chemos, ...postmeds].map((drug) => {
                        const cls = classStyle[drug.classification];
                        const ms = methodStyle[drug.method];
                        return (
                          <tr key={drug.id} className={`${drug.classification === "premedication" ? "bg-info-bg/30" : "hover:bg-background-alt/50"}`}>
                            <td className="px-4 py-2.5 text-xs text-text-muted text-center">
                              {drug.classification === "premedication" ? "P" : drug.seq}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls.bg} ${cls.text} inline-flex items-center gap-0.5`}>
                                <cls.icon size={8} /> {cls.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {editMode ? (
                                <input value={drug.name} onChange={e => updateDrug(drug.id, "name", e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                              ) : (
                                <div>
                                  <p className="font-semibold text-text">{drug.name}</p>
                                  {drug.notes && <p className="text-[10px] text-text-muted">{drug.notes}</p>}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {editMode ? (
                                <div className="flex items-center gap-1 justify-end">
                                  <input type="number" value={drug.baseDose} onChange={e => updateDrug(drug.id, "baseDose", Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-sm text-right border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                                  <input value={drug.unit} onChange={e => updateDrug(drug.id, "unit", e.target.value)}
                                    className="w-16 px-2 py-1 text-[11px] border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                                </div>
                              ) : (
                                <span className="font-semibold text-text">{drug.baseDose} <span className="text-xs text-text-muted font-normal">{drug.unit}</span></span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {editMode ? (
                                <Select selectedKeys={drug.method ? [drug.method] : []} onSelectionChange={(keys) => updateDrug(drug.id, "method", Array.from(keys)[0] as string)}
                                  size="sm" variant="bordered">
                                  {(["BSA", "WEIGHT", "AUC", "FIXED"] as DoseMethod[]).map(m => <SelectItem key={m}>{m}</SelectItem>)}
                                </Select>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ms.bg} ${ms.text}`}>{drug.method}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-text-secondary">
                              {editMode ? (
                                <input value={drug.route} onChange={e => updateDrug(drug.id, "route", e.target.value)}
                                  className="w-full px-2 py-1 text-[11px] border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                              ) : drug.route}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-text-muted">
                              {editMode ? (
                                <div className="flex gap-1">
                                  <input value={drug.diluent} onChange={e => updateDrug(drug.id, "diluent", e.target.value)}
                                    className="w-16 px-2 py-1 text-[11px] border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                                  <input type="number" value={drug.diluentVol} onChange={e => updateDrug(drug.id, "diluentVol", Number(e.target.value))}
                                    className="w-14 px-2 py-1 text-[11px] border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                                </div>
                              ) : (
                                drug.diluent !== "—" ? `${drug.diluent} ${drug.diluentVol} ml` : "—"
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-text-muted">
                              {editMode ? (
                                <input value={drug.rate} onChange={e => updateDrug(drug.id, "rate", e.target.value)}
                                  className="w-16 px-2 py-1 text-[11px] border border-border rounded bg-surface focus:outline-none focus:border-onc" />
                              ) : drug.rate}
                            </td>
                            {editMode && (
                              <td className="px-3 py-2.5 text-center">
                                <button onClick={() => deleteDrug(drug.id)} className="p-1.5 rounded-lg hover:bg-danger-bg text-text-muted hover:text-danger transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
