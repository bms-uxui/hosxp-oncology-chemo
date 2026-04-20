import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Breadcrumbs, BreadcrumbItem, Select, SelectItem } from "@heroui/react";
import {
  Search, UserPlus, ChevronRight, ChevronDown, AlertTriangle, Check,
  Building2,
} from "lucide-react";
import { Stepper as MuiStepper, Step, StepLabel, StepConnector, stepConnectorClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import PatientAvatar from "../../components/onc/PatientAvatar";
import { useToast } from "../../components/onc/Toast";

const BASE = import.meta.env.BASE_URL;

/* ── MUI Qonto-style Stepper (same as OrderEntry) ── */
const QontoConnector = styled(StepConnector)({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: "calc(-50% + 16px)", right: "calc(50% + 16px)" },
  [`&.${stepConnectorClasses.active}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3", animation: "connectorFill 0.4s ease-in-out" } },
  [`&.${stepConnectorClasses.completed}`]: { [`& .${stepConnectorClasses.line}`]: { borderColor: "#674BB3" } },
  [`& .${stepConnectorClasses.line}`]: { borderColor: "#c4c4c4", borderTopWidth: 3, borderRadius: 1, transition: "border-color 0.4s ease" },
  "@keyframes connectorFill": {
    "0%": { transform: "scaleX(0)", transformOrigin: "left" },
    "100%": { transform: "scaleX(1)", transformOrigin: "left" },
  },
});

function QontoStepIcon({ active, completed }: { active?: boolean; completed?: boolean }) {
  return (
    <div style={{ color: active ? "#674BB3" : completed ? "#674BB3" : "#e5e7eb", display: "flex", height: 22, alignItems: "center", transition: "color 0.3s ease" }}>
      {completed ? (
        <Check size={18} style={{ color: "#674BB3" }} />
      ) : (
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "currentColor", transition: "background-color 0.3s ease, transform 0.3s ease", transform: active ? "scale(1.3)" : "scale(1)" }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Patient Registration — 2-Step Flow
   Step 1: Search by HN or ID Card → fetch from HOSxP
   Step 2: Confirm patient profile → register to Oncology
   ══════════════════════════════════════════════ */

/* ── Mock HOSxP patient database (simulated API response) ── */
const hosxpPatients: Record<string, HosxpPatient> = {
  "550123": {
    hn: "550123", idCard: "1-1001-00123-45-6",
    titleName: "นาง", firstName: "สมศรี", lastName: "รักสุข",
    gender: "หญิง", dob: "08/03/2508", bloodType: "A+",
    phone: "081-234-5678", address: "123/45 ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240",
    allergy: "Aspirin", allergyDetail: "ผื่นแดง คัน", allergyLevel: "moderate" as const,
    weight: 56, height: 160, bsa: 1.58,
    creatinine: 0.7, crcl: 88, ecog: 1,
    insurance: "UC — สิทธิบัตรทอง", insuranceCode: "UC",
    diagnosis: "", icd10: "", morphology: "",
    t: "", n: "", m: "", stage: "",
  },
  "660234": {
    hn: "660234", idCard: "3-3401-00456-78-9",
    titleName: "นาย", firstName: "วิชัย", lastName: "มั่นคง",
    gender: "ชาย", dob: "21/11/2500", bloodType: "O+",
    phone: "089-876-5432", address: "88 หมู่ 5 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000",
    allergy: "—", allergyDetail: "", allergyLevel: "none" as const,
    weight: 72, height: 170, bsa: 1.83,
    creatinine: 1.1, crcl: 62, ecog: 2,
    insurance: "ประกันสังคม", insuranceCode: "SSO",
    diagnosis: "", icd10: "", morphology: "",
    t: "", n: "", m: "", stage: "",
  },
  "770345": {
    hn: "770345", idCard: "1-5001-00789-01-2",
    titleName: "นางสาว", firstName: "พิมพ์ใจ", lastName: "แสงทอง",
    gender: "หญิง", dob: "14/07/2523", bloodType: "B-",
    phone: "062-345-6789", address: "55/12 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900",
    allergy: "Sulfonamide", allergyDetail: "ผื่นลมพิษ หายใจลำบาก", allergyLevel: "severe" as const,
    weight: 50, height: 155, bsa: 1.47,
    creatinine: 0.6, crcl: 105, ecog: 0,
    insurance: "ข้าราชการ", insuranceCode: "GOV",
    diagnosis: "", icd10: "", morphology: "",
    t: "", n: "", m: "", stage: "",
  },
};

interface HosxpPatient {
  hn: string; idCard: string;
  titleName: string; firstName: string; lastName: string;
  gender: string; dob: string; bloodType: string;
  phone: string; address: string;
  allergy: string; allergyDetail: string; allergyLevel: "severe" | "moderate" | "mild" | "none";
  weight: number; height: number; bsa: number;
  creatinine: number; crcl: number; ecog: number;
  insurance: string; insuranceCode: string;
  diagnosis: string; icd10: string; morphology: string;
  t: string; n: string; m: string; stage: string;
}

function formatAge(dobStr: string): string {
  const parts = dobStr.split("/");
  const bYear = parseInt(parts[2]) - 543;
  const birth = new Date(bYear, parseInt(parts[1]) - 1, parseInt(parts[0]));
  const now = new Date();
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return `${y} ปี ${m} เดือน ${d} วัน`;
}

const diagnosisOptions = [
  { name: "Breast Cancer", icd10: "C50.9" },
  { name: "Colorectal Cancer", icd10: "C18.9" },
  { name: "Lung Cancer", icd10: "C34.9" },
  { name: "Ovarian Cancer", icd10: "C56.9" },
  { name: "Lymphoma", icd10: "C85.9" },
  { name: "Gastric Cancer", icd10: "C16.9" },
  { name: "Cervical Cancer", icd10: "C53.9" },
  { name: "Liver Cancer", icd10: "C22.0" },
  { name: "Pancreatic Cancer", icd10: "C25.9" },
  { name: "Prostate Cancer", icd10: "C61" },
  { name: "Bladder Cancer", icd10: "C67.9" },
  { name: "Head & Neck Cancer", icd10: "C76.0" },
];

const sideCard = "bg-white rounded-2xl p-5";

export default function PatientRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectedRef = useRef(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [searchType, setSearchType] = useState<"hn" | "idcard">("hn");
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<HosxpPatient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Cancer profile form
  const [cancer, setCancer] = useState({ diagnosis: "", icd10: "", morphology: "", t: "", n: "", m: "", stage: "" });
  const updateCancer = (field: string, value: string) => setCancer(prev => ({ ...prev, [field]: value }));

  function handleSearch() {
    if (!searchValue.trim()) return;
    setSearching(true);
    setNotFound(false);
    setPatient(null);

    // Simulate API call
    setTimeout(() => {
      const found = Object.values(hosxpPatients).find(p =>
        searchType === "hn" ? p.hn === searchValue.trim() : p.idCard === searchValue.trim()
      );
      if (found) {
        setPatient(found);
        setStep(2);
      } else {
        setNotFound(true);
      }
      setSearching(false);
    }, 800);
  }

  function handleRegister() {
    setRegistering(true);
  }

  // Skeleton screen with redirect
  if (registering && patient) {
    if (!redirectedRef.current) {
      redirectedRef.current = true;
      setTimeout(() => { toast("success", `ลงทะเบียน ${patient.titleName}${patient.firstName} ${patient.lastName} สำเร็จ`); navigate(`/onc/patients/${patient.hn}`); }, 2500);
    }
    return (
      <div className="flex flex-col h-full overflow-hidden pt-2">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          {/* Spinner */}
          <div className="w-14 h-14 rounded-2xl bg-[#674BB3]/10 flex items-center justify-center">
            <div className="w-7 h-7 border-3 border-[#674BB3]/20 border-t-[#674BB3] rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-[#404040]">กำลังสร้างโปรไฟล์ผู้ป่วย...</h2>
            <p className="text-sm text-[#898989] mt-1">ลงทะเบียน {patient.titleName}{patient.firstName} {patient.lastName} เข้าสู่ระบบ Oncology</p>
          </div>

          {/* Skeleton cards */}
          <div className="w-full max-w-2xl space-y-4 mt-4">
            {/* Profile skeleton */}
            <div className="bg-white rounded-2xl p-5 animate-pulse" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded-lg w-48" />
                  <div className="h-3 bg-gray-100 rounded-lg w-32" />
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 bg-gray-100 rounded w-20" />
                    <div className="h-3 bg-gray-200 rounded w-28" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cancer profile skeleton */}
            <div className="bg-white rounded-2xl p-5 animate-pulse" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="h-5 bg-[#674BB3]/10 rounded-lg w-36 mb-4" />
              <div className="flex gap-3">
                <div className="h-10 bg-[#674BB3]/5 rounded-xl flex-1" />
                <div className="h-10 bg-[#674BB3]/5 rounded-xl w-20" />
                <div className="h-10 bg-[#674BB3]/5 rounded-xl w-20" />
              </div>
            </div>

            {/* Vitals skeleton */}
            <div className="grid grid-cols-4 gap-3 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="h-3 bg-gray-100 rounded w-12 mb-3" />
                  <div className="h-7 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden pt-2">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <Breadcrumbs size="sm" separator="›" className="text-[13px]" classNames={{
          list: "gap-1",
          separator: "text-[#898989] mx-1",
        }}>
          <BreadcrumbItem onPress={() => navigate("/onc")} classNames={{ item: "text-[#898989] hover:text-[#674BB3]" }}>หน้าหลัก</BreadcrumbItem>
          <BreadcrumbItem isCurrent classNames={{ item: "text-[#674BB3] font-semibold" }}>ลงทะเบียนผู้ป่วยใหม่</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      {/* ── Stepper (MUI Qonto-style) ── */}
      <div className="rounded-2xl border-[0.1px] border-border-card p-5 mb-5 sticky top-0 z-10 backdrop-blur-md bg-white/70 shrink-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <MuiStepper activeStep={step - 1} alternativeLabel connector={<QontoConnector />}
          sx={{ "& .MuiStep-root": { p: 0 } }}>
          {["ค้นหาผู้ป่วย", "ยืนยันข้อมูล"].map((label, i) => (
            <Step key={i} completed={i < step - 1}>
              <StepLabel
                slots={{ stepIcon: () => <QontoStepIcon active={i === step - 1} completed={i < step - 1} /> }}
                onClick={() => { if (i < step - 1) setStep((i + 1) as 1 | 2); }}
                sx={{
                  cursor: i < step - 1 ? "pointer" : "default",
                  p: 0,
                  "& .MuiStepLabel-iconContainer": { p: 0 },
                  "& .MuiStepLabel-labelContainer": { p: 0 },
                  "& .MuiStepLabel-label, & .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
                    fontFamily: '"Google Sans", "Google Sans Text", "Noto Sans Thai", sans-serif',
                    fontSize: "12px !important", fontWeight: "600 !important", mt: 0.5, whiteSpace: "nowrap", p: 0,
                    color: "#404040",
                  },
                }}
              >{label}</StepLabel>
            </Step>
          ))}
        </MuiStepper>
      </div>

      {/* ══════════ STEP 1 — Search ══════════ */}
      {step === 1 && (
        <div className="flex-1 flex items-start justify-center pt-8">
          <div className="w-full max-w-lg">
            {/* Search card */}
            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#674BB3]/10 flex items-center justify-center">
                  <Search size={20} className="text-[#674BB3]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#404040]">ค้นหาผู้ป่วยจากระบบ HOSxP</h2>
                  <p className="text-xs text-[#898989]">กรอก HN หรือเลขบัตรประชาชนเพื่อดึงข้อมูลผู้ป่วย</p>
                </div>
              </div>

              {/* Search type toggle */}
              <div className="flex gap-2 mb-4">
                {([
                  { key: "hn" as const, label: "เลข HN" },
                  { key: "idcard" as const, label: "เลขบัตรประชาชน" },
                ]).map(t => (
                  <button key={t.key}
                    onClick={() => { setSearchType(t.key); setSearchValue(""); setNotFound(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      searchType === t.key
                        ? "bg-[#674BB3] text-white"
                        : "bg-gray-50 text-[#898989] hover:bg-gray-100"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={e => { setSearchValue(e.target.value); setNotFound(false); }}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder={searchType === "hn" ? "เช่น 550123" : "เช่น 1-1001-00123-45-6"}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchValue.trim()}
                  className="px-6 py-3 bg-[#674BB3] text-white text-sm font-semibold rounded-xl hover:bg-[#563AA4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>ค้นหา</>
                  )}
                </button>
              </div>

              {/* Not found */}
              {notFound && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#404040]">ไม่พบข้อมูลผู้ป่วย</p>
                    <p className="text-xs text-[#898989] mt-0.5">กรุณาตรวจสอบ{searchType === "hn" ? "เลข HN" : "เลขบัตรประชาชน"}อีกครั้ง</p>
                  </div>
                </div>
              )}

              {/* Demo hint */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-[#898989] mb-2">ทดลองค้นหาด้วย HN:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(hosxpPatients).map(hn => (
                    <button key={hn}
                      onClick={() => { setSearchType("hn"); setSearchValue(hn); setNotFound(false); }}
                      className="text-xs font-mono font-semibold text-[#674BB3] bg-[#674BB3]/5 px-2.5 py-1 rounded-lg hover:bg-[#674BB3]/10 transition-colors">
                      {hn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STEP 2 — Patient Profile Confirmation ══════════ */}
      {step === 2 && patient && (
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ════ LEFT — Patient profile (same style as PatientSummary) ════ */}
          <div className="w-80 min-w-[320px] max-w-[320px] shrink-0 overflow-y-auto overflow-x-hidden space-y-4 rounded-2xl">

            {/* Profile header */}
            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3">
                <PatientAvatar hn={patient.hn} size={56} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[#404040] leading-tight">
                    {patient.titleName}{patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-sm text-[#898989] mt-0.5">{patient.gender} · {formatAge(patient.dob)}</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
                <InfoRow label="HN" value={patient.hn} mono />
                <InfoRow label="เลขบัตรประชาชน" value={patient.idCard} />
                <InfoRow label="วันเกิด" value={patient.dob} />
                <InfoRow label="หมู่เลือด" value={patient.bloodType} />
                <InfoRow label="โทรศัพท์" value={patient.phone} />
                <InfoRow label="สิทธิการรักษา" value={patient.insurance} />
              </div>

              {/* Clinical parameters */}
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 text-sm">
                <InfoRow label="BW / HT" value={`${patient.weight} kg / ${patient.height} cm`} />
                <InfoRow label="BSA" value={`${patient.bsa} m²`} highlight />
                <InfoRow label="CrCl" value={`${patient.crcl} mL/min`} />
                <InfoRow label="ECOG" value={`${patient.ecog}`} />
              </div>
            </div>

            {/* Allergies — same as PatientSummary */}
            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-2">การแพ้ยา</h3>
              {patient.allergy === "—" ? (
                <div className="bg-gray-50 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                  <p className="text-sm text-[#898989]">ไม่มีประวัติแพ้ยา</p>
                </div>
              ) : (
                <div className="bg-[#CE364C]/5 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.5" d="M12.7574 5.12132C13.9289 6.29289 15.8284 6.29289 17 5.12132C17.5858 4.53553 17.8787 3.76777 17.8787 3C17.8787 2.23223 17.5858 1.46447 17 0.878677C15.8284-.292892 13.9289-.292892 12.7574.878677 12.1716 1.46447 11.8787 2.23223 11.8787 3C11.8787 3.76777 12.1716 4.53553 12.7574 5.12132Z" fill="#CE364C"/>
                    <path opacity="0.5" d="M18.9052 15.381C20.3649 13.9213 20.3649 11.5546 18.9052 10.0948 17.4454 8.6351 15.0787 8.6351 13.619 10.0948L10.0948 13.619C8.6351 15.0787 8.6351 17.4454 10.0948 18.9052 11.5546 20.3649 13.9213 20.3649 15.381 18.9052L18.9052 15.381Z" fill="#CE364C"/>
                    <path d="M17.8779 16.4084L17.8784 16.4054 17.1465 16.2644C17.1424 16.2635 17.132 16.2611 17.1177 16.2575 17.089 16.2503 17.0405 16.2371 16.9748 16.2161 16.8432 16.1741 16.6427 16.1007 16.3923 15.9801 15.8925 15.7392 15.1913 15.3087 14.4415 14.5589 13.6916 13.8091 13.2611 13.1078 13.0201 12.6078 12.8994 12.3575 12.826 12.1569 12.784 12.0253 12.763 11.9595 12.7431 11.8831 12.7359 11.8544L12.5946 11.1216 12.5916 11.1222 11.3262 12.3876C11.3348 12.4167 11.3444 12.4481 11.3551 12.4817 11.4168 12.6747 11.5155 12.9409 11.6689 13.2591 11.976 13.8964 12.501 14.7397 13.3808 15.6195 14.2606 16.4994 15.1039 17.0243 15.7412 17.3314 16.0593 17.4847 16.3255 17.5834 16.5185 17.6451 16.552 17.6558 16.5833 17.6653 16.6123 17.6739L17.8779 16.4084Z" fill="#CE364C"/>
                    <path d="M7.72685 10.682C5.94471 12.4393 3.05529 12.4393 1.27315 10.682.57624 9.9948.15185 9.1406 0 8.25H9C8.8481 9.1406 8.4238 9.9948 7.72685 10.682Z" fill="#CE364C"/>
                    <path d="M9 6.75H0C.15185 5.85943.57624 5.00524 1.27315 4.31802 3.05529 2.56066 5.94471 2.56066 7.72685 4.31802 8.4238 5.00524 8.8481 5.85943 9 6.75Z" fill="#CE364C"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#404040] leading-normal">{patient.allergy}</p>
                    <p className="text-xs text-[#404040]/60 leading-normal">{patient.allergyDetail}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className={sideCard} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-2">ที่อยู่</h3>
              <p className="text-sm text-[#898989] leading-relaxed">{patient.address}</p>
            </div>
          </div>

          {/* ════ RIGHT — Confirmation panel (matches PatientSummary layout) ════ */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Tab-like header with nav buttons */}
            <div className="shrink-0 flex items-center justify-between">
              <div className="bg-white rounded-t-2xl px-5 py-3 self-start" style={{ boxShadow: "0 -1px 4px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#674BB3]" />
                  <span className="text-sm font-semibold text-[#404040]">ข้อมูลจากระบบ HOSxP</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep(1); setPatient(null); setSearchValue(""); }}
                  className="text-sm font-semibold text-[#404040] bg-gray-100 hover:bg-gray-200 rounded-full px-5 py-1.5 transition-colors">
                  ย้อนกลับ
                </button>
                <button onClick={handleRegister} disabled={registering}
                  className="rounded-full px-5 py-1.5 text-sm font-semibold bg-[#674BB3] text-white hover:bg-onc-hover transition-all disabled:opacity-60 flex items-center gap-2">
                  {registering ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>ลงทะเบียน</>
                  )}
                </button>
              </div>
            </div>

            {/* Content card */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white rounded-b-2xl rounded-tr-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

              {/* Cancer Profile Form */}
              <div className="rounded-2xl border-[0.1px] border-[#d9d9d9]/25 p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <h3 className="text-sm font-bold text-[#404040] mb-4">ข้อมูลการวินิจฉัย</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#898989] mb-1 block">Diagnosis</label>
                    <Select
                      selectedKeys={cancer.diagnosis ? [cancer.diagnosis] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        updateCancer("diagnosis", v);
                        const match = diagnosisOptions.find(d => d.name === v);
                        if (match) updateCancer("icd10", match.icd10);
                      }}
                      placeholder="เลือกการวินิจฉัย"
                      size="sm"
                      variant="flat"
                      selectorIcon={<ChevronDown size={14} className="text-[#898989]" />}
                      classNames={{
                        trigger: "!bg-gray-50 border border-gray-200 rounded-xl h-[38px] min-h-[38px] px-3 data-[hover=true]:border-[#674BB3] data-[focus=true]:border-[#674BB3] data-[focus=true]:ring-1 data-[focus=true]:ring-[#674BB3]",
                        value: "text-sm text-[#404040]",
                        selectorIcon: "right-3 absolute text-[#898989]",
                        popoverContent: "bg-white shadow-xl rounded-xl border border-gray-100 p-1",
                        listbox: "p-0",
                      }}
                    >
                      {diagnosisOptions.map(d => <SelectItem key={d.name} classNames={{ base: "rounded-lg data-[hover=true]:bg-gray-50 px-3 py-2", title: "text-sm" }}>{d.name}</SelectItem>)}
                    </Select>
                  </div>
                  <FormField label="ICD-10" value={cancer.icd10} onChange={v => updateCancer("icd10", v)} placeholder="เช่น C50.9" />
                  <div className="col-span-2">
                    <FormField label="Morphology" value={cancer.morphology} onChange={v => updateCancer("morphology", v)} placeholder="เช่น Invasive ductal carcinoma, NOS" />
                  </div>
                  {/* Stage + TNM — stacked column */}
                  <div className="col-span-2 space-y-4">
                    {/* Stage */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative overflow-hidden">
                      <img src={`${BASE}onc/stage.svg`} alt="" className="absolute -bottom-4 -right-4 w-24 h-24 object-contain pointer-events-none opacity-70" />
                      <div className="relative">
                        <span className="text-lg font-bold text-[#674BB3]">Stage</span>
                        <p className="text-xs text-[#898989] mt-0.5 mb-4">ระยะของมะเร็ง</p>
                        <div className="flex gap-2 flex-wrap">
                          {["I","IA","IB","II","IIA","IIB","III","IIIA","IIIB","IIIC","IV","IVA","IVB"].map(s => (
                            <button key={s} onClick={() => updateCancer("stage", s)}
                              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                cancer.stage === s
                                  ? "bg-[#674BB3] text-white shadow-sm"
                                  : "bg-white text-[#404040] border border-gray-200 hover:border-[#674BB3] hover:text-[#674BB3]"
                              }`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* TNM — row */}
                    <div className="grid grid-cols-3 gap-4">
                      {(["t", "n", "m"] as const).map(key => {
                        const label = key.toUpperCase();
                        const desc = key === "t" ? "Primary Tumor" : key === "n" ? "Regional Nodes" : "Distant Metastasis";
                        const options = key === "t" ? ["0","1","2","3","4","X"] : key === "n" ? ["0","1","2","3","X"] : ["0","1","X"];
                        const img = key === "t" ? "tumor-diagnosis.svg" : key === "n" ? "tumor.png" : "netastasis.svg";
                        return (
                          <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative overflow-hidden">
                            <img src={`${BASE}onc/${img}`} alt="" className="absolute -bottom-4 -right-4 w-24 h-24 object-contain pointer-events-none opacity-70" />
                            <div className="relative">
                              <span className="text-lg font-bold text-[#674BB3]">{label}</span>
                              <p className="text-[11px] text-[#898989] mt-0.5 mb-3">{desc}</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {options.map(v => (
                                  <button key={v} onClick={() => updateCancer(key, v)}
                                    className={`w-11 h-11 rounded-xl text-sm font-bold transition-all ${
                                      cancer[key] === v
                                        ? "bg-[#674BB3] text-white shadow-sm"
                                        : "bg-white text-[#404040] border border-gray-200 hover:border-[#674BB3] hover:text-[#674BB3]"
                                    }`}>
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="bg-[#674BB3]/5 border border-[#674BB3]/10 rounded-xl px-4 py-3">
                <p className="text-xs text-[#898989]">ข้อมูลผู้ป่วย (ซ้ายมือ) ถูกดึงจากฐานข้อมูล HOSxP แล้ว กรุณากรอกข้อมูลการวินิจฉัยเพื่อลงทะเบียนเข้าสู่ระบบ Oncology</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ── */

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#898989]">{label}</span>
      <span className={`font-semibold ${highlight ? "font-bold text-onc" : "text-[#404040]"} ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}


function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex-1">
      <label className="text-xs font-semibold text-[#898989] mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none transition-colors"
      />
    </div>
  );
}

