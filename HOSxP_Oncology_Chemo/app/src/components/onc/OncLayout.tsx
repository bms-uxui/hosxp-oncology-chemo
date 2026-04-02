import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard, Users, FlaskConical, Pill, Home,
  BarChart3, Settings, Beaker, Heart,
  Bell, Search, ChevronDown,
  Stethoscope, CalendarCheck, Clock, Receipt, Syringe, ClipboardCheck,
} from "lucide-react";
import { useOnc, roleLabels, roleInitials, roleEnglish, roleColor, type OncRole } from "./OncContext";

/* ══════════════════════════════════════════════
   OncLayout — Sidebar with margin + floating content
   ══════════════════════════════════════════════ */

type NavItem = {
  label: string;
  icon: React.ElementType;
  to: string;
  end?: boolean;
  roles?: OncRole[];
};

const navItems: NavItem[] = [
  { label: "หน้าหลัก", icon: Home, to: "/onc", end: true },
  { label: "เภสัชกรตรวจสอบ", icon: Heart, to: "/onc/pharm-verify", roles: ["ONC_PHARMACIST"] },
  { label: "เตรียมผสมยา", icon: Beaker, to: "/onc/compounding", roles: ["ONC_PHARMACIST", "COMPOUND_TECH"] },
  { label: "บันทึกการให้ยา", icon: Stethoscope, to: "/onc/administration", roles: ["CHEMO_NURSE", "ONC_DOCTOR"] },
  { label: "สูตรยาเคมีบำบัด", icon: FlaskConical, to: "/onc/regimen", roles: ["ONC_DOCTOR", "ONC_PHARMACIST"] },
  { label: "วางแผนการรักษา", icon: CalendarCheck, to: "/onc/plan", roles: ["ONC_DOCTOR"] },
  { label: "ประวัติ/Audit", icon: Clock, to: "/onc/timeline" },
  { label: "รายงาน", icon: BarChart3, to: "/onc/reports", roles: ["ONC_DOCTOR", "ONC_PHARMACIST", "BILLING_OFFICER"] },
  { label: "ตั้งค่าระบบ", icon: Settings, to: "/onc/settings", roles: ["ADMIN"] },
];

export default function OncLayout() {
  const { role, setRole, setSearchOpen } = useOnc();
  const [roleOpen, setRoleOpen] = useState(false);
  const navigate = useNavigate();

  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden gap-4 p-4">

      {/* ══════════ Sidebar — Purple theme ══════════ */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 rounded-3xl flex-col overflow-hidden"
        style={{ background: "#674BB3" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <Pill size={18} className="text-[#674BB3]" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/60 leading-tight">BMS</p>
            <p className="text-sm font-bold text-white leading-tight">Oncology Chemo</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#FF8654] text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10"
                }`
              }>
              <item.icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User / Role */}
        <div className="px-3 pb-4 pt-2">
          <div className="relative">
            <button onClick={() => setRoleOpen(!roleOpen)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/10 transition-all text-left"
              style={{ background: "#563AA4" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: roleColor[role] }}>
                {roleInitials[role]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {roleLabels[role].split(" (")[0]}
                </p>
                <p className="text-[10px] text-white/50 leading-tight">{roleEnglish[role]}</p>
              </div>
              <ChevronDown size={14} className="text-white/50 shrink-0" />
            </button>

            {roleOpen && (
              <div className="absolute left-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl z-50 py-2 w-full">
                <p className="px-4 py-1.5 text-[9px] text-[#898989] uppercase tracking-widest font-bold">เปลี่ยน Role</p>
                {(Object.keys(roleLabels) as OncRole[]).map((r) => (
                  <button key={r}
                    onClick={() => { setRole(r); setRoleOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-all text-left ${
                      role === r ? "bg-[#674BB3]/5" : ""
                    }`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ background: role === r ? roleColor[r] : "#94A3B8" }}>
                      {roleInitials[r]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#404040] leading-tight truncate">{roleLabels[r]}</p>
                      <p className="text-[10px] text-[#898989]">{roleEnglish[r]}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════ Main ══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Backdrop */}
      {roleOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
      )}
    </div>
  );
}
