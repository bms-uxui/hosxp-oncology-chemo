import { useState } from "react";
import {
  Receipt, Search, CheckCircle2, FileText, ChevronRight,
  ClipboardCheck, Printer, Plus, X, Filter,
  Pill, FlaskConical, BedDouble, Stethoscope, Download, CreditCard, ShieldCheck,
} from "lucide-react";
import { useOnc, type BillingRecord, type BillingStatus, type BillingItem } from "../../components/onc/OncContext";
import PatientAvatar from "../../components/onc/PatientAvatar";
import { useToast } from "../../components/onc/Toast";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";

const BASE = import.meta.env.BASE_URL;

const statusLabel: Record<BillingStatus, string> = { PENDING: "รอตรวจสอบ", CONFIRMED: "ยืนยันแล้ว", INVOICED: "ออกใบแจ้งหนี้" };
const statusColor: Record<BillingStatus, string> = { PENDING: "bg-amber-500", CONFIRMED: "bg-emerald-500", INVOICED: "bg-indigo-500" };

const categoryIcon: Record<string, typeof Pill> = { drug: Pill, diluent: FlaskConical, service: Stethoscope, room: BedDouble };
const categoryLabel: Record<string, string> = { drug: "ยา", diluent: "สารละลาย", service: "บริการ", room: "ห้อง/เตียง" };

const coverageOptions = [
  { code: "UC", label: "สิทธิบัตรทอง (UC)", color: "bg-blue-500" },
  { code: "SSO", label: "ประกันสังคม", color: "bg-emerald-500" },
  { code: "GOV", label: "ข้าราชการ", color: "bg-amber-500" },
  { code: "CASH", label: "เงินสด", color: "bg-gray-500" },
  { code: "INS", label: "ประกันเอกชน", color: "bg-purple-500" },
];

export default function Billing() {
  const { billingRecords, updateBillingStatus, verifyPin } = useOnc();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | BillingStatus>("ALL");
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const filtered = billingRecords.filter(r => {
    const matchSearch = !search || r.patientName.includes(search) || r.hn.includes(search) || r.orderId.includes(search);
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selected = billingRecords.find(r => r.id === selectedId);

  const pendingCount = billingRecords.filter(r => r.status === "PENDING").length;
  const invoicedCount = billingRecords.filter(r => r.status === "INVOICED").length;
  const totalRevenue = billingRecords.filter(r => r.status === "INVOICED").reduce((s, r) => s + r.totalAmount, 0);

  function handlePinComplete(p: string) {
    if (!verifyPin(p) || !selected) { setPinError(true); setPin(""); return; }
    setShowPin(false); setPin("");
    updateBillingStatus(selected.id, "INVOICED", "คุณสมศรี บัญชี");
    toast("success", `ออกใบแจ้งหนี้ ${selected.id} สำเร็จ — ฿${selected.totalAmount.toLocaleString()}`);
    setTimeout(() => { const t = document.title; document.title = `BILL-${selected.id}`; window.print(); document.title = t; }, 300);
  }


  /* ═══ Detail view ═══ */
  if (selected) {
    const drugTotal = selected.items.filter(i => i.category === "drug").reduce((s, i) => s + i.totalPrice, 0);
    const diluentTotal = selected.items.filter(i => i.category === "diluent").reduce((s, i) => s + i.totalPrice, 0);
    const serviceTotal = selected.items.filter(i => i.category === "service" || i.category === "room").reduce((s, i) => s + i.totalPrice, 0);
    const coverage = coverageOptions.find(c => c.code === selected.coverageType) ?? coverageOptions[0];

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] overflow-y-auto space-y-4">
        {/* Breadcrumb */}
        <div className="shrink-0 pt-2">
          <Breadcrumbs size="sm" separator="›" className="text-[13px]" classNames={{ list: "gap-1", separator: "text-[#898989] mx-1" }}>
            <BreadcrumbItem onPress={() => setSelectedId(null)} classNames={{ item: "text-[#898989] hover:text-[#674BB3]" }}>ค่าใช้จ่าย</BreadcrumbItem>
            <BreadcrumbItem isCurrent classNames={{ item: "text-[#674BB3] font-semibold" }}>{selected.id}</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PatientAvatar hn={selected.hn} size={48} />
              <div>
                <h2 className="text-lg font-bold text-[#404040]">{selected.patientName}</h2>
                <p className="text-sm text-[#898989]">HN {selected.hn} · {selected.protocol} C{selected.cycle}D{selected.day} · {selected.ward}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold text-white px-4 py-1.5 rounded-full ${statusColor[selected.status]}`}>
                {statusLabel[selected.status]}
              </span>
              <span className={`text-sm font-bold text-white px-4 py-1.5 rounded-full ${coverage.color}`}>
                <CreditCard size={14} className="inline mr-1 -mt-0.5" />{coverage.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-[#898989]">
            <span>Order: <span className="font-semibold text-[#404040]">{selected.orderId}</span></span>
            <span>สร้างเมื่อ: <span className="font-semibold text-[#404040]">{selected.generatedAt} น.</span></span>
            <span>โดย: <span className="font-semibold text-[#404040]">{selected.generatedBy}</span></span>
            {selected.confirmedBy && <span>ยืนยันโดย: <span className="font-semibold text-emerald-600">{selected.confirmedBy}</span></span>}
          </div>
        </div>

        {/* 2-column: Left (summary + actions) | Right (table) */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Summary cards */}
            <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040]">สรุปค่าใช้จ่าย</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#898989]">ค่ายา</span><span className="font-semibold text-[#404040]">฿{drugTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#898989]">ค่าสารละลาย</span><span className="font-semibold text-[#404040]">฿{diluentTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#898989]">ค่าบริการ</span><span className="font-semibold text-[#404040]">฿{serviceTotal.toLocaleString()}</span></div>
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="font-bold text-[#404040]">รวมทั้งสิ้น</span>
                  <span className="text-lg font-bold text-[#674BB3]">฿{selected.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-3">สิทธิการรักษา</h3>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#674BB3]" />
                <span className="text-sm font-semibold text-[#404040]">{coverage.label}</span>
              </div>
              {selected.notes && <p className="text-xs text-[#898989] mt-2">{selected.notes}</p>}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl p-5 space-y-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 className="text-sm font-bold text-[#404040] mb-3">ดำเนินการ</h3>
              {selected.status === "PENDING" && (
                <button onClick={() => { setShowPin(true); setPin(""); setPinError(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white bg-[#674BB3] rounded-xl hover:bg-[#563AA4] transition-colors">
                  ยืนยันและออกใบแจ้งหนี้ <FileText size={16} />
                </button>
              )}
              {selected.status === "INVOICED" && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold px-4 py-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 size={16} /> ดำเนินการเสร็จสิ้น
                </div>
              )}
              <button onClick={() => { const t = document.title; document.title = `BILL-${selected.id}`; window.print(); document.title = t; }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#404040] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                พิมพ์ใบแจ้งหนี้ <Printer size={16} className="text-[#898989]" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#404040] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ดาวน์โหลด PDF <Download size={16} className="text-[#898989]" />
              </button>
            </div>
          </div>

          {/* Right — Itemized table */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-sm font-bold text-[#404040]">รายการค่าใช้จ่าย ({selected.items.length} รายการ)</p>
              </div>

              {/* On-screen table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[#898989] uppercase border-b border-gray-200">
                    <th className="px-5 py-3 text-left font-semibold">รหัส</th>
                    <th className="px-5 py-3 text-left font-semibold">ประเภท</th>
                    <th className="px-5 py-3 text-left font-semibold">รายการ</th>
                    <th className="px-5 py-3 text-right font-semibold">จำนวน</th>
                    <th className="px-5 py-3 text-right font-semibold">ราคา/หน่วย</th>
                    <th className="px-5 py-3 text-right font-semibold">รวม (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.items.map((item, idx) => {
                    const Icon = categoryIcon[item.category] ?? Pill;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs font-mono text-[#898989]">{item.code}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} className="text-[#898989]" />
                            <span className="text-xs text-[#898989]">{categoryLabel[item.category]}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-[#404040]">{item.description}</td>
                        <td className="px-5 py-3 text-right text-[#898989]">{item.quantity}</td>
                        <td className="px-5 py-3 text-right text-[#898989]">฿{item.unitPrice.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-bold text-[#404040]">฿{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td colSpan={5} className="px-5 py-3 text-right text-sm font-bold text-[#404040]">รวมทั้งสิ้น</td>
                    <td className="px-5 py-3 text-right text-lg font-bold text-[#674BB3]">฿{selected.totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Print area — A4 invoice document (hidden on screen) */}
              <div className="print-area hidden print:block mx-auto bg-white p-8" style={{ width: 595, minHeight: 842, aspectRatio: "1 / 1.4142" }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b-2 border-[#674BB3] pb-3">
                  <div>
                    <h1 className="text-sm font-bold text-[#674BB3]">โรงพยาบาลตัวอย่าง</h1>
                    <p className="text-[10px] text-[#898989]">คลินิกเคมีบำบัด / Chemotherapy Clinic</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#674BB3]">ใบแจ้งค่าใช้จ่ายเคมีบำบัด</p>
                    <p className="text-[10px] text-[#898989]">เลขที่: <span className="font-mono font-bold text-[#404040]">{selected.id}</span></p>
                    <p className="text-[10px] text-[#898989]">Order: <span className="font-mono font-bold text-[#404040]">{selected.orderId}</span></p>
                  </div>
                </div>

                {/* Patient info */}
                <div className="border border-gray-300 rounded-lg p-2 mb-3 text-[10px]">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="col-span-2"><span className="text-[#898989]">ชื่อ-สกุล: </span><span className="font-bold">{selected.patientName}</span></div>
                    <div><span className="text-[#898989]">HN: </span><span className="font-bold">{selected.hn}</span></div>
                    <div><span className="text-[#898989]">หอผู้ป่วย: </span><span className="font-bold">{selected.ward}</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    <div><span className="text-[#898989]">Protocol: </span><span className="font-bold text-[#674BB3]">{selected.protocol}</span></div>
                    <div><span className="text-[#898989]">Cycle: </span><span className="font-bold">C{selected.cycle}D{selected.day}</span></div>
                    <div><span className="text-[#898989]">สิทธิ: </span><span className="font-bold">{coverage.label}</span></div>
                    <div><span className="text-[#898989]">วันที่: </span><span className="font-bold">{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                  </div>
                </div>

                {/* Items table */}
                <table className="w-full text-[10px] border border-gray-300 mb-3">
                  <thead>
                    <tr className="bg-gray-50 text-[#898989]">
                      <th className="border border-gray-300 px-2 py-1 text-left">รหัส</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">ประเภท</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">รายการ</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">จำนวน</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">ราคา/หน่วย</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">รวม (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-2 py-1 font-mono">{item.code}</td>
                        <td className="border border-gray-300 px-2 py-1">{categoryLabel[item.category]}</td>
                        <td className="border border-gray-300 px-2 py-1 font-bold">{item.description}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{item.quantity}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">฿{item.unitPrice.toLocaleString()}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-bold">฿{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="border border-gray-300 px-2 py-1"></td>
                      <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right font-bold">ค่ายา</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-bold">฿{drugTotal.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="border border-gray-300 px-2 py-1"></td>
                      <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right font-bold">ค่าสารละลาย</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-bold">฿{diluentTotal.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="border border-gray-300 px-2 py-1"></td>
                      <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right font-bold">ค่าบริการ</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-bold">฿{serviceTotal.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-[#674BB3]/5">
                      <td colSpan={3} className="border border-gray-300 px-2 py-1.5"></td>
                      <td colSpan={2} className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-[#674BB3]">รวมทั้งสิ้น</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-[#674BB3]">฿{selected.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 mt-8 text-[10px] text-center">
                  <div>
                    <div className="border-b border-gray-400 mb-1 h-8"></div>
                    <p className="text-[#898989]">ผู้จัดทำ</p>
                    <p className="font-bold">{selected.generatedBy}</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 mb-1 h-8"></div>
                    <p className="text-[#898989]">ผู้ตรวจสอบ</p>
                    <p className="font-bold">{selected.confirmedBy || "—"}</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 mb-1 h-8"></div>
                    <p className="text-[#898989]">ผู้อนุมัติ</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-2 border-t border-gray-200 flex justify-between text-[8px] text-[#898989]">
                  <span>HOSxP Oncology Chemo CPOE — ใบแจ้งค่าใช้จ่าย</span>
                  <span>พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PIN dialog */}
        {showPin && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => { setShowPin(false); setPin(""); }} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 animate-[editSlideUp_0.3s_ease-out]">
              <p className="text-sm font-bold text-[#404040] mb-1 text-center">
                ยืนยันและออกใบแจ้งหนี้
              </p>
              <p className="text-xs text-[#898989] mb-4 text-center">กรอก PIN 6 หลักเพื่อยืนยัน</p>
              <div className="flex justify-center gap-2 mb-4 cursor-text" onClick={() => (document.getElementById("bill-pin") as HTMLInputElement)?.focus()}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                    i < pin.length ? "border-[#674BB3] bg-[#674BB3]/5 text-[#674BB3]" : i === pin.length ? "border-[#674BB3]/50" : "border-gray-200"
                  }`}>{i < pin.length ? "●" : ""}</div>
                ))}
              </div>
              <input id="bill-pin" type="password" inputMode="numeric" maxLength={6} value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(false); }}
                onKeyDown={e => { if (e.key === "Enter" && pin.length === 6) handlePinComplete(pin); }}
                autoFocus className="sr-only" />
              {pinError && <p className="text-xs text-red-600 font-semibold mb-3 text-center">PIN ไม่ถูกต้อง</p>}
              <button onClick={() => { if (pin.length === 6) handlePinComplete(pin); }} disabled={pin.length < 6}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  pin.length >= 6 ? "bg-[#674BB3] text-white hover:bg-[#563AA4]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}>
                <ClipboardCheck size={14} /> ยืนยัน
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ═══ List view ═══ */
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4 overflow-hidden">

      {/* Breadcrumb */}
      <div className="shrink-0 pt-2">
        <Breadcrumbs size="sm" separator="›" className="text-[13px]" classNames={{ list: "gap-1", separator: "text-[#898989] mx-1" }}>
          <BreadcrumbItem isCurrent classNames={{ item: "text-[#674BB3] font-semibold" }}>ค่าใช้จ่าย</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      {/* Banner */}
      <div className="rounded-3xl overflow-hidden relative shrink-0" style={{ background: "#DEDFFF", minHeight: 140 }}>
        <img src={`${BASE}onc/ribbon-left.svg`} className="absolute -left-2 bottom-0 h-14 opacity-50" alt="" />
        <img src={`${BASE}onc/banner-3d.png`} className="absolute right-0 -bottom-8 h-52 object-contain" alt="" />
        <div className="relative z-10 px-8 py-6">
          <h1 className="text-xl font-bold text-[#674BB3]">ค่าใช้จ่ายเคมีบำบัด</h1>
          <p className="text-sm text-[#674BB3]/70 mt-1 max-w-md">ตรวจสอบ ยืนยัน และออกใบแจ้งหนี้ค่ายาเคมีบำบัด</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        {[
          { label: "ทั้งหมด", count: billingRecords.length, color: "#674BB3" },
          { label: "รอตรวจสอบ", count: pendingCount, color: "#f59e0b" },
          { label: "ออกใบแจ้งหนี้แล้ว", count: invoicedCount, color: "#6366f1" },
          { label: "รายได้รวม", count: `฿${totalRevenue.toLocaleString()}`, color: "#10b981" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p className="text-sm text-[#898989]">{s.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-3xl overflow-hidden flex-1 min-h-0 flex flex-col" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Filter + Search */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, HN, Order..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#674BB3] focus:ring-1 focus:ring-[#674BB3] outline-none" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <Filter size={14} className="text-[#898989] shrink-0" />
            {(["ALL", "PENDING", "INVOICED"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  filterStatus === s ? "text-white" : "text-[#898989] hover:bg-gray-100"
                }`}
                style={filterStatus === s ? { background: s === "ALL" ? "#674BB3" : s === "PENDING" ? "#f59e0b" : "#6366f1" } : {}}>
                {s === "ALL" ? "ทั้งหมด" : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 mx-4 mb-4 rounded-2xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 sticky top-0 z-10">
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">ผู้ป่วย</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">HN</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">Order ID</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">Protocol</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">สิทธิ</th>
                <th className="text-right text-xs font-semibold text-[#898989] px-4 py-3">จำนวนเงิน</th>
                <th className="text-left text-xs font-semibold text-[#898989] px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-[#898989]">ไม่พบรายการ</td></tr>
              )}
              {filtered.map(r => {
                const cov = coverageOptions.find(c => c.code === r.coverageType) ?? coverageOptions[0];
                return (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PatientAvatar hn={r.hn} size={36} />
                        <div>
                          <p className="text-sm font-semibold text-[#404040]">{r.patientName}</p>
                          <p className="text-xs text-[#898989]">C{r.cycle}D{r.day} · {r.ward}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#404040] font-mono">{r.hn}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono font-semibold text-[#674BB3] bg-[#674BB3]/5 px-2 py-1 rounded-lg">{r.orderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-[#674BB3] bg-[#674BB3]/10 px-2 py-1 rounded-lg">{r.protocol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold text-white px-2.5 py-1 rounded-full ${cov.color}`}>{cov.code}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#404040]">฿{r.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold text-white px-2.5 py-1 rounded-full ${statusColor[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
