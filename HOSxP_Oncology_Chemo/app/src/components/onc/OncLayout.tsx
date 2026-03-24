import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard, Users, FlaskConical, Pill,
  BarChart3, Settings, Beaker, Heart,
  Bell, Activity, Search, ChevronDown,
  Stethoscope, CalendarCheck, Clock,
  ChevronRight, Receipt,
} from "lucide-react";
import { useOnc, roleLabels, roleInitials, roleEnglish, roleColor, type OncRole } from "./OncContext";

/* ══════════════════════════════════════════════
   OncLayout — Growly-style dark sidebar + frosted topbar
   Grid: 8pt system
   Sidebar: Dark navy, icon-first, expand on hover
   Background: Blue-gray gradient
   ══════════════════════════════════════════════ */

type NavItem = {
  label: string;
  icon: React.ElementType;
  to: string;
  end?: boolean;
  roles?: OncRole[];
  badge?: number;
};

const navItems: NavItem[] = [
  { label: "ภาพรวม", icon: LayoutDashboard, to: "/onc", end: true },
  { label: "ผู้ป่วย", icon: Users, to: "/onc/patients" },
  { label: "สั่งยา (CPOE)", icon: FlaskConical, to: "/onc/order-entry", roles: ["ONC_DOCTOR"] },
  { label: "Pharm Verify", icon: Heart, to: "/onc/pharm-verify", roles: ["ONC_PHARMACIST"] },
  { label: "เตรียมยา", icon: Beaker, to: "/onc/compounding", roles: ["ONC_PHARMACIST", "COMPOUND_TECH"] },
  { label: "ให้ยา", icon: Stethoscope, to: "/onc/administration", roles: ["CHEMO_NURSE", "ONC_DOCTOR"] },
  { label: "Regimen Master", icon: Pill, to: "/onc/regimen", roles: ["ONC_DOCTOR", "ONC_PHARMACIST"] },
  { label: "Plan Creator", icon: CalendarCheck, to: "/onc/plan", roles: ["ONC_DOCTOR"] },
  { label: "Timeline", icon: Clock, to: "/onc/timeline" },
  { label: "รายงาน", icon: BarChart3, to: "/onc/reports", roles: ["ONC_DOCTOR", "ONC_PHARMACIST", "BILLING_OFFICER"] },
  { label: "Billing", icon: Receipt, to: "/onc/billing", roles: ["BILLING_OFFICER"] },
  { label: "ตั้งค่า", icon: Settings, to: "/onc/settings", roles: ["ADMIN"] },
];

export default function OncLayout() {
  const { role, setRole, setSearchOpen } = useOnc();
  const [roleOpen, setRoleOpen] = useState(false);
  const navigate = useNavigate();

  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #DAE5F0 0%, #E8EDF3 40%, #D5E3F0 100%)" }}>

      {/* ══════════ Sidebar — always expanded ══════════ */}
      <aside
        className="w-56 flex flex-col shrink-0 relative z-20"
        style={{ background: "linear-gradient(180deg, #1A2A3A 0%, #0F1C2B 100%)" }}>

        {/* Logo */}
        <div className="flex items-center pt-6 pb-5 px-4">
          <div className={`flex items-center gap-3 ${!true && "justify-center w-full"}`}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7C6EBF, #9B8FD8)", boxShadow: "0 4px 12px rgba(124,110,191,0.4)" }}>
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">HOSxP</p>
              <p className="text-white/40 text-[10px] font-medium">Oncology Chemo</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden py-2">
          {visibleNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative ${
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-white/35 hover:text-white/80 hover:bg-white/6"
                }`
              }>
              {({ isActive }) => (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? "bg-onc shadow-md"
                      : "bg-white/5 group-hover:bg-white/10"
                  }`}
                    style={isActive ? { background: "#7C6EBF", boxShadow: "0 4px 12px rgba(124,110,191,0.3)" } : {}}>
                    <item.icon size={17} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={`text-[13px] whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="absolute top-1 left-9 w-4 h-4 text-[9px] font-bold bg-danger text-white rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-2 space-y-1">
          <button onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/25 hover:text-white/70 hover:bg-white/6 transition-all">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Search size={16} />
            </div>
            <span className="text-[13px] font-medium whitespace-nowrap">ค้นหา</span>
          </button>
        </div>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: roleColor[role], boxShadow: `0 4px 12px ${roleColor[role]}40` }}>
              {roleInitials[role]}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{roleLabels[role].split(" (")[0]}</p>
              <p className="text-white/35 text-[11px]">{roleEnglish[role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════ Main ══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar — frosted glass */}
        <header className="shrink-0 px-8 py-3 flex items-center justify-between onc-glass">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-semibold text-text">HOSxP Oncology</span>
            <ChevronRight size={12} />
            <span>Chemo CPOE</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted bg-white/50 hover:bg-white/80 rounded-xl transition-all border border-white/60">
              <Search size={13} />
              <span>ค้นหาผู้ป่วย...</span>
              <kbd className="ml-6 text-[10px] bg-background px-1.5 py-0.5 rounded font-mono text-text-muted">⌘K</kbd>
            </button>

            <div className="w-px h-6 bg-border" />

            {/* Date */}
            <p className="text-xs text-text-muted font-medium">
              {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            {/* Role switcher */}
            <div className="relative">
              <button onClick={() => setRoleOpen(!roleOpen)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/50 rounded-xl transition-all">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: roleColor[role] }}>
                  {roleInitials[role]}
                </div>
                <span className="text-xs font-medium text-text-secondary">{roleEnglish[role]}</span>
                <ChevronDown size={12} className="text-text-muted" />
              </button>
              {roleOpen && (
                <div className="absolute right-0 top-full mt-2 onc-card-raised z-40 py-2 w-64">
                  <p className="px-4 py-2 text-[10px] text-text-muted uppercase tracking-widest font-bold">เปลี่ยน Role (Prototype)</p>
                  {(Object.keys(roleLabels) as OncRole[]).map((r) => (
                    <button key={r}
                      onClick={() => { setRole(r); setRoleOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-background-alt transition-all text-left ${
                        role === r ? "font-semibold" : ""
                      }`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: role === r ? roleColor[r] : "#94A3B8" }}>
                        {roleInitials[r]}
                      </div>
                      <div>
                        <p className="text-[13px] text-text leading-tight">{roleLabels[r]}</p>
                        <p className="text-[11px] text-text-muted">{roleEnglish[r]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 flex items-center justify-center hover:bg-white/50 rounded-xl text-text-muted hover:text-text transition-all">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {roleOpen && <div className="fixed inset-0 z-30" onClick={() => setRoleOpen(false)} />}
    </div>
  );
}
