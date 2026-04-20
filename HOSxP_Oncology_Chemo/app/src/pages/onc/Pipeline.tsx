import { useState, useRef, useEffect, type ReactNode } from "react";
import { Search, ChevronDown, Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import PatientAvatar from "../../components/onc/PatientAvatar";

/* ── Smooth height wrapper ── */
function SmoothHeight({ children, deps }: { children: ReactNode; deps: unknown }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prevHeight = useRef<number>(0);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!outerRef.current || !innerRef.current) return;
    const from = prevHeight.current || outerRef.current.offsetHeight;
    const to = innerRef.current.offsetHeight;
    prevHeight.current = to;
    if (from === to) return;
    // Set to old height instantly, then animate to new
    setStyle({ height: from, overflow: "hidden", transition: "none" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle({ height: to, overflow: "hidden", transition: "height 0.3s ease" });
      });
    });
  }, [deps]);

  return (
    <div ref={outerRef} style={style} onTransitionEnd={() => setStyle({})}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Pipeline — ภาพรวมการให้ยาเคมีบำบัด
   Accordion funnel per role with patient tables
   ══════════════════════════════════════════════ */

type Patient = {
  hn: string; name: string; age: string; protocol: string; cycle: string;
  doctor: string; status: string; date: string;
};

type FunnelStage = {
  label: string;
  barColor: string;
  total: number;
  metrics: { label: string; value: number | string; icon?: React.ElementType }[];
  lastUpdate: string;
  patients: Patient[];
};

type RoleSection = {
  title: string;
  roleBadge: string;
  roleBadgeColor: string;
  bgColor: string;
  illustration?: string;
  stages: FunnelStage[];
};

/* ── Mock data ── */
const sections: RoleSection[] = [
  {
    title: "การออกคำสั่งยาบำบัดเคมี",
    roleBadge: "แพทย์",
    roleBadgeColor: "bg-[#FFA35F] text-white",
    bgColor: "bg-orange-50",
    illustration: `${import.meta.env.BASE_URL}onc/doctor-workflow.svg`,
    stages: [
      {
        label: "ประเมิน ECOG", barColor: "#BAE1FF",
        total: 8,
        metrics: [
          { label: "ประเมินแล้ว", value: 6, icon: CheckCircle2 },
          { label: "รอผล Lab", value: 2, icon: Clock },
        ],
        lastUpdate: "14:00 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "ประเมินแล้ว", date: "06/04/2569" },
          { hn: "205471", name: "นายบุญมี ดีใจ", age: "68 ปี", protocol: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา", status: "รอผล Lab", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "ประเมินแล้ว", date: "06/04/2569" },
          { hn: "308892", name: "นางเพ็ญ ใจสว่าง", age: "61 ปี", protocol: "CARBO-PAC", cycle: "C1/6", doctor: "นพ.สมชาย", status: "ประเมินแล้ว", date: "06/04/2569" },
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "ประเมินแล้ว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "ประเมินแล้ว", date: "06/04/2569" },
          { hn: "710234", name: "นางสมหวัง ดีเลิศ", age: "63 ปี", protocol: "CAF", cycle: "C1/6", doctor: "พญ.วิภา", status: "รอผล Lab", date: "06/04/2569" },
          { hn: "815678", name: "นายวิชัย พงษ์สวัสดิ์", age: "58 ปี", protocol: "FOLFOX6", cycle: "C2/12", doctor: "นพ.สมชาย", status: "ประเมินแล้ว", date: "06/04/2569" },
        ],
      },
      {
        label: "พิจารณา Protocol", barColor: "#FFE8CC", total: 6,
        metrics: [
          { label: "เลือกแล้ว", value: 5, icon: CheckCircle2 },
          { label: "รอปรึกษา", value: 1, icon: Clock },
        ],
        lastUpdate: "13:45 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "เลือกแล้ว", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "เลือกแล้ว", date: "06/04/2569" },
          { hn: "308892", name: "นางเพ็ญ ใจสว่าง", age: "61 ปี", protocol: "CARBO-PAC", cycle: "C1/6", doctor: "นพ.สมชาย", status: "รอปรึกษา", date: "06/04/2569" },
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "เลือกแล้ว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "เลือกแล้ว", date: "06/04/2569" },
          { hn: "815678", name: "นายวิชัย พงษ์สวัสดิ์", age: "58 ปี", protocol: "FOLFOX6", cycle: "C2/12", doctor: "นพ.สมชาย", status: "เลือกแล้ว", date: "06/04/2569" },
        ],
      },
      {
        label: "คำนวณขนาดยา", barColor: "#FFD6E8", total: 5,
        metrics: [
          { label: "คำนวณแล้ว", value: 4, icon: CheckCircle2 },
          { label: "ปรับลดโดส", value: 1, icon: AlertTriangle },
        ],
        lastUpdate: "13:30 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "คำนวณแล้ว", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "คำนวณแล้ว", date: "06/04/2569" },
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "ปรับลดโดส", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "คำนวณแล้ว", date: "06/04/2569" },
          { hn: "815678", name: "นายวิชัย พงษ์สวัสดิ์", age: "58 ปี", protocol: "FOLFOX6", cycle: "C2/12", doctor: "นพ.สมชาย", status: "คำนวณแล้ว", date: "06/04/2569" },
        ],
      },
      {
        label: "แพทย์ลงนาม", barColor: "#E8D5F5", total: 3,
        metrics: [
          { label: "ลงนามแล้ว", value: 2, icon: CheckCircle2 },
          { label: "รอลงนาม", value: 1, icon: Clock },
        ],
        lastUpdate: "13:15 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "ลงนามแล้ว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "ลงนามแล้ว", date: "06/04/2569" },
          { hn: "815678", name: "นายวิชัย พงษ์สวัสดิ์", age: "58 ปี", protocol: "FOLFOX6", cycle: "C2/12", doctor: "นพ.สมชาย", status: "รอลงนาม", date: "06/04/2569" },
        ],
      },
    ],
  },
  {
    title: "ตรวจสอบและอนุมัติคำสั่งยา",
    roleBadge: "เภสัชกร",
    roleBadgeColor: "bg-indigo-400 text-white",
    bgColor: "bg-indigo-50",
    stages: [
      {
        label: "รอตรวจสอบ", barColor: "#C7D2FE", total: 4,
        metrics: [
          { label: "ตรวจแล้ว", value: 2, icon: CheckCircle2 },
          { label: "ส่งกลับแก้ไข", value: 1, icon: AlertTriangle },
        ],
        lastUpdate: "14:10 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "รอตรวจสอบ", date: "06/04/2569" },
          { hn: "205471", name: "นายบุญมี ดีใจ", age: "68 ปี", protocol: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา", status: "ตรวจแล้ว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "ตรวจแล้ว", date: "06/04/2569" },
          { hn: "710234", name: "นางสมหวัง ดีเลิศ", age: "63 ปี", protocol: "CAF", cycle: "C1/6", doctor: "พญ.วิภา", status: "ส่งกลับแก้ไข", date: "06/04/2569" },
        ],
      },
      {
        label: "ตรวจ Drug Interaction", barColor: "#A5B4FC", total: 3,
        metrics: [
          { label: "ผ่าน", value: 3, icon: CheckCircle2 },
          { label: "พบปฏิกิริยา", value: 0, icon: AlertTriangle },
        ],
        lastUpdate: "13:50 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "ผ่าน", date: "06/04/2569" },
          { hn: "205471", name: "นายบุญมี ดีใจ", age: "68 ปี", protocol: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา", status: "ผ่าน", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "ผ่าน", date: "06/04/2569" },
        ],
      },
      {
        label: "อนุมัติส่งเตรียมยา", barColor: "#818CF8", total: 2,
        metrics: [
          { label: "อนุมัติแล้ว", value: 2, icon: CheckCircle2 },
          { label: "เวลาเฉลี่ย", value: "25 นาที", icon: Clock },
        ],
        lastUpdate: "13:40 น.",
        patients: [
          { hn: "205471", name: "นายบุญมี ดีใจ", age: "68 ปี", protocol: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา", status: "อนุมัติแล้ว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "อนุมัติแล้ว", date: "06/04/2569" },
        ],
      },
    ],
  },
  {
    title: "เตรียมยาเคมีบำบัด",
    roleBadge: "เตรียมยา",
    roleBadgeColor: "bg-amber-400 text-white",
    bgColor: "bg-amber-50",
    stages: [
      {
        label: "รอเตรียมยา", barColor: "#FDE68A", total: 3,
        metrics: [
          { label: "กำลังผสม", value: 1, icon: Clock },
          { label: "รอคิว", value: 2, icon: Clock },
        ],
        lastUpdate: "14:15 น.",
        patients: [
          { hn: "308892", name: "นางเพ็ญ ใจสว่าง", age: "61 ปี", protocol: "CARBO-PAC", cycle: "C1/6", doctor: "นพ.สมชาย", status: "กำลังผสม", date: "06/04/2569" },
          { hn: "205471", name: "นายบุญมี ดีใจ", age: "68 ปี", protocol: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา", status: "รอคิว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "รอคิว", date: "06/04/2569" },
        ],
      },
      {
        label: "QC ตรวจสอบ", barColor: "#FCD34D", total: 2,
        metrics: [
          { label: "ผ่าน QC", value: 2, icon: CheckCircle2 },
          { label: "ไม่ผ่าน", value: 0, icon: AlertTriangle },
        ],
        lastUpdate: "13:55 น.",
        patients: [
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "ผ่าน QC", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "ผ่าน QC", date: "06/04/2569" },
        ],
      },
      {
        label: "จ่ายยาแล้ว", barColor: "#F59E0B", total: 2,
        metrics: [
          { label: "ส่งมอบแล้ว", value: 2, icon: CheckCircle2 },
        ],
        lastUpdate: "13:30 น.",
        patients: [
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "ส่งมอบแล้ว", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "ส่งมอบแล้ว", date: "06/04/2569" },
        ],
      },
    ],
  },
  {
    title: "การให้ยาเคมีบำบัด",
    roleBadge: "พยาบาล",
    roleBadgeColor: "bg-emerald-400 text-white",
    bgColor: "bg-emerald-50",
    stages: [
      {
        label: "รอวัด Vital Signs", barColor: "#A7F3D0", total: 4,
        metrics: [
          { label: "วัดแล้ว", value: 3, icon: CheckCircle2 },
          { label: "รอวัด", value: 1, icon: Clock },
        ],
        lastUpdate: "14:20 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "วัดแล้ว", date: "06/04/2569" },
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "วัดแล้ว", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "วัดแล้ว", date: "06/04/2569" },
          { hn: "815678", name: "นายวิชัย พงษ์สวัสดิ์", age: "58 ปี", protocol: "FOLFOX6", cycle: "C2/12", doctor: "นพ.สมชาย", status: "รอวัด", date: "06/04/2569" },
        ],
      },
      {
        label: "กำลังให้ยา", barColor: "#6EE7B7", total: 3,
        metrics: [
          { label: "กำลัง Infuse", value: 3, icon: Clock },
          { label: "Reaction", value: 0, icon: AlertTriangle },
        ],
        lastUpdate: "14:15 น.",
        patients: [
          { hn: "104365", name: "นางคำปุ่น เสนาหอย", age: "54 ปี", protocol: "CAF", cycle: "C3/6", doctor: "นพ.สมชาย", status: "Infusing", date: "06/04/2569" },
          { hn: "412230", name: "นายสมศักดิ์ ชัยมงคล", age: "72 ปี", protocol: "GEM", cycle: "C4/6", doctor: "พญ.วิภา", status: "Infusing", date: "06/04/2569" },
          { hn: "519087", name: "นางสาวมาลี สุขใจ", age: "52 ปี", protocol: "AC-T", cycle: "C3/8", doctor: "นพ.สมชาย", status: "Infusing", date: "06/04/2569" },
        ],
      },
      {
        label: "ให้ยาครบ", barColor: "#34D399", total: 2,
        metrics: [
          { label: "ครบแล้ว", value: 2, icon: CheckCircle2 },
          { label: "ผลข้างเคียง", value: 1, icon: AlertTriangle },
        ],
        lastUpdate: "13:00 น.",
        patients: [
          { hn: "205471", name: "นายบุญมี ดีใจ", age: "68 ปี", protocol: "FOLFOX6", cycle: "C5/12", doctor: "พญ.วิภา", status: "ครบแล้ว", date: "06/04/2569" },
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "ครบแล้ว (G1 คลื่นไส้)", date: "06/04/2569" },
        ],
      },
      {
        label: "พร้อมจำหน่าย", barColor: "#10B981", total: 1,
        metrics: [
          { label: "จำหน่ายแล้ว", value: 1, icon: CheckCircle2 },
        ],
        lastUpdate: "12:30 น.",
        patients: [
          { hn: "620145", name: "นายอุดม พัฒนา", age: "45 ปี", protocol: "R-CHOP", cycle: "C6/6", doctor: "นพ.ประยุทธ์", status: "จำหน่ายแล้ว", date: "06/04/2569" },
        ],
      },
    ],
  },
];

/* ── Table style (matching home page) ── */
const TH = "text-left text-xs font-semibold text-text-secondary px-4 py-3";
const TD = "px-4 py-3";

type BarFilter = "all" | "done" | "pending";

/* Helper: classify patient status as done or pending */
function isDoneStatus(status: string): boolean {
  return /แล้ว|ผ่าน|ครบ|ลงนาม|อนุมัติ|ส่งมอบ|จำหน่าย/.test(status);
}

export default function Pipeline() {
  const [searchQ, setSearchQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>("ประเมิน ECOG");
  const [barFilter, setBarFilter] = useState<Record<string, BarFilter>>({});

  const toggle = (label: string) => setExpanded(prev => prev === label ? null : label);

  const getBarFilter = (label: string): BarFilter => barFilter[label] ?? "all";
  const setStageBarFilter = (label: string, filter: BarFilter) => {
    setBarFilter(prev => ({ ...prev, [label]: prev[label] === filter ? "all" : filter }));
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">ภาพรวมการให้ยาเคมีบำบัด</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input placeholder="ค้นหา..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl w-64 focus:border-onc focus:ring-1 focus:ring-onc outline-none transition-colors" />
        </div>
      </div>

      {/* ── Role sections ── */}
      {sections.map((section) => (
        <div key={section.title} className={`relative ${section.bgColor} rounded-3xl overflow-hidden`}>

          {/* Illustration — top right, behind content */}
          {section.illustration && (
            <img src={section.illustration} alt="" className="absolute right-6 top-2 h-28 object-contain pointer-events-none z-10" />
          )}

          {/* Section header */}
          <div className="relative z-20 px-6 pt-5 pb-3 flex items-center gap-3">
            <h2 className="text-lg font-bold text-text">{section.title}</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${section.roleBadgeColor}`}>{section.roleBadge}</span>
          </div>

          {/* Inner white card — stacked stages, flush edges */}
          <div className="relative z-20 bg-white rounded-t-2xl divide-y divide-gray-100">
            {section.stages.map((stage) => {
              const doneCount = stage.patients.filter(p => isDoneStatus(p.status)).length;
              const barPct = stage.total > 0 ? Math.round((doneCount / stage.total) * 100) : 0;
              const isOpen = expanded === stage.label;
              const currentFilter = getBarFilter(stage.label);
              const basePatients = searchQ
                ? stage.patients.filter(p => p.name.includes(searchQ) || p.hn.includes(searchQ) || p.protocol.includes(searchQ))
                : stage.patients;
              const filteredPatients = currentFilter === "all" ? basePatients
                : currentFilter === "done" ? basePatients.filter(p => isDoneStatus(p.status))
                : basePatients.filter(p => !isDoneStatus(p.status));

              return (
                <div key={stage.label}>

                  {/* Accordion header — whole row clickable */}
                  <div className="w-full grid items-center px-5 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggle(stage.label)}
                    style={{ gridTemplateColumns: "280px 16px 80px 180px 180px 1fr auto 28px" }}>
                    {/* Bar — static progress */}
                    <div className="relative rounded-lg h-10" style={{ backgroundColor: `${stage.barColor}30` }}>
                      <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${barPct}%`, backgroundColor: stage.barColor }} />
                      <span className="relative z-10 text-sm font-semibold text-text px-3 py-2 block">{stage.label}</span>
                    </div>
                    {/* Gap */}
                    <div />
                    {/* Count */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-black text-text">{stage.total}</span>
                      <Users size={16} className="text-text-secondary" />
                    </div>
                    {/* Metric 1 */}
                    <div className="flex items-center gap-1.5 text-sm">
                      {stage.metrics[0] && (() => { const Icon = stage.metrics[0].icon; return <>
                        {Icon && <Icon size={14} className="text-text-secondary" />}
                        <span className="text-text-secondary">{stage.metrics[0].label}:</span>
                        <span className="font-bold text-text">{stage.metrics[0].value}</span>
                      </>; })()}
                    </div>
                    {/* Metric 2 */}
                    <div className="flex items-center gap-1.5 text-sm">
                      {stage.metrics[1] && (() => { const Icon = stage.metrics[1].icon; return <>
                        {Icon && <Icon size={14} className="text-text-secondary" />}
                        <span className="text-text-secondary">{stage.metrics[1].label}:</span>
                        <span className="font-bold text-text">{stage.metrics[1].value}</span>
                      </>; })()}
                    </div>
                    {/* Spacer */}
                    <div />
                    {/* Last update */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">แก้ไขล่าสุดเมื่อ:</span>
                      <span className="text-sm font-bold text-text">{stage.lastUpdate}</span>
                    </div>
                    {/* Chevron */}
                    <ChevronDown size={20} className={`text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>

                  {/* Accordion content — patient table */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      {/* Filter pills */}
                      <div className="flex items-center gap-2 px-4 py-2">
                        <button onClick={() => setStageBarFilter(stage.label, "all")}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                            currentFilter === "all" ? "bg-text text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                          }`}>
                          ทั้งหมด ({basePatients.length})
                        </button>
                        <button onClick={() => setStageBarFilter(stage.label, currentFilter === "done" ? "all" : "done")}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                            currentFilter === "done" ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}>
                          เสร็จแล้ว ({basePatients.filter(p => isDoneStatus(p.status)).length})
                        </button>
                        <button onClick={() => setStageBarFilter(stage.label, currentFilter === "pending" ? "all" : "pending")}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                            currentFilter === "pending" ? "bg-onc text-white" : "bg-onc/10 text-onc hover:bg-onc/20"
                          }`}>
                          รอดำเนินการ ({basePatients.filter(p => !isDoneStatus(p.status)).length})
                        </button>
                      </div>
                      <SmoothHeight deps={currentFilter + searchQ}>
                      {filteredPatients.length > 0 ? (
                        <div className="mx-4 mb-4 rounded-xl overflow-hidden border-x border-b border-gray-200">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className={TH}>ผู้ป่วย</th>
                              <th className={TH}>HN</th>
                              <th className={TH}>Protocol</th>
                              <th className={TH}>Cycle</th>
                              <th className={TH}>แพทย์</th>
                              <th className={TH}>วันที่</th>
                              <th className={TH}>สถานะ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPatients.map((p) => (
                              <tr key={p.hn} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <td className={TD}>
                                  <div className="flex items-center gap-3">
                                    <PatientAvatar hn={p.hn} size={40} />
                                    <div>
                                      <p className="text-sm font-semibold text-text">{p.name}</p>
                                      <p className="text-xs text-text-secondary">{p.age}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className={`${TD} text-sm text-text font-mono`}>{p.hn}</td>
                                <td className={TD}>
                                  <span className="text-xs font-semibold text-onc bg-onc/10 px-2 py-1 rounded-lg">{p.protocol}</span>
                                </td>
                                <td className={`${TD} text-sm text-text`}>{p.cycle}</td>
                                <td className={`${TD} text-sm text-text-secondary`}>{p.doctor}</td>
                                <td className={`${TD} text-sm text-text-secondary`}>{p.date}</td>
                                <td className={TD}>
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${
                                    isDoneStatus(p.status)
                                      ? "bg-emerald-500"
                                      : p.status.includes("รอ") || p.status.includes("Infusing") || p.status.includes("กำลัง")
                                      ? "bg-onc"
                                      : p.status.includes("ปรับ") || p.status.includes("ส่งกลับ")
                                      ? "bg-amber-500"
                                      : "bg-gray-400"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-text-secondary">ไม่พบรายการ</div>
                      )}
                      </SmoothHeight>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
